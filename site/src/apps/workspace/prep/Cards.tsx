// Flashcards with spaced repetition. Review: Space shows the answer, 1–4 grade it (Again/Hard/Good/
// Easy); each button shows when the card comes back. Browse: search, edit, suspend, add your own.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, useLoad, useStored } from '../api';
import { Markdown } from '../markdown';
import { intervalLabel, schedule, type Grade } from '../../../lib/srs';
import type { PrepData } from './shared';
import { Btn, useSafeDelete } from '../ui';
import { targetId, useJumpTarget } from '../search/jump';

interface Card {
  id: string; track: string; module: string; front: string; back: string; custom: number; suspended: number;
  ease: number; interval_days: number; reps: number; lapses: number; due_on: string | null; last_reviewed: string | null;
}
interface Deck { today: string; cards: Card[]; reviewedToday: number; newToday: number }
const GRADES: { g: Grade; label: string; key: string; cls: string }[] = [
  { g: 1, label: 'Again', key: '1', cls: 'again' }, { g: 2, label: 'Hard', key: '2', cls: 'hard' },
  { g: 3, label: 'Good', key: '3', cls: 'good' }, { g: 4, label: 'Easy', key: '4', cls: 'easy' },
];

export default function Cards({ prep, match = () => true, focus }: { prep: PrepData; match?: (track: string, module?: string) => boolean; focus?: string }) {
  const deck = useLoad<Deck>('cards', { today: '', cards: [], reviewedToday: 0, newToday: 0 });
  const [mode, setMode] = useStored<'review' | 'browse'>('ws.cards.mode', 'review');
  const [scope, setScope] = useStored<string>('ws.cards.scope', 'all');
  const [newPerDay, setNewPerDay] = useState(15);
  // Opened from search: show that card in "Browse", whatever the deck or focus.
  const jump = useJumpTarget('card');
  const want = targetId(jump);
  useEffect(() => { if (want) setMode('browse'); }, [want]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { api<Record<string, string>>('settings').then((s) => setNewPerDay(Number(s.new_cards_per_day ?? 15)), () => undefined); }, []);

  // The prep focus (if any) decides which cards are in play at all.
  const pool = useMemo(() => deck.data.cards.filter((c) => match(c.track, c.module)), [deck.data.cards, match]);
  const tracks = prep.tracks.filter((t) => pool.some((c) => c.track === t.id));
  const title = (id: string) => prep.tracks.find((t) => t.id === id)?.title ?? id;
  const { today } = deck.data;
  const isDue = (c: Card) => !c.suspended && !!c.due_on && c.due_on <= today;
  const isNew = (c: Card) => !c.suspended && !c.due_on;
  // A deck saved under another focus may not exist in this one: fall back to all.
  const scopeGone = scope !== 'all' && !deck.loading && tracks.length > 0 && !tracks.some((t) => t.id === scope);
  useEffect(() => { if (scopeGone) setScope('all'); }, [scopeGone, setScope]);
  const inScope = (c: Card) => (scope === 'all' || c.track === scope) && match(c.track, c.module);
  const newLeft = Math.max(0, newPerDay - deck.data.newToday);
  // New cards come in curriculum order: track, then module, then card.
  const trackPos = new Map(prep.tracks.map((t) => [t.id, t.position])), modPos = new Map(prep.modules.map((m) => [m.id, m.position]));
  const curriculum = (a: Card, b: Card) => ((trackPos.get(a.track) ?? 99) - (trackPos.get(b.track) ?? 99)) || ((modPos.get(a.module) ?? 99) - (modPos.get(b.module) ?? 99)) || (a.id < b.id ? -1 : 1);
  const stat = (t: string) => {
    const cs = pool.filter((c) => t === 'all' || c.track === t);
    return { due: cs.filter(isDue).length, fresh: cs.filter(isNew).length };
  };

  return (
    <section className="ws-section fc">
      <header className="ws-head">
        <div>
          <p className="ws-eyebrow">FLASHCARDS</p>
          <h1>Remember it for the interview.</h1>
          <p className="ws-sub">{focus ? <><b>{focus}</b> focus · {pool.length} cards · </> : null}{deck.data.reviewedToday} reviewed today · {stat('all').due} due · {newLeft} new cards left today</p>
        </div>
        <div className="ws-seg" role="tablist" aria-label="Mode">
          <button role="tab" aria-selected={mode === 'review'} onClick={() => setMode('review')}>Review</button>
          <button role="tab" aria-selected={mode === 'browse'} onClick={() => setMode('browse')}>Browse & add</button>
        </div>
      </header>
      {deck.error && <p className="ws-error" role="alert">{deck.error}</p>}

      <div className="fc-scopes" role="group" aria-label="Deck">
        {['all', ...tracks.map((t) => t.id)].map((t) => {
          const s = stat(t);
          return (
            <button key={t} className={`ws-chip${scope === t ? ' on' : ''}`} aria-pressed={scope === t} onClick={() => setScope(t)}>
              {t === 'all' ? (focus ? `All of ${focus}` : 'All tracks') : title(t)}<small>{s.due ? `${s.due} due` : s.fresh ? `${s.fresh} new` : '✓'}</small>
            </button>
          );
        })}
      </div>

      {mode === 'review'
        ? <Review key={`${scope}|${focus ?? ''}`} cards={deck.data.cards.filter(inScope).sort(curriculum)} isDue={isDue} isNew={isNew} newLeft={newLeft} title={title}
            onReviewed={(row, wasNew) => deck.setData((d) => ({ ...d, cards: d.cards.map((c) => (c.id === row.id ? row : c)), reviewedToday: d.reviewedToday + 1, newToday: d.newToday + (wasNew ? 1 : 0) }))}
            onError={deck.setError} loading={deck.loading} newPerDay={newPerDay}
            setNewPerDay={async (n) => { setNewPerDay(n); try { await api('settings/new_cards_per_day', 'PUT', { value: n }); } catch (e) { deck.setError((e as Error).message); } }} />
        : <Browse want={want} cards={deck.data.cards.filter((c) => inScope(c) || c.id === want)} tracks={tracks.length ? tracks : prep.tracks} scope={scope} title={title} today={today}
            onChange={(row) => deck.setData((d) => ({ ...d, cards: d.cards.some((c) => c.id === row.id) ? d.cards.map((c) => (c.id === row.id ? row : c)) : [...d.cards, row] }))}
            onDelete={(id) => deck.setData((d) => ({ ...d, cards: d.cards.filter((c) => c.id !== id) }))} onError={deck.setError} />}
    </section>
  );
}

