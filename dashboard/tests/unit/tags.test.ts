import { describe, expect, it } from 'vitest';
import { atsFromUrl, deriveFlags, deriveTags, normalizePosted } from '../../../watcher/lib/tags.js';

describe('deriveTags', () => {
  it('tags from title, hits and description', () => {
    expect(deriveTags({ title: 'PhD Research Intern, AI Accelerator Design and VLSI', hits: ['phd', 'ai accelerator', 'asic'] }))
      .toEqual(expect.arrayContaining(['PhD', 'AI accelerator', 'ASIC/RTL']));
    const t = deriveTags({ title: 'Intern - Memory Systems Architecture', description: 'Work on HBM, processing-in-memory, ECC and RAS features. MLIR compiler.' });
    expect(t).toEqual(expect.arrayContaining(['Memory/PIM', 'Reliability/ECC', 'Compiler/MLIR', 'Architecture']));
    expect(deriveTags({ title: 'Design Verification Intern', description: 'UVM testbenches' })).toContain('Verification');
    expect(deriveTags({ title: 'EDA Software Intern' })).toContain('EDA');
    expect(deriveTags({ title: 'GPU Performance Intern', description: 'CUDA kernels' })).toContain('GPU/CUDA');
  });

  it('keeps the canonical order and no false positives on unrelated words', () => {
    expect(deriveTags({ title: 'Marketing Analyst Intern', description: 'spreadsheets' })).toEqual([]);
    // "dram" inside "drama", "ras" inside "rasterization" must not match
    expect(deriveTags({ title: 'Intern', description: 'drama club, rasterization' })).toEqual([]);
    const t = deriveTags({ title: 'PhD Compiler Intern', description: 'DRAM' });
    expect(t).toEqual(['PhD', 'Memory/PIM', 'Compiler/MLIR']);
  });
});

describe('deriveFlags', () => {
  const now = '2026-09-30T12:00:00Z';
  it('flags sponsorship, citizenship, degree and age', () => {
    expect(deriveFlags({ sponsorship: 'Does Not Offer Sponsorship', now })).toContain('No sponsorship');
    expect(deriveFlags({ description: 'We are unable to provide visa sponsorship for this role.', now })).toContain('No sponsorship');
    expect(deriveFlags({ sponsorship: 'U.S. Citizenship is Required', now })).toContain('Citizenship/clearance');
    expect(deriveFlags({ description: 'Must be able to obtain a security clearance.', now })).toContain('Citizenship/clearance');
    expect(deriveFlags({ degrees: "Bachelor's", now })).toContain("Bachelor's only");
    expect(deriveFlags({ degrees: "PhD/Master's", now })).not.toContain("Bachelor's only");
    expect(deriveFlags({ title: 'Undergraduate Hardware Intern', now })).toContain("Bachelor's only");
    expect(deriveFlags({ title: 'BS/MS Hardware Intern', now })).not.toContain("Bachelor's only");
    expect(deriveFlags({ posted: '2026-08-01', now })).toContain('Posted > 30 days');
    expect(deriveFlags({ posted: '2026-09-15', now })).not.toContain('Posted > 30 days');
    expect(deriveFlags({ description: 'Great PhD internship in architecture.', posted: '', now })).toEqual([]);
  });
});

describe('normalizePosted', () => {
  const now = '2026-09-30T12:00:00Z';
  it.each([
    ['Posted Today', '2026-09-30'], ['Posted Yesterday', '2026-09-29'], ['Posted 14 Days Ago', '2026-09-16'],
    ['Posted 30+ Days Ago', '2026-08-31'], ['2026-08-27T10:00:00Z', '2026-08-27'], ['August 27, 2026', '2026-08-27'],
    ['Aug 7, 2026', '2026-08-07'], ['09/01/2026', '2026-09-01'], ['1790000000', '2026-09-21'], ['', ''], ['whenever', ''],
  ])('%s → %s', (input, out) => { expect(normalizePosted(input, now)).toBe(out); });
});

describe('atsFromUrl', () => {
  it.each([
    ['https://nvidia.wd5.myworkdayjobs.com/en-US/X/job/1', 'workday'], ['https://job-boards.greenhouse.io/x/jobs/1', 'greenhouse'],
    ['https://jobs.lever.co/x/1', 'lever'], ['https://jobs.ashbyhq.com/etched/1', 'ashby'], ['https://example.com/job', 'other'], ['', 'other'],
  ])('%s → %s', (url, ats) => { expect(atsFromUrl(url)).toBe(ats); });
});
