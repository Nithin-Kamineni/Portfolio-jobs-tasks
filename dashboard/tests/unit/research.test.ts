import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { detectVenue, paperTopics, venueList } from '../../server/research/venues';
import { authorsAtCompany, phraseMatcher, s2PdfUrl, s2Url, worksUrl, type OaWork } from '../../server/research/openalex';
import { collectAuthors, scoreAuthor } from '../../server/research/candidates';
import { cacheKey, ResearchError, ResearchHttp } from '../../server/research/http';
import { authorBlock, findEmails, pdfEmails, pdfLink, pdfText } from '../../server/research/pdf';
import { normalizeLinkedin } from '../../shared/statuses';
import { normalizeOpenalexId } from '../../server/repo';
import { AMD_US, ETCHED_WORKS, NVIDIA_US, WORKS } from '../fixtures/research';
import { makePdf } from '../fixtures/research/makePdf';
import type { CandidatePaper } from '../../shared/types';

const dirs: string[] = [];
const tmp = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'jw-research-')); dirs.push(d); return d; };
afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });

const loc = (name: string) => ({ locations: [{ source: { display_name: name } }] });

describe('venues', () => {
  it('recognises venues from DOIs and location names', () => {
    expect(detectVenue({ doi: 'https://doi.org/10.1109/ISSCC49661.2025.10904512' })?.key).toBe('ISSCC');
    expect(detectVenue({ doi: 'https://doi.org/10.23919/DATE64628.2025.10993001' })?.key).toBe('DATE');
    expect(detectVenue({ doi: '10.1145/3695053.3731001', ...loc('Proceedings of the 52nd Annual International Symposium on Computer Architecture') })?.key).toBe('ISCA');
    expect(detectVenue(loc('Proceedings of the 30th ACM International Conference on Architectural Support for Programming Languages and Operating Systems, Volume 1'))?.key).toBe('ASPLOS');
    expect(detectVenue({ locations: [{ source: null, raw_source_name: '2025 62nd ACM/IEEE Design Automation Conference (DAC)' }] })?.key).toBe('DAC');
    expect(detectVenue(loc('IEEE Micro'))?.key).toBe('IEEE Micro');
    expect(detectVenue(loc('IEEE Journal of Solid-State Circuits'))?.key).toBe('JSSC');
  });

  it('does not confuse look-alike venues', () => {
    expect(detectVenue(loc('2025 30th Asia and South Pacific Design Automation Conference (ASP-DAC)'))).toBeNull();
    expect(detectVenue(loc('2024 IEEE Asian Solid-State Circuits Conference (A-SSCC)'))).toBeNull();
    expect(detectVenue(loc('ESSCIRC 2024 - IEEE 50th European Solid-State Circuits Conference'))).toBeNull();
    expect(detectVenue(loc('IEEE Micro Letters'))).toBeNull();
    expect(detectVenue(loc('Nature Communications'))).toBeNull();
    expect(detectVenue({ doi: '10.1109/tpel.2024.1234' })).toBeNull();
  });

  it('limits to chosen venues and rejects unknown ones', () => {
    const only = venueList(['ISCA', 'micro']);
    expect(only.map((v) => v.key)).toEqual(['ISCA', 'MICRO']);
    expect(detectVenue({ doi: '10.1109/ISSCC49661.2025.1' }, only)).toBeNull();
    expect(venueList(['all']).length).toBeGreaterThan(10);
    expect(() => venueList(['NeurIPS'])).toThrow(/Unknown venue/);
  });

  it('tags topics close to the owner\'s work', () => {
    expect(paperTopics('ECC-protected processing-in-memory for DNN inference on HBM')).toEqual(expect.arrayContaining(['PIM/CIM', 'Reliability/ECC', 'Memory systems', 'AI accelerators']));
    expect(paperTopics('An MLIR compiler for PIM')).toEqual(expect.arrayContaining(['Compilers/MLIR', 'PIM/CIM']));
    expect(paperTopics('140-GHz phased array transceiver')).toEqual([]);
  });

  it('scores relevant, recent, first/last-author papers higher', () => {
    const p = (o: Partial<CandidatePaper>): CandidatePaper => ({ title: 't', venue: 'ISCA', year: 2026, doi: null, url: null, pdf_url: null, position: 'middle', topics: [], ...o });
    const base = scoreAuthor([p({})], 2026);
    expect(scoreAuthor([p({ topics: ['PIM/CIM'] })], 2026)).toBeGreaterThan(base);
    expect(scoreAuthor([p({ position: 'first' })], 2026)).toBeGreaterThan(base);
    expect(scoreAuthor([p({ year: 2023 })], 2026)).toBeLessThan(base);
    expect(scoreAuthor([p({ venue: 'JSSC' })], 2026)).toBeLessThan(base);
    expect(scoreAuthor([p({}), p({ title: 'u' })], 2026)).toBeGreaterThan(base);
    expect(scoreAuthor(Array.from({ length: 40 }, (_, i) => p({ title: String(i), topics: ['PIM/CIM', 'Reliability/ECC'] })), 2026)).toBeLessThanOrEqual(100);
  });
});

