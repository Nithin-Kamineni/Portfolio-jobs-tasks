// Claude runs in the browser: live state (SSE, polling fallback), the app-bar pill, the Run panel, "Run" buttons,
// the preflight message (inline under the button), notifications, and the "updated by Claude" chip (plan v2 §3.3).
// Nothing opens by itself (2026-10-17): no "may take a while" dialog, no panel on start, no preflight dialog.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Alert, Box, Button, Chip, CircularProgress, Divider, Drawer, IconButton, Link, List,
  ListItem, ListItemIcon, ListItemText, Stack, TextField, Tooltip, Typography, type ButtonProps,
} from '@mui/material';
import AutoAwesome from '@mui/icons-material/AutoAwesome';
import Close from '@mui/icons-material/Close';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import RadioButtonUnchecked from '@mui/icons-material/RadioButtonUnchecked';
import RemoveCircleOutline from '@mui/icons-material/RemoveCircleOutline';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import { runKeys, runsApi, useRunDetail, type RunList } from '../api/runs';
import { useInvalidateAll } from '../api/hooks';
import { useNotify } from './Notify';
import { ACTIVE, finishedLine, progressText, type TaskId } from '../runs/taskInfo';
import { markdownToHtml } from '../lib/markdown';
import { readStore, writeStore } from '../lib/storage';
import { relTime } from '../lib/time';
import type { Preflight, Run, RunStatus } from '../../../shared/types';

// ---------- formatting ----------
export const RUN_STATUS_LABEL: Record<RunStatus, string> = {
  queued: 'Queued', running: 'Running', succeeded: 'Done', failed: 'Failed', cancelled: 'Cancelled', timed_out: 'Timed out', needs_user: 'Needs you',
};
export const runStatusColor = (s: RunStatus): 'default' | 'info' | 'success' | 'error' | 'warning' =>
  s === 'succeeded' ? 'success' : s === 'failed' || s === 'timed_out' ? 'error' : s === 'needs_user' ? 'warning' : s === 'running' || s === 'queued' ? 'info' : 'default';

