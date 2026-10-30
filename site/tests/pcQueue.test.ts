import { describe, expect, it } from 'vitest';
import { validateRequest } from '../src/lib/cloud/runRequests';
import { findRequest, requestStatus, type RunRequest } from '../src/apps/jobs/api/pcQueue';

const NOW = Date.parse('2026-10-17T22:00:00Z');
const req = (o: Partial<RunRequest> = {}): RunRequest => ({
  id: 1, kind: 'run', task: 'process-new-jobs', params: {}, requested_at: '2026-10-17T21:59:00Z', requested_by: 'x', status: 'queued',
  claimed_at: null, local_run_id: null, message: null, result: null, updated_at: '2026-10-17T21:59:00Z', claimed_by: null, ...o,
});
const hb = (agoMs: number, busy = false) => ({ at: new Date(NOW - agoMs).toISOString(), version: 'v', busy, current_run: busy ? 9 : null, current_request: null, machine: 'home', name: 'Home PC' });

describe('validateRequest', () => {
  it('accepts the dashboard tasks with their own parameters only', () => {
    expect(validateRequest('run', 'process-new-jobs', { recheck: true })).toEqual({ kind: 'run', task: 'process-new-jobs', params: { recheck: true } });
    expect(validateRequest('run', 'check-manual-companies', { company: 'Meta' }).params).toEqual({ company: 'Meta' });
    expect(() => validateRequest('run', 'rm -rf', {})).toThrow(/Unknown task/);
    expect(() => validateRequest('run', 'quick-rank', {})).toThrow(/step of another task/);
    expect(() => validateRequest('run', 'weekly-review', { evil: 1 })).toThrow(/no parameter/);
    expect(() => validateRequest('run', 'process-new-jobs', { limit: { nested: 1 } })).toThrow(/Invalid value/);
    expect(() => validateRequest('shell', null, {})).toThrow(/Unknown request kind/);
  });
  it('needs a job id / company / run id for the other kinds', () => {
    expect(validateRequest('fetch-description', null, { jobId: 'wd:x:1', extra: 2 })).toEqual({ kind: 'fetch-description', task: null, params: { jobId: 'wd:x:1' } });
    expect(() => validateRequest('paper-emails', null, {})).toThrow(/company is required/);
    expect(validateRequest('cancel-run', null, { runId: '12' }).params).toEqual({ runId: 12 });
    expect(validateRequest('sync', 'ignored', { x: 1 })).toEqual({ kind: 'sync', task: null, params: {} });
  });
});

describe('requestStatus (the inline line under a button)', () => {
  it('queued: online, busy, offline, never seen', () => {
    expect(requestStatus(req(), { heartbeats: [hb(10_000)], now: NOW }).text).toBe('Queued — your PC will start it within ~30 s');
    expect(requestStatus(req(), { heartbeats: [hb(10_000, true)], now: NOW }).text).toBe('Queued — Home PC is busy with run #9; it starts right after');
    expect(requestStatus(req(), { heartbeats: [hb(3 * 3600_000)], now: NOW }).text).toMatch(/^PC offline since .+ — it will run when your PC's dashboard is on$/);
    expect(requestStatus(req(), { heartbeats: [], now: NOW }).text).toMatch(/hasn't checked in yet/);
  });
  it('started → running with the step; done with counts; failed with the message', () => {
    const run = { task: 'process-new-jobs', status: 'running' as const, progress: { steps: [], counters: {} as never, malformed: 0, pipeline: [{ key: 'quick', label: 'Quick rank (Sonnet)', status: 'running' as const }] } };
    expect(requestStatus(req({ status: 'started', local_run_id: 66, claimed_by: 'Home PC' }), { heartbeats: [hb(1000)], run: run as never, now: NOW }).text).toBe('Running on Home PC (run #66, Quick rank (Sonnet))');
    expect(requestStatus(req({ status: 'done', result: { counters: { ranked: 12 }, synced: true } }), { heartbeats: [], now: NOW }).text).toBe('Done (12 ranked) · synced');
    expect(requestStatus(req({ kind: 'sync', task: null, status: 'done', message: 'Imported 2 new jobs', result: { synced: true } }), { heartbeats: [], now: NOW }).text).toBe('Done: Imported 2 new jobs · synced');
    expect(requestStatus(req({ status: 'failed', message: 'Stopped after 20 min' }), { heartbeats: [], now: NOW })).toMatchObject({ severity: 'error', text: 'Failed: Stopped after 20 min' });
  });
  it('findRequest: the newest matching request; finished ones fade after 15 min', () => {
    const list = [req({ id: 3, status: 'done', updated_at: new Date(NOW - 20 * 60_000).toISOString() }), req({ id: 2, kind: 'fetch-description', task: null, params: { jobId: 'a' } })];
    expect(findRequest(list, 'run', 'process-new-jobs', {}, NOW)).toBeNull();
    expect(findRequest(list, 'fetch-description', null, { jobId: 'a' }, NOW)?.id).toBe(2);
    expect(findRequest(list, 'fetch-description', null, { jobId: 'b' }, NOW)).toBeNull();
  });
});