describe('OpenAlex mapping (recorded responses)', () => {
  it('keeps only the authors at the company, by institution id', () => {
    const works = WORKS.results as OaWork[];
    const acc = collectAuthors('AMD', works, { ids: [AMD_US] });
    const alan = [...acc.values()].find((a) => a.name === 'Alan Smith')!;
    // OpenAlex has no author id for him (first author!): he is kept, keyed by company + name, and his two papers merge.
    expect(alan.id).toBe('~amd:alansmith');
    expect(alan.company).toBe('AMD');
    expect(alan.country).toBe('US');
    const papers = [...alan.papers.values()];
    expect(papers.map((p) => p.venue).sort()).toEqual(['ISCA', 'ISSCC']);
    expect(papers.every((p) => p.position === 'first')).toBe(true);
    // NVIDIA-only authors are not AMD candidates; papers outside the venues don't count.
    expect([...acc.values()].some((a) => a.name === 'Haoxing Mark Ren')).toBe(false);
    expect([...acc.values()].some((a) => a.name === 'Amr Shebl Ahmed')).toBe(false);
    const nv = collectAuthors('NVIDIA', works, { ids: [NVIDIA_US] });
    const ren = [...nv.values()].find((a) => a.name === 'Haoxing Mark Ren')!;
    expect([...ren.papers.values()][0]).toMatchObject({ venue: 'DAC', position: 'last', title: 'DGR: Differentiable Global Router' });
    expect(ren.id).toMatch(/^A\d+$/);
  });

  it('matches startups by affiliation text (whole words; all-caps phrases case-sensitive)', () => {
    const w = ETCHED_WORKS.results[0] as unknown as OaWork;
    expect(authorsAtCompany(w, { raw: ['Etched'] }).map((a) => [a.name, a.position])).toEqual([['Pat Example', 'first'], ['Robin Sample', 'last']]);
    expect(phraseMatcher('SAIT').test('Samsung Advanced Institute of Technology (SAIT), Suwon')).toBe(true);
    expect(phraseMatcher('SAIT').test('Sait Yilmaz, Istanbul')).toBe(false);
    expect(phraseMatcher('Arm Ltd').test('Harm Ltd')).toBe(false);
    const acc = collectAuthors('Etched', [w], { raw: ['Etched'] });
    expect([...acc.values()][0].papers.values().next().value).toMatchObject({ venue: 'ISCA', topics: expect.arrayContaining(['PIM/CIM', 'Memory systems']) });
  });

  it('builds frugal works queries; the cache ignores the API key', () => {
    const u = worksUrl({ ids: ['I1', 'I2'] }, 2024, '*', undefined);
    expect(u).toContain('filter=authorships.institutions.id:I1|I2,from_publication_date:2024-01-01,topics.subfield.id:1708|2208|1712');
    expect(u).toContain('per_page=200');
    expect(u).toContain('sort=publication_date:desc');
    expect(u).not.toContain('api_key');
    expect(worksUrl({ raw: 'Siemens EDA' }, 2025, '*', undefined)).toContain('raw_affiliation_strings.search:%22Siemens%20EDA%22');
    const k = worksUrl({ ids: ['I1'] }, 2024, '*', 'secret');
    expect(k).toContain('api_key=secret');
    expect(cacheKey(k)).toBe(cacheKey(worksUrl({ ids: ['I1'] }, 2024, '*', undefined)));
  });

  it('normalizes OpenAlex author ids', () => {
    expect(normalizeOpenalexId('https://openalex.org/A5012345678')).toBe('A5012345678');
    expect(normalizeOpenalexId('a5012345678')).toBe('A5012345678');
    expect(normalizeOpenalexId('W123')).toBeNull();
  });
});