function Review({ cards, isDue, isNew, newLeft, title, onReviewed, onError, loading, newPerDay, setNewPerDay }: {
  cards: Card[]; isDue: (c: Card) => boolean; isNew: (c: Card) => boolean; newLeft: number; title: (t: string) => string;
  onReviewed: (row: Card, wasNew: boolean) => void; onError: (m: string) => void; loading: boolean; newPerDay: number; setNewPerDay: (n: number) => void;
}) {
  // The session queue is fixed when the session starts (due first, then today's new cards); "Again"
  // puts a card back at the end so it comes round once more before you finish.
  const [queue, setQueue] = useState<string[] | null>(null);
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const start = useCallback(() => {
    const due = cards.filter(isDue).sort((a, b) => (a.due_on! < b.due_on! ? -1 : 1));
    const fresh = cards.filter(isNew).slice(0, newLeft);
    setQueue([...due, ...fresh].map((c) => c.id)); setDone(0); setShown(false);
  }, [cards, isDue, isNew, newLeft]);
  useEffect(() => { if (queue === null && !loading) start(); }, [queue, loading, start]);

  const card = queue && queue.length ? byId.get(queue[0]) : undefined;
  const grade = useCallback(async (g: Grade) => {
    if (!card || busy) return;
    setBusy(true);
    const wasNew = !card.due_on;
    try {
      const row = await api<Card>(`cards/${card.id}/review`, 'POST', { grade: g });
      onReviewed(row, wasNew);
      setQueue((q) => (q ? (g === 1 ? [...q.slice(1), q[0]] : q.slice(1)) : q));
      if (g !== 1) setDone((n) => n + 1);
      setShown(false);
    } catch (e) { onError((e as Error).message); } finally { setBusy(false); }
  }, [card, busy, onReviewed, onError]);

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (!card) return;
      if (!shown && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); setShown(true); return; }
      if (shown && ['1', '2', '3', '4'].includes(e.key)) { e.preventDefault(); void grade(Number(e.key) as Grade); }
      if (shown && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); void grade(3); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [card, shown, grade]);

  if (loading && queue === null) return <p className="ws-muted">Loading cards…</p>;
  const total = done + (queue?.length ?? 0);
  if (!card) {
    const tomorrow = cards.filter((c) => !c.suspended && c.due_on).length;
    return (
      <div className="ws-empty fc-done">
        <span>✓</span>
        <h2>{done ? `Session done: ${done} card${done === 1 ? '' : 's'}.` : 'Nothing due right now.'}</h2>
        <p>{newLeft ? `${newLeft} new cards are still available today.` : `You've started today's ${newPerDay} new cards.`} {tomorrow ? `${tomorrow} cards are scheduled ahead.` : ''}</p>
        <div className="fc-done-actions">
          <button className="ws-primary" onClick={start}>{newLeft ? 'Study new cards' : 'Check again'}</button>
          <label className="ws-check">New cards per day
            <select value={newPerDay} onChange={(e) => setNewPerDay(Number(e.target.value))}>{[5, 10, 15, 20, 30, 50].map((n) => <option key={n}>{n}</option>)}</select>
          </label>
        </div>
      </div>
    );
  }
  const next = (g: Grade) => intervalLabel(schedule({ ease: card.ease, interval_days: card.interval_days, reps: card.reps, lapses: card.lapses }, g).interval_days);
  return (
    <div className="fc-session" ref={ref}>
      <div className="fc-progress"><span style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
      <p className="fc-meta"><span>{title(card.track)}</span><span>{!card.due_on ? 'New' : `Review · every ${intervalLabel(card.interval_days)}`}</span><span>{done} / {total}</span></p>
      <article className={`fc-card${shown ? ' shown' : ''}`} onClick={() => { if (!shown) setShown(true); }}>
        <Markdown className="fc-front" text={card.front} />
        {shown ? <><hr /><Markdown className="fc-back" text={card.back} /></> : <p className="fc-hint">Think of the answer, then press <kbd>Space</kbd> or click.</p>}
      </article>
      {shown ? (
        <div className="fc-grades" role="group" aria-label="How well did you know it?">
          {GRADES.map((x) => (
            <button key={x.g} className={`fc-grade ${x.cls}`} onClick={() => void grade(x.g)} disabled={busy}>
              <strong>{x.label}</strong><small>{next(x.g)}</small><kbd>{x.key}</kbd>
            </button>
          ))}
        </div>
      ) : (
        <div className="fc-grades"><button className="ws-primary fc-show" onClick={() => setShown(true)}>Show answer <kbd>Space</kbd></button></div>
      )}
    </div>
  );
}