export function fmtDuration(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return '';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m} min ${s % 60 ? `${s % 60} s` : ''}`.trim() : `${Math.floor(m / 60)} h ${m % 60} min`;
}
export const runDurationMs = (r: Pick<Run, 'started_at' | 'finished_at'>, now = Date.now()) =>
  r.started_at ? (r.finished_at ? new Date(r.finished_at).getTime() : now) - new Date(r.started_at).getTime() : null;

export function totalTokens(r: Pick<Run, 'progress'>): number {
  const u = r.progress.usage;
  return u ? u.input_tokens + u.output_tokens + u.cache_read_input_tokens + u.cache_creation_input_tokens : 0;
}
export const fmtTokens = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));
export const fmtUsd = (n: number | null | undefined) => (n == null ? '' : `$${n < 10 ? n.toFixed(2) : n.toFixed(0)}`);

// ---------- context ----------
interface RunsCtx {
  runs: Run[];
  active: Run[];
  paused: RunList['paused'];
  isRunning: (task: TaskId, params?: Record<string, unknown>) => boolean;
  /** Starts (queues) a run. No dialog and no panel opens; if Claude Code isn't ready, `onProblem` gets the message (else a snackbar). */
  start: (task: TaskId, params?: Record<string, unknown>, opts?: { onProblem?: (message: string) => void }) => Promise<Run | null>;
  openPanel: (id: number) => void;
  resumeQueue: () => void;
}

const Ctx = createContext<RunsCtx | null>(null);
export function useRuns(): RunsCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useRuns outside RunsProvider');
  return c;
}
/** For components that may render without the provider (older tests). */
export const useRunsOptional = () => useContext(Ctx);

const sameEntity = (a: Record<string, unknown>, b: Record<string, unknown>) =>
  ['jobId', 'company'].every((k) => (a[k] ?? null) === (b[k] ?? null));

export function RunsProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const notify = useNotify();
  const invalidateAll = useInvalidateAll();
  const [map, setMap] = useState<Record<number, Run>>({});
  const [paused, setPaused] = useState<RunList['paused']>(null);
  const [panel, setPanel] = useState<number | null>(null);
  const prev = useRef(new Map<number, RunStatus>());
  const live = useRef(new Map<number, string>());
  const liveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sseOk, setSseOk] = useState(false);

  const onFinished = useCallback((run: Run) => {
    void invalidateAll();
    const ok = run.status === 'succeeded';
    notify({
      severity: ok ? 'success' : run.status === 'cancelled' ? 'info' : 'warning', message: finishedLine(run), duration: 10000,
      action: { label: 'View summary', onClick: () => setPanel(run.id) },
    });
    try {
      if (typeof document !== 'undefined' && document.hidden && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('JobWatcher', { body: finishedLine(run) });
      }
    } catch { /* notifications unavailable */ }
  }, [invalidateAll, notify]);

  const upsert = useCallback((run: Run) => {
    if (run.parent_id != null) {
      // a pipeline step: refresh the pipeline's detail, and the pages while the step writes
      void qc.invalidateQueries({ queryKey: runKeys.one(run.parent_id) });
      const sig = JSON.stringify(run.progress.counters);
      if (ACTIVE(run) && live.current.get(run.id) !== sig) {
        live.current.set(run.id, sig);
        if (!liveTimer.current) liveTimer.current = setTimeout(() => { liveTimer.current = null; void invalidateAll(); }, 2500);
      }
      return;
    }
    const before = prev.current.get(run.id);
    // Never move a run backwards: the SSE "running" event can arrive before the POST response that says "queued".
    const phase = (s: RunStatus) => (s === 'queued' ? 0 : s === 'running' ? 1 : 2);
    if (before && phase(run.status) < phase(before)) return;
    prev.current.set(run.id, run.status);
    setMap((m) => ({ ...m, [run.id]: run }));
    void qc.invalidateQueries({ queryKey: runKeys.one(run.id) });
    if (before && ACTIVE({ status: before }) && !ACTIVE(run)) { onFinished(run); return; }
    // Live refresh while Claude writes: re-read jobs/outreach at most every 2.5 s when a counter moved.
    const sig = JSON.stringify(run.progress.counters);
    if (ACTIVE(run) && live.current.get(run.id) !== sig) {
      live.current.set(run.id, sig);
      if (!liveTimer.current) liveTimer.current = setTimeout(() => { liveTimer.current = null; void invalidateAll(); }, 2500);
    }
  }, [qc, onFinished, invalidateAll]);

  const load = useCallback(async () => {
    try {
      const r = await runsApi.list(50);
      setPaused(r.paused);
      for (const run of [...r.runs].reverse()) upsert(run);
    } catch { /* server not reachable: try later */ }
  }, [upsert]);

  useEffect(() => {
    void load();
    if (typeof EventSource === 'undefined') return;
    const es = new EventSource('/api/runs/stream');
    es.addEventListener('hello', (e) => { setSseOk(true); try { setPaused(JSON.parse((e as MessageEvent).data).paused); } catch { /* ignore */ } void load(); });
    es.addEventListener('run', (e) => { try { upsert(JSON.parse((e as MessageEvent).data)); } catch { /* ignore */ } });
    es.addEventListener('paused', (e) => { try { setPaused(JSON.parse((e as MessageEvent).data)); } catch { /* ignore */ } });
    es.onerror = () => setSseOk(false); // the browser reconnects by itself; poll meanwhile
    return () => es.close();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const runs = useMemo(() => Object.values(map).sort((a, b) => b.id - a.id), [map]);
  const active = useMemo(() => runs.filter(ACTIVE).sort((a, b) => a.id - b.id), [runs]);

  // Polling fallback (no EventSource, or the stream dropped) while something is active.
  useEffect(() => {
    if (sseOk || !active.length) return;
    const t = setInterval(() => { void load(); }, 2000);
    return () => clearInterval(t);
  }, [sseOk, active.length, load]);
  useEffect(() => () => { if (liveTimer.current) clearTimeout(liveTimer.current); }, []);

  const isRunning = useCallback((task: TaskId, params: Record<string, unknown> = {}) =>
    active.some((r) => r.task === task && sameEntity(r.params, params)), [active]);

  const start = useCallback(async (task: TaskId, params: Record<string, unknown> = {}, opts: { onProblem?: (message: string) => void } = {}) => {
    let pf: Preflight;
    try { pf = await qc.fetchQuery({ queryKey: runKeys.preflight, queryFn: () => runsApi.preflight(), staleTime: 60_000 }); }
    catch (e) { notify({ severity: 'error', message: `Couldn't check Claude Code: ${(e as Error).message}` }); return null; }
    if (!pf.ok) {
      const message = pf.message || "Claude Code isn't ready";
      if (opts.onProblem) opts.onProblem(message); else notify({ severity: 'warning', message });
      return null;
    }
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default' && !readStore('jw.runs.notifyAsked', false)) {
        writeStore('jw.runs.notifyAsked', true);
        void Notification.requestPermission().catch(() => undefined);
      }
    } catch { /* ignore */ }
    try {
      const { run, deduped } = await runsApi.start(task, params);
      upsert(run);
      if (deduped) notify({ severity: 'info', message: 'Claude is already doing this', action: { label: 'View', onClick: () => setPanel(run.id) } });
      return run;
    } catch (e) {
      notify({ severity: 'error', message: `Couldn't start Claude: ${(e as Error).message}` });
      return null;
    }
  }, [qc, notify, upsert]);

  const resumeQueue = useCallback(() => { void runsApi.resumeQueue().then(() => { setPaused(null); void load(); }); }, [load]);

  const value: RunsCtx = { runs, active, paused, isRunning, start, openPanel: setPanel, resumeQueue };
  return (
    <Ctx.Provider value={value}>
      {children}
      <RunPanel runId={panel} fallback={panel != null ? map[panel] : undefined} onClose={() => setPanel(null)} />
    </Ctx.Provider>
  );
}

