import { describe, expect, it } from 'vitest';
import { autoKey, autoTitle, suggest, upsertSql, validateFound } from '../../server/deadlines';

const dac = { conference: 'DAC', year: 2027, kind: 'paper', due_on: '2026-11-18', due_time: '23:59', tz: 'AoE', source_url: 'https://www.dac.com/call-for-papers' };

describe('conference deadlines from the "conference deadlines" run', () => {
  it('validates every field and never accepts an entry without its source page', () => {
    expect(validateFound([dac])[0]).toMatchObject({ conference: 'DAC', kind: 'paper', tz: 'AoE' });
    expect(() => validateFound([{ ...dac, source_url: '' }])).toThrow(/source_url/);
    expect(() => validateFound([{ ...dac, due_on: '18/11/2026' }])).toThrow(/due_on/);
    expect(() => validateFound([{ ...dac, kind: 'poster' }])).toThrow(/kind/);
    expect(() => validateFound([{ ...dac, tz: 'PST' }])).toThrow(/tz/);
    expect(() => validateFound([])).toThrow();
    expect(validateFound([{ ...dac, tz: undefined, due_time: undefined }])[0]).toMatchObject({ tz: 'AoE', due_time: null });
  });
  it('one row per conference, year and kind; new ones hidden', () => {
    const d = validateFound([dac, { ...dac, kind: 'abstract', due_on: '2026-11-11' }]);
    expect(d.map(autoKey)).toEqual(['dac-2027-paper', 'dac-2027-abstract']);
    expect(autoTitle(d[1])).toBe('DAC 2027: abstract registration');
    const sql = upsertSql(d, '2026-10-29T00:00:00Z');
    expect(sql).toContain("'auto'");
    expect(sql).toContain('ON CONFLICT(auto_key) WHERE auto_key IS NOT NULL DO UPDATE');
    expect(sql).not.toMatch(/DO UPDATE SET[^;]*\bshown=/); // a later run never changes what the owner picked
  });
  it('reports which deadlines are new and which were updated', async () => {
    const execs: string[] = [];
    const d1 = { query: async () => [[{ auto_key: 'dac-2027-paper' }]], exec: async (s: string) => { execs.push(s); } };
    const r = await suggest(d1, [dac, { ...dac, conference: 'ISCA', due_on: '2026-11-20' }]);
    expect(r).toEqual({ saved: 2, new: ['isca-2027-paper'], updated: ['dac-2027-paper'] });
    expect(execs).toHaveLength(1);
  });
});
