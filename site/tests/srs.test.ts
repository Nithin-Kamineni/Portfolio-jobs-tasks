import { describe, expect, it } from 'vitest';
import { dayPlus, intervalLabel, schedule, type SrsState } from '../src/lib/srs';

const fresh: SrsState = { ease: 2.5, interval_days: 0, reps: 0, lapses: 0 };

describe('spaced repetition', () => {
  it('new card: Again 0 d, Hard 1 d, Good 1 d, Easy 4 d', () => {
    expect(schedule(fresh, 1).interval_days).toBe(0);
    expect(schedule(fresh, 2).interval_days).toBe(1);
    expect(schedule(fresh, 3).interval_days).toBe(1);
    expect(schedule(fresh, 4).interval_days).toBe(4);
  });
  it('Good grows 1 → 3 → ~ease × interval', () => {
    let s = schedule(fresh, 3);
    s = schedule(s, 3);
    expect(s.interval_days).toBe(3);
    s = schedule(s, 3);
    expect(s.interval_days).toBe(8); // round(3 × 2.5)
    expect(s.reps).toBe(3);
  });
  it('Again resets reps, counts a lapse, lowers ease but never below 1.3', () => {
    let s: SrsState = { ease: 1.35, interval_days: 20, reps: 5, lapses: 0 };
    s = schedule(s, 1);
    expect(s).toEqual({ ease: 1.3, interval_days: 0, reps: 0, lapses: 1 });
    expect(schedule(s, 1).ease).toBe(1.3);
  });
  it('intervals always grow on Hard/Good/Easy and are capped at a year', () => {
    const s: SrsState = { ease: 3.5, interval_days: 300, reps: 9, lapses: 0 };
    for (const g of [2, 3, 4] as const) expect(schedule(s, g).interval_days).toBeGreaterThan(300);
    expect(schedule(s, 4).interval_days).toBe(365);
  });
  it('dates and labels', () => {
    expect(dayPlus(0, new Date('2026-10-17T15:00:00Z'))).toBe('2026-10-17');
    expect(dayPlus(3, new Date('2026-10-17T15:00:00Z'))).toBe('2026-10-20');
    expect(intervalLabel(0)).toBe('<10 min');
    expect(intervalLabel(1)).toBe('1 day');
    expect(intervalLabel(45)).toBe('2 mo');
  });
});