// ---------- app-bar pill ----------
export function RunPill() {
  const ctx = useRunsOptional();
  if (!ctx) return null;
  const { active, paused, openPanel, runs } = ctx;
  const current = active.find((r) => r.status === 'running') || active[0];
  if (paused && !current) {
    const last = runs[0];
    return (
      <Chip color="warning" icon={<AutoAwesome />} label={`Claude paused: plan usage limit${paused.until ? `, resumes ${relTime(paused.until)}` : ''}`}
        onClick={last ? () => openPanel(last.id) : undefined} data-testid="run-pill" />
    );
  }
  if (!current) return null;
  const prog = progressText(current);
  const queued = active.length - 1;
  const label = `Claude: ${current.status === 'queued' ? `waiting to start ${current.activity}` : current.activity}${prog ? ` · ${prog}` : ''}${queued > 0 ? ` (+${queued} queued)` : ''}`;
  return (
    <Chip color="secondary" variant="outlined" onClick={() => openPanel(current.id)} data-testid="run-pill" aria-label={`${label}. Open the run panel`}
      icon={<CircularProgress size={14} color="inherit" aria-hidden sx={{ ml: '8px !important' }} />} label={<>✦ {label}</>}
      sx={{ maxWidth: 420, fontWeight: 600 }} />
  );
}

// ---------- buttons ----------
/**
 * A button that starts a Claude run. Nothing opens by itself: the app-bar pill shows the run (click it for the panel).
 * If Claude Code isn't ready, a short message with "Check again" shows right under the button.
 */
