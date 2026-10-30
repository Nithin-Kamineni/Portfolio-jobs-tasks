// Interview questions: filter by category, company, difficulty and status; answer in your own words
// first, then reveal the model answer with the topics and concepts it tests. ←/→ move, R reveals.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, useDebounced, useLoad, useStored } from '../api';
import { Markdown } from '../markdown';
import { FocusBar, useFocus } from '../prep/focus';
import type { PrepData } from '../prep/shared';
import { useJumpTarget } from '../search/jump';

interface Question {
  id: string; category: string; question: string; answer_md: string; topics: string[]; concepts: string[]; difficulty: 'Easy' | 'Medium' | 'Hard';
  companies: string[]; role: string; track: string; module: string; source: string; common: number; custom: number; status: Status; starred: number; my_answer: string; updated_at: string | null;
}
type Status = 'new' | 'practiced' | 'confident';
const STATUS: Record<Status, string> = { new: 'Not practiced', practiced: 'Practiced', confident: 'Confident' };
interface Filters { q: string; cat: string; company: string; diff: string; status: string; starred: boolean }
const NONE: Filters = { q: '', cat: '', company: '', diff: '', status: '', starred: false };

export default function Questions() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data, setData, error, setError, loading } = useLoad<Question[]>('questions', []);
  const [f, setF] = useStored<Filters>('ws.questions.filters', NONE);
  const prep = useLoad<PrepData>('prep', { tracks: [], modules: [], items: [], log: [] });
  const focus = useFocus(prep.data);
  const inFocus = useMemo(() => data.filter((x) => focus.matches(x.track, x.module)), [data, focus.matches]);
  const categories = useMemo(() => [...new Set(data.map((q) => q.category))], [data]);
  const companies = useMemo(() => {
    const n = new Map<string, number>();
    for (const q of data) for (const c of q.companies) n.set(c, (n.get(c) ?? 0) + 1);
    return [...n].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  }, [data]);
  const list = useMemo(() => inFocus.filter((x) =>
    (!f.cat || x.category === f.cat) && (!f.company || x.companies.includes(f.company)) && (!f.diff || x.difficulty === f.diff)
    && (!f.status || x.status === f.status) && (!f.starred || x.starred)
    && (!f.q || `${x.question} ${x.topics.join(' ')} ${x.concepts.join(' ')}`.toLowerCase().includes(f.q.toLowerCase()))), [inFocus, f]);
  const current = data.find((x) => x.id === id) ?? null;
  const pos = current ? list.findIndex((x) => x.id === current.id) : -1;
  const go = (q: Question | undefined) => { if (q) nav(`/questions/${q.id}`); };

  useEffect(() => { if (!id && !loading && list.length) nav(`/questions/${list[0].id}`, { replace: true }); }, [id, loading, list.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = async (q: Question, p: Partial<Question>) => {
    setData((d) => d.map((x) => (x.id === q.id ? { ...x, ...p } : x)));
    try { const row = await api<Question>(`questions/${q.id}`, 'PATCH', p); setData((d) => d.map((x) => (x.id === row.id ? row : x))); }
    catch (e) { setError((e as Error).message); }
  };
  const count = (s: Status) => inFocus.filter((q) => q.status === s).length;
  const filtering = JSON.stringify(f) !== JSON.stringify(NONE);

  return (
    <section className="qs-layout">
      <aside className="qs-side">
        <FocusBar f={focus} prep={prep.data} compact />
        <div className="qs-progress">
          {(Object.keys(STATUS) as Status[]).map((s) => <span key={s} className={`qs-pill ${s}`}><b>{count(s)}</b> {STATUS[s]}</span>)}
        </div>
        <input type="search" placeholder="Search questions, topics, concepts…" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} aria-label="Search questions" />
        <div className="qs-filters">
          <select value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })} aria-label="Category"><option value="">All categories</option>{categories.map((c) => <option key={c}>{c}</option>)}</select>
          <select value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} aria-label="Company"><option value="">All companies</option>{companies.map((c) => <option key={c}>{c}</option>)}</select>
          <select value={f.diff} onChange={(e) => setF({ ...f, diff: e.target.value })} aria-label="Difficulty"><option value="">Any difficulty</option>{['Easy', 'Medium', 'Hard'].map((d) => <option key={d}>{d}</option>)}</select>
          <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} aria-label="Status"><option value="">Any status</option>{(Object.keys(STATUS) as Status[]).map((s) => <option key={s} value={s}>{STATUS[s]}</option>)}</select>
        </div>
        <div className="qs-filter-row">
          <label className="ws-check"><input type="checkbox" checked={f.starred} onChange={(e) => setF({ ...f, starred: e.target.checked })} /> Starred</label>
          <button className="ws-link" style={{ visibility: filtering ? 'visible' : 'hidden' }} onClick={() => setF(NONE)}>Clear</button>
          <button className="ws-link" onClick={() => go(list[Math.floor(Math.random() * list.length)])} disabled={!list.length}>Random ⤳</button>
          <span className="ws-muted">{list.length}</span>
        </div>
        <ul className="qs-list">
          {list.map((q) => (
            <li key={q.id} className={q.id === id ? 'on' : ''}>
              <button onClick={() => go(q)}>
                <span className={`qs-dot ${q.status}`} aria-hidden="true" />
                <span className="qs-list-q">{q.starred ? '★ ' : ''}{q.question}</span>
                <small>{q.category} · <span className={`cd-pill ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span></small>
              </button>
            </li>
          ))}
          {!list.length && !loading && <li className="ws-muted qs-none">No question matches.</li>}
        </ul>
      </aside>
      <div className="qs-main">
        {error && <p className="ws-error" role="alert">{error}</p>}
        {current
          ? <QuestionView key={current.id} q={current} onPatch={(p) => void patch(current, p)}
              prev={pos > 0 ? () => go(list[pos - 1]) : undefined} next={pos >= 0 && pos < list.length - 1 ? () => go(list[pos + 1]) : undefined}
              index={pos} total={list.length} />
          : !loading && <div className="ws-empty"><span>?</span><h2>Pick a question</h2><p>Answer it in your own words first, then reveal the model answer.</p></div>}
      </div>
    </section>
  );
}

function QuestionView({ q, onPatch, prev, next, index, total }: { q: Question; onPatch: (p: Partial<Question>) => void; prev?: () => void; next?: () => void; index: number; total: number }) {
  const [revealed, setRevealed] = useState(false);
  const jump = useJumpTarget('question');
  useEffect(() => { if (jump?.open) setRevealed(true); }, [jump]);
  const [mine, setMine] = useState(q.my_answer);
  const [saved, setSaved] = useState(true);
  const [save, flush] = useDebounced((v: string) => { onPatch({ my_answer: v }); setSaved(true); }, 700);
  const top = useRef<HTMLDivElement>(null);
  useEffect(() => { top.current?.scrollIntoView({ block: 'nearest' }); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      if (e.key === 'ArrowRight' && next) { e.preventDefault(); flush(); next(); }
      else if (e.key === 'ArrowLeft' && prev) { e.preventDefault(); flush(); prev(); }
      else if (e.key.toLowerCase() === 'r') { e.preventDefault(); setRevealed((r) => !r); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, flush]);

  return (
    <article className="qs-view" ref={top} data-find="question-view">
      <div className="qs-nav">
        <button className="ws-ghost" onClick={() => { flush(); prev?.(); }} disabled={!prev} aria-label="Previous question">← Prev</button>
        <span className="ws-muted">{index >= 0 ? `${index + 1} of ${total}` : 'Not in the current filter'}</span>
        <button className="ws-ghost" onClick={() => { flush(); next?.(); }} disabled={!next} aria-label="Next question">Next →</button>
      </div>
      <div className="qs-meta">
        <span className="ws-tag">{q.category}</span>
        <span className={`cd-pill ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
        {q.companies.length > 0 && <span className="ws-muted" title={q.companies.join(', ')}>Asked at: {q.companies.slice(0, 4).join(', ')}{q.companies.length > 4 ? ` +${q.companies.length - 4} more` : ''}</span>}
        {q.source ? <a className="ws-link" href={q.source} target="_blank" rel="noreferrer">Reported here ↗</a> : q.common ? <span className="ws-muted">· common question</span> : null}
      </div>
      <h1 className="qs-q">{q.question}</h1>

      <div className="qs-status" role="group" aria-label="Your status">
        {(Object.keys(STATUS) as Status[]).map((s) => (
          <button key={s} className={`qs-st ${s}${q.status === s ? ' on' : ''}`} aria-pressed={q.status === s} onClick={() => onPatch({ status: s })}>{STATUS[s]}</button>
        ))}
        <button className={`ws-star${q.starred ? ' on' : ''}`} aria-pressed={!!q.starred} aria-label="Star" onClick={() => onPatch({ starred: q.starred ? 0 : 1 })}>★</button>
      </div>

      <label className="qs-mine">
        <span>Your answer <small className="ws-muted">{saved ? (mine ? 'saved' : 'say it out loud, or jot the key points') : 'saving…'}</small></span>
        <textarea rows={5} value={mine} placeholder="Answer before you reveal: structure, numbers, trade-offs…" onChange={(e) => { setMine(e.target.value); setSaved(false); save(e.target.value); }} onBlur={flush} />
      </label>

      {!revealed ? (
        <button className="ws-primary qs-reveal" onClick={() => setRevealed(true)}>Reveal model answer <kbd>R</kbd></button>
      ) : (
        <section className="qs-answer ws-card">
          <header><h2>Model answer</h2><button className="ws-link" onClick={() => setRevealed(false)}>Hide</button></header>
          <Markdown text={q.answer_md} />
          <div className="qs-tags">
            {q.topics.length > 0 && <div><span className="ws-label">Topics</span>{q.topics.map((t) => <span key={t} className="ws-tag" style={{ '--tone': 'var(--cyan)' } as React.CSSProperties}>{t}</span>)}</div>}
            {q.concepts.length > 0 && <div><span className="ws-label">Concepts</span>{q.concepts.map((t) => <span key={t} className="ws-tag" style={{ '--tone': 'var(--copper)' } as React.CSSProperties}>{t}</span>)}</div>}
          </div>
        </section>
      )}
      <p className="ws-muted qs-keys"><kbd>←</kbd> <kbd>→</kbd> move · <kbd>R</kbd> reveal</p>
    </article>
  );
}
