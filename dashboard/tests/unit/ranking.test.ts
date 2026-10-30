import { describe, expect, it } from 'vitest';
import { normalizeUrl, reqIdFrom, repostKey } from '../../server/dedupe';
import { relevantText, ruleFor } from '../../server/ranking';
import { manualJobId } from '../../server/manual';

describe('normalizeUrl / reqIdFrom / repostKey', () => {
  it('drops tracking parameters, fragment, www, trailing slash; lower-cases; strips the Workday locale', () => {
    expect(normalizeUrl('https://www.Example.com/Jobs/123/?utm_source=Simplify&gh_src=abc#apply')).toBe('https://example.com/jobs/123');
    expect(normalizeUrl('https://boards.greenhouse.io/acme/jobs/555?gh_jid=555&source=LinkedIn')).toBe('https://greenhouse.io/acme/jobs/555?gh_jid=555'); // boards./job-boards. hosts are one board
    expect(normalizeUrl('https://x.example/a?b=2&a=1')).toBe(normalizeUrl('https://x.example/a?a=1&b=2'));
    expect(normalizeUrl('https://intel.wd1.myworkdayjobs.com/en-US/External/job/US-Oregon-Hillsboro/X_JR0287314'))
      .toBe(normalizeUrl('https://intel.wd1.myworkdayjobs.com/External/job/US-Oregon-Hillsboro/X_JR0287314?source=simplify'));
    expect(normalizeUrl('')).toBe('');
    expect(normalizeUrl('not a url')).toBe('not a url');
  });

  it('requisition numbers from Workday, Greenhouse, SmartRecruiters (and none for others)', () => {
    expect(reqIdFrom('https://nvidia.example/x', 'wd:nvidia:JR2026584')).toBe('JR2026584');
    expect(reqIdFrom('https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/US-CA-Santa-Clara/PhD-Research-Intern_JR2026584', 'simplify:1')).toBe('JR2026584');
    expect(reqIdFrom('https://micron.wd1.myworkdayjobs.com/External/job/Boise/Intern_JR111017-1')).toBe('JR111017'); // -1 = another copy of the same requisition
    expect(reqIdFrom('https://boards.greenhouse.io/acme/jobs/4455667')).toBe('4455667');
    expect(reqIdFrom('https://careers.acme.example/apply?gh_jid=987654')).toBe('987654');
    expect(reqIdFrom('https://jobs.smartrecruiters.com/WesternDigital/744000140949875')).toBe('744000140949875');
    expect(reqIdFrom('https://jobs.ashbyhq.com/etched/11111111-2222-3333-4444-555555555555')).toBe('');
    expect(reqIdFrom('')).toBe('');
  });

  it('re-post key: company key + title without punctuation, years and seasons', () => {
    expect(repostKey('NVIDIA', 'PhD Research Intern, AI Accelerator Design and VLSI - 2027')).toBe('nvidia|phd research intern ai accelerator design vlsi');
    expect(repostKey('NVIDIA Corp', 'PhD Research Intern – AI Accelerator Design & VLSI (Summer 2028)')).toBe('nvidia|phd research intern ai accelerator design vlsi');
    expect(repostKey('Micron', 'Intern')).not.toBe(repostKey('NVIDIA', 'Intern'));
    expect(repostKey('X', '')).toBe('');
  });

  it('manual job ids are stable for URL variants', () => {
    const a = manualJobId('Meta', 'https://www.metacareers.com/jobs/123/?utm_source=x');
    expect(a).toBe(manualJobId('Meta', 'https://metacareers.com/jobs/123'));
    expect(a).toMatch(/^manual:meta:[0-9a-f]{12}$/);
    expect(manualJobId('Tesla (AI hardware)', 'https://t.example/1')).toMatch(/^manual:tesla:/);
  });
});

describe('ranking cards: the relevant part of a description', () => {
  const desc = `<h2>About Acme</h2><p>Acme is a leading company founded in 1999 with offices worldwide.</p>
    <h3>What you'll do</h3><ul><li>Design processing-in-memory accelerators for LLM inference</li><li>Model HBM bandwidth with Ramulator</li></ul>
    <h3>Minimum qualifications</h3><ul><li>PhD student in EE/CE</li><li>Verilog, C++</li></ul>
    <h3>Benefits</h3><p>401(k), paid time off, health insurance.</p>
    <p>The base salary range for this position is $40 - $60 per hour.</p>
    <h3>Equal Opportunity</h3><p>Acme is an equal opportunity employer without regard to race, color or veteran status.</p>`;
  it('keeps responsibilities and qualifications; drops about-us, benefits, pay and EEO text', () => {
    const t = relevantText(desc);
    expect(t).toMatch(/What you'll do: Design processing-in-memory accelerators/);
    expect(t).toMatch(/Minimum qualifications: PhD student in EE\/CE Verilog, C\+\+/);
    expect(t).not.toMatch(/founded in 1999|401\(k\)|salary|equal opportunity|veteran/i);
  });
  it('without headings it drops boilerplate sentences; long texts are capped at a word boundary', () => {
    const plain = 'We build memory chips. You will design ECC for HBM. We are an equal opportunity employer without regard to race. '.repeat(1) + 'Design RTL for PIM. '.repeat(200);
    const t = relevantText(plain, 300);
    expect(t.length).toBeLessThanOrEqual(302);
    expect(t.endsWith('…')).toBe(true);
    expect(t).not.toMatch(/equal opportunity/);
    expect(t).toMatch(/design ECC for HBM/);
  });
});

describe('rule-based pre-ranking', () => {
  const domainOk = (title: string, desc: string) => /hardware|memory|rtl|asic|chip/i.test(`${title} ${desc}`);
  const long = (s: string) => `${s} `.repeat(30);
  it('citizenship/clearance → 3; no hardware topic → 5 (only with a real description); Bachelor\'s only → 10; else null', () => {
    expect(ruleFor({ title: 'Hardware Intern', flags: ['Citizenship/clearance'], description: long('secret clearance'), degrees: '' }, domainOk)).toEqual({ fit: 3, reason: expect.stringMatching(/citizenship\/clearance/) });
    expect(ruleFor({ title: 'Data Analyst Intern', flags: [], description: long('spreadsheets and dashboards for the sales team'), degrees: '' }, domainOk)).toEqual({ fit: 5, reason: 'Domain rule: no hardware topic' });
    expect(ruleFor({ title: 'Data Analyst Intern', flags: [], description: '', degrees: '' }, domainOk)).toBeNull(); // JS-only page: not ruled out by title
    expect(ruleFor({ title: 'Hardware Intern', flags: ["Bachelor's only"], description: long('memory chips'), degrees: "Bachelor's" }, domainOk)).toEqual({ fit: 10, reason: expect.stringMatching(/Bachelor/) });
    expect(ruleFor({ title: 'PhD Memory Intern', flags: ['No sponsorship'], description: long('HBM memory'), degrees: 'PhD' }, domainOk)).toBeNull();
  });

});
