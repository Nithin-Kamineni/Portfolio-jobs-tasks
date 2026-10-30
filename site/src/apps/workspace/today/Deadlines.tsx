// Today → Deadlines. Each card has a size: L (a full-width row with a big timer), M (a card with a live
// countdown to the second) or S (one line). "Auto" asks the PC to search the web for conference deadlines
// (the "conference deadlines" Claude run; "Log" shows its steps live); what it finds arrives hidden, and the
// deadline selector is where the owner ticks the ones the page shows (with the page each date was read from).
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api, readStore, relTime, useLoad, useStored, writeStore } from '../api';
import { Btn, useSafeDelete, useToast } from '../ui';
import { Markdown } from '../markdown';

export interface Deadline {
  id: number; title: string; due_on: string; due_time: string | null; tz: 'local' | 'AoE' | 'UTC'; kind: Kind; note: string; url: string; done_at: string | null; created_at: string;
  size: Size; shown: number; source: 'manual' | 'auto'; source_url: string; auto_key: string | null; conf: string; seen: number; changed_at: string | null; found_at: string | null;
}
type Size = 'L' | 'M' | 'S';
type Kind = 'paper' | 'application' | 'exam' | 'interview' | 'other';
const KINDS: Record<Kind, { label: string; icon: string }> = {
  paper: { label: 'Paper', icon: '📄' }, application: { label: 'Application', icon: '💼' }, exam: { label: 'Exam', icon: '📝' }, interview: { label: 'Interview', icon: '🎤' }, other: { label: 'Other', icon: '⏳' },
};
const SIZE_LABEL: Record<Size, string> = { L: 'Large', M: 'Medium', S: 'Small' };

