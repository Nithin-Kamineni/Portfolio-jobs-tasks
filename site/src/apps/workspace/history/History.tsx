// History: every change made in the workspace (newest first), each with an Undo button. Deletes can be
// restored here; an undo is itself a change and can be redone.
import { useMemo, useState } from 'react';
import { api, useLoad, useStored } from '../api';
import { Btn, Icon, useToast } from '../ui';

interface Entry { id: number; at: string; area: string; action: string; label: string; undone_at: string | null; undo_of: number | null; undoable: number }
const AREAS: Record<string, { label: string; tone: string }> = {
  reading: { label: 'Reading list', tone: 'var(--cyan)' }, prep: { label: 'Interview prep', tone: 'var(--copper)' }, plan: { label: 'Weekly plan', tone: 'var(--gold)' },
  cards: { label: 'Flashcards', tone: 'var(--violet)' }, questions: { label: 'Questions', tone: 'var(--green)' }, docs: { label: 'Tasks', tone: 'var(--amber)' }, today: { label: 'Today', tone: 'var(--rose)' },
  coding: { label: 'Coding', tone: 'var(--rose)' }, settings: { label: 'Settings', tone: 'var(--muted)' },
};
const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
const time = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export default function History() {
  const { data, setData, error, setError, loading, reload } = useLoad<Entry[]>('history?limit=200', []);
  const [filter, setFilter] = useStored<string>('ws.history.filter', 'all');
  const [busy, setBusy] = useState<number | null>(null);
  const [more, setMore] = useState(true);
  const toast = useToast();

  const list = useMemo(() => data.filter((e) => filter === 'all' || (filter === 'deletes' ? e.action === 'delete' : e.area === filter)), [data, filter]);
  const groups = useMemo(() => {
    const g: [string, Entry[]][] = [];
    for (const e of list) { const d = day(e.at); if (g.length && g[g.length - 1][0] === d) g[g.length - 1][1].push(e); else g.push([d, [e]]); }
    return g;
  }, [list]);
  const areas = [...new Set(data.map((e) => e.area))];

  const undo = async (e: Entry) => {
    setBusy(e.id);
    try {
      await api(`history/${e.id}/undo`, 'POST');
      toast({ text: `${e.action === 'undo' ? 'Redone' : 'Undone'}: ${e.label.replace(/^(Undid|Redid): /, '')}` });
      await reload();
    } catch (er) { setError((er as Error).message); } finally { setBusy(null); }
  };
  const loadMore = async () => {
    const last = data[data.length - 1];
    if (!last) return;
    try {
      const rows = await api<Entry[]>(`history?limit=200&before=${last.id}`);
      if (rows.length < 200) setMore(false);
      setData((d) => [...d, ...rows]);
    } catch (er) { setError((er as Error).message); }
  };

  return (
    <section className="ws-section">
      <header className="ws-head">
        <div>
          <p className="ws-eyebrow">HISTORY</p>
          <h1>Every change, undoable.</h1>
          <p className="ws-sub">Deleted something by accident? Find it here and press Undo. Quick edits to the same thing within 10 minutes are grouped into one entry.</p>
        </div>
      </header>
      {error && <p className="ws-error" role="alert">{error}</p>}
      <div className="hs-filters" role="group" aria-label="Show">
        {['all', 'deletes', ...areas].map((a) => (
          <button key={a} className={`ws-chip${filter === a ? ' on' : ''}`} aria-pressed={filter === a} onClick={() => setFilter(a)}
            style={AREAS[a] ? ({ '--tone': AREAS[a].tone } as React.CSSProperties) : undefined}>
            {a === 'all' ? 'Everything' : a === 'deletes' ? 'Deletions only' : AREAS[a]?.label ?? a}
          </button>
        ))}
      </div>
      {!loading && !list.length && <div className="ws-empty"><span><Icon name="history" size={30} /></span><h2>Nothing here yet</h2><p>Changes you make in the reading list, prep, flashcards, questions, tasks and coding show up here.</p></div>}
      {groups.map(([d, es]) => (
        <div key={d}>
          <h2 className="hs-day">{d}</h2>
          <ul className="hs-list">
            {es.map((e) => (
              <li key={e.id} className={`ws-card hs-row${e.undone_at ? ' undone' : ''}`}>
                <span className="hs-time">{time(e.at)}</span>
                <span className="ws-tag hs-area" style={{ '--tone': AREAS[e.area]?.tone ?? 'var(--muted)' } as React.CSSProperties}>{AREAS[e.area]?.label ?? e.area}</span>
                <span className={`hs-label${e.action === 'delete' ? ' del' : ''}`}>{e.label}</span>
                {e.undone_at
                  ? <span className="hs-state">undone {time(e.undone_at)}</span>
                  : e.undoable
                    ? <Btn size="sm" icon="undo" disabled={busy !== null} onClick={() => void undo(e)}>{e.action === 'delete' ? 'Restore' : e.action === 'undo' ? 'Redo' : 'Undo'}</Btn>
                    : <span className="hs-state">can't undo</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {data.length >= 200 && more && <p style={{ textAlign: 'center', marginTop: 20 }}><button className="ws-ghost" onClick={() => void loadMore()}>Show older changes</button></p>}
    </section>
  );
}
