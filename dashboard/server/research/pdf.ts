// `cli research pdf-emails`: the author e-mails printed on a paper's first pages (plan v2 §6.1). pdfjs-dist, no Python.
import { HttpError } from '../repo';
import type { ResearchHttp } from './http';
import { bareDoi, oaPdfUrl, s2PdfUrl, type OaWork } from './openalex';

export const MAX_PDF_BYTES = 20 * 1024 * 1024;

/** The text of the first `maxPages` pages, one line per text line. */
export async function pdfText(data: Uint8Array, maxPages = 2): Promise<{ pages: number; text: string }> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data, useSystemFonts: false, disableFontFace: true, verbosity: 0 }).promise;
  try {
    const parts: string[] = [];
    for (let i = 1; i <= Math.min(maxPages, doc.numPages); i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      let line = '';
      for (const it of content.items as { str?: string; hasEOL?: boolean }[]) {
        line += it.str ?? '';
        if (it.hasEOL) { parts.push(line); line = ''; }
      }
      if (line) parts.push(line);
      page.cleanup();
    }
    return { pages: doc.numPages, text: parts.join('\n') };
  } finally {
    await doc.destroy();
  }
}

const EMAIL = /[A-Za-z0-9](?:[A-Za-z0-9._%+-]*[A-Za-z0-9])?@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}/g;
// {jane, john.doe}@nvidia.com  ·  {jane|john}@x.com  ·  (jane, john)@x.com
const GROUPED = /[{(]\s*([A-Za-z0-9._%+\-,;|\s]{1,400}?)\s*[})]\s*@\s*((?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,})/g;

export interface EmailFind { emails: string[]; grouped: { text: string; emails: string[] }[] }

/** Every e-mail address in the text, including the grouped form {a,b}@x.com expanded to a@x.com and b@x.com. */
export function findEmails(text: string): EmailFind {
  // PDF text often puts spaces or line breaks around "@" and inside grouped lists.
  const t = text.replace(/\s*@\s*/g, '@');
  const grouped: EmailFind['grouped'] = [];
  const emails: string[] = [];
  const seen = new Set<string>();
  const add = (e: string) => { const v = e.replace(/\.$/, ''); const k = v.toLowerCase(); if (!seen.has(k)) { seen.add(k); emails.push(v); } };
  let rest = t;
  for (const m of t.matchAll(GROUPED)) {
    const names = m[1].split(/[,;|\s]+/).map((s) => s.trim()).filter((s) => /^[A-Za-z0-9._%+-]+$/.test(s));
    if (!names.length) continue;
    const list = names.map((n) => `${n}@${m[2]}`);
    grouped.push({ text: m[0].replace(/\s+/g, ' '), emails: list });
    list.forEach(add);
    rest = rest.replace(m[0], ' ');
  }
  for (const m of rest.matchAll(EMAIL)) add(m[0]);
  return { emails, grouped };
}

/** The author block: the text before "Abstract" (names, affiliations, e-mails), at most 1,500 characters. */
export function authorBlock(text: string): string {
  const i = text.search(/\babstract\b/i);
  return (i > 0 ? text.slice(0, i) : text.slice(0, 1500)).replace(/[ \t]+/g, ' ').trim().slice(0, 1500);
}

/** arXiv abstract pages → their PDF. */
export const pdfLink = (url: string) => url.replace(/^(https?:\/\/(?:www\.)?arxiv\.org)\/abs\//i, '$1/pdf/');

export interface PdfEmails { url: string; pages: number; emails: string[]; grouped: EmailFind['grouped']; authorBlock: string }

export async function pdfEmails(http: ResearchHttp, url: string): Promise<PdfEmails> {
  if (!/^https?:\/\//i.test(url)) throw new HttpError(400, `Not a web link: ${url}`);
  const link = pdfLink(url);
  let r;
  try { r = await http.get(link, { maxBytes: MAX_PDF_BYTES, accept: 'application/pdf' }); } catch (e) { throw new HttpError(502, (e as Error).message); }
  if (r.status >= 400) throw new HttpError(502, `${new URL(link).host}: HTTP ${r.status} for the PDF`);
  if (r.body.subarray(0, 5).toString('latin1') !== '%PDF-') {
    throw new HttpError(422, `${link} is not a PDF (it answered with ${r.type || 'a web page'}; publisher pages often need a login). Try the arXiv version or another paper.`);
  }
  const { pages, text } = await pdfText(new Uint8Array(r.body), 2);
  const found = findEmails(text);
  return { url: link, pages, ...found, authorBlock: authorBlock(text) };
}

/** An open-access PDF link for a DOI: OpenAlex first, then Semantic Scholar. */
export async function pdfForDoi(http: ResearchHttp, doi: string): Promise<string | null> {
  const d = bareDoi(doi);
  if (!d) return null;
  try {
    const key = process.env.OPENALEX_API_KEY;
    const w = await http.json<OaWork>(`https://api.openalex.org/works/doi:${encodeURIComponent(d)}?select=id,best_oa_location,locations${key ? `&api_key=${encodeURIComponent(key)}` : ''}`);
    const u = w && oaPdfUrl(w);
    if (u) return u;
  } catch { /* no answer from OpenAlex (budget, cache miss, error): try Semantic Scholar */ }
  return s2PdfUrl(http, d);
}

const normTitle = (s: string) => s.toLowerCase().replace(/<[^>]+>/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();

export function arxivSearchUrl(title: string): string {
  const words = normTitle(title).split(' ').filter((w) => w.length > 2).slice(0, 12).join(' ');
  return `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(`ti:"${words}"`)}&max_results=3`;
}

/**
 * The arXiv PDF of a paper found by its title (many architecture papers have an arXiv version even when the publisher's
 * PDF needs a login). Only an entry whose title matches is used. Null when there is none.
 */
export async function arxivPdfForTitle(http: ResearchHttp, title: string): Promise<string | null> {
  const r = await http.get(arxivSearchUrl(title), { accept: 'application/atom+xml', retries: 1 });
  if (r.status >= 400) return null;
  const xml = r.body.toString('utf8');
  const want = normTitle(title);
  for (const entry of xml.split('<entry>').slice(1)) {
    const t = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '';
    const id = entry.match(/<id>\s*https?:\/\/arxiv\.org\/abs\/([^<\s]+)\s*<\/id>/)?.[1];
    if (id && normTitle(t) === want) return `https://arxiv.org/pdf/${id.replace(/v\d+$/, '')}`;
  }
  return null;
}