describe('ResearchHttp', () => {
  const answer = (status: number, body: string, headers: Record<string, string> = {}) => new Response(body, { status, headers: { 'content-type': 'application/json', ...headers } });

  it('caches for 7 days, then asks again', async () => {
    let calls = 0; let t = Date.parse('2026-09-30T00:00:00Z');
    const http = new ResearchHttp({ cacheDir: tmp(), now: () => t, intervalMs: {}, fetchImpl: (async () => { calls++; return answer(200, `{"n":${calls}}`); }) as typeof fetch });
    expect(await http.json('https://api.example/x')).toEqual({ n: 1 });
    expect(await http.json('https://api.example/x')).toEqual({ n: 1 });
    expect(http.cached).toBe(1);
    t += 8 * 86_400_000;
    expect(await http.json('https://api.example/x')).toEqual({ n: 2 });
  });

  it('offline: a cache miss is an error, a hit is used however old', async () => {
    const dir = tmp();
    new ResearchHttp({ cacheDir: dir, now: () => 0 }).put('https://api.example/y', 200, 'application/json', '{"ok":1}');
    const http = new ResearchHttp({ cacheDir: dir, offline: true });
    expect(await http.json('https://api.example/y')).toEqual({ ok: 1 });
    await expect(http.get('https://api.example/z')).rejects.toMatchObject({ kind: 'offline' });
  });

  it('reports the OpenAlex daily budget and when it resets', async () => {
    const http = new ResearchHttp({
      cacheDir: tmp(), intervalMs: {}, now: () => Date.parse('2026-09-30T06:00:00Z'),
      fetchImpl: (async () => answer(429, '{"error":"Rate limit exceeded","message":"Insufficient budget."}', { 'retry-after': '64800' })) as typeof fetch,
    });
    const err = await http.get('https://api.openalex.org/works?x').catch((e) => e) as ResearchError;
    expect(err.kind).toBe('budget');
    expect(err.resetsAt).toBe('2026-10-01T00:00:00.000Z');
    expect(err.message).toMatch(/daily request budget/);
  });

  it('backs off on short rate limits and server errors, never caches them', async () => {
    const seq = [answer(429, '', { 'retry-after': '0' }), answer(503, ''), answer(200, '{"ok":true}')];
    let n = 0;
    const http = new ResearchHttp({ cacheDir: tmp(), intervalMs: {}, backoffMs: 1, fetchImpl: (async () => seq[n++]) as typeof fetch });
    expect(await http.json('https://api.semanticscholar.org/p')).toEqual({ ok: true });
    expect(http.requests).toBe(3);
  });

  it('refuses files over the size limit', async () => {
    const http = new ResearchHttp({ cacheDir: tmp(), intervalMs: {}, fetchImpl: (async () => new Response('x'.repeat(50), { headers: { 'content-length': '50' } })) as typeof fetch });
    await expect(http.get('https://x.example/big.pdf', { maxBytes: 10 })).rejects.toMatchObject({ kind: 'too_large' });
  });

  it('Semantic Scholar: open-access PDF, else arXiv, else nothing', async () => {
    const dir = tmp();
    const w = new ResearchHttp({ cacheDir: dir });
    w.put(s2Url('10.1/a'), 200, 'application/json', JSON.stringify({ openAccessPdf: { url: 'https://x.example/a.pdf' } }));
    w.put(s2Url('10.1/b'), 200, 'application/json', JSON.stringify({ openAccessPdf: null, externalIds: { ArXiv: '2401.01234' } }));
    w.put(s2Url('10.1/c'), 404, 'application/json', '{"error":"Paper not found"}');
    const http = new ResearchHttp({ cacheDir: dir, offline: true });
    expect(await s2PdfUrl(http, '10.1/a')).toBe('https://x.example/a.pdf');
    expect(await s2PdfUrl(http, '10.1/b')).toBe('https://arxiv.org/pdf/2401.01234');
    expect(await s2PdfUrl(http, '10.1/c')).toBeNull();
  });
});

