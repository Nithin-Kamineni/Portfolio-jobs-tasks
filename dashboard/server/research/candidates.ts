// `cli research candidates`: researchers at the target companies from recent papers at the chosen venues, scored by how
// close their papers are to the owner's work, stored in research_candidates (plan v2 §6.1). Code does the searching;
// Claude only picks people and writes (§6.2).
import path from 'node:path';
import { nextId, type DB } from '../db';
import type { Config } from '../config';
import { companyKey } from '../../shared/statuses';
import type { CandidatePaper, ResearchCandidate } from '../../shared/types';
import { HttpError, linkCandidates, nowIso } from '../repo';
import { ResearchError, ResearchHttp } from './http';
import { authorsAtCompany, bareDoi, fetchWorks, loadInstitutionMap, mapEntry, oaPdfUrl, s2PdfUrl, type OaWork } from './openalex';
import { detectVenue, paperTopics, topicScore, venueList, VENUES } from './venues';

type Row = Record<string, unknown>;

export interface CandidateOptions {
  companies?: string[];
  /** Company priorities from targets/companies.csv (default A,B) when no companies are named. */
  priority?: string[];
  venues?: string[];
  since?: number;
  limit?: number;
  /** Only read what is already stored (no network). */
  noFetch?: boolean;
  /** Look up PDF links on Semantic Scholar for the top results that have none (default on). */
  enrich?: boolean;
  /** Also list skipped and contacted candidates. */
  all?: boolean;
  /** Just these stored candidates (the ones the owner picked). */
  ids?: number[];
  maxPages?: number;
}

export interface CandidateResult {
  companies: string[];
  notInMap: string[];
  venues: string[];
  since: number;
  requests: number;
  fromCache: number;
  found: number;
  warnings: string[];
  candidates: CandidateCard[];
}

/** What Claude sees per person: compact, the best papers first. */
export interface CandidateCard {
  id: number;
  /** For contact add --openalex-id (null when OpenAlex has no id for this person). */
  openalex_id: string | null;
  name: string; company: string; institution: string | null; us: boolean; score: number; status: string;
  topics: string[]; papers: Pick<CandidatePaper, 'title' | 'venue' | 'year' | 'doi' | 'pdf_url' | 'position'>[]; contact_id: number | null;
}

export function researchHttp(cfg: Pick<Config, 'dataDir'>): ResearchHttp {
  return new ResearchHttp({ cacheDir: path.join(cfg.dataDir, 'research-cache'), offline: process.env.JOBWATCHER_RESEARCH_OFFLINE === '1' });
}

const paperWeight = (p: CandidatePaper) => (VENUES.find((v) => v.key === p.venue)?.weight ?? 0.5) * (1 + topicScore(p.topics));

/** 0–100: venue weight × (1 + topic overlap) per paper, recent and first/last-author papers count more. */
export function scoreAuthor(papers: CandidatePaper[], thisYear = new Date().getFullYear()): number {
  const raw = papers.reduce((s, p) => s + paperWeight(p)
    * ((p.year ?? 0) >= thisYear - 1 ? 1 : 0.8)
    * (p.position === 'first' || p.position === 'last' ? 1.25 : 1), 0);
  return Math.round(100 * (1 - Math.exp(-raw / 15)));
}

interface Acc { id: string; name: string; company: string; institution: string | null; country: string | null; papers: Map<string, CandidatePaper> }

/** Turns works into per-author candidates at one company (pure; unit-tested with recorded OpenAlex responses). */
export function collectAuthors(company: string, works: OaWork[], entry: Parameters<typeof authorsAtCompany>[1], venues = VENUES, into = new Map<string, Acc>()): Map<string, Acc> {
  for (const w of works) {
    const venue = detectVenue(w, venues);
    if (!venue) continue;
    const title = String(w.title || w.display_name || '').trim();
    if (!title) continue;
    const topics = paperTopics([title, w.primary_topic?.display_name, ...(w.keywords || []).map((k) => k.display_name)].filter(Boolean).join(' | '));
    const doi = bareDoi(w.doi);
    for (const a of authorsAtCompany(w, entry)) {
      const key = a.id.startsWith('~') ? `~${companyKey(company)}:${a.id.slice(1)}` : a.id;
      const acc = into.get(key) || { id: key, name: a.name, company, institution: a.institution, country: a.country, papers: new Map() };
      if (!acc.country && a.country) acc.country = a.country;
      acc.papers.set(doi || title.toLowerCase(), {
        title, venue: venue.key, year: w.publication_year ?? null, doi, url: doi ? `https://doi.org/${doi}` : null,
        pdf_url: oaPdfUrl(w), position: a.position, topics,
      });
      into.set(key, acc);
    }
  }
  return into;
}

