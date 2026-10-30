// Pipeline runs (plan v2 §3.8, §4). One button, one queued run whose steps are code or their own Claude runs:
//   Process new jobs: sync → manual companies (Chrome, when due) → rule-based pre-ranking → quick rank (Sonnet) → final check (Opus, fit ≥ runs.finalMinFit, 30)
//   Check manual companies: one Chrome run per company.
import { sync } from '../sync';
import { getSettings, listJobs } from '../repo';
import { manualChecks, manualCompanies } from '../manual';
import { prerank, type Fetcher } from '../ranking';
import type { PipelineApi, PipelineFn, PipelineOutcome } from './runner';
import type { PipelineStep, Run } from '../../shared/types';
import type { TaskId } from './tasks';
import type { PromptInfo } from './prompts';
import { companyInfo } from './params';

const FINAL_BATCH = 15;
const MAX_QUICK_BATCHES = 12;

export interface PipelineDeps { fetcher?: Fetcher; fetchDelayMs?: number }

type Api = PipelineApi;
const done = (s: Run) => s.status === 'succeeded';

/** Runs a Claude step; when the plan's usage limit stops it, waits for the reset and tries again (up to 3 times). */
async function childWithPause(api: Api, key: string, task: TaskId, params: Record<string, unknown>, info?: Omit<PromptInfo, 'runId' | 'params'>): Promise<Run> {
  for (let attempt = 0; ; attempt++) {
    const r = await api.runChild(task, params, info);
    const limit = r.progress.usageLimit;
    if (r.status !== 'needs_user' || !limit || attempt >= 3 || api.cancelled()) return r;
    const until = limit.resetsAt && new Date(limit.resetsAt).getTime() > Date.now() ? limit.resetsAt : new Date(Date.now() + 3600e3).toISOString();
    api.step(key, { detail: `Paused: plan usage limit, resumes at ${new Date(until).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` });
    if (!(await api.pauseUntil(until, 'Paused: plan usage limit'))) return r;
  }
}