function Browse({ want, cards, tracks, scope, title, today, onChange, onDelete, onError }: {
  want?: string | null; cards: Card[]; tracks: { id: string; title: string }[]; scope: string; title: (t: string) => string; today: string;
  onChange: (c: Card) => void; onDelete: (id: string) => void; onError: (m: string) => void;
}) {
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<Card | 'new' | null>(null);
  useEffect(() => { if (want) setQ(''); }, [want]);
  const list = cards.filter((c) => !q || c.id === want || `${c.front} ${c.back}`.toLowerCase().includes(q.toLowerCase()));
  const when = (c: Card) => (c.suspended ? 'Suspended' : !c.due_on ? 'New' : c.due_on <= today ? 'Due now' : `Due ${c.due_on}`);
  const toggle = async (c: Card) => { try { onChange(await api<Card>(`cards/${c.id}`, 'PATCH', { suspended: c.suspended ? 0 : 1 })); } catch (e) { onError((e as Error).message); } };
  return (
    <>
      <div className="ws-toolbar">
        <div className="ws-filters"><input type="search" placeholder="Search cards…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search cards" /></div>
        <button className="ws-primary" onClick={() => setEdit('new')}>+ Add card</button>
      </div>
      <ul className="fc-list">
        {list.map((c) => (
          <li key={c.id} className={`ws-card${c.suspended ? ' suspended' : ''}`} data-find={`card-${c.id}`}>
            <div className="fc-list-main"><Markdown text={c.front} /><Markdown className="fc-list-back" text={c.back} /></div>
            <div className="fc-list-side">
              <span className="ws-label">{title(c.track)}</span>
              <span className="ws-muted">{when(c)}{c.custom ? ' · yours' : ''}</span>
              <span className="fc-list-actions">
                <button className="ws-link" onClick={() => setEdit(c)}>Edit</button>
                <button className="ws-link" onClick={() => void toggle(c)}>{c.suspended ? 'Unsuspend' : 'Suspend'}</button>
              </span>
            </div>
          </li>
        ))}
        {!list.length && <li className="ws-muted">No cards match.</li>}
      </ul>
      {edit && <CardEditor card={edit === 'new' ? null : edit} tracks={tracks} scope={scope} onClose={() => setEdit(null)}
        onSaved={(c) => { onChange(c); setEdit(null); }} onDeleted={(id) => { onDelete(id); setEdit(null); }} onError={onError} />}
    </>
  );
}