function rowToCandidate(r: Row): ResearchCandidate {
  const parse = <T>(s: unknown, d: T): T => { try { return JSON.parse(String(s)) as T; } catch { return d; } };
  return {
    id: Number(r.id), openalex_id: String(r.openalex_id), name: String(r.name), company: String(r.company),
    institution: (r.institution as string) ?? null, country: (r.country as string) ?? null,
    papers: parse<CandidatePaper[]>(r.papers_json, []), topics: parse<string[]>(r.topics_json, []), score: Number(r.score),
    status: String(r.status) as ResearchCandidate['status'], contact_id: r.contact_id == null ? null : Number(r.contact_id),
    first_seen: String(r.first_seen), updated_at: String(r.updated_at),
  };
}

export function listCandidates(db: DB, f: { status?: string[]; companies?: string[]; ids?: number[]; limit?: number } = {}): ResearchCandidate[] {
  let rows = (db.prepare('SELECT * FROM research_candidates ORDER BY score DESC, id').all() as Row[]).map(rowToCandidate);
  if (f.ids?.length) rows = rows.filter((c) => f.ids!.includes(c.id));
  if (f.status?.length) rows = rows.filter((c) => f.status!.includes(c.status));
  if (f.companies?.length) { const ks = new Set(f.companies.map(companyKey)); rows = rows.filter((c) => ks.has(companyKey(c.company))); }
  return f.limit ? rows.slice(0, f.limit) : rows;
}

export function setCandidateStatus(db: DB, ids: number[], status: string): ResearchCandidate[] {
  if (!['new', 'picked', 'skipped'].includes(status)) throw new HttpError(400, 'status must be new, picked or skipped (contacted is set when the contact is added)');
  if (!ids.length) throw new HttpError(400, 'No candidate ids');
  const upd = db.prepare("UPDATE research_candidates SET status=?, updated_at=? WHERE id=? AND status != 'contacted'");
  for (const id of ids) {
    if (!db.prepare('SELECT 1 FROM research_candidates WHERE id=?').get(id)) throw new HttpError(404, `No research candidate ${id}`);
    upd.run(status, nowIso(), id);
  }
  return listCandidates(db, { ids });
}

const card = (c: ResearchCandidate): CandidateCard => ({
  id: c.id, openalex_id: /^A\d+$/.test(c.openalex_id) ? c.openalex_id : null, name: c.name, company: c.company, institution: c.institution, us: c.country === 'US', score: c.score, status: c.status,
  topics: c.topics, contact_id: c.contact_id,
  papers: [...c.papers].sort((a, b) => paperWeight(b) - paperWeight(a) || (b.year ?? 0) - (a.year ?? 0)).slice(0, 4)
    .map(({ title, venue, year, doi, pdf_url, position }) => ({ title, venue, year, doi, pdf_url, position })),
});

/** Target companies by priority (enabled ones), in companies.csv order. */
function companiesByPriority(db: DB, priority: string[]): string[] {
  const want = new Set(priority.map((p) => p.trim().toUpperCase()));
  return (db.prepare('SELECT name, priority, enabled FROM companies').all() as Row[])
    .filter((r) => want.has(String(r.priority).toUpperCase()) && String(r.enabled).toLowerCase() !== 'no').map((r) => String(r.name));
}

