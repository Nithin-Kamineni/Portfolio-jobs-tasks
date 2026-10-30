// Interview prep: tracks → modules → items, with status, confidence and notes per item; a dashboard
// with overall progress, streak, hours, an activity heatmap and "continue where you left off".
import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Route, Routes, useParams } from 'react-router-dom';
import { api, Bar, dayET, relTime, Ring, todayET, useLoad, useStored } from '../api';
import { counts, itemsByTrack, KIND, STATUS_LABEL, type Ctx, type Item, type Kind, type Log, type PrepData, type Status, type Track } from './shared';
import Plan from './Plan';
import Cards from './Cards';
import Quiz from './Quiz';
import { FocusBar, useFocus, type FocusCtx } from './focus';
import { Btn, useSafeDelete } from '../ui';
import { targetId, useJumpTarget } from '../search/jump';

export default function Prep() {
  const load = useLoad<PrepData>('prep', { tracks: [], modules: [], items: [], log: [] });
  const update = async (item: Item, patch: Partial<Item>) => {
    const optimistic = { ...item, ...patch };
    load.setData((d) => ({ ...d, items: d.items.map((i) => (i.id === item.id ? optimistic : i)) }));
    try {
      const row = await api<Item>(`prep/items/${item.id}`, 'PATCH', patch);
      load.setData((d) => ({
        ...d, items: d.items.map((i) => (i.id === row.id ? row : i)),
        log: patch.status && patch.status !== item.status ? [...d.log, { item_id: item.id, status: patch.status, at: new Date().toISOString() }] : d.log,
      }));
    } catch (e) { load.setError((e as Error).message); void load.reload(); }
  };
  const ctx = { ...load, update };
  const f = useFocus(load.data);
  const [editing, setEditing] = useStored('ws.prep.editFocus', false);
  // Overview and plan see only the focus's items; a track page can show the rest while editing.
  const focused = { ...ctx, data: f.filtered };
  return (
    <>
      {load.error && <p className="ws-error ws-section" role="alert">{load.error}</p>}
      <nav className="pp-nav" aria-label="Interview prep">
        <NavLink to="/prep" end>Overview</NavLink>
        <NavLink to="/prep/plan">Weekly plan</NavLink>
        <NavLink to="/prep/cards">Flashcards</NavLink>
        <NavLink to="/prep/quiz">Quiz</NavLink>
      </nav>
      <div className="pf-wrap"><FocusBar f={f} prep={load.data} editing={editing} setEditing={setEditing} /></div>
      <Routes>
        <Route path="/" element={<Dashboard {...focused} focus={f} />} />
        <Route path="/plan" element={<Plan {...focused} />} />
        <Route path="/cards" element={<Cards prep={ctx.data} match={f.matches} focus={f.current?.name} />} />
        <Route path="/quiz" element={<Quiz prep={ctx.data} match={f.matches} focus={f.current?.name} />} />
        <Route path="/:track" element={<TrackPage {...ctx} focus={f} editing={editing} setEditing={setEditing} />} />
      </Routes>
    </>
  );
}

const useIndex = (data: PrepData) => useMemo(() => itemsByTrack(data), [data]);

function streak(log: Log[]) {
  const days = new Set(log.filter((l) => l.status === 'done' || l.status === 'doing').map((l) => dayET(l.at)));
  let n = 0;
  const d = new Date();
  if (!days.has(todayET())) d.setDate(d.getDate() - 1); // today not done yet: count up to yesterday
  for (;;) {
    const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
    if (!days.has(key)) return n;
    n++; d.setDate(d.getDate() - 1);
  }
}

function Heatmap({ log }: { log: Log[] }) {
  const WEEKS = 26;
  const perDay = new Map<string, number>();
  for (const l of log) if (l.status === 'done') perDay.set(dayET(l.at), (perDay.get(dayET(l.at)) ?? 0) + 1);
  const end = new Date(); const start = new Date(end); start.setDate(end.getDate() - (WEEKS * 7 - 1) - end.getDay());
  const cells: { key: string; n: number; future: boolean }[] = [];
  for (let d = new Date(start); cells.length < WEEKS * 7; d.setDate(d.getDate() + 1)) {
    const key = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
    cells.push({ key, n: perDay.get(key) ?? 0, future: d > end });
  }
  const level = (n: number) => (n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : 4);
  return (
    <div className="pp-heat" role="img" aria-label="Items completed per day, last 26 weeks">
      {cells.map((c) => <span key={c.key} className={`l${c.future ? 'x' : level(c.n)}`} title={`${c.key}: ${c.n} done`} />)}
    </div>
  );
}