/** The moment a deadline ends: its time (or the end of the day) in its zone. */
export function dueAt(d: Pick<Deadline, 'due_on' | 'due_time' | 'tz'>) {
  const t = d.due_time ?? '23:59';
  if (d.tz === 'UTC') return Date.parse(`${d.due_on}T${t}:00Z`);
  if (d.tz === 'AoE') return Date.parse(`${d.due_on}T${t}:00-12:00`);
  return new Date(`${d.due_on}T${t}:00`).getTime();
}
const split = (ms: number) => {
  const a = Math.abs(ms);
  return { d: Math.floor(a / 864e5), h: Math.floor((a % 864e5) / 36e5), m: Math.floor((a % 36e5) / 6e4), s: Math.floor((a % 6e4) / 1e3), past: ms < 0 };
};
const pad = (n: number) => String(n).padStart(2, '0');
const short = (ms: number) => { const c = split(ms); return `${c.past ? '−' : ''}${c.d ? `${c.d}d ${c.h}h` : c.h ? `${c.h}h ${pad(c.m)}m` : `${c.m}m ${pad(c.s)}s`}`; };
const urgency = (ms: number) => (ms < 0 ? 'past' : ms < 864e5 ? 'now' : ms < 7 * 864e5 ? 'week' : 'later');
const when = (d: Deadline) => new Date(dueAt(d)).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
const fmtDay = (day: string) => new Date(day + 'T12:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
const asLocalDay = (d: Deadline) => new Date(dueAt(d)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

// The website's PC queue (the same one the job dashboard's buttons use).
interface RunRequest { id: number; status: 'queued' | 'claimed' | 'started' | 'done' | 'failed' | 'cancelled'; message: string | null; local_run_id: number | null; updated_at: string }
async function root<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const r = await fetch('/api/' + path, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
  return data;
}

const EMPTY = { title: '', kind: 'paper' as Kind, due_on: '', due_time: '', tz: 'local' as Deadline['tz'], url: '', note: '', size: 'M' as Size };

export function Deadlines({ list, now }: { list: ReturnType<typeof useLoad<Deadline[]>>; now: number }) {
  const [form, setForm] = useState<(typeof EMPTY & { id?: number }) | null>(null);
  const [picker, setPicker] = useState(false);
  const [autoStatus, setAutoStatus] = useState<AutoStatus | null>(null);
  const [showDone, setShowDone] = useStored('ws.today.showDone', false);
  const safeDelete = useSafeDelete();
  const toast = useToast();
  const open = list.data.filter((d) => !d.done_at && d.shown).sort((a, b) => dueAt(a) - dueAt(b));
  const done = list.data.filter((d) => d.done_at && d.shown);
  const unseen = list.data.filter((d) => !d.seen && !d.done_at).length;
  const byType = (s: Size) => open.filter((d) => (d.size || 'M') === s);
  const save = async () => {
    if (!form) return;
    try {
      const body = { ...form, due_time: form.due_time || null };
      if (form.id) await api(`deadlines/${form.id}`, 'PATCH', body); else await api('deadlines', 'POST', body);
      setForm(null); await list.reload();
    } catch (e) { list.setError((e as Error).message); }
  };
  const patch = async (d: Deadline, body: Record<string, unknown>) => {
    list.setData((x) => x.map((y) => (y.id === d.id ? { ...y, ...body } as Deadline : y)));
    try { await api(`deadlines/${d.id}`, 'PATCH', body); } catch (e) { list.setError((e as Error).message); void list.reload(); }
  };
  const setDone = async (d: Deadline, v: boolean) => {
    await patch(d, { done: v, done_at: v ? new Date().toISOString() : null });
    if (v) toast({ text: `“${d.title}” marked done.`, undo: async () => { await patch(d, { done: false, done_at: null }); } });
  };
  const hide = async (d: Deadline) => {
    await patch(d, { shown: 0 });
    toast({ text: `“${d.title}” hidden from Today (still in Choose deadlines).`, undo: async () => { await patch(d, { shown: 1 }); } });
  };
  const remove = (d: Deadline) => safeDelete({
    title: `Delete the deadline “${d.title}”?`, confirm: 'Delete deadline',
    body: d.source === 'auto' ? <p>To only take it off the Today page, use <b>Hide</b> instead: a later Auto search would find it again.</p> : undefined,
    run: async () => { await api(`deadlines/${d.id}`, 'DELETE'); await list.reload(); },
    done: `Deleted “${d.title}”.`, reload: list.reload,
  }).catch((e) => list.setError((e as Error).message));
  const edit = (d: Deadline) => setForm({ id: d.id, title: d.title, kind: d.kind, due_on: d.due_on, due_time: d.due_time ?? '', tz: d.tz, url: d.url, note: d.note, size: d.size || 'M' });

  const actions = (d: Deadline) => (
    <span className="td-dl-acts">
      <SizePick value={d.size || 'M'} onPick={(s) => void patch(d, { size: s })} />
      <button className="ws-link" onClick={() => void setDone(d, true)}>✓ Done</button>
      <button className="ws-link" onClick={() => edit(d)}>Edit</button>
      <button className="ws-link" onClick={() => void hide(d)}>Hide</button>
      <Btn size="sm" icon="trash" tone="danger" className="td-del" title="Delete this deadline" aria-label={`Delete ${d.title}`} onClick={() => void remove(d)} />
    </span>
  );
  const name = (d: Deadline) => (d.url ? <a href={d.url} target="_blank" rel="noreferrer">{d.title} ↗</a> : <strong>{d.title}</strong>);
  const sub = (d: Deadline) => <>{d.tz !== 'local' ? `${fmtDay(d.due_on)} ${d.due_time ?? '23:59'} ${d.tz} · ${when(d)} your time` : when(d)}{d.source === 'auto' && d.source_url ? <> · <a href={d.source_url} target="_blank" rel="noreferrer" className="td-src">source ↗</a></> : null}</>;
  const bar = (d: Deadline, ms: number) => {
    const total = Math.max(1, dueAt(d) - Date.parse(d.created_at)), left = Math.min(1, Math.max(0, ms / total));
    return <span className="td-dl-bar"><span style={{ width: `${left * 100}%` }} /></span>;
  };

  return (
    <section className="td-section">
      <div className="td-section-head">
        <h2 className="ws-h2">Deadlines</h2>
        <span className="td-head-btns">
          <AutoButton onDone={() => void list.reload()} onStatus={setAutoStatus} />
          <Btn icon="check" onClick={() => setPicker(true)}>Choose deadlines{unseen ? <span className="td-badge">{unseen} new</span> : null}</Btn>
          {!form && <Btn icon="plus" tone="accent" onClick={() => setForm({ ...EMPTY })}>Add</Btn>}
        </span>
      </div>
      {autoStatus && <p className={`td-auto-status${autoStatus.bad ? ' bad' : ''}`} role="status">{autoStatus.text}{autoStatus.openLog && <> <button className="ws-link" onClick={autoStatus.openLog}>Show the log</button></>}{autoStatus.cancel && <> · <button className="ws-link" onClick={autoStatus.cancel}>Cancel</button></>}</p>}
      {form && (
        <form className="ws-card td-form" onSubmit={(e) => { e.preventDefault(); void save(); }}>
          <label className="td-f-title">What<input required autoFocus maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. ISCA 2027 paper submission" /></label>
          <label>Kind<select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as Kind })}>{(Object.keys(KINDS) as Kind[]).map((k) => <option key={k} value={k}>{KINDS[k].icon} {KINDS[k].label}</option>)}</select></label>
          <label>Date<input required type="date" value={form.due_on} onChange={(e) => setForm({ ...form, due_on: e.target.value })} /></label>
          <label>Time <small>(optional)</small><input type="time" value={form.due_time} onChange={(e) => setForm({ ...form, due_time: e.target.value })} /></label>
          <label>Time zone<select value={form.tz} onChange={(e) => setForm({ ...form, tz: e.target.value as Deadline['tz'] })}><option value="local">My time</option><option value="AoE">AoE (UTC−12, most paper deadlines)</option><option value="UTC">UTC</option></select></label>
          <label>Card size<select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value as Size })}><option value="L">Large (full row)</option><option value="M">Medium</option><option value="S">Small (one line)</option></select></label>
          <label className="td-f-wide">Link <small>(optional)</small><input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://… (call for papers, portal)" /></label>
          <label className="td-f-wide">Note <small>(optional)</small><input value={form.note} maxLength={4000} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="abstract due a week earlier, page limit…" /></label>
          <span className="td-f-actions"><button className="ws-primary" type="submit">{form.id ? 'Save' : 'Add deadline'}</button><button className="ws-ghost" type="button" onClick={() => setForm(null)}>Cancel</button></span>
        </form>
      )}
      {!open.length && !form && !list.loading && (
        <p className="ws-muted td-none">No deadlines on this page yet. <b>Add</b> your own, or press <b>Auto</b> to look up conference deadlines and pick the ones you want in <b>Choose deadlines</b>.</p>
      )}

      {/* Large: one full row each, like the job dashboard's search timer */}
      {byType('L').map((d) => {
        const ms = dueAt(d) - now, c = split(ms);
        return (
          <article key={d.id} className={`ws-card td-dl-l u-${urgency(ms)}`} data-find={`deadline-${d.id}`}>
            <span className="td-l-ico" aria-hidden="true">⏱</span>
            <div className="td-l-main">
              <span className="ws-label">{KINDS[d.kind].icon} {d.conf || KINDS[d.kind].label}{c.past ? ' · passed' : ''}</span>
              <div className="td-l-name">{name(d)}</div>
              <div className="td-l-count" aria-label={`${c.past ? 'Passed' : 'Left'}: ${c.d} days ${c.h} hours ${c.m} minutes`}>
                {[[c.d, 'days'], [c.h, 'hours'], [c.m, 'min'], [c.s, 'sec']].map(([n, l], i) => <span key={l}><b>{i ? pad(Number(n)) : n}</b><small>{l}</small></span>)}
                {c.past && <em>ago</em>}
              </div>
              <small className="td-l-sub">{sub(d)}</small>
              {d.note && <p className="td-dl-note">{d.note}</p>}
              {bar(d, ms)}
            </div>
            {actions(d)}
          </article>
        );
      })}

      {/* Medium: cards with days, hours, minutes and seconds */}
      {byType('M').length > 0 && (
        <ul className="td-deadlines">
          {byType('M').map((d) => {
            const ms = dueAt(d) - now, c = split(ms);
            return (
              <li key={d.id} className={`ws-card td-dl u-${urgency(ms)}`} data-find={`deadline-${d.id}`}>
                <div className="td-dl-top">
                  <span className="td-dl-kind" title={KINDS[d.kind].label}>{KINDS[d.kind].icon}</span>
                  <div className="td-dl-name">{name(d)}<small>{sub(d)}</small></div>
                </div>
                <div className="td-count">
                  {c.past && <span className="td-count-past">passed</span>}
                  {(c.d ? [[c.d, 'd'], [c.h, 'h'], [c.m, 'm'], [c.s, 's']] : [[c.h, 'h'], [c.m, 'm'], [c.s, 's']]).map(([n, l], i) => <span key={l}><b>{i ? pad(Number(n)) : n}</b><small>{l}</small></span>)}
                  {c.past && <span className="td-count-past">ago</span>}
                </div>
                {bar(d, ms)}
                {d.note && <p className="td-dl-note">{d.note}</p>}
                {actions(d)}
              </li>
            );
          })}
        </ul>
      )}

      {/* Small: one line each */}
      {byType('S').length > 0 && (
        <ul className="td-dl-s-list">
          {byType('S').map((d) => {
            const ms = dueAt(d) - now;
            return (
              <li key={d.id} className={`td-dl-s u-${urgency(ms)}`} data-find={`deadline-${d.id}`}>
                <span className="td-s-dot" aria-hidden="true" />
                <span className="td-s-name">{d.url ? <a href={d.url} target="_blank" rel="noreferrer">{d.title}</a> : d.title}</span>
                <span className="td-s-date">{asLocalDay(d)}</span>
                <span className="td-s-left">{short(ms)}</span>
                <SizePick value="S" onPick={(s) => void patch(d, { size: s })} />
              </li>
            );
          })}
        </ul>
      )}

      {done.length > 0 && (
        <div className="td-done">
          <button className="ws-link" onClick={() => setShowDone(!showDone)} aria-expanded={showDone}>{showDone ? '▾' : '▸'} Done ({done.length})</button>
          {showDone && <ul>{done.map((d) => <li key={d.id}><s>{d.title}</s> <small className="ws-muted">{d.due_on}</small> <button className="ws-link" onClick={() => void setDone(d, false)}>Reopen</button> <button className="ws-link danger" onClick={() => void remove(d)}>Delete</button></li>)}</ul>}
        </div>
      )}
      {picker && <Selector list={list} now={now} onClose={() => setPicker(false)} />}
    </section>
  );
}