export async function findCandidates(ctx: { db: DB; cfg: Config }, o: CandidateOptions = {}, http = researchHttp(ctx.cfg)): Promise<CandidateResult> {
  const { db, cfg } = ctx;
  const since = o.since ?? new Date().getFullYear() - 2;
  const limit = o.limit ?? 80;
  let venues;
  try { venues = venueList(o.venues); } catch (e) { throw new HttpError(400, (e as Error).message); }
  const warnings: string[] = [];

  if (o.ids?.length) {
    const cands = listCandidates(db, { ids: o.ids });
    const missing = o.ids.filter((id) => !cands.some((c) => c.id === id));
    if (missing.length) warnings.push(`No research candidate(s) ${missing.join(', ')}`);
    return { companies: [...new Set(cands.map((c) => c.company))], notInMap: [], venues: venues.map((v) => v.key), since, requests: 0, fromCache: 0, found: cands.length, warnings, candidates: cands.map(card) };
  }

  const map = loadInstitutionMap(cfg.repoRoot);
  const names = o.companies?.length ? o.companies : companiesByPriority(db, o.priority?.length ? o.priority : ['A', 'B']);
  const companies: string[] = []; const notInMap: string[] = [];
  for (const n of names) { const e = mapEntry(map, n); if (e) companies.push(e[0]); else notInMap.push(n); }
  if (notInMap.length) warnings.push(`Not in targets/openalex_institutions.json (skipped): ${notInMap.join(', ')}`);

  let found = 0;
  if (!o.noFetch) {
    const acc = new Map<string, Acc>();
    let stopped = false;
    for (const company of companies) {
      if (stopped) break;
      const entry = map[company];
      const queries = [...(entry.ids?.length ? [{ ids: entry.ids }] : []), ...(entry.raw || []).map((raw) => ({ raw }))];
      for (const q of queries) {
        try {
          collectAuthors(company, await fetchWorks(http, q, since, o.maxPages ?? 3), entry, venues, acc);
        } catch (e) {
          const err = e as ResearchError;
          warnings.push(`${company}: ${err.message}`);
          if (err.kind === 'budget' || err.kind === 'offline') { stopped = err.kind === 'budget'; if (stopped) warnings.push('Stopped searching; showing what is stored from earlier searches.'); break; }
        }
      }
    }
    found = acc.size;
    store(db, [...acc.values()]);
  }
  linkCandidates(db);

  const status = o.all ? undefined : ['new', 'picked'];
  let cands = listCandidates(db, { status, companies, limit });
  if (o.enrich !== false && !o.noFetch) cands = await enrichPdfs(db, http, cands, warnings);
  return { companies, notInMap, venues: venues.map((v) => v.key), since, requests: http.requests, fromCache: http.cached, found, warnings, candidates: cands.map(card) };
}

function store(db: DB, authors: Acc[]): void {
  const at = nowIso();
  const up = db.prepare(`INSERT INTO research_candidates(id, openalex_id, name, company, institution, country, papers_json, topics_json, score, status, first_seen, updated_at)
    VALUES (@rowId, @id, @name, @company, @institution, @country, @papers, @topics, @score, 'new', @at, @at)
    ON CONFLICT(openalex_id) DO UPDATE SET name=excluded.name, company=excluded.company, institution=excluded.institution,
      country=COALESCE(excluded.country, research_candidates.country), papers_json=excluded.papers_json, topics_json=excluded.topics_json,
      score=excluded.score, updated_at=excluded.updated_at`);
  db.transaction(() => {
    for (const a of authors) {
      const papers = [...a.papers.values()].sort((x, y) => (y.year ?? 0) - (x.year ?? 0));
      // Keep PDF links found earlier (Semantic Scholar) when OpenAlex still has none.
      const old = db.prepare('SELECT papers_json FROM research_candidates WHERE openalex_id=?').get(a.id) as Row | undefined;
      if (old) {
        const prev = JSON.parse(String(old.papers_json)) as CandidatePaper[];
        for (const p of papers) if (!p.pdf_url) p.pdf_url = prev.find((q) => (q.doi && q.doi === p.doi) || q.title === p.title)?.pdf_url ?? null;
      }
      const topics = [...new Set(papers.flatMap((p) => p.topics))];
      up.run({ rowId: nextId(db, 'research_candidates'), id: a.id, name: a.name, company: a.company, institution: a.institution, country: a.country, papers: JSON.stringify(papers), topics: JSON.stringify(topics), score: scoreAuthor(papers), at });
    }
  })();
}

/** Semantic Scholar PDF links for the best paper of each listed candidate that has none (at most 25 lookups). */
async function enrichPdfs(db: DB, http: ResearchHttp, cands: ResearchCandidate[], warnings: string[]): Promise<ResearchCandidate[]> {
  let lookups = 0;
  const upd = db.prepare('UPDATE research_candidates SET papers_json=? WHERE id=?');
  for (const c of cands) {
    const best = [...c.papers].sort((a, b) => paperWeight(b) - paperWeight(a))[0];
    if (!best || best.pdf_url || !best.doi || lookups >= 25) continue;
    lookups++;
    try {
      const pdf = await s2PdfUrl(http, best.doi);
      if (pdf) { best.pdf_url = pdf; upd.run(JSON.stringify(c.papers), c.id); }
    } catch (e) {
      warnings.push(`Semantic Scholar: ${(e as Error).message}`);
      if ((e as ResearchError).kind !== 'http') break;
    }
  }
  return cands;
}
