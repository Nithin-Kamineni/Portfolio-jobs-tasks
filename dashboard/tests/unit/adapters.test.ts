// Watcher adapters must never lose postings to paging (2026-09-30: Workday stopped after 2 pages, Google after 1,
// Oracle/SmartRecruiters/Rippling read one page, Siemens EDA was on the wrong site). Fetch is stubbed.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { adapters } from '../../../watcher/lib/adapters.js';
import { refreshSeen, targetFor } from '../../../watcher/watch.js';

afterEach(() => vi.unstubAllGlobals());

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- request bodies of several ATS APIs
type Body = any;
type Handler = (url: string, body: Body) => unknown;
function stub(handler: Handler) {
  const calls: { url: string; body: Body }[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, body });
    const v = handler(url, body);
    if (v === undefined) return new Response('not found', { status: 404 });
    return new Response(typeof v === 'string' ? v : JSON.stringify(v), { status: 200 });
  }));
  return calls;
}

const wdJob = (i: number) => ({ title: `Intern ${i}`, externalPath: `/job/x/Intern-${i}_JR${1000 + i}`, locationsText: 'Santa Clara, CA', bulletFields: [`JR${1000 + i}`] });
const WD = { company: 'NVIDIA', host: 'nvidia.wd5.myworkdayjobs.com', tenant: 'nvidia', site: 'Ext' };

describe('workday', () => {
  it('reads every page although Workday sends total 0 after the first page', async () => {
    const jobs = Array.from({ length: 45 }, (_, i) => wdJob(i));
    stub((_u, b) => ({ total: b.offset === 0 ? 45 : 0, jobPostings: jobs.slice(b.offset, b.offset + 20) }));
    const r = await adapters.workday(WD, ['intern']);
    expect(r).toHaveLength(45);
    expect(r.warnings).toEqual([]);
  });

  it('stops when Workday wraps around to page 1 instead of looping', async () => {
    const jobs = Array.from({ length: 40 }, (_, i) => wdJob(i));
    const calls = stub((_u, b) => ({ total: 50, jobPostings: b.offset < 40 ? jobs.slice(b.offset, b.offset + 20) : jobs.slice(0, 20) }));
    const r = await adapters.workday(WD, ['intern']);
    expect(r).toHaveLength(40);
    expect(calls.length).toBeLessThan(10);
  });

  it('a board under 2000 is read in full, whatever the titles say (no search words, no facets)', async () => {
    const jobs = Array.from({ length: 30 }, (_, i) => wdJob(i));
    const calls = stub((_u, b) => ({ total: b.offset === 0 ? 30 : 0, jobPostings: jobs.slice(b.offset, b.offset + 20) }));
    expect(await adapters.workday(WD, ['intern', 'co-op'])).toHaveLength(30);
    expect(calls.every((c) => c.body.searchText === '' && !Object.keys(c.body.appliedFacets).length)).toBe(true);
  });

  it('a board over the 2000 limit is completed with its intern facets and every search word', async () => {
    const board = Array.from({ length: 60 }, (_, i) => wdJob(i));
    const interns = Array.from({ length: 25 }, (_, i) => wdJob(500 + i));
    const facets = [{ facetParameter: 'workerSubType', values: [{ descriptor: 'Regular', id: 'r' }, { descriptor: 'Intern (Fixed Term)', id: 'i1' }] }];
    const calls = stub((_u, b) => {
      if (b.appliedFacets?.workerSubType) return { total: b.offset === 0 ? 25 : 0, jobPostings: interns.slice(b.offset, b.offset + 20) };
      if (b.searchText === 'co-op') return { total: b.offset === 0 ? 1 : 0, jobPostings: b.offset === 0 ? [wdJob(900)] : [] };
      if (b.searchText) return { total: 0, jobPostings: [] };
      // the whole board: says 2000 (Workday's cap), then wraps after 60
      return { total: b.offset === 0 ? 2000 : 0, facets: b.offset === 0 ? facets : undefined, jobPostings: b.offset < 60 ? board.slice(b.offset, b.offset + 20) : board.slice(0, 20) };
    });
    const r = await adapters.workday(WD, ['intern', 'co-op']);
    expect(r).toHaveLength(86);
    expect(r.map((j: { title: string }) => j.title)).toEqual(expect.arrayContaining(['Intern 59', 'Intern 524', 'Intern 900']));
    expect(r.warnings).toEqual([]);
    expect(calls.some((c) => c.body?.searchText === 'intern')).toBe(true);
  });

  it('a board without an intern facet over the 2000 limit falls back to every search term, with a warning', async () => {
    const board = Array.from({ length: 60 }, (_, i) => wdJob(i));
    stub((_u, b) => {
      if (b.searchText === 'PhD') return { total: b.offset === 0 ? 1 : 0, jobPostings: b.offset === 0 ? [wdJob(900)] : [] };
      if (b.searchText === 'intern') return { total: 0, jobPostings: [] };
      return { total: b.offset === 0 ? 2000 : 0, jobPostings: b.offset < 60 ? board.slice(b.offset, b.offset + 20) : board.slice(0, 20) }; // wraps after 60
    });
    const r = await adapters.workday(WD, ['intern', 'PhD']);
    expect(r).toHaveLength(61);
    expect(r.warnings.join(' ')).toMatch(/no intern facet/);
  });
});