function Dashboard({ data, setData, setError, loading, update, focus }: Ctx & { focus: FocusCtx }) {
  const cards = useLoad<{ today: string; cards: { due_on: string | null; suspended: number }[] }>('cards', { today: '', cards: [] });
  const due = cards.data.cards.filter((c) => !c.suspended && c.due_on && c.due_on <= cards.data.today).length;
  const fresh = cards.data.cards.filter((c) => !c.suspended && !c.due_on).length;
  const { byTrack } = useIndex(data);
  const [showHidden, setShowHidden] = useState(false);
  const list = data.tracks;
  const visible = list.filter((t) => !t.hidden && (!focus.current || focus.index.tracks.has(t.id)));
  const all = visible.flatMap((t) => byTrack.get(t.id) ?? []);
  const c = counts(all);
  const week = data.log.filter((l) => l.status === 'done' && Date.now() - Date.parse(l.at) < 7 * 864e5).length;
  const doing = all.filter((i) => i.status === 'doing' && !i.hide_continue).sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''));
  const patchTrack = async (t: Track, body: Partial<Track>) => {
    try {
      const row = await api<Track>(`prep/tracks/${t.id}`, 'PATCH', body);
      setData((d) => ({ ...d, tracks: d.tracks.map((x) => (x.id === row.id ? row : x)) }));
    } catch (e) { setError((e as Error).message); }
  };
  const titleOf = (i: Item) => data.tracks.find((t) => (byTrack.get(t.id) ?? []).includes(i))?.title ?? '';

  if (loading && !data.tracks.length) return <p className="ws-muted ws-section">Loading…</p>;
  if (!data.tracks.length) return <div className="ws-empty ws-section"><span>◎</span><h2>No curriculum yet</h2><p>The interview-prep tracks are loaded by a database migration.</p></div>;
  return (
    <section className="ws-section">
      <header className="ws-head">
        <div>
          <p className="ws-eyebrow">INTERVIEW PREP{focus.current ? ` · ${focus.current.name.toUpperCase()}` : ''}</p>
          <h1>{focus.current ? focus.current.name : 'Be the expert in the room.'}</h1>
          <p className="ws-sub">{focus.current
            ? (focus.current.items.length ? 'Only this focus is shown here, in Flashcards, Quiz and Questions. Pick “All concepts” to see everything.' : 'This focus is empty: open a track and tick the items you want (Edit items).')
            : 'Every item you finish moves the rings. Rate your confidence so the weak spots stay visible.'}</p>
        </div>
      </header>

      <div className="pp-top">
        <div className="ws-card pp-overall">
          <Ring value={c.pct} size={112} stroke={9} label={`${Math.round(c.pct * 100)}% of core items done`} />
          <div>
            <span className="ws-label">Overall</span>
            <strong>{c.done}<small> / {c.total} items</small></strong>
            <span className="ws-muted">{Math.round(c.hoursDone)} of {Math.round(c.hours)} h · {c.doing} in progress</span>
          </div>
        </div>
        <div className="ws-card pp-kpi"><span className="ws-label">Streak</span><strong>{streak(data.log)}<small> days</small></strong><span className="ws-muted">a day counts when you start or finish something</span></div>
        <div className="ws-card pp-kpi"><span className="ws-label">This week</span><strong>{week}<small> done</small></strong><span className="ws-muted">last 7 days</span></div>
        <Link to="/prep/cards" className="ws-card pp-kpi pp-due"><span className="ws-label">Flashcards</span><strong>{due}<small> due</small></strong><span className="ws-muted">{fresh} new waiting · review →</span></Link>
        <div className="ws-card pp-activity"><span className="ws-label">Activity · 26 weeks</span><Heatmap log={data.log} /></div>
      </div>

      {doing.length > 0 && (
        <>
          <h2 className="ws-h2">Continue</h2>
          <ul className="pp-continue">
            {doing.slice(0, 3).map((i) => (
              <li key={i.id} className="ws-card">
                <span className="pp-kind" title={KIND[i.kind].label}>{KIND[i.kind].icon}</span>
                <div><span className="ws-label">{titleOf(i)}</span>{i.url ? <a href={i.url} target="_blank" rel="noreferrer">{i.title}</a> : <span>{i.title}</span>}</div>
                <button className="ws-ghost" onClick={() => void update(i, { status: 'done' })}>Mark done</button>
                <button className="ws-icon pp-dismiss" title="Remove from Continue (the item stays in progress)" aria-label={`Remove ${i.title} from Continue`} onClick={() => void update(i, { hide_continue: 1 })}>✕</button>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="ws-h2">Tracks</h2>
      <div className="pp-tracks">
        {visible.map((t) => {
          const items = byTrack.get(t.id) ?? [], tc = counts(items);
          const next = items.find((i) => i.status === 'todo' && !i.optional);
          const last = items.map((i) => i.updated_at ?? '').sort().pop();
          return (
            <article key={t.id} className={`ws-card pp-track${t.suggested ? ' suggested' : ''}`}>
              <Link to={`/prep/${t.id}`} className="pp-track-link" aria-label={`Open ${t.title}`} />
              <div className="pp-track-top">
                <Ring value={tc.pct} />
                <div><h3>{t.title}</h3><p>{t.summary}</p></div>
              </div>
              <Bar value={tc.pct} />
              <p className="pp-track-meta"><span>{tc.done}/{tc.total} items</span><span>{Math.max(0, Math.round(tc.hours - tc.hoursDone))} h left</span>{last ? <span>active {relTime(last)}</span> : null}</p>
              {next && <p className="pp-next"><span className="ws-label">Next</span>{KIND[next.kind].icon} {next.title}</p>}
              {t.suggested ? (
                <div className="pp-suggest"><span className="ws-tag" style={{ '--tone': 'var(--amber)' } as React.CSSProperties}>suggested</span>
                  <button className="ws-link" onClick={() => void patchTrack(t, { suggested: 0 })}>Keep</button>
                  <button className="ws-link" onClick={() => void patchTrack(t, { hidden: 1 })}>Hide</button></div>
              ) : null}
            </article>
          );
        })}
      </div>
      {list.some((t) => t.hidden) && (
        <div className="pp-hidden">
          <button className="ws-link" onClick={() => setShowHidden(!showHidden)}>{showHidden ? 'Hide' : 'Show'} hidden tracks ({list.filter((t) => t.hidden).length})</button>
          {showHidden && <ul>{list.filter((t) => t.hidden).map((t) => <li key={t.id}>{t.title} <button className="ws-link" onClick={() => void patchTrack(t, { hidden: 0 })}>Restore</button></li>)}</ul>}
        </div>
      )}
    </section>
  );
}

function TrackPage({ data, update, setData, setError, loading, reload, focus, editing, setEditing }: Ctx & { focus: FocusCtx; editing: boolean; setEditing: (v: boolean) => void }) {
  const { track: id } = useParams();
  const t = data.tracks.find((x) => x.id === id);
  const [hideDone, setHideDone] = useStored('ws.prep.hideDone', false);
  const [open, setOpen] = useStored<string | null>('ws.prep.notesOpen', null);
  const safeDelete = useSafeDelete();
  // Opened from search: that item is always shown (even if finished and hidden, or outside the focus),
  // with its notes open when the words were found in them.
  const jump = useJumpTarget('item');
  const want = targetId(jump);
  useEffect(() => { if (jump?.open && want) setOpen(want); }, [jump]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!t) return loading ? <p className="ws-muted ws-section">Loading…</p> : <div className="ws-section"><Link to="/prep" className="ws-link">← All tracks</Link><p>Track not found.</p></div>;
  const allModules = data.modules.filter((m) => m.track_id === t.id);
  const allItems = data.items.filter((i) => allModules.some((m) => m.id === i.module_id));
  // In a focus, show only its items unless you are editing the focus (then everything, with ticks).
  const filter = !!focus.current && !editing;
  const items = filter ? allItems.filter((i) => focus.index.items.has(i.id) || i.id === want) : allItems;
  const modules = filter ? allModules.filter((m) => items.some((i) => i.module_id === m.id)) : allModules;
  const outside = focus.current ? allItems.length - allItems.filter((i) => focus.index.items.has(i.id)).length : 0;
  const tc = counts(items);
  const addItem = async (moduleId: string, body: { title: string; kind: Kind; url: string; est: string }) => {
    try {
      const row = await api<Item>('prep/items', 'POST', { module_id: moduleId, ...body, focus_id: focus.current?.id });
      setData((d) => ({ ...d, items: [...d.items, row] }));
      if (focus.current) void focus.list.reload();
    } catch (e) { setError((e as Error).message); }
  };
  const removeItem = (i: Item) => safeDelete({
    title: `Delete “${i.title}”?`, body: <p>Your status, notes and plan entries for it go too.</p>, confirm: 'Delete item',
    run: async () => { await api(`prep/items/${i.id}`, 'DELETE'); setData((d) => ({ ...d, items: d.items.filter((x) => x.id !== i.id) })); },
    done: `Deleted “${i.title}”.`, reload,
  }).catch((e) => setError((e as Error).message));
  return (
    <section className="ws-section">
      <Link to="/prep" className="ws-link pp-back">← All tracks</Link>
      <header className="ws-head pp-track-head">
        <div className="pp-track-top">
          <Ring value={tc.pct} size={84} stroke={7} />
          <div>
            <p className="ws-eyebrow">{t.suggested ? 'SUGGESTED TRACK' : 'TRACK'}</p>
            <h1>{t.title}</h1>
            <p className="ws-sub">{t.summary}</p>
          </div>
        </div>
        <div className="pp-track-side ws-card">
          <span className="ws-label">Goal</span><p>{t.goal}</p>
          <p className="ws-muted">{tc.done}/{tc.total} core items · {Math.round(tc.hoursDone)}/{Math.round(tc.hours)} h</p>
        </div>
      </header>
      <div className="ws-toolbar">
        <label className="ws-check"><input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} /> Hide finished items</label>
        {focus.current && (editing
          ? <span className="pf-editing">Editing <b>{focus.current.name}</b>: tick items (or a whole module) to put them in this focus. <Btn size="sm" icon="check" tone="accent" onClick={() => setEditing(false)}>Done editing</Btn></span>
          : outside > 0 && <span className="ws-muted">{outside} more item{outside === 1 ? '' : 's'} in this track {outside === 1 ? 'is' : 'are'}n't in “{focus.current.name}”. <button className="ws-link" onClick={() => setEditing(true)}>Edit items</button></span>)}
      </div>
      {focus.current && !modules.length && <div className="ws-empty"><span>◎</span><h2>Nothing from this track is in “{focus.current.name}”</h2><p><Btn icon="edit" onClick={() => setEditing(true)}>Edit items</Btn></p></div>}

      {modules.map((m, mi) => {
        const mItems = items.filter((i) => i.module_id === m.id).sort((a, b) => a.position - b.position);
        const mc = counts(mItems);
        return (
          <section key={m.id} className="ws-card pp-module" data-find={`mod-${m.id}`}>
            <header>
              {focus.current && editing && (() => {
                const ids = mItems.map((i) => i.id), n = ids.filter((x) => focus.index.items.has(x)).length;
                return <input type="checkbox" className="pf-tick" checked={n === ids.length && n > 0} ref={(el) => { if (el) el.indeterminate = n > 0 && n < ids.length; }}
                  onChange={(e) => void focus.toggle(ids, e.target.checked)} aria-label={`Put all of ${m.title} in the focus`} title="All items of this module" />;
              })()}
              <span className="pp-mod-n">{String(mi + 1).padStart(2, '0')}</span><h2>{m.title}</h2><span className="ws-muted">{mc.done}/{mc.total}</span><Bar value={mc.pct} />
            </header>
            <ul className="pp-items">
              {mItems.filter((i) => !hideDone || (i.status !== 'done' && i.status !== 'skipped') || i.id === want).map((i) => (
                <li key={i.id} className={`pp-item s-${i.status}`} data-find={`item-${i.id}`}>
                  <div className="pp-item-row">
                    {focus.current && editing && <input type="checkbox" className="pf-tick" checked={focus.index.items.has(i.id)} onChange={(e) => void focus.toggle([i.id], e.target.checked)} aria-label={`${i.title} in focus`} />}
                    <button className={`pp-check s-${i.status}`} onClick={() => void update(i, { status: i.status === 'done' ? 'todo' : 'done' })} aria-label={i.status === 'done' ? `Mark ${i.title} not done` : `Mark ${i.title} done`}>{i.status === 'done' ? '✓' : i.status === 'doing' ? '◐' : ''}</button>
                    <span className="pp-kind" title={KIND[i.kind].label}>{KIND[i.kind].icon}</span>
                    <div className="pp-item-main">
                      {i.url ? <a href={i.url} target="_blank" rel="noreferrer" onClick={() => { if (i.status === 'todo') void update(i, { status: 'doing' }); }}>{i.title}</a> : <span>{i.title}</span>}
                      <span className="pp-item-meta">
                        {KIND[i.kind].label}{i.est ? ` · ${i.est} h` : ''}{i.optional ? ' · optional' : ''}{i.custom ? ' · yours' : ''}
                        {i.note ? ` · ${i.note}` : ''}
                      </span>
                    </div>
                    <select className={`pp-status s-${i.status}`} value={i.status} onChange={(e) => void update(i, { status: e.target.value as Status })} aria-label={`Status of ${i.title}`}>
                      {(Object.keys(STATUS_LABEL) as Status[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                    <Stars value={i.confidence} onChange={(v) => void update(i, { confidence: v })} label={i.title} />
                    <button className="ws-link" onClick={() => setOpen(open === i.id ? null : i.id)} aria-expanded={open === i.id}>{i.my_notes ? 'Notes ●' : 'Notes'}</button>
                  </div>
                  {open === i.id && (
                    <div className="pp-notes">
                      <textarea rows={4} defaultValue={i.my_notes} placeholder="What you learned, questions, links…" autoFocus
                        onBlur={(e) => { if (e.target.value !== i.my_notes) void update(i, { my_notes: e.target.value }); }} />
                      <span className="ws-muted">{i.done_at ? `Done ${relTime(i.done_at)}` : i.started_at ? `Started ${relTime(i.started_at)}` : ''}</span>
                      {i.custom ? <Btn size="sm" icon="trash" tone="danger" onClick={() => void removeItem(i)}>Delete item</Btn> : null}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <AddItem onAdd={(b) => addItem(m.id, b)} />
          </section>
        );
      })}
    </section>
  );
}

function Stars({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <span className="pp-stars" role="radiogroup" aria-label={`Confidence in ${label}`}>
      {[1, 2, 3, 4, 5].map((n) => <button key={n} role="radio" aria-checked={value === n} className={n <= value ? 'on' : ''} title={`Confidence ${n}/5`} onClick={() => onChange(value === n ? 0 : n)}>●</button>)}
    </span>
  );
}

function AddItem({ onAdd }: { onAdd: (b: { title: string; kind: Kind; url: string; est: string }) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: '', kind: 'reading' as Kind, url: '', est: '' });
  if (!open) return <button className="ws-link pp-add" onClick={() => setOpen(true)}>+ Add your own item</button>;
  return (
    <form className="pp-add-form" onSubmit={async (e) => { e.preventDefault(); await onAdd(f); setF({ title: '', kind: 'reading', url: '', est: '' }); setOpen(false); }}>
      <input required autoFocus placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as Kind })} aria-label="Kind">{(Object.keys(KIND) as Kind[]).map((k) => <option key={k} value={k}>{KIND[k].label}</option>)}</select>
      <input type="url" placeholder="https://… (optional)" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} />
      <input inputMode="decimal" placeholder="Hours" value={f.est} onChange={(e) => setF({ ...f, est: e.target.value })} className="pp-est" />
      <button className="ws-primary">Add</button><button type="button" className="ws-ghost" onClick={() => setOpen(false)}>Cancel</button>
    </form>
  );
}
