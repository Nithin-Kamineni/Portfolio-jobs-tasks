// Today: one page for the morning. Deadlines with a live countdown (Deadlines.tsx), the open checklist
// items of every document (by due date, tick them off here), and what to study today (due flashcards,
// today's weekly-plan items, and Continue: in progress + the next open item from the top of each list).
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, useLoad } from '../api';
import { useToast } from '../ui';
import { Deadlines, type Deadline } from './Deadlines';
import { Continue } from './Continue';
import { dueLabel, localDay } from '../docs/Editor';
import { KIND, type Item, type PrepData } from '../prep/shared';
import './today.css';

interface DocTask { doc_id: number; doc_title: string; index: number; text: string; due: string | null }
interface PlanRow { day: string; item_id: string }

export default function Today() {
  const deadlines = useLoad<Deadline[]>('deadlines', []);
  const tasks = useLoad<DocTask[]>('doc-tasks', []);
  const prep = useLoad<PrepData>('prep', { tracks: [], modules: [], items: [], log: [] });
  const cards = useLoad<{ today: string; cards: { due_on: string | null; suspended: number }[]; newToday: number }>('cards', { today: '', cards: [], newToday: 0 });
  const today = localDay();
  const plan = useLoad<PlanRow[]>(`plan?from=${today}&to=${today}`, []);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const error = deadlines.error || tasks.error || prep.error;
  const hour = new Date(now).getHours();
  return (
    <section className="ws-section td">
      <header className="ws-head">
        <div>
          <p className="ws-eyebrow">TODAY · {new Date(now).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}</p>
          <h1>{hour < 12 ? 'Good morning.' : hour < 18 ? 'Good afternoon.' : 'Good evening.'}</h1>
          <p className="ws-sub">Deadlines, your open checklist items and today’s study, in one place.</p>
        </div>
      </header>
      {error && <p className="ws-error" role="alert">{error}</p>}
      <Deadlines list={deadlines} now={now} />
      <div className="td-grid">
        <Tasks list={tasks} today={today} />
        <Study prep={prep} cards={cards.data} plan={plan.data} />
      </div>
    </section>
  );
}

// ---- checklist items from documents -------------------------------------------------------------
function Tasks({ list, today }: { list: ReturnType<typeof useLoad<DocTask[]>>; today: string }) {
  const nav = useNavigate();
  const toast = useToast();
  const [allUndated, setAllUndated] = useState(false);
  const [gone, setGone] = useState<Set<string>>(new Set());
  const key = (t: DocTask) => `${t.doc_id}:${t.index}`;
  const tick = async (t: DocTask, checked: boolean) => {
    setGone((g) => new Set(g).add(key(t)));
    try {
      await api(`doc-tasks/${t.doc_id}/${t.index}`, 'PATCH', { checked, text: t.text });
      if (checked) toast({ text: `Done: “${t.text.slice(0, 50)}”`, undo: async () => { await api(`doc-tasks/${t.doc_id}/${t.index}`, 'PATCH', { checked: false, text: t.text }); setGone((g) => { const n = new Set(g); n.delete(key(t)); return n; }); } });
    } catch (e) { setGone((g) => { const n = new Set(g); n.delete(key(t)); return n; }); list.setError((e as Error).message); void list.reload(); }
  };
  const open = list.data.filter((t) => !gone.has(key(t)));
  const groups = useMemo(() => {
    const week = localDay(new Date(Date.now() + 7 * 864e5));
    const by = (f: (t: DocTask) => boolean) => open.filter(f).sort((a, b) => (a.due ?? '').localeCompare(b.due ?? ''));
    return [
      { id: 'late', label: 'Overdue', items: by((t) => !!t.due && t.due < today) },
      { id: 'today', label: 'Today', items: by((t) => t.due === today) },
      { id: 'week', label: 'Next 7 days', items: by((t) => !!t.due && t.due > today && t.due <= week) },
      { id: 'later', label: 'Later', items: by((t) => !!t.due && t.due > week) },
      { id: 'none', label: 'No date', items: open.filter((t) => !t.due) },
    ].filter((g) => g.items.length);
  }, [open, today]); // eslint-disable-line react-hooks/exhaustive-deps
  const goTo = (t: DocTask) => nav(`/docs/${t.doc_id}?find=${encodeURIComponent(t.text.slice(0, 80))}`);
  return (
    <section className="td-section">
      <div className="td-section-head"><h2 className="ws-h2">Checklist items <small className="ws-muted">from your documents</small></h2></div>
      {!list.loading && !open.length && (
        <p className="ws-muted td-none">No open checklist items. In any document, select some lines and press <b>☑ Checklist</b>; give items a date with 📅.</p>
      )}
      {groups.map((g) => {
        const shown = g.id === 'none' && !allUndated ? g.items.slice(0, 8) : g.items;
        return (
          <div key={g.id} className={`td-group g-${g.id}`}>
            <span className="ws-label">{g.label} · {g.items.length}</span>
            <ul className="td-tasks">
              {shown.map((t) => (
                <li key={key(t)}>
                  <input type="checkbox" aria-label={`Done: ${t.text}`} onChange={(e) => void tick(t, e.target.checked)} />
                  <button className="td-task-text" onClick={() => goTo(t)} title="Open it in its document">{t.text}</button>
                  {t.due && <span className={`td-due s-${dueLabel(t.due, today).state}`}>{dueLabel(t.due, today).label.replace('Due ', '')}</span>}
                  <span className="td-doc" title={`In “${t.doc_title}”`}>{t.doc_title || 'Untitled document'}</span>
                </li>
              ))}
            </ul>
            {g.id === 'none' && g.items.length > 8 && <button className="ws-link" onClick={() => setAllUndated(!allUndated)}>{allUndated ? 'Show fewer' : `Show all ${g.items.length}`}</button>}
          </div>
        );
      })}
    </section>
  );
}

