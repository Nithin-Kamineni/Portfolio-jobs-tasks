// The PC queue on the website: buttons that need the PC (Claude runs, Sync, Fetch description, Find R&D emails) queue a
// request; the dashboard on the PC picks it up within ~20 s. This file: the API, the polling query and the status texts.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { PcHeartbeat, RequestKind, RunRequest } from '../../../lib/cloud/runRequests';
import type { Run } from '../../../../../dashboard/shared/types';
import { progressText } from '../runs/taskInfo';

export type { PcHeartbeat, RequestKind, RunRequest };
export interface QueueState { requests: RunRequest[]; heartbeats: PcHeartbeat[]; online: boolean }
export interface Queued { queued: true; deduped: boolean; request: RunRequest }

export const queueKey = ['run-requests'] as const;
export const PC_ONLINE_MS = 2 * 60_000;
const ACTIVE = new Set(['queued', 'claimed', 'started']);
export const isActiveRequest = (r: Pick<RunRequest, 'status'>) => ACTIVE.has(r.status);
/** A finished request's line stays next to its button this long. */
export const SHOW_FINISHED_MS = 15 * 60_000;

export const queueApi = {
  list: () => api.get<QueueState>('/run-requests?limit=40'),
  cancel: (id: number) => api.post<RunRequest>(`/run-requests/${id}/cancel`),
};

/** The queue and the PC's heartbeat: every 4 s while something is queued or running, else every 30 s. */
export function usePcQueue() {
  return useQuery({
    queryKey: queueKey, queryFn: queueApi.list, staleTime: 2000,
    refetchInterval: (q) => (q.state.data?.requests.some(isActiveRequest) ? 4000 : 30_000),
  });
}

/** Puts a just-queued request into the cache so its status shows at once. */
export function useAddRequest() {
  const qc = useQueryClient();
  return (r: RunRequest) => {
    qc.setQueryData<QueueState>(queueKey, (old) => (old ? { ...old, requests: [r, ...old.requests.filter((x) => x.id !== r.id)] } : { requests: [r], heartbeats: [], online: false }));
    void qc.invalidateQueries({ queryKey: queueKey });
  };
}

const sameParams = (a: Record<string, unknown>, b: Record<string, unknown>) => {
  const clean = (o: Record<string, unknown>) => JSON.stringify(Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => [k, o[k]]));
  return clean(a) === clean(b);
};

/** The newest request for this button (still going, or finished in the last 15 min). */
export function findRequest(requests: RunRequest[] | undefined, kind: RequestKind, task: string | null, params: Record<string, unknown>, now = Date.now()): RunRequest | null {
  const r = (requests || []).find((x) => x.kind === kind && (x.task ?? null) === task && sameParams(x.params, params));
  if (!r) return null;
  if (isActiveRequest(r)) return r;
  return now - new Date(r.updated_at).getTime() < SHOW_FINISHED_MS ? r : null;
}

export const pcOnline = (hb: PcHeartbeat | null | undefined, now = Date.now()) => Boolean(hb && now - new Date(hb.at).getTime() < PC_ONLINE_MS);
/** The PC's display name for a claimed_by id. */
export const pcName = (hbs: PcHeartbeat[] | undefined, machine: string | null | undefined) => (hbs || []).find((h) => h.machine === machine)?.name || machine || 'your PC';

const clock = (iso: string, now: number) => {
  const d = new Date(iso);
  const sameDay = new Date(now).toDateString() === d.toDateString();
  return sameDay ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const RUNNING: Record<RequestKind, string> = {
  run: 'Running on your PC', sync: 'Syncing on your PC (git pull, import, push)', 'fetch-description': 'Fetching the description on your PC',
  'paper-emails': 'Searching papers on your PC (1–2 min)', 'cancel-run': 'Stopping the run on your PC',
};

export interface StatusLine { severity: 'info' | 'success' | 'error' | 'warning'; text: string; active: boolean }

/** The line shown where the button is: Queued → Running on your PC (run #N, step …) → Done (…) · synced / Failed: … */
export function requestStatus(r: RunRequest, ctx: { heartbeats: PcHeartbeat[] | null | undefined; run?: Pick<Run, 'task' | 'progress' | 'status'> | null; now?: number }): StatusLine {
  const now = ctx.now ?? Date.now();
  const hbs = ctx.heartbeats || [];
  const online = hbs.filter((h) => pcOnline(h, now));
  const where = r.claimed_by ? pcName(hbs, r.claimed_by) : 'your PC';
  if (r.status === 'queued') {
    if (!hbs.length) return { severity: 'warning', active: true, text: "Queued — your PC hasn't checked in yet; it will run when your PC's dashboard is on" };
    if (!online.length) {
      const last = [...hbs].sort((a, b) => b.at.localeCompare(a.at))[0];
      return { severity: 'warning', active: true, text: hbs.length === 1 ? `PC offline since ${clock(last.at, now)} — it will run when your PC's dashboard is on` : `All PCs offline (${last.name} since ${clock(last.at, now)}) — it will run when a PC's dashboard is on` };
    }
    const needsIdle = r.kind === 'run' || r.kind === 'sync';
    if (needsIdle && online.every((h) => h.busy)) {
      const b = online[0];
      return { severity: 'info', active: true, text: `Queued — ${b.name} is busy${b.current_run ? ` with run #${b.current_run}` : ''}; it starts right after` };
    }
    return { severity: 'info', active: true, text: 'Queued — your PC will start it within ~30 s' };
  }
  if (r.status === 'claimed') return { severity: 'info', active: true, text: `${where === 'your PC' ? 'Your PC' : where} picked it up…` };
  if (r.status === 'started') {
    if (r.kind === 'run') {
      const step = ctx.run ? progressText(ctx.run) : '';
      return { severity: 'info', active: true, text: `Running on ${where} (run #${r.local_run_id ?? '?'}${step ? `, ${step}` : ''})` };
    }
    return { severity: 'info', active: true, text: `${RUNNING[r.kind].replace('your PC', where)}…` };
  }
  if (r.status === 'cancelled') return { severity: 'info', active: false, text: 'Cancelled' };
  if (r.status === 'failed') return { severity: 'error', active: false, text: `Failed: ${r.message || 'unknown error'}` };
  // done
  const res = (r.result || {}) as { synced?: boolean; counters?: Record<string, number>; runStatus?: string };
  const synced = res.synced === false ? ' · website updates at the next sync (≤ 5 min)' : ' · synced';
  if (r.kind === 'run') {
    const c = res.counters || {};
    const parts = [c.ranked ? `${c.ranked} ranked` : '', c.jobsAdded ? `${c.jobsAdded} added` : '', c.contacts ? `${c.contacts} contacts` : '', c.outreach ? `${c.outreach} drafts` : ''].filter(Boolean);
    return { severity: 'success', active: false, text: `Done (${parts.length ? parts.join(', ') : r.message || 'finished'})${synced}` };
  }
  return { severity: 'success', active: false, text: `Done: ${r.message || 'finished'}${synced}` };
}