function SizePick({ value, onPick }: { value: Size; onPick: (s: Size) => void }) {
  return (
    <span className="td-size" role="group" aria-label="Card size">
      {(['S', 'M', 'L'] as Size[]).map((s) => <button key={s} type="button" className={value === s ? 'on' : ''} aria-pressed={value === s} title={`${SIZE_LABEL[s]} card`} onClick={() => onPick(s)}>{s}</button>)}
    </span>
  );
}

// ---- "Auto": the PC searches the web for conference deadlines ---------------------------------------
const REQ_KEY = 'ws.today.autoRequest';
// The PC's dashboard watches the live website's queue only, so a search queued from the local preview
// (astro dev, its own local database) is never picked up: say so instead of "waiting for your PC".
const LOCAL_PREVIEW = import.meta.env.DEV;
const LOCAL_NOTE = 'This is the local preview: your PC’s dashboard only picks up searches from the live website (your-site.pages.dev), so this one will stay queued. Cancel it and use Auto on the live site.';
const ACTIVE = ['queued', 'claimed', 'started'];
type AutoStatus = { text: string; bad: boolean; cancel?: () => void; openLog?: () => void };
function AutoButton({ onDone, onStatus }: { onDone: () => void; onStatus: (s: AutoStatus | null) => void }) {
  const [req, setReq] = useState<RunRequest | null>(null);
  const [pcOnline, setPcOnline] = useState<boolean | null>(null);
  const [err, setErr] = useState('');
  const [logOpen, setLogOpen] = useState(false);
  const active = !!req && ACTIVE.includes(req.status);
  // A request started earlier (another visit or device) keeps being followed.
  useEffect(() => { const id = readStore<number | null>(REQ_KEY, null); if (id) root<RunRequest>(`run-requests/${id}`).then(setReq, () => writeStore(REQ_KEY, null)); }, []);
  const refresh = async () => {
    const r = await root<RunRequest>(`run-requests/${req!.id}`);
    setReq((old) => { if (old && ACTIVE.includes(old.status) && r.status === 'done') onDone(); return r; });
    const q = await root<{ online: boolean }>('run-requests?limit=1');
    setPcOnline(q.online);
  };
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => { refresh().catch((e: Error) => setErr(e.message)); }, logOpen ? 2500 : 5000);
    return () => clearInterval(t);
  }, [active, req?.id, logOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  const start = async () => {
    setErr('');
    try {
      const r = await root<{ request: RunRequest }>('runs', 'POST', { task: 'conference-deadlines', params: {} });
      setReq(r.request); writeStore(REQ_KEY, r.request.id);
      const q = await root<{ online: boolean }>('run-requests?limit=1');
      setPcOnline(q.online);
    } catch (e) { setErr((e as Error).message); }
  };
  const status = !req ? '' : req.status === 'queued' ? (LOCAL_PREVIEW ? `Auto search: ${LOCAL_NOTE}` : pcOnline === false ? 'Auto search: waiting for your PC. It starts as soon as the dashboard is running on your PC.' : 'Auto search: queued for your PC…')
    : req.status === 'claimed' || req.status === 'started' ? 'Auto search: Claude is reading the conference sites on your PC… (a few minutes)'
    : req.status === 'done' ? `Auto search finished ${relTime(req.updated_at)}. New dates are waiting, unticked, in Choose deadlines.`
    : req.status === 'failed' ? `The auto search failed: ${req.message ?? 'open the log for details'}` : 'Auto search cancelled.';
  // Queued: the request is simply withdrawn. Running: the PC is asked to stop the Claude run.
  const cancel = async () => {
    try {
      if (req!.status === 'queued') setReq(await root<RunRequest>(`run-requests/${req!.id}/cancel`, 'POST', {}));
      else if (req!.local_run_id) { await root(`runs/${req!.local_run_id}/cancel`, 'POST', {}); setErr(''); }
    } catch (e) { setErr((e as Error).message); }
  };
  useEffect(() => {
    onStatus(status || err ? { text: err || status, bad: !!err || req?.status === 'failed', cancel: active ? () => void cancel() : undefined, openLog: req ? () => setLogOpen(true) : undefined } : null);
  }, [status, err, req?.status]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <Btn icon="history" onClick={() => void start()} disabled={active} title="Search the web (on your PC) for DAC, DATE, ICCAD, ISCA, MICRO, ASPLOS, GLSVLSI and ASP-DAC abstract and paper deadlines">{active ? 'Searching…' : 'Auto'}</Btn>
      {req && <Btn icon="edit" onClick={() => setLogOpen(true)} title="What Claude is doing, step by step">Log</Btn>}
      {logOpen && req && <AutoLog req={req} pcOnline={pcOnline} onRefresh={() => refresh().catch((e: Error) => setErr(e.message))} onCancel={() => void cancel()} onClose={() => setLogOpen(false)} />}
    </>
  );
}