// ---- study for today --------------------------------------------------------------------------------
function Study({ prep, cards, plan }: { prep: ReturnType<typeof useLoad<PrepData>>; cards: { today: string; cards: { due_on: string | null; suspended: number }[]; newToday: number }; plan: PlanRow[] }) {
  const due = cards.cards.filter((c) => !c.suspended && c.due_on && c.due_on <= cards.today).length;
  const fresh = cards.cards.filter((c) => !c.suspended && !c.due_on).length;
  const items = new Map(prep.data.items.map((i) => [i.id, i]));
  const planned = plan.map((p) => items.get(p.item_id)).filter(Boolean) as Item[];
  const setStatus = async (i: Item, status: Item['status']) => {
    prep.setData((d) => ({ ...d, items: d.items.map((x) => (x.id === i.id ? { ...x, status } : x)) }));
    try { await api(`prep/items/${i.id}`, 'PATCH', { status }); } catch (e) { prep.setError((e as Error).message); void prep.reload(); }
  };
  const row = (i: Item) => (
    <li key={i.id} className={i.status === 'done' ? 'done' : ''}>
      <input type="checkbox" checked={i.status === 'done'} onChange={(e) => void setStatus(i, e.target.checked ? 'done' : 'doing')} aria-label={`Done: ${i.title}`} />
      <span className="td-kind" title={KIND[i.kind].label}>{KIND[i.kind].icon}</span>
      {i.url ? <a href={i.url} target="_blank" rel="noreferrer" onClick={() => { if (i.status === 'todo') void setStatus(i, 'doing'); }}>{i.title}</a> : <span>{i.title}</span>}
    </li>
  );
  return (
    <section className="td-section">
      <div className="td-section-head"><h2 className="ws-h2">Study today</h2></div>
      <div className="td-study">
        <Link to="/prep/cards" className={`ws-card td-tile${due ? ' hot' : ''}`}>
          <span className="ws-label">Flashcards</span><strong>{due}<small> due</small></strong><span className="ws-muted">{fresh} new waiting · review →</span>
        </Link>
        <div className="ws-card td-tile">
          <span className="ws-label">Weekly plan · today</span>
          {planned.length ? <ul className="td-items">{planned.map(row)}</ul> : <span className="ws-muted">Nothing planned for today. <Link to="/prep/plan" className="ws-link">Plan the week →</Link></span>}
        </div>
        <Continue prep={prep} />
      </div>
    </section>
  );
}