describe('google', () => {
  it('pages on the total in ds:1[2] (it moved from [1]) and stops on an empty page', async () => {
    const page = (n: number, from: number) => {
      const jobs = Array.from({ length: n }, (_, i) => [`${from + i}`, `Hardware Intern ${from + i}`, null, null, null, null, null, null, null, [['Sunnyvale, CA, USA']]]);
      return `<script>AF_initDataCallback({key: 'ds:1', hash: '2', data:${JSON.stringify([jobs, null, 25, 20])}, sideChannel: {}});</script>`;
    };
    stub((u) => { const p = Number(new URL(u).searchParams.get('page')); return p === 1 ? page(20, 0) : p === 2 ? page(5, 20) : page(0, 0); });
    expect(await adapters.google({ company: 'Google' }, ['intern'])).toHaveLength(25);
  });
});

describe('offset-paged feeds', () => {
  it('Oracle reads past the first 200', async () => {
    const all = Array.from({ length: 431 }, (_, i) => ({ Id: `${i}`, Title: `Intern ${i}`, PrimaryLocation: 'Dallas, TX' }));
    stub((u) => { const off = Number(u.match(/offset=(\d+)/)![1]); return { items: [{ TotalJobsCount: 431, requisitionList: all.slice(off, off + 200) }] }; });
    expect(await adapters.oracle({ company: 'TI', host: 'x.oraclecloud.com', tenant: 'CX', site: 'https://careers.ti.com/en/sites/CX' }, ['intern'])).toHaveLength(431);
  });

  it('SmartRecruiters reads past the first 100', async () => {
    const all = Array.from({ length: 150 }, (_, i) => ({ id: `${i}`, name: `Intern ${i}`, location: { city: 'Irvine', country: 'us' } }));
    stub((u) => { const off = Number(new URL(u).searchParams.get('offset')); return { totalFound: 150, content: all.slice(off, off + 100) }; });
    expect(await adapters.smartrecruiters({ company: 'WD', tenant: 'WesternDigital' }, ['intern'])).toHaveLength(150);
  });

  it('Qualcomm/Microsoft (PCSX) are read in full without a search word', async () => {
    const calls = stub((u) => { const st = Number(new URL(u).searchParams.get('start')); return { data: { count: 25, positions: Array.from({ length: Math.min(10, 25 - st) }, (_, i) => ({ id: st + i, name: 'Engineer', positionUrl: '/careers/job/' + (st + i) })) } }; });
    expect(await adapters.pcsx({ company: 'Qualcomm', host: 'careers.qualcomm.com', tenant: 'qualcomm.com' }, ['intern', 'PhD'])).toHaveLength(25);
    expect(calls.every((c) => new URL(c.url).searchParams.get('query') === '')).toBe(true);
  });

  it('a page that still fails after the retries keeps what was read, with a warning (not the whole source lost)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true, advanceTimeDelta: 1000 });
    try {
      stub((u) => { const st = Number(new URL(u).searchParams.get('start')); return st >= 20 ? undefined : { data: { count: 40, positions: Array.from({ length: 10 }, (_, i) => ({ id: st + i, name: 'Intern', positionUrl: '/j/' + (st + i) })) } }; });
      const r = await adapters.pcsx({ company: 'Microsoft', host: 'apply.careers.microsoft.com', tenant: 'microsoft.com' }, []);
      expect(r).toHaveLength(20);
      expect(r.warnings[0]).toMatch(/stopped at 20 of 40 jobs/);
    } finally { vi.useRealTimers(); }
  });

  it('Rippling reads every page', async () => {
    stub((u) => { const p = Number(new URL(u).searchParams.get('page')); return { totalPages: 2, items: [{ id: `${p}a`, name: 'Intern' }, { id: `${p}b`, name: 'Intern' }] }; });
    expect(await adapters.rippling({ company: 'Positron', tenant: 'positron' })).toHaveLength(4);
  });
});

