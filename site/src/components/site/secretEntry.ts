// The way into the private apps from the portfolio: five taps on the logo chip within three seconds
// open the workspace on Tasks, where Cloudflare Access asks for the Google login. Convenience only;
// the login is the lock, and nothing on the page mentions this.

export const TAPS = 5;
export const WINDOW_MS = 3000;
export const TARGET = '/app/tasks/';

export function makeTapCounter(now: () => number = () => Date.now(), go: (url: string) => void = (url) => window.location.assign(url)) {
  let taps: number[] = [];
  return (e?: { preventDefault(): void }): boolean => {
    const t = now();
    taps = taps.filter((x) => t - x <= WINDOW_MS);
    taps.push(t);
    if (taps.length < TAPS) return false;
    taps = [];
    e?.preventDefault();
    go(TARGET);
    return true;
  };
}

/** One counter shared by every logo chip on the page (hero nav and sticky bar). */
export const secretTap = makeTapCounter();