async function manualStep(api: Api, key: string, companies: string[]): Promise<{ lines: string[]; failed: boolean }> {
  const lines: string[] = []; let chromeDown = false;
  for (const [i, name] of companies.entries()) {
    if (api.cancelled()) break;
    if (chromeDown) { lines.push(`${name}: skipped (Chrome not connected)`); continue; }
    api.step(key, { status: 'running', detail: `${name} (${i + 1}/${companies.length})…` });
    const r = await childWithPause(api, key, 'check-manual-companies', { company: name }, { company: companyInfo(api.ctx.db, name) });
    const check = manualChecks(api.ctx.db).get(name);
    if (!done(r) && /Claude in Chrome isn't connected/.test(r.error || '')) { chromeDown = true; lines.push(`${name}: Chrome not connected`); continue; }
    lines.push(check && check.checked_at && r.started_at && check.checked_at >= r.started_at
      ? `${name}: ${check.result === 'ok' ? `${check.added ?? 0} added` : check.result}`
      : `${name}: ${done(r) ? 'checked' : r.status.replace('_', ' ')}`);
  }
  return { lines, failed: chromeDown };
}

function topJobsMarkdown(api: Api, sinceIso: string, n = 8): string {
  const jobs = listJobs(api.ctx.db, { status: 'ranked', sort: 'fit' }).filter((j) => j.ranked_at && j.ranked_at >= sinceIso && j.rank_stage !== 'rule').slice(0, n);
  if (!jobs.length) return '';
  const mark = (s: string | null | undefined) => (s === 'final' ? ' (checked)' : s === 'quick' ? ' (quick)' : '');
  return `\n\n**Top jobs**\n${jobs.map((j) => `- fit ${j.fit_score}${mark(j.rank_stage)} · ${j.company.replace(/\s*\(.*$/, '')}: ${j.title}`).join('\n')}`;
}

export function processNewJobsPipeline(deps: PipelineDeps = {}): PipelineFn {
  return async (api): Promise<PipelineOutcome> => {
    const { db, cfg } = api.ctx;
    const p = api.params as { limit?: number; skipManual?: boolean; recheck?: boolean };
    const started = api.run.started_at || new Date().toISOString();
    const limit = Number(p.limit || 40);
    const minFit = cfg.runs.finalMinFit;

    if (p.recheck) {
      // Opus re-reads ranked jobs with fit ≥ finalMinFit that were never checked (e.g. the v1 backlog).
      api.setSteps([{ key: 'final', label: `Final check (Opus, fit ≥ ${minFit})`, status: 'running' }]);
      const ids = listJobs(db, { status: 'ranked', sort: 'fit' }).filter((j) => (j.fit_score ?? 0) >= minFit && j.rank_stage !== 'final').map((j) => j.id);
      const out = await finalStep(api, ids);
      if (out.error) return { status: 'failed', summary: out.summary, error: out.error };
      return { status: 'succeeded', summary: `**Re-checked ${out.checked} ranked job${out.checked === 1 ? '' : 's'} with fit ≥ ${minFit}** (${out.changed} score${out.changed === 1 ? '' : 's'} changed by 5 or more).${topJobsMarkdown(api, started)}\n\nDecide in the dashboard.` };
    }

    const steps: PipelineStep[] = [
      { key: 'sync', label: 'Sync (git pull + import)', status: 'pending' },
      { key: 'manual', label: 'Manual companies (Claude in Chrome)', status: 'pending' },
      { key: 'rules', label: 'Rule-based pre-ranking', status: 'pending' },
      { key: 'quick', label: 'Quick rank (Sonnet)', status: 'pending' },
      { key: 'final', label: `Final check (Opus, fit ≥ ${minFit})`, status: 'pending' },
    ];
    api.setSteps(steps);
    const notes: string[] = [];
    const fail = (key: string, error: string, summary: string): PipelineOutcome => {
      api.step(key, { status: 'failed', detail: error });
      for (const s of steps.slice(steps.findIndex((x) => x.key === key) + 1)) api.step(s.key, { status: 'skipped', detail: 'not run (an earlier step failed)' });
      return { status: 'failed', summary, error };
    };

    // 1. sync (no AI). The pipeline's own after-run commit pushes at the end.
    api.step('sync', { status: 'running' });
    const s = await sync(api.ctx, { commitAndPush: false });
    api.step('sync', { status: 'done', detail: `${s.importedJobs} new job${s.importedJobs === 1 ? '' : 's'} imported${s.warning ? ' (git warning; see Home)' : ''}` });
    if (api.cancelled()) return { status: 'cancelled', summary: '' };

    // 2. manual companies (Chrome), only the ones that are due
    const hours = getSettings(db, cfg.runs).manualCheckEveryHours;
    const due = manualCompanies(db, hours).filter((c) => c.due).map((c) => c.name);
    if (p.skipManual) api.step('manual', { status: 'skipped', detail: 'skipped for this run' });
    else if (!due.length) api.step('manual', { status: 'skipped', detail: `all checked in the last ${hours} h` });
    else {
      const m = await manualStep(api, 'manual', due);
      notes.push(`Manual companies: ${m.lines.join(' · ')}`);
      api.step('manual', { status: 'done', detail: m.lines.join(' · ') });
    }
    if (api.cancelled()) return { status: 'cancelled', summary: '' };

    // 3. rules (no AI)
    api.step('rules', { status: 'running', detail: 'fetching missing descriptions…' });
    const pr = await prerank(api.ctx, { fetcher: deps.fetcher, delayMs: deps.fetchDelayMs });
    api.step('rules', {
      status: 'done',
      detail: `${pr.settled.length} settled by rules${pr.closed.length ? ` · ${pr.closed.length} closed (posting gone)` : ''}${pr.fetched ? ` · ${pr.fetched} descriptions fetched` : ''} · ${pr.toRank} left for Claude`,
    });
    if (api.cancelled()) return { status: 'cancelled', summary: '' };

    // 4. quick rank in batches (Sonnet)
    let quick = 0; let batches = 0;
    if (!pr.toRank) api.step('quick', { status: 'skipped', detail: 'no new jobs to rank' });
    else {
      api.step('quick', { status: 'running', detail: `${pr.toRank} jobs…` });
      while (!api.cancelled() && batches < MAX_QUICK_BATCHES) {
        const left = listJobs(db, { forRanking: true }).length;
        if (!left) break;
        const r = await childWithPause(api, 'quick', 'quick-rank', { limit });
        batches++;
        const n = r.progress.counters.ranked;
        quick += n;
        if (!done(r) || !n) {
          if (!n && done(r)) return fail('quick', 'Claude ranked nothing in this batch', `Ranked ${quick} job(s) before the quick rank stopped.`);
          if (!done(r)) return fail('quick', r.error || `quick rank ${r.status}`, `Ranked ${quick} job(s) before the quick rank stopped.`);
        }
        api.step('quick', { detail: `${quick} ranked in ${batches} run${batches === 1 ? '' : 's'}${left - n > 0 ? ` · ${left - n} left` : ''}` });
      }
      api.step('quick', { status: 'done', detail: `${quick} ranked in ${batches} run${batches === 1 ? '' : 's'}` });
    }
    if (api.cancelled()) return { status: 'cancelled', summary: '' };

    // 5. final check (Opus) of the promising quick scores
    const ids = listJobs(db, { status: 'ranked', sort: 'fit' })
      .filter((j) => j.rank_stage === 'quick' && (j.fit_score ?? 0) >= minFit && j.ranked_at && j.ranked_at >= started).map((j) => j.id);
    let checked = 0;
    if (!ids.length) api.step('final', { status: 'skipped', detail: quick ? `no quick score ≥ ${minFit}` : 'nothing to check' });
    else {
      const out = await finalStep(api, ids);
      checked = out.checked;
      if (out.error) return fail('final', out.error, `Ranked ${quick + pr.settled.length} jobs; the final check stopped.`);
    }

    const total = pr.settled.length + quick;
    const summary = total || s.importedJobs
      ? `**Ranked ${total} new job${total === 1 ? '' : 's'}**: ${pr.settled.length} by rules, ${quick} quick-ranked, ${checked} checked by Opus.${pr.closed.length ? ` ${pr.closed.length} closed (posting gone).` : ''}${notes.length ? `\n\n${notes.join('\n\n')}` : ''}${topJobsMarkdown(api, started)}\n\nDecide in the dashboard.`
      : `No new jobs to rank.${notes.length ? `\n\n${notes.join('\n\n')}` : ''}`;
    return { status: 'succeeded', summary };
  };
}

async function finalStep(api: Api, ids: string[]): Promise<{ checked: number; changed: number; error?: string; summary: string }> {
  const { db } = api.ctx;
  const all = new Map(listJobs(db, {}).map((j) => [j.id, j.fit_score]));
  const before = new Map(ids.map((id) => [id, all.get(id) ?? null]));
  let checked = 0;
  api.step('final', { status: 'running', detail: `${ids.length} job${ids.length === 1 ? '' : 's'}…` });
  for (let i = 0; i < ids.length && !api.cancelled(); i += FINAL_BATCH) {
    const batch = ids.slice(i, i + FINAL_BATCH);
    const r = await childWithPause(api, 'final', 'final-check', { jobIds: batch });
    checked += r.progress.counters.ranked;
    if (!done(r)) return { checked, changed: 0, error: r.error || `final check ${r.status}`, summary: '' };
    api.step('final', { detail: `${checked}/${ids.length} checked` });
  }
  const after = new Map(listJobs(db, {}).map((j) => [j.id, j.fit_score]));
  const changed = ids.filter((id) => { const a = after.get(id); const b = before.get(id); return a != null && b != null && Math.abs(a - b) >= 5; }).length;
  api.step('final', { status: 'done', detail: `${checked} checked · ${changed} changed by ≥ 5` });
  return { checked, changed, summary: '' };
}

/** "Check now" on the Companies page: every enabled manual company (or the given ones), one Chrome run each. */
export function checkManualPipeline(): PipelineFn {
  return async (api): Promise<PipelineOutcome> => {
    const { db } = api.ctx;
    const list = Array.isArray(api.params.companies) && api.params.companies.length
      ? (api.params.companies as string[]) : manualCompanies(db, 0).map((c) => c.name);
    api.setSteps([{ key: 'manual', label: 'Manual companies (Claude in Chrome)', status: 'running' }]);
    const m = await manualStep(api, 'manual', list);
    api.step('manual', { status: m.failed ? 'failed' : 'done', detail: m.lines.join(' · ') });
    const summary = `**Manual companies**\n${m.lines.map((l) => `- ${l}`).join('\n')}\n\nNew postings are in the Jobs list as New; "Process new jobs" ranks them.`;
    return m.failed ? { status: 'failed', summary, error: "Claude in Chrome isn't connected. Open Chrome and make sure the Claude extension is signed in, then try again." } : { status: 'succeeded', summary };
  };
}

export function buildPipelines(deps: PipelineDeps = {}): Partial<Record<TaskId, PipelineFn>> {
  return { 'process-new-jobs': processNewJobsPipeline(deps), 'check-manual-companies': checkManualPipeline() };
}