describe('nlx (Siemens EDA)', () => {
  it('lists postings from the sitemap and reads each student posting\'s JSON record', async () => {
    const G1 = '6AFFDBD4521D4B32B11E90FA92C7678D', G2 = '8395466EA74F4CE4AD65B98AAE440C11', G3 = '4B945E5600914C989CF0EC447CADB6AE';
    const calls = stub((u) => {
      if (u.endsWith('/sitemap.xml')) return '<sitemapindex><sitemap><loc>https://jobs.sw.siemens.com/sitemaps/jobs_1.xml</loc></sitemap><sitemap><loc>https://jobs.sw.siemens.com/sitemaps/pages.xml</loc></sitemap></sitemapindex>';
      if (u.endsWith('/jobs_1.xml')) return `<urlset><url><loc>https://jobs.sw.siemens.com/huntsville-al/electronics-software-engineering-co-op-spring-2027/${G1}/job/</loc></url>`
        + `<url><loc>https://jobs.sw.siemens.com/rotterdam-nld/market-development-intern/${G2}/job/</loc></url>`
        + `<url><loc>https://jobs.sw.siemens.com/nagoya-jpn/account-development-representative/${G3}/job/</loc></url></urlset>`;
      if (u.includes(`/data/${G1}.json`)) return { title_exact: 'Electronics Software Engineering Co-Op (Spring 2027)', location_exact: 'Huntsville, AL', country: 'United States', html_description: '<p>Semiconductor</p>', date_new: '2026-09-05T03:47:26Z', is_posted: false };
      if (u.includes(`/data/${G2}.json`)) return { title_exact: 'Market Development Intern', location_exact: 'Rotterdam, NLD', country: 'Netherlands' };
      return undefined;
    });
    const r = await adapters.nlx({ company: 'Siemens EDA', host: 'jobs.sw.siemens.com', tenant: 'jobs-sw-siemens-com' });
    expect(r.map((j: { title: string; location?: string; posted?: string }) => [j.title, j.location, j.posted])).toEqual([
      ['Electronics Software Engineering Co-Op (Spring 2027)', 'Huntsville, AL, United States', '2026-09-05'],
      ['Market Development Intern', 'Rotterdam, NLD, Netherlands', ''],
    ]);
    expect(calls.some((c) => c.url.includes(G3))).toBe(false); // not a student role by its URL: never opened
  });
});

describe('watch.js helpers', () => {
  it('refreshSeen forgets rejections (not reported jobs) once when the filters change', () => {
    const kw = { titleMustMatchAny: ['intern'] };
    const seen: Record<string, { s: number; r?: number }> = { a: { s: -99 }, b: { s: 7 }, c: { s: 3 }, 'simplify:d': { s: 8 }, 'simplify:e': { s: 12 }, f: { s: 1, r: 1 }, g: { s: 20, r: 0 } };
    expect(refreshSeen(seen, kw)).toBe(4);
    expect(Object.keys(seen).sort()).toEqual(['__filters', 'b', 'f', 'simplify:e']);
    expect(refreshSeen(seen, kw)).toBe(0); // same filters: nothing more
  });

  it('targetFor matches SimplifyJobs company names to companies.csv rows by whole-word prefix', () => {
    const cs = [{ company: 'Amazon / AWS (Annapurna Labs)' }, { company: 'Tesla (AI hardware)' }, { company: 'Western Digital' }, { company: 'Siemens EDA' }, { company: 'Arm' }];
    expect(targetFor('Amazon', cs)?.company).toBe('Amazon / AWS (Annapurna Labs)');
    expect(targetFor('Tesla', cs)?.company).toBe('Tesla (AI hardware)');
    expect(targetFor('Siemens', cs)?.company).toBe('Siemens EDA');
    expect(targetFor('Western Alliance Bank', cs)).toBeNull();
    expect(targetFor('Armada', cs)).toBeNull();
  });
});
