import { describe, expect, it } from 'vitest';
import { TAPS, TARGET, WINDOW_MS, makeTapCounter } from '../src/components/site/secretEntry';

function counter(times: number[]) {
  let i = 0;
  const gone: string[] = [];
  const tap = makeTapCounter(() => times[i++], (u) => gone.push(u));
  return { tap, gone };
}

describe('secret entry', () => {
  it('opens the workspace on the fifth tap inside the window and prevents the link', () => {
    const { tap, gone } = counter([0, 500, 1000, 1500, 2000]);
    let prevented = 0;
    const e = { preventDefault: () => prevented++ };
    for (let k = 0; k < TAPS - 1; k++) expect(tap(e)).toBe(false);
    expect(tap(e)).toBe(true);
    expect(gone).toEqual([TARGET]);
    expect(prevented).toBe(1);
  });
  it('forgets taps older than the window', () => {
    const { tap, gone } = counter([0, 100, 200, 300, WINDOW_MS + 400, WINDOW_MS + 500, WINDOW_MS + 600, WINDOW_MS + 700, WINDOW_MS + 800]);
    for (let k = 0; k < 4; k++) tap();
    expect(tap()).toBe(false); // the four early taps have expired: this is tap 1 of a new window
    tap(); tap(); tap();
    expect(tap()).toBe(true);
    expect(gone).toEqual([TARGET]);
  });
  it('starts over after opening', () => {
    const { tap, gone } = counter([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (let k = 0; k < 5; k++) tap();
    for (let k = 0; k < 4; k++) expect(tap()).toBe(false);
    expect(tap()).toBe(true);
    expect(gone).toEqual([TARGET, TARGET]);
  });
});