export function RunButton({ task, params = {}, children, disabledReason, onStarted, ...rest }:
  { task: TaskId; params?: Record<string, unknown>; children: ReactNode; disabledReason?: string; onStarted?: (run: Run) => void } & Omit<ButtonProps, 'onClick' | 'children'>) {
  const ctx = useRunsOptional();
  const qc = useQueryClient();
  const busy = ctx?.isRunning(task, params) ?? false;
  const [starting, setStarting] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const tip = busy ? 'Claude is already doing this' : disabledReason || '';
  const checkAgain = () => {
    void runsApi.preflight(true).then((p) => { qc.setQueryData(runKeys.preflight, p); setProblem(p.ok ? null : p.message || 'Still not ready'); })
      .catch((e: Error) => setProblem(`Couldn't check Claude Code: ${e.message}`));
  };
  return (
    <Box component="span" sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: 420, verticalAlign: 'middle' }}>
      <Tooltip title={tip}>
        <span>
          <Button {...rest} disabled={!ctx || busy || starting || Boolean(disabledReason) || rest.disabled}
            startIcon={busy || starting ? <CircularProgress size={14} aria-label="Claude is working" /> : 'startIcon' in rest ? rest.startIcon : <AutoAwesome fontSize="small" />}
            onClick={async () => {
              if (!ctx) return;
              setStarting(true); setProblem(null);
              try { const run = await ctx.start(task, params, { onProblem: setProblem }); if (run) onStarted?.(run); } finally { setStarting(false); }
            }}>
            {children}
          </Button>
        </span>
      </Tooltip>
      {problem && (
        <Typography component="span" variant="caption" color="warning.main" role="alert" data-testid="preflight-message" sx={{ mt: 0.5, lineHeight: 1.35 }}>
          {problem}{' '}
          <Link component="button" type="button" variant="caption" onClick={checkAgain} sx={{ verticalAlign: 'baseline' }}>Check again</Link>
        </Typography>
      )}
    </Box>
  );
}

/** "✦ Claude" chip for 1 hour after a Claude run changed this job or contact. */
export function ClaudeTouchedChip({ at, now = Date.now() }: { at?: string | null; now?: number }) {
  if (!at) return null;
  const age = now - new Date(at).getTime();
  if (!(age >= -60_000 && age < 3600_000)) return null;
  return (
    <Tooltip title={`Updated by Claude ${relTime(at)}`}>
      <Chip size="small" color="secondary" variant="outlined" label="✦ Claude" data-testid="claude-touched" sx={{ height: 20, fontSize: 11 }} />
    </Tooltip>
  );
}

// ---------- the Run panel ----------
const STEP_ICON: Record<string, ReactNode> = {
  done: <CheckCircleOutline color="success" fontSize="small" />, failed: <ErrorOutline color="error" fontSize="small" />,
  running: <CircularProgress size={16} aria-label="Running" />, skipped: <RemoveCircleOutline color="disabled" fontSize="small" />, pending: <RadioButtonUnchecked color="disabled" fontSize="small" />,
};