// ---- the auto search's log: the Claude run's steps, pushed by the PC every few seconds ------------------
interface RunStep { at: string; text: string; kind: 'tool' | 'text' | 'info' | 'error' | 'step' }
interface RunRow {
  id: number; status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'timed_out' | 'needs_user';
  started_at: string | null; finished_at: string | null; summary: string | null; error: string | null; num_turns: number | null;
  progress: { model?: string; steps: RunStep[]; lastText?: string; counters?: { toolCalls?: number; denied?: number } };
}
const STEP_ICON: Record<RunStep['kind'], string> = { tool: '›', text: '✎', info: 'ℹ', error: '⚠', step: '•' };
const clock = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
const dur = (ms: number) => { const s = Math.max(0, Math.round(ms / 1000)); return s >= 60 ? `${Math.floor(s / 60)} min ${pad(s % 60)} s` : `${s} s`; };

function AutoLog({ req, pcOnline, onRefresh, onCancel, onClose }: { req: RunRequest; pcOnline: boolean | null; onRefresh: () => void; onCancel: () => void; onClose: () => void }) {
  const [run, setRun] = useState<RunRow | null>(null);
  const [err, setErr] = useState('');
  const [follow, setFollow] = useState(true);
  const [, tick] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);
  const done = !!run && !['queued', 'running'].includes(run.status);
  // The run's row (steps, Claude's latest words, the summary) every 2.5 s until it has ended.
  useEffect(() => {
    if (!req.local_run_id) return;
    let stop = false;
    const load = () => root<RunRow>(`runs/${req.local_run_id}`).then((r) => { if (!stop) { setRun(r); setErr(''); } }, (e: Error) => { if (!stop) setErr(e.message); });
    void load();
    if (done) return () => { stop = true; };
    const t = setInterval(load, 2500);
    return () => { stop = true; clearInterval(t); };
  }, [req.local_run_id, req.status, done]);
  useEffect(() => { onRefresh(); const t = setInterval(() => tick((n) => n + 1), 1000); return () => clearInterval(t); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [onClose]);
  const steps = run?.progress.steps ?? [];
  useEffect(() => { if (follow && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [steps.length, follow]);
  const phase = req.status === 'queued' ? 0 : !run || run.status === 'queued' ? 1 : run.status === 'running' ? 2 : 3;
  const ok = req.status === 'done' || run?.status === 'succeeded';
  const label = req.status === 'cancelled' || run?.status === 'cancelled' ? 'Cancelled' : req.status === 'failed' || (run && ['failed', 'timed_out', 'needs_user'].includes(run.status)) ? 'Failed'
    : ok ? 'Finished' : phase === 0 ? (pcOnline === false ? 'Waiting for your PC' : 'Queued') : phase === 1 ? 'Starting on your PC' : 'Claude is working';
  const elapsed = run?.started_at ? (run.finished_at ? Date.parse(run.finished_at) : Date.now()) - Date.parse(run.started_at) : null;
  return createPortal(
    <div className="ws-app ws-overlay td-sel-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="td-sel td-log" role="dialog" aria-modal="true" aria-labelledby="td-log-title">
        <header>
          <div>
            <h2 id="td-log-title">Auto search log</h2>
            <p className="ws-muted">Claude on your PC looks up the DAC, DATE, ICCAD, ISCA, MICRO, ASPLOS, GLSVLSI and ASP-DAC abstract and paper deadlines on their official pages.</p>
          </div>
          <button className="ws-icon" onClick={onClose} aria-label="Close" autoFocus>✕</button>
        </header>
        <div className="td-log-meta">
          <span className={`td-log-pill s-${label.split(' ')[0].toLowerCase()}`}>{!done && phase > 0 && label !== 'Finished' ? <span className="td-log-spin" aria-hidden="true" /> : null}{label}</span>
          <ol className="td-log-phases" aria-label="Progress">
            {['Queued', 'Picked up by your PC', 'Claude searching', 'Saved'].map((p, i) => <li key={p} className={i < phase || (i === 3 && ok) ? 'done' : i === phase ? 'now' : ''}>{p}</li>)}
          </ol>
          <span className="td-log-facts">
            {elapsed != null && <span>{dur(elapsed)}</span>}
            {run?.progress.model && <span>{run.progress.model}</span>}
            {run?.progress.counters?.toolCalls ? <span>{run.progress.counters.toolCalls} tool calls</span> : null}
            {run?.progress.counters?.denied ? <span className="bad">{run.progress.counters.denied} denied</span> : null}
          </span>
        </div>
        <div className="td-log-body">
          {err && <p className="ws-error">{err}</p>}
          {phase === 0 && <p className="ws-muted td-log-wait">{LOCAL_PREVIEW ? LOCAL_NOTE : pcOnline === false ? 'Your PC is off or the job dashboard isn’t running on it. The search starts by itself as soon as it is (you can close this window).' : 'Your PC picks this up within about 20 seconds…'}</p>}
          {phase >= 1 && !steps.length && !done && <p className="ws-muted td-log-wait">Starting Claude on your PC…</p>}
          {steps.length > 0 && (
            <ol className="td-log-steps" ref={listRef} onScroll={(e) => { const el = e.currentTarget; setFollow(el.scrollHeight - el.scrollTop - el.clientHeight < 30); }}>
              {steps.length >= 60 && <li className="td-log-trim">(older steps are trimmed; the newest 60 are kept)</li>}
              {steps.map((s, i) => (
                <li key={i} className={`k-${s.kind}`}>
                  <time>{clock(s.at)}</time><span className="td-log-ico" aria-hidden="true">{STEP_ICON[s.kind]}</span><span className="td-log-text">{s.text}</span>
                </li>
              ))}
            </ol>
          )}
          {!done && run?.progress.lastText && (
            <div className="td-log-says"><span className="ws-label">Claude, just now</span><p>{run.progress.lastText}</p></div>
          )}
          {done && (run?.summary || run?.error || req.message) && (
            <div className={`td-log-summary${run?.error ? ' bad' : ''}`}>
              <span className="ws-label">{run?.error ? 'What went wrong' : 'Claude’s summary'}</span>
              {run?.summary && <Markdown text={run.summary} />}
              {(run?.error || (!run?.summary && req.message)) && <p>{run?.error ?? req.message}</p>}
            </div>
          )}
        </div>
        <footer>
          {!follow && steps.length > 0 && <button className="ws-link" onClick={() => setFollow(true)}>↓ Follow the newest step</button>}
          <span className="td-sel-count">{req.local_run_id ? `run #${req.local_run_id}` : `request #${req.id}`}</span>
          {ACTIVE.includes(req.status) && <Btn icon="close" tone="danger" onClick={onCancel}>{req.status === 'queued' ? 'Cancel' : 'Stop the search'}</Btn>}
          <button className="ws-primary" onClick={onClose}>Close</button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

// ---- the deadline selector -------------------------------------------------------------------------
function Selector({ list, now, onClose }: { list: ReturnType<typeof useLoad<Deadline[]>>; now: number; onClose: () => void }) {
  const all = useMemo(() => list.data.filter((d) => !d.done_at).sort((a, b) => dueAt(a) - dueAt(b)), [list.data]);
  const [on, setOn] = useState<Set<number>>(() => new Set(all.filter((d) => d.shown).map((d) => d.id)));
  const [showPast, setShowPast] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose(); };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [busy, onClose]);
  const past = (d: Deadline) => dueAt(d) < now;
  const visible = all.filter((d) => showPast || !past(d) || on.has(d.id));
  const groups = useMemo(() => {
    const g = new Map<string, Deadline[]>();
    for (const d of visible) { const k = d.source === 'auto' ? (d.conf || 'Conferences') : 'Your deadlines'; g.set(k, [...(g.get(k) ?? []), d]); }
    return [...g].sort((a, b) => (a[0] === 'Your deadlines' ? -1 : b[0] === 'Your deadlines' ? 1 : dueAt(a[1][0]) - dueAt(b[1][0])));
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggle = (id: number, v: boolean) => setOn((s) => { const n = new Set(s); if (v) n.add(id); else n.delete(id); return n; });
  const save = async () => {
    setBusy(true);
    try {
      await api('deadlines/select', 'POST', { shown: all.filter((d) => on.has(d.id)).map((d) => d.id), hidden: all.filter((d) => !on.has(d.id)).map((d) => d.id) });
      await list.reload(); onClose();
    } catch (e) { list.setError((e as Error).message); } finally { setBusy(false); }
  };
  // In <body>, so it sits above the workspace bars (the page content is its own stacking layer).
  return createPortal(
    <div className="ws-app ws-overlay td-sel-overlay" onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div className="td-sel" role="dialog" aria-modal="true" aria-labelledby="td-sel-title">
        <header>
          <div><h2 id="td-sel-title">Choose deadlines</h2><p className="ws-muted">Ticked deadlines show on the Today page. Check a conference date on its source page before you rely on it.</p></div>
          <button className="ws-icon" onClick={onClose} aria-label="Close" autoFocus>✕</button>
        </header>
        <div className="td-sel-body">
          {!all.length && <p className="ws-muted">No deadlines yet. Press <b>Auto</b> to look up conference deadlines, or <b>Add</b> your own.</p>}
          {groups.map(([g, ds]) => (
            <section key={g} className="td-sel-group">
              <h3>
                <span>{g}</span>
                <button className="ws-link" onClick={() => setOn((s) => { const n = new Set(s); const allOn = ds.every((d) => n.has(d.id)); for (const d of ds) if (allOn) n.delete(d.id); else n.add(d.id); return n; })}>
                  {ds.every((d) => on.has(d.id)) ? 'Untick all' : 'Tick all'}
                </button>
              </h3>
              <ul>
                {ds.map((d) => (
                  <li key={d.id} className={past(d) ? 'past' : ''}>
                    <label>
                      <input type="checkbox" checked={on.has(d.id)} onChange={(e) => toggle(d.id, e.target.checked)} />
                      <span className="td-sel-name">{d.source === 'auto' ? d.title.replace(/^.*?:\s*/, '') : d.title}
                        {!d.seen && <span className="td-badge">{d.changed_at ? 'date changed' : 'new'}</span>}</span>
                      <span className="td-sel-when">{when(d)}{d.tz !== 'local' ? ` (${d.tz})` : ''}</span>
                      <span className="td-sel-left">{past(d) ? 'passed' : short(dueAt(d) - now)}</span>
                    </label>
                    {d.source_url && <a className="td-src" href={d.source_url} target="_blank" rel="noreferrer" title={d.source_url}>verify ↗</a>}
                    {d.source === 'auto' && d.found_at && <small className="ws-muted td-sel-found">checked {relTime(d.found_at)}</small>}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <footer>
          <label className="ws-check"><input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} /> Show passed deadlines</label>
          <span className="td-sel-count">{on.size} shown</span>
          <button className="ws-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="ws-primary" onClick={() => void save()} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
