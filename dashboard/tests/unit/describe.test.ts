import { afterEach, describe, expect, it, vi } from 'vitest';
import { descriptionFromHtml, fetchDescription } from '../../../watcher/lib/describe.js';

const LONG = 'Design memory systems and ECC for AI accelerators. '.repeat(10);
afterEach(() => vi.unstubAllGlobals());

function stub(map: Record<string, unknown>) {
  const calls: string[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    calls.push(url);
    const key = Object.keys(map).find((k) => url.startsWith(k));
    if (!key) return new Response('not found', { status: 404 });
    const v = map[key];
    return new Response(typeof v === 'string' ? v : JSON.stringify(v), { status: 200 });
  }));
  return calls;
}

describe('descriptionFromHtml', () => {
  it('reads a JSON-LD JobPosting (also inside @graph)', () => {
    const page = `<script type="application/ld+json">{"@graph":[{"@type":"Organization"},{"@type":"JobPosting","description":"&lt;p&gt;${LONG}&lt;/p&gt;"}]}</script>`;
    expect(descriptionFromHtml(page)).toEqual({ html: `<p>${LONG}</p>`, via: 'json-ld' });
  });
  it('falls back to the meta description; returns null when there is nothing', () => {
    expect(descriptionFromHtml('<meta name="description" content="Short summary">')).toEqual({ html: 'Short summary', via: 'meta' });
    expect(descriptionFromHtml('<html></html>')).toBeNull();
  });
});

describe('fetchDescription routing', () => {
  it('Greenhouse by id and by URL', async () => {
    const calls = stub({ 'https://boards-api.greenhouse.io/v1/boards/': { content: `&lt;p&gt;${LONG}&lt;/p&gt;` } });
    expect((await fetchDescription({ id: 'gh:tenstorrent:123', url: '' })).via).toBe('greenhouse');
    await fetchDescription({ id: 'simplify:x', url: 'https://job-boards.greenhouse.io/lightmatter/jobs/456?gh_src=simplify' });
    expect(calls).toEqual(['https://boards-api.greenhouse.io/v1/boards/tenstorrent/jobs/123', 'https://boards-api.greenhouse.io/v1/boards/lightmatter/jobs/456']);
  });

  it('Apple by id; Oracle by URL; Amazon page sections without side boxes or scripts', async () => {
    const calls = stub({
      'https://jobs.apple.com/api/v1/jobDetails/': { res: { jobSummary: LONG, minimumQualifications: 'PhD student\nVerilog' } },
      'https://egup.fa.us2.oraclecloud.com/': { items: [{ ExternalDescriptionStr: `<p>${LONG}</p>` }] },
      'https://www.amazon.jobs/': `<div class="section description"></div><div class="section"><h2>Description</h2><p>${LONG}</p></div><h2>Job details</h2><p>Seattle</p><script>track()</script><div class="section app-download">`,
    });
    const a = await fetchDescription({ id: 'apple:200682357', url: '' });
    expect(a.description).toContain('<h3>Minimum qualifications</h3><p>PhD student</p><p>Verilog</p>');
    const o = await fetchDescription({ id: 'simplify:y', url: 'https://egup.fa.us2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1/job/20270351' });
    expect(o.via).toBe('oracle');
    expect(calls[1]).toContain('finder=ById;Id=%2220270351%22,siteNumber=CX_1');
    const z = await fetchDescription({ id: 'amzn:1', url: 'https://www.amazon.jobs/en/jobs/1/x' });
    expect(z.text).not.toMatch(/Seattle|track/);
    expect(z.via).toBe('amazon');
  });

  it('generic pages: JSON-LD works; a short meta summary is rejected', async () => {
    stub({
      'https://careers.amd.com/': `<script type="application/ld+json">{"@type":"JobPosting","description":"${LONG}"}</script>`,
      'https://jobs.bytedance.com/': '<meta property="og:description" content="Join us!">',
    });
    expect((await fetchDescription({ id: 'jibe:careers.amd.com:1', url: 'https://careers.amd.com/careers-home/jobs/1' })).via).toBe('json-ld');
    await expect(fetchDescription({ id: 'simplify:z', url: 'https://jobs.bytedance.com/en/position/1/detail' })).rejects.toThrow(/no machine-readable description/);
    await expect(fetchDescription({ id: 'x:1', url: '' })).rejects.toThrow(/no posting URL/);
  });
});
