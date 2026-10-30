import { describe, expect, it } from 'vitest';
import { allowedNext, canTransition, companyKey, JOB_STATUSES, normalizeStatus, PHASES, REMOVED_STATUSES, STATUS_LABEL, type JobStatus } from '../../shared/statuses';

describe('job status transitions (2026-10-17 model)', () => {
  it('allows the normal pipeline: decide → Referral → Applied ⇄ Interview', () => {
    const path: JobStatus[] = ['new', 'ranked', 'apply_referral', 'applied', 'interview', 'applied'];
    for (let i = 1; i < path.length; i++) expect(canTransition(path[i - 1], path[i]), `${path[i - 1]} → ${path[i]}`).toBe(true);
  });

  it('"Apply direct" is applied straight from the inbox; changing one\'s mind still works', () => {
    expect(canTransition('new', 'applied')).toBe(true);
    expect(canTransition('ranked', 'applied')).toBe(true);
    expect(canTransition('new', 'skip')).toBe(true);
    expect(canTransition('skip', 'applied')).toBe(true);
    expect(canTransition('later', 'apply_referral')).toBe(true);
    expect(canTransition('apply_referral', 'later')).toBe(true);
  });

  it.each([
    ['ranked', 'new'], ['applied', 'new'], ['applied', 'skip'], ['applied', 'apply_referral'], ['closed', 'new'],
    ['later', 'interview'], ['new', 'interview'], ['interview', 'skip'],
  ] as [JobStatus, JobStatus][])('rejects %s → %s', (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });

  it('removed statuses are gone; apply_direct is an alias of applied', () => {
    for (const s of ['prepared', 'apply_direct', 'rejected', 'offer']) expect((JOB_STATUSES as readonly string[]).includes(s)).toBe(false);
    expect(normalizeStatus('apply_direct')).toBe('applied');
    expect(normalizeStatus('interview')).toBe('interview');
    expect(Object.keys(REMOVED_STATUSES).sort()).toEqual(['offer', 'prepared', 'rejected']);
  });

  it('three phases: Referral, Applied, Interview', () => {
    expect(PHASES.map((p) => [p.label, p.status])).toEqual([['Referral', 'apply_referral'], ['Applied', 'applied'], ['Interview', 'interview']]);
    expect(STATUS_LABEL.apply_referral).toBe('Referral');
  });

  it('every status has a transition list and closed is terminal', () => {
    for (const s of JOB_STATUSES) expect(Array.isArray(allowedNext(s))).toBe(true);
    expect(allowedNext('closed')).toEqual([]);
  });
});

describe('companyKey', () => {
  it.each([
    ['NVIDIA', 'nvidia'], ['Amazon / AWS (Annapurna Labs) (Annapurna Labs (U.S.) Inc. - D63)', 'amazon'], ['SK hynix America', 'sk hynix'],
    ['Samsung Semiconductor (US / SAIT America)', 'samsung'], ['d-Matrix', 'd-matrix'], ['', ''],
  ])('%s → %s', (name, key) => { expect(companyKey(name)).toBe(key); });
});
