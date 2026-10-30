// OpenAlex (https://api.openalex.org, free; no key needed for ~1,000 list requests a day per IP address; an optional
// free key in OPENALEX_API_KEY has its own budget) and Semantic Scholar (PDF links; no key, 1 request/s).
import fs from 'node:fs';
import path from 'node:path';
import { companyKey } from '../../shared/statuses';
import type { ResearchHttp } from './http';

export interface InstitutionEntry { ids?: string[]; raw?: string[] }
export type InstitutionMap = Record<string, InstitutionEntry>;

/** targets/openalex_institutions.json: which OpenAlex institutions (and affiliation texts) count as each company. */
export function loadInstitutionMap(repoRoot: string): InstitutionMap {
  const f = path.join(repoRoot, 'targets', 'openalex_institutions.json');
  if (!fs.existsSync(f)) return {};
  const raw = JSON.parse(fs.readFileSync(f, 'utf8')) as Record<string, unknown>;
  const out: InstitutionMap = {};
  for (const [k, v] of Object.entries(raw)) if (!k.startsWith('_') && v && typeof v === 'object') out[k] = v as InstitutionEntry;
  return out;
}

export function mapEntry(map: InstitutionMap, company: string): [string, InstitutionEntry] | null {
  const k = companyKey(company);
  const hit = Object.entries(map).find(([name]) => companyKey(name) === k);
  return hit || null;
}

// ---------- OpenAlex works ----------
export interface OaInstitution { id?: string; display_name?: string; country_code?: string | null }
export interface OaAuthorship {
  author_position?: string; author?: { id?: string; display_name?: string };
  institutions?: OaInstitution[]; raw_affiliation_strings?: string[]; countries?: string[];
}
export interface OaLocation { source?: { display_name?: string | null } | null; raw_source_name?: string | null; pdf_url?: string | null; landing_page_url?: string | null }
export interface OaWork {
  id: string; doi?: string | null; title?: string | null; display_name?: string | null;
  publication_year?: number | null; publication_date?: string | null;
  locations?: OaLocation[] | null; best_oa_location?: OaLocation | null;
  authorships?: OaAuthorship[]; primary_topic?: { display_name?: string } | null; keywords?: { display_name?: string }[] | null;
}
interface OaPage { meta?: { count?: number; next_cursor?: string | null }; results?: OaWork[] }

/** Hardware & Architecture, Electrical & Electronic Engineering, Software (compilers): keeps the result small. */
export const SUBFIELDS = ['1708', '2208', '1712'];
const SELECT = 'id,doi,title,publication_year,publication_date,locations,best_oa_location,authorships,primary_topic,keywords';

export const shortId = (id: string | undefined | null) => String(id || '').replace(/^https?:\/\/openalex\.org\//i, '');

export function worksUrl(q: { ids?: string[]; raw?: string }, since: number, cursor = '*', apiKey = process.env.OPENALEX_API_KEY): string {
  const who = q.ids?.length ? `authorships.institutions.id:${q.ids.join('|')}` : `raw_affiliation_strings.search:${encodeURIComponent(`"${q.raw}"`)}`;
  const filter = `${who},from_publication_date:${since}-01-01,topics.subfield.id:${SUBFIELDS.join('|')}`;
  return `https://api.openalex.org/works?filter=${filter}&sort=publication_date:desc&per_page=200&cursor=${encodeURIComponent(cursor)}&select=${SELECT}${apiKey ? `&api_key=${encodeURIComponent(apiKey)}` : ''}`;
}

/** All works for one institution query, newest first, at most maxPages × 200. */
export async function fetchWorks(http: ResearchHttp, q: { ids?: string[]; raw?: string }, since: number, maxPages = 3): Promise<OaWork[]> {
  const out: OaWork[] = [];
  let cursor: string | null | undefined = '*';
  for (let page = 0; page < maxPages && cursor; page++) {
    let j: OaPage | null;
    try { j = await http.json<OaPage>(worksUrl(q, since, cursor)); }
    catch (e) {
      // Since 2026-10 OpenAlex answers 401 "API key required for cursor paging" past page 1 without a key: keep page 1.
      if (page > 0 && /HTTP 401/.test((e as Error).message)) break;
      throw e;
    }
    const rows: OaWork[] = j?.results || [];
    out.push(...rows);
    cursor = rows.length === 200 ? j?.meta?.next_cursor : null;
  }
  return out;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** A whole-word/phrase matcher for an affiliation text; all-caps phrases (SAIT) are case-sensitive. */
export function phraseMatcher(phrase: string): RegExp {
  return new RegExp(`(^|[^A-Za-z0-9])${escapeRe(phrase)}($|[^A-Za-z0-9])`, phrase === phrase.toUpperCase() ? '' : 'i');
}

export interface CompanyAuthor {
  /** OpenAlex author id (A…), or ~name when OpenAlex has none. */
  id: string; name: string; position: string; institution: string | null; country: string | null }

/** The authors of a work who were at the company (by institution id, else by affiliation text). */
export function authorsAtCompany(w: OaWork, entry: InstitutionEntry): CompanyAuthor[] {
  const ids = new Set((entry.ids || []).map((i) => shortId(i)));
  const phrases = (entry.raw || []).map(phraseMatcher);
  const out: CompanyAuthor[] = [];
  for (const a of w.authorships || []) {
    if (!a.author?.display_name) continue;
    // OpenAlex sometimes has no author id (even for first authors): such people are keyed by name (~name).
    const id = shortId(a.author.id) || `~${a.author.display_name.toLowerCase().replace(/[^a-z]+/g, '')}`;
    const inst = (a.institutions || []).find((i) => ids.has(shortId(i.id)));
    const raw = inst ? null : (a.raw_affiliation_strings || []).find((s) => phrases.some((re) => re.test(s)));
    if (!inst && !raw) continue;
    out.push({
      id, name: a.author.display_name, position: a.author_position || 'middle',
      institution: inst?.display_name || raw || null,
      country: inst?.country_code || (a.countries?.length === 1 ? a.countries[0] : null) || null,
    });
  }
  return out;
}

/** The paper's open-access PDF link from OpenAlex (best OA location, else any location with a PDF, e.g. arXiv). */
export function oaPdfUrl(w: OaWork): string | null {
  return w.best_oa_location?.pdf_url || (w.locations || []).map((l) => l.pdf_url).find(Boolean) || null;
}

// ---------- Semantic Scholar ----------
interface S2Paper { openAccessPdf?: { url?: string | null } | null; externalIds?: { ArXiv?: string } | null }

export function s2Url(doi: string): string {
  return `https://api.semanticscholar.org/graph/v1/paper/DOI:${encodeURIComponent(doi)}?fields=openAccessPdf,externalIds`;
}

/** An open-access PDF link for a DOI from Semantic Scholar (its openAccessPdf, else the arXiv version), or null. */
export async function s2PdfUrl(http: ResearchHttp, doi: string): Promise<string | null> {
  const p = await http.json<S2Paper>(s2Url(doi));
  if (!p) return null;
  if (p.openAccessPdf?.url) return p.openAccessPdf.url;
  if (p.externalIds?.ArXiv) return `https://arxiv.org/pdf/${p.externalIds.ArXiv}`;
  return null;
}

export const bareDoi = (doi: string | null | undefined) => (doi ? String(doi).replace(/^https?:\/\/doi\.org\//i, '').toLowerCase() : null);
