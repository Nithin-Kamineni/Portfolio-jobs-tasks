// Weekly plan: drag (or "+") prep items onto the days of a week, tick them off there, and watch the
// planned and finished hours against a weekly goal. Everything saves as you go.
import { useEffect, useMemo, useState, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, Bar, useStored } from '../api';
import { dayPlus } from '../../../lib/srs';
import { itemsByTrack, KIND, type Ctx, type Item } from './shared';

interface PlanRow { day: string; item_id: string; position: number }
const WEEKDAY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const parse = (d: string) => new Date(`${d}T12:00:00Z`);
const fmt = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: string, n: number) => fmt(new Date(parse(d).getTime() + n * 864e5));
const monday = (d: string) => addDays(d, -((parse(d).getUTCDay() + 6) % 7));
const nice = (d: string) => parse(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });

export default function Plan({ data, update, setError }: Ctx) {
  const today = dayPlus(0);
  // The week on screen and the track filter are remembered (on every device). A week picked in an
  // earlier calendar week falls back to this week.
  const [saved, setSaved] = useStored<{ week: string; on: string }>('ws.plan.week', { week: monday(today), on: monday(today) });
  const week = saved.on === monday(today) ? saved.week : monday(today);
  const setWeek = (w: string) => setSaved({ week: w, on: monday(today) });
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(week, i)), [week]);
  const [rows, setRows] = useState<PlanRow[]>([]);
  // Items already planned in another week: once an item has a day, it is not offered again.
  const [elsewhere, setElsewhere] = useState<Set<string>>(new Set());
  const [goal, setGoal] = useState<number>(10);
  const [goalText, setGoalText] = useState('10');
  const [track, setTrack] = useStored('ws.plan.track', '');
  const [addTo, setAddTo] = useState(today);
  const [drag, setDrag] = useState<{ item: string; from: string | null } | null>(null);
  const [over, setOver] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    api<PlanRow[]>(`plan?from=${days[0]}&to=${days[6]}`).then((r) => { if (live) setRows(r); }, (e: Error) => setError(e.message));
    api<string[]>(`plan/elsewhere?from=${days[0]}&to=${days[6]}`).then((r) => { if (live) setElsewhere(new Set(r)); }, (e: Error) => setError(e.message));
    return () => { live = false; };
  }, [days, setError]);
  useEffect(() => {
    api<Record<string, string>>('settings').then((s) => { const g = Number(s.weekly_hours ?? 10); setGoal(g); setGoalText(String(g)); }, () => undefined);
  }, []);
  useEffect(() => { setAddTo(days.includes(today) ? today : days[0]); }, [days, today]);

  const byId = useMemo(() => new Map(data.items.map((i) => [i.id, i])), [data.items]);
  const { byTrack } = useMemo(() => itemsByTrack(data), [data]);
  const trackOf = useMemo(() => { const m = new Map<string, string>(); for (const [t, list] of byTrack) for (const i of list) m.set(i.id, t); return m; }, [byTrack]);
  // Short track names for the narrow day columns: "Computer architecture (incl. …)" → "Computer architecture".
  const trackTitle = (id: string) => (data.tracks.find((t) => t.id === id)?.title ?? id).replace(/\s*\(.*\)\s*$/, '');
  const planned = new Set([...elsewhere, ...rows.map((r) => r.item_id)]);
  const hours = (ids: string[]) => ids.reduce((s, id) => s + (byId.get(id)?.est ?? 0), 0);
  const plannedHours = hours(rows.map((r) => r.item_id));
  const doneHours = hours(rows.filter((r) => byId.get(r.item_id)?.status === 'done').map((r) => r.item_id));

  // Backlog: the next unfinished items of each visible track, in curriculum order.
  const backlog = useMemo(() => {
    const out: Item[] = [];
    for (const t of data.tracks.filter((x) => !x.hidden && (!track || x.id === track))) {
      const next = (byTrack.get(t.id) ?? []).filter((i) => i.status !== 'done' && i.status !== 'skipped' && !planned.has(i.id));
      out.push(...next.slice(0, track ? 50 : 3));
    }
    return out;
  }, [data.tracks, byTrack, track, rows, elsewhere]); // eslint-disable-line react-hooks/exhaustive-deps

  const put = async (item: string, day: string, from: string | null) => {
    if (from === day) return;
    const pos = (rows.filter((r) => r.day === day).reduce((m, r) => Math.max(m, r.position), 0)) + 1;
    setRows((rs) => [...rs.filter((r) => !(r.item_id === item && r.day === from)), { day, item_id: item, position: pos }]);
    try { await api('plan', 'PUT', { day, item_id: item, from, position: pos }); }
    catch (e) { setError((e as Error).message); setRows((rs) => rs.filter((r) => !(r.item_id === item && r.day === day))); }
  };
  const remove = async (row: PlanRow) => {
    setRows((rs) => rs.filter((r) => r !== row));
    try { await api('plan', 'DELETE', { day: row.day, item_id: row.item_id }); } catch (e) { setError((e as Error).message); setRows((rs) => [...rs, row]); }
  };
  const saveGoal = async () => {
    const g = Math.max(0, Math.min(80, Math.round(Number(goalText) || 0)));
    setGoal(g); setGoalText(String(g));
    try { await api('settings/weekly_hours', 'PUT', { value: g }); } catch (e) { setError((e as Error).message); }
  };
  const onDrop = (e: DragEvent, day: string) => {
    e.preventDefault(); setOver(null);
    if (drag) void put(drag.item, day, drag.from);
    setDrag(null);
  };

  return (
    <section className="ws-section pl">
      <header className="ws-head pl-head">
        <div>
          <p className="ws-eyebrow">WEEKLY PLAN</p>
          <h1>{week === monday(today) ? 'This week' : `Week of ${nice(week)}`}</h1>
          <p className="ws-sub">Drag items onto a day, or use + to add to the selected day. Tick them off right here.</p>
        </div>
        <div className="pl-weeknav" role="group" aria-label="Week">
          <button className="ws-ghost" onClick={() => setWeek(addDays(week, -7))} aria-label="Previous week">‹</button>
          <button className="ws-ghost" onClick={() => setWeek(monday(today))} disabled={week === monday(today)}>This week</button>
          <button className="ws-ghost" onClick={() => setWeek(addDays(week, 7))} aria-label="Next week">›</button>
        </div>
      </header>

      <div className="pl-goal ws-card">
        <label className="pl-goal-input">Weekly goal
          <span><input inputMode="numeric" value={goalText} onChange={(e) => setGoalText(e.target.value.replace(/[^\d]/g, '').slice(0, 2))} onBlur={() => void saveGoal()} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} aria-label="Weekly goal in hours" /> h</span>
        </label>
        <div className="pl-meter">
          <span className="ws-label">Planned {Math.round(plannedHours * 10) / 10} / {goal} h</span>
          <Bar value={goal ? plannedHours / goal : 0} tone="var(--copper)" />
        </div>
        <div className="pl-meter">
          <span className="ws-label">Done {Math.round(doneHours * 10) / 10} / {goal} h</span>
          <Bar value={goal ? doneHours / goal : 0} tone="var(--green)" />
        </div>
      </div>

      <div className="pl-board">
        {days.map((d, i) => {
          const list = rows.filter((r) => r.day === d).sort((a, b) => a.position - b.position);
          return (
            <div key={d} className={`pl-day${d === today ? ' today' : ''}${over === d ? ' over' : ''}${addTo === d ? ' target' : ''}`}
              onDragOver={(e) => { e.preventDefault(); if (over !== d) setOver(d); }} onDragLeave={() => setOver((o) => (o === d ? null : o))} onDrop={(e) => onDrop(e, d)}>
              <button className="pl-day-head" onClick={() => setAddTo(d)} aria-pressed={addTo === d} title="Add new items to this day">
                <strong>{WEEKDAY[i]}</strong><span>{nice(d)}</span><small>{Math.round(hours(list.map((r) => r.item_id)) * 10) / 10} h</small>
              </button>
              <ul>
                {list.map((r) => {
                  const it = byId.get(r.item_id);
                  if (!it) return null;
                  return (
                    <li key={r.item_id} className={`pl-item${it.status === 'done' ? ' done' : ''}`} draggable onDragStart={() => setDrag({ item: r.item_id, from: d })} onDragEnd={() => { setDrag(null); setOver(null); }}>
                      <input type="checkbox" checked={it.status === 'done'} onChange={() => void update(it, { status: it.status === 'done' ? 'todo' : 'done' })} aria-label={`Done: ${it.title}`} />
                      <div>
                        {it.url ? <a href={it.url} target="_blank" rel="noreferrer" onClick={() => { if (it.status === 'todo') void update(it, { status: 'doing' }); }}>{it.title}</a> : <span>{it.title}</span>}
                        <small>{KIND[it.kind].icon} {trackTitle(trackOf.get(it.id) ?? '')}{it.est ? ` · ${it.est} h` : ''}</small>
                      </div>
                      <button className="pl-x" onClick={() => void remove(r)} aria-label={`Remove ${it.title} from ${nice(d)}`}>✕</button>
                    </li>
                  );
                })}
                {!list.length && <li className="pl-empty">Drop items here</li>}
              </ul>
            </div>
          );
        })}
      </div>

      <section className="ws-card pl-backlog">
        <header>
          <h2>Up next</h2>
          <select value={track} onChange={(e) => setTrack(e.target.value)} aria-label="Track">
            <option value="">Next 3 from every track</option>
            {data.tracks.filter((t) => !t.hidden).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          <span className="ws-muted">+ adds to <b>{WEEKDAY[days.indexOf(addTo)] ?? ''} {nice(addTo)}</b> (click a day to change)</span>
        </header>
        <ul>
          {backlog.map((it) => (
            <li key={it.id} draggable onDragStart={() => setDrag({ item: it.id, from: null })} onDragEnd={() => { setDrag(null); setOver(null); }}>
              <button className="pl-add" onClick={() => void put(it.id, addTo, null)} aria-label={`Add ${it.title} to ${nice(addTo)}`}>+</button>
              <span className="pp-kind" title={KIND[it.kind].label}>{KIND[it.kind].icon}</span>
              <div><span>{it.title}</span><small>{trackTitle(trackOf.get(it.id) ?? '')}{it.est ? ` · ${it.est} h` : ''}{it.status === 'doing' ? ' · in progress' : ''}</small></div>
            </li>
          ))}
          {!backlog.length && <li className="ws-muted">Nothing left here. <Link to="/prep" className="ws-link">Back to the tracks</Link></li>}
        </ul>
      </section>
    </section>
  );
}