describe('PDF e-mails', () => {
  it('finds plain and grouped addresses', () => {
    const r = findEmails([
      '{jane.doe, john_roe}@nvidia.example  (amy, bo)@amd.example',
      '{kim|lee}@chip.example; solo.author @ uni.example.',
      'Contact: JANE.DOE@nvidia.example',
    ].join('\n'));
    expect(r.emails).toEqual(['jane.doe@nvidia.example', 'john_roe@nvidia.example', 'amy@amd.example', 'bo@amd.example', 'kim@chip.example', 'lee@chip.example', 'solo.author@uni.example']);
    expect(r.grouped).toHaveLength(3);
    expect(r.grouped[0]).toEqual({ text: '{jane.doe, john_roe}@nvidia.example', emails: ['jane.doe@nvidia.example', 'john_roe@nvidia.example'] });
    expect(findEmails('no addresses here, just {braces} and @handles').emails).toEqual([]);
  });

  it('reads the first pages of a PDF and cuts the author block at "Abstract"', async () => {
    const pdf = makePdf([['A Title', 'Ana One, Ben Two', 'Chip Lab', '{ana, ben}@lab.example', 'Abstract', 'Body text.'], ['Second page'], ['Third page (not read)']]);
    const { pages, text } = await pdfText(new Uint8Array(pdf), 2);
    expect(pages).toBe(3);
    expect(text).toContain('Second page');
    expect(text).not.toContain('Third page');
    expect(authorBlock(text)).toBe('A Title\nAna One, Ben Two\nChip Lab\n{ana, ben}@lab.example');
  });

  it('pdfEmails: from the cache; web pages are refused; arXiv abstract links become PDF links', async () => {
    const dir = tmp();
    const w = new ResearchHttp({ cacheDir: dir });
    w.put('https://arxiv.org/pdf/2501.00002', 200, 'application/pdf', makePdf([['T', 'Ana One', '{ana, ben}@lab.example', 'Abstract']]));
    w.put('https://publisher.example/paper', 200, 'text/html', '<html>Sign in</html>');
    const http = new ResearchHttp({ cacheDir: dir, offline: true });
    const r = await pdfEmails(http, 'https://arxiv.org/abs/2501.00002');
    expect(r).toMatchObject({ url: 'https://arxiv.org/pdf/2501.00002', pages: 1, emails: ['ana@lab.example', 'ben@lab.example'] });
    await expect(pdfEmails(http, 'https://publisher.example/paper')).rejects.toThrow(/not a PDF/);
    await expect(pdfEmails(http, 'file:///etc/passwd')).rejects.toThrow(/Not a web link/);
    expect(pdfLink('https://www.arxiv.org/abs/1706.03762')).toBe('https://www.arxiv.org/pdf/1706.03762');
  });
});

describe('LinkedIn links', () => {
  it('accepts only profile links, in one canonical form', () => {
    expect(normalizeLinkedin('https://www.linkedin.com/in/jane-doe-123/')).toBe('https://www.linkedin.com/in/jane-doe-123');
    expect(normalizeLinkedin('linkedin.com/in/jane-doe')).toBe('https://www.linkedin.com/in/jane-doe');
    expect(normalizeLinkedin('https://in.linkedin.com/in/jane?trk=abc')).toBe('https://www.linkedin.com/in/jane');
    expect(normalizeLinkedin('https://www.linkedin.com/company/nvidia')).toBeNull();
    expect(normalizeLinkedin('https://evil.example/linkedin.com/in/jane')).toBeNull();
    expect(normalizeLinkedin('javascript:alert(1)//linkedin.com/in/x')).toBeNull();
    expect(normalizeLinkedin('')).toBeNull();
  });
});
