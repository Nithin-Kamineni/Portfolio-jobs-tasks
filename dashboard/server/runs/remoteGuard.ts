// Two PCs, one "Process new jobs" at a time: the website queue's poller (server/runRequests.ts) knows from D1 whether the
// other PC is running one, and registers that check here; RunManager.start refuses those tasks while it says so.
let guard: (() => string | null) | null = null;

/** Tasks that write jobs (ranking, manual-company checks): only one of these across both PCs. */
export const EXCLUSIVE_TASKS = new Set(['process-new-jobs', 'check-manual-companies', 'quick-rank', 'final-check']);

export const setRemoteGuard = (g: (() => string | null) | null) => { guard = g; };
/** Why this task can't start now (the other PC is running one), or null. */
export const remoteBusy = (task: string): string | null => (EXCLUSIVE_TASKS.has(task) ? guard?.() ?? null : null);