export function RunPanel({ runId, fallback, onClose }: { runId: number | null; fallback?: Run; onClose: () => void }) {
  const { data } = useRunDetail(runId);
  const ctx = useRunsOptional();
  const notify = useNotify();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [, tick] = useState(0);
  // The live copy (SSE) is never older than the fetched detail; the detail adds the pipeline's child runs.
  const run = data && data.id === runId
    ? { ...data, ...(fallback && fallback.id === data.id ? fallback : {}), children: data.children }
    : fallback ? { ...fallback, children: [] as Run[] } : undefined;
  const activeNow = run ? ACTIVE(run) : false;
  useEffect(() => {
    if (!activeNow) return;
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [activeNow]);
  useEffect(() => { setNote(''); }, [runId]);

  const cancel = async () => {
    if (!run) return;
    setBusy(true);
    try { await runsApi.cancel(run.id); notify({ severity: 'info', message: 'Cancelling…' }); } catch (e) { notify({ severity: 'error', message: (e as Error).message }); } finally { setBusy(false); }
  };
  const cont = async () => {
    if (!run) return;
    setBusy(true);
    try { const r = await runsApi.continue(run.id, note || undefined); ctx?.openPanel(r.run.id); notify({ message: 'Continuing…' }); }
    catch (e) { notify({ severity: 'error', message: (e as Error).message }); } finally { setBusy(false); }
  };

  const c = run?.progress.counters;
  const counts = c ? ([
    ['ranked', 'ranked'], ['jobsAdded', 'jobs added'], ['statuses', 'status changes'], ['outreach', 'drafts'], ['contacts', 'contacts'], ['fetched', 'fetches'], ['denied', 'not allowed'],
  ] as const).filter(([k]) => c[k] > 0).map(([k, label]) => `${c[k]} ${label}`) : [];
  const canContinue = run && !ACTIVE(run) && run.session_id && !run.progress.pipeline && ['needs_user', 'failed', 'succeeded', 'timed_out', 'cancelled'].includes(run.status);
  const steps = run ? [...run.progress.steps].reverse().slice(0, 25) : [];

  return (
    <Drawer anchor="right" open={runId != null} onClose={onClose} sx={{ zIndex: (t) => t.zIndex.modal }}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: 'max(480px, 50vw)' } }, role: 'dialog', 'aria-label': 'Claude run' } as object }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <AutoAwesome color="secondary" />
        <Typography variant="h6" component="h2" sx={{ flex: 1 }} noWrap>{run ? run.label : 'Claude run'}</Typography>
        {run && <Chip size="small" label={RUN_STATUS_LABEL[run.status]} color={runStatusColor(run.status)} data-testid="run-status" />}
        <IconButton aria-label="Close run panel" onClick={onClose}><Close /></IconButton>
      </Stack>
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
        {!run ? <CircularProgress size={20} aria-label="Loading the run" /> : (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              {run.status === 'queued' ? 'Waiting for the run before it to finish.' : run.started_at ? `Started ${relTime(run.started_at)} · ${fmtDuration(runDurationMs(run))}` : ''}
              {run.progress.model ? ` · ${run.progress.model}` : ''}
            </Typography>
            {run.progress.pipeline && run.progress.pipeline.length > 0 && (
              <List dense disablePadding aria-label="Pipeline steps" sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                {run.progress.pipeline.map((s) => (
                  <ListItem key={s.key} divider data-testid={`pipeline-${s.key}`} data-status={s.status}>
                    <ListItemIcon sx={{ minWidth: 32 }}>{STEP_ICON[s.status]}</ListItemIcon>
                    <ListItemText primary={s.label} secondary={s.detail} />
                  </ListItem>
                ))}
              </List>
            )}
            {run.error && <Alert severity={run.status === 'needs_user' ? 'warning' : run.status === 'cancelled' ? 'info' : 'error'} data-testid="run-error">{run.error}</Alert>}
            {ctx?.paused && run.progress.usageLimit && (
              <Alert severity="warning" action={<Button color="inherit" size="small" onClick={ctx.resumeQueue}>Resume now</Button>}>
                The queue is paused until {new Date(ctx.paused.until).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.
              </Alert>
            )}
            {activeNow && run.progress.lastText && (
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                <Typography variant="overline" color="text.secondary">Claude says</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }} data-testid="run-last-text">{run.progress.lastText}</Typography>
              </Box>
            )}
            {!activeNow && run.summary && (
              <Box>
                <Typography variant="overline" color="text.secondary">Summary</Typography>
                <Box data-testid="run-summary" sx={{ typography: 'body2', '& h3,& h4,& h5,& h6': { fontSize: 15, fontWeight: 650, m: '8px 0 4px' }, '& ul,& ol': { pl: 2.5, my: 0.5 }, '& p': { my: 0.5 }, '& table': { borderCollapse: 'collapse', width: '100%', my: 1, fontSize: 13 }, '& th,& td': { border: 1, borderColor: 'divider', px: 0.75, py: 0.5, textAlign: 'left', verticalAlign: 'top' }, '& th': { bgcolor: 'action.hover', fontWeight: 650 } }}
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(run.summary) }} />
              </Box>
            )}
            {(counts.length > 0 || run.num_turns != null || run.progress.usage) && (
              <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }} data-testid="run-counts">
                {progressText(run) && ACTIVE(run) && <Chip size="small" color="secondary" label={progressText(run)} />}
                {counts.map((t) => <Chip key={t} size="small" variant="outlined" label={t} />)}
                {run.num_turns != null && <Chip size="small" variant="outlined" label={`${run.num_turns} turns`} />}
                {totalTokens(run) > 0 && <Chip size="small" variant="outlined" label={`${fmtTokens(totalTokens(run))} tokens`} />}
                {run.usage_usd != null && (
                  <Tooltip title="What this run would cost on the API. You're on the Claude plan, so it only shows how much of the plan's usage it took.">
                    <Chip size="small" variant="outlined" label={`usage (API-equivalent) ${fmtUsd(run.usage_usd)}`} />
                  </Tooltip>
                )}
              </Stack>
            )}
            {run.progress.git && (run.progress.git.warning
              ? <Alert severity="warning" data-testid="run-git">{run.progress.git.warning}</Alert>
              : <Typography variant="body2" color="text.secondary" data-testid="run-git">
                  {run.progress.git.committed ? `Committed ${run.progress.git.files.length} file${run.progress.git.files.length === 1 ? '' : 's'}` : 'Nothing to commit'}{run.progress.git.pushed ? ' and pushed to GitHub.' : '.'}
                </Typography>)}
            <Stack direction="row" spacing={1} alignItems="center">
              {ACTIVE(run) && <Button variant="outlined" color="error" onClick={cancel} disabled={busy}>Cancel</Button>}
              <Link href={`/api/runs/${run.id}/log`} target="_blank" rel="noopener noreferrer" variant="body2">Open log</Link>
            </Stack>
            {canContinue && (
              <Box sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Continue this run</Typography>
                <TextField size="small" fullWidth multiline minRows={2} label="Tell Claude (optional)" value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. I logged in; the posting is open in Chrome" />
                <Button sx={{ mt: 1 }} variant="contained" startIcon={<PlayArrowRounded />} onClick={cont} disabled={busy}>Continue</Button>
              </Box>
            )}
            {run.children && run.children.length > 0 && (
              <Box>
                <Typography variant="overline" color="text.secondary">Claude runs in this pipeline</Typography>
                <List dense disablePadding data-testid="run-children">
                  {run.children.map((ch) => (
                    <ListItem key={ch.id} disableGutters secondaryAction={<Chip size="small" label={RUN_STATUS_LABEL[ch.status]} color={runStatusColor(ch.status)} />}>
                      <ListItemText primary={`${ch.label}${ch.params.company ? `: ${String(ch.params.company)}` : ''}`}
                        secondary={[progressText(ch), ch.num_turns != null ? `${ch.num_turns} turns` : '', ch.usage_usd != null ? fmtUsd(ch.usage_usd) : '', ch.error || ''].filter(Boolean).join(' · ')} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            <Divider />
            <Box>
              <Typography variant="overline" color="text.secondary">Steps</Typography>
              {steps.length === 0 ? <Typography variant="body2" color="text.secondary">Nothing yet.</Typography> : (
                <List dense disablePadding data-testid="run-steps">
                  {steps.map((s, i) => (
                    <ListItem key={`${s.at}-${i}`} disableGutters sx={{ py: 0.25 }}>
                      <ListItemText primary={s.text} secondary={new Date(s.at).toLocaleTimeString()}
                        slotProps={{ primary: { variant: 'body2', color: s.kind === 'error' ? 'error' : undefined }, secondary: { variant: 'caption' } }} />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}
