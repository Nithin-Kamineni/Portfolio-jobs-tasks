// "Find R&D emails from papers" (Referral phase, 2026-10-17): runs in code, no Claude. For one company it takes the
// researchers found in recent papers (OpenAlex + Semantic Scholar, targets/openalex_institutions.json), opens the PDFs of
// their best papers and keeps only the addresses printed on the paper that belong to one of the paper's company authors.
// Never a guessed or pattern address. Results are cached per company (paper_email_searches) until "Search again".
import type { DB } from '../db';
import type { Config } from '../config';
import { companyKey } from '../../shared/statuses';
import type { PaperEmailHit, PaperEmailSearch } from '../../shared/types';
import { HttpError, nowIso } from '../repo';
import { findCandidates, researchHttp, type CandidateCard } from './candidates';
import type { ResearchHttp } from './http';
import { loadInstitutionMap, mapEntry } from './openalex';
import { arxivPdfForTitle, pdfEmails, pdfForDoi } from './pdf';

/** At most this many researchers per search, two papers each, and this much time in all. */
export const PAPER_EMAIL_LIMITS = { people: 8, papersPerPerson: 2, timeMs: 120_000 };

type Row = Record<string, unknown>;

const words = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .split(/[\s\-.,']+/).map((p) => p.replace(/[^a-z]/g, '')).filter(Boolean);

/**
 * True when an address printed on a paper is plausibly this author's: the local part is their first name, their last
 * name (4+ letters), or contains the last name plus the first name or first initial (jdoe, doej, jane.doe, doe.jane).
 */
export function emailMatchesName(email: string, name: string): boolean {
  const local = email.split('@')[0].toLowerCase().replace(/[^a-z]/g, '');
  const parts = words(name);
  if (local.length < 2 || !parts.length) return false;
  const first = parts[0]; const last = parts[parts.length - 1];
  if (local === first && first.length >= 3) return true;
  if (parts.length > 1 && local === last && last.length >= 4) return true;
  if (parts.length > 1 && last.length >= 3 && local.includes(last)
    && (local.includes(first) || local.startsWith(first[0]) || local.endsWith(first[0]))) return true;
  // first name + last initial (janed)
  return parts.length > 1 && first.length >= 3 && local === first + last[0];
}

const paperKey = (p: { doi: string | null; title: string }) => p.doi || p.title.toLowerCase();

function rowToSearch(r: Row): PaperEmailSearch {
  const result = (() => { try { return JSON.parse(String(r.result_json || '{}')); } catch { return {}; } })();
  return {
    company: String(r.company), company_key: String(r.company_key), status: r.status as PaperEmailSearch['status'],
    started_at: String(r.started_at), finished_at: (r.finished_at as string) ?? null, error: (r.error as string) ?? null,
    result: { total: 0, checked: 0, papers: 0, hits: [], warnings: [], institution: null, ...result },
  };
}

// Searches running in this process (a "running" row without one was interrupted by a restart).
const active = new Map<string, Promise<PaperEmailSearch>>();

export function getPaperEmailSearch(db: DB, company: string): PaperEmailSearch | null {
  const r = db.prepare('SELECT * FROM paper_email_searches WHERE company_key = ?').get(companyKey(company)) as Row | undefined;
  if (!r) return null;
  const s = rowToSearch(r);
  if (s.status === 'running' && !active.has(s.company_key)) return { ...s, status: 'error', error: 'The search was interrupted (the dashboard restarted). Search again.' };
  return s;
}

export function listPaperEmailSearches(db: DB): PaperEmailSearch[] {
  return (db.prepare('SELECT company_key, company FROM paper_email_searches ORDER BY company').all() as Row[])
    .map((r) => getPaperEmailSearch(db, String(r.company))!).filter(Boolean);
}

/** For tests and the CLI: the running search's promise (or null when none runs for this company). */
export const paperEmailSearchDone = (company: string) => active.get(companyKey(company)) ?? null;

/**
 * Starts the search for `company` in the background and returns its "running" row at once; the page polls
 * GET …/paper-emails until it is done. One search at a time (they share the OpenAlex budget).
 */
export function startPaperEmailSearch(ctx: { db: DB; cfg: Config }, company: string, http?: ResearchHttp): PaperEmailSearch {
  const key = companyKey(company);
  if (!key) throw new HttpError(400, 'company is required');
  if (active.size) {
    const other = [...active.keys()][0];
    throw new HttpError(409, other === key ? 'Already searching papers for this company' : `Another paper search is running (${other}); try again in a minute`);
  }
  const map = loadInstitutionMap(ctx.cfg.repoRoot);
  const entry = mapEntry(map, company);
  const at = nowIso();
  ctx.db.prepare(`INSERT INTO paper_email_searches(company_key, company, status, started_at, finished_at, result_json, error) VALUES (?,?,?,?,NULL,?,NULL)
    ON CONFLICT(company_key) DO UPDATE SET company=excluded.company, status=excluded.status, started_at=excluded.started_at, finished_at=NULL,
      result_json=excluded.result_json, error=NULL`)
    .run(key, company.trim(), 'running', at, JSON.stringify({ total: 0, checked: 0, papers: 0, hits: [], warnings: [], institution: entry?.[0] ?? null }));
  const job = runSearch(ctx, company, entry?.[0] ?? null, http ?? researchHttp(ctx.cfg))
    .finally(() => { active.delete(key); });
  active.set(key, job);
  return getPaperEmailSearch(ctx.db, company)!;
}

async function runSearch(ctx: { db: DB; cfg: Config }, company: string, institution: string | null, http: ResearchHttp): Promise<PaperEmailSearch> {
  const { db } = ctx;
  const key = companyKey(company);
  const deadline = Date.now() + PAPER_EMAIL_LIMITS.timeMs;
  const result = { total: 0, checked: 0, papers: 0, hits: [] as PaperEmailHit[], warnings: [] as string[], institution };
  const save = (status: 'running' | 'done' | 'error', error: string | null = null) => {
    db.prepare('UPDATE paper_email_searches SET status=?, result_json=?, error=?, finished_at=? WHERE company_key=?')
      .run(status, JSON.stringify(result), error, status === 'running' ? null : nowIso(), key);
  };
  try {
    if (!institution) {
      save('error', `${company} is not in targets/openalex_institutions.json, so its researchers can't be found in papers yet.`);
      return getPaperEmailSearch(db, company)!;
    }
    const found = await findCandidates(ctx, { companies: [institution], all: true, limit: 60, enrich: true }, http);
    result.warnings.push(...new Set(found.warnings));
    const people = found.candidates.filter((c) => c.papers.some((p) => p.pdf_url || p.doi));
    // People with a known open PDF first, then US-based, then by score (the list is already best first); and each
    // picked person must bring at least one paper not already covered (co-authors share papers).
    const rank = (c: CandidateCard) => (c.papers.some((p) => p.pdf_url) ? 0 : 2) + (c.us ? 0 : 1);
    const ordered = [...people].sort((a, b) => rank(a) - rank(b));
    const covered = new Set<string>();
    const picked: CandidateCard[] = [];
    for (const c of ordered) {
      if (picked.length >= PAPER_EMAIL_LIMITS.people) break;
      const fresh = c.papers.slice(0, PAPER_EMAIL_LIMITS.papersPerPerson).filter((p) => !covered.has(paperKey(p)));
      if (!fresh.length) continue;
      fresh.forEach((p) => covered.add(paperKey(p)));
      picked.push(c);
    }
    result.total = picked.length;
    save('running');
    const seenPapers = new Set<string>();
    const note = (m: string) => { const w = m.slice(0, 160); if (!result.warnings.includes(w)) result.warnings.push(w); };
    const hasHit = (name: string) => result.hits.some((h) => h.name === name);
    for (const person of picked) {
      if (Date.now() > deadline) { result.warnings.push(`Stopped after ${Math.round(PAPER_EMAIL_LIMITS.timeMs / 1000)} s; ${result.total - result.checked} people not checked.`); break; }
      let tried = 0;
      for (const paper of person.papers) {
        if (tried >= PAPER_EMAIL_LIMITS.papersPerPerson || hasHit(person.name) || Date.now() > deadline) break;
        const pk = paperKey(paper);
        if (seenPapers.has(pk)) continue;
        seenPapers.add(pk);
        tried++;
        try {
          // An open PDF: OpenAlex's link, else OpenAlex/Semantic Scholar by DOI, else arXiv by title.
          let pdf = paper.pdf_url;
          if (!pdf && paper.doi) pdf = await pdfForDoi(http, paper.doi).catch((e: Error) => { note(e.message); return null; });
          if (!pdf) pdf = await arxivPdfForTitle(http, paper.title).catch((e: Error) => { note(e.message); return null; });
          if (!pdf) continue;
          const read = await pdfEmails(http, pdf);
          result.papers++;
          // Every company author of this paper (from the candidate list) whose name matches an address on it.
          const authors = people.filter((c: CandidateCard) => c.papers.some((p) => paperKey(p) === pk) || c.id === person.id);
          for (const email of read.emails) {
            const who = authors.find((a) => emailMatchesName(email, a.name));
            if (!who || hasHit(who.name)) continue;
            result.hits.push({ name: who.name, email, paper: { title: paper.title, venue: paper.venue, year: paper.year, url: paper.doi ? `https://doi.org/${paper.doi}` : null, pdf_url: read.url } });
          }
        } catch (e) {
          result.warnings.push(`${person.name}: ${(e as Error).message.slice(0, 160)}`);
        }
      }
      result.checked++;
      save('running');
    }
    save('done');
  } catch (e) {
    save('error', (e as Error).message);
  }
  return getPaperEmailSearch(db, company)!;
}