function CardEditor({ card, tracks, scope, onClose, onSaved, onDeleted, onError }: {
  card: Card | null; tracks: { id: string; title: string }[]; scope: string; onClose: () => void; onSaved: (c: Card) => void; onDeleted: (id: string) => void; onError: (m: string) => void;
}) {
  const [f, setF] = useState({ track: card?.track ?? (scope !== 'all' ? scope : tracks[0]?.id ?? ''), front: card?.front ?? '', back: card?.back ?? '' });
  const [busy, setBusy] = useState(false);
  const safeDelete = useSafeDelete();
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { onSaved(await api<Card>(card ? `cards/${card.id}` : 'cards', card ? 'PATCH' : 'POST', f)); } catch (er) { onError((er as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="ws-overlay" onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }} onKeyDown={(e) => { if (e.key === 'Escape' && !busy) onClose(); }}>
      <aside className="ws-drawer" role="dialog" aria-modal="true" aria-labelledby="fc-ed-title">
        <header><h2 id="fc-ed-title">{card ? 'Edit card' : 'New card'}</h2><button className="ws-icon" onClick={onClose} aria-label="Close">✕</button></header>
        <form className="ws-form" onSubmit={save}>
          {!card && <label>Track<select value={f.track} onChange={(e) => setF({ ...f, track: e.target.value })}>{tracks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label>}
          <label>Front (question)<textarea required autoFocus rows={4} maxLength={2000} value={f.front} onChange={(e) => setF({ ...f, front: e.target.value })} /></label>
          <label>Back (answer; Markdown works)<textarea required rows={7} maxLength={6000} value={f.back} onChange={(e) => setF({ ...f, back: e.target.value })} /></label>
          <footer>
            {card?.custom ? <Btn icon="trash" tone="danger" disabled={busy} onClick={() => void safeDelete({
              title: 'Delete this card?', body: <p>Its review history goes with it.</p>, confirm: 'Delete card',
              run: async () => { await api(`cards/${card.id}`, 'DELETE'); onDeleted(card.id); }, done: 'Card deleted.', reload: () => location.reload(),
            }).catch((er) => onError((er as Error).message))}>Delete card</Btn> : null}
            <span style={{ flex: 1 }} />
            <button type="button" className="ws-ghost" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="ws-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          </footer>
        </form>
      </aside>
    </div>
  );
}
