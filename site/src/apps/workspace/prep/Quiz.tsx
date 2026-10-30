// Quizzes: pick a track (or module) and a length; answer with a click or keys 1–4, see right away
// whether it was right and why, then a summary with a "retry the ones I missed". Scores are kept.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, Bar, relTime, useLoad, useStored } from '../api';
import { Markdown } from '../markdown';
import type { PrepData } from './shared';
import { targetId, useJumpTarget } from '../search/jump';

interface Q { id: string; track: string; module: string; q: string; options: string[]; answer: number; explain: string }
interface Attempt { id: number; scope: string; total: number; correct: number; details: { id: string; chosen: number; ok: boolean }[]; at: string }
interface Data { questions: Q[]; attempts: Attempt[] }
const LETTERS = ['A', 'B', 'C', 'D'];
const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

export default function Quiz({ prep, match = () => true, focus }: { prep: PrepData; match?: (track: string, module?: string) => boolean; focus?: string }) {
  const data = useLoad<Data>('quiz', { questions: [], attempts: [] });
  const [scope, setScope] = useStored('ws.quiz.scope', 'all');
  const [count, setCount] = useStored('ws.quiz.count', 10);
  const [missedOnly, setMissedOnly] = useState(false);
  const [run, setRun] = useState<{ qs: Q[]; scope: string } | null>(null);
  // Opened from search: that question (with its answer) on top of the page until it is closed.
  const jump = useJumpTarget('quiz');
  const [found, setFound] = useState<string | null>(null);
  useEffect(() => { const id = targetId(jump); if (id) { setFound(id); setRun(null); } }, [jump]);
  const foundQ = found ? data.data.questions.find((q) => q.id === found) : undefined;

  const trackTitle = (id: string) => prep.tracks.find((t) => t.id === id)?.title ?? id;
  const moduleTitle = (id: string) => prep.modules.find((m) => m.id === id)?.title ?? id;
  const scopeTitle = (s: string) => (s === 'all' ? 'All tracks' : s.startsWith('m:') ? moduleTitle(s.slice(2)) : trackTitle(s));
  // The prep focus (if any) decides which questions are in play at all.
  const inFocus = useMemo(() => data.data.questions.filter((q) => match(q.track, q.module)), [data.data.questions, match]);
  const tracks = prep.tracks.filter((t) => inFocus.some((q) => q.track === t.id));
  const pool = (s: string) => inFocus.filter((q) => s === 'all' || (s.startsWith('m:') ? q.module === s.slice(2) : q.track === s));
  // The latest answer to each question decides whether it counts as "missed".
  const missed = useMemo(() => {
    const last = new Map<string, boolean>();
    for (const a of [...data.data.attempts].reverse()) for (const d of a.details) last.set(d.id, d.ok);
    return new Set([...last].filter(([, ok]) => !ok).map(([id]) => id));
  }, [data.data.attempts]);
  const start = (s = scope, onlyMissed = missedOnly, n = count) => {
    let qs = pool(s);
    if (onlyMissed) qs = qs.filter((q) => missed.has(q.id));
    qs = shuffle(qs).slice(0, n);
    if (qs.length) setRun({ qs, scope: s });
  };
  const available = pool(scope).filter((q) => !missedOnly || missed.has(q.id)).length;

  if (run) return (
    <section className="ws-section qz">
      <Runner key={run.qs.map((q) => q.id).join()} run={run} title={scopeTitle(run.scope)}
        onFinish={async (details) => {
          const correct = details.filter((d) => d.ok).length;
          try {
            const row = await api<Attempt>('quiz/attempts', 'POST', { scope: run.scope, total: details.length, correct, details });
            data.setData((d) => ({ ...d, attempts: [{ ...row, details }, ...d.attempts] }));
          } catch (e) { data.setError((e as Error).message); }
        }}
        onRetry={(ids) => setRun({ qs: shuffle(run.qs.filter((q) => ids.includes(q.id))), scope: run.scope })}
        onExit={() => setRun(null)} />
    </section>
  );

  // Per-track history: last and best score.
  const history = tracks.map((t) => {
    const at = data.data.attempts.filter((a) => a.scope === t.id || a.scope.startsWith('m:') && prep.modules.find((m) => m.id === a.scope.slice(2))?.track_id === t.id);
    const pct = (a: Attempt) => a.correct / a.total;
    return { t, last: at[0] ? pct(at[0]) : null, best: at.length ? Math.max(...at.map(pct)) : null, n: at.length };
  });

  return (
    <section className="ws-section qz">
      <header className="ws-head">
        <div>
          <p className="ws-eyebrow">QUIZ</p>
          <h1>Check yourself.</h1>
          <p className="ws-sub">{focus ? <><b>{focus}</b> focus · </> : null}{inFocus.length} questions across {tracks.length} tracks · answer with 1–4 or A–D, Enter for next.</p>
        </div>
      </header>
      {data.error && <p className="ws-error" role="alert">{data.error}</p>}
      {foundQ && (
        <div className="ws-card qz-found" data-find={`quiz-${foundQ.id}`}>
          <div className="qz-found-head"><span className="ws-label">From search · {trackTitle(foundQ.track)}</span><button className="ws-icon" onClick={() => setFound(null)} aria-label="Close">✕</button></div>
          <Markdown text={foundQ.q} className="qz-found-q" />
          <ol className="qz-found-opts">{foundQ.options.map((o, i) => <li key={i} className={i === foundQ.answer ? 'right' : ''}><b>{LETTERS[i]}</b> <Markdown text={o} />{i === foundQ.answer && <span className="qz-found-ok">✓ answer</span>}</li>)}</ol>
          {foundQ.explain && <Markdown text={foundQ.explain} className="qz-found-why" />}
        </div>
      )}

      <div className="ws-card qz-setup">
        <label>Topic
          <select value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="all">{focus ? `All of ${focus}` : 'All tracks'} ({pool('all').length})</option>
            {tracks.map((t) => (
              <optgroup key={t.id} label={t.title}>
                <option value={t.id}>All of {t.title} ({pool(t.id).length})</option>
                {prep.modules.filter((m) => m.track_id === t.id && pool(`m:${m.id}`).length).map((m) => <option key={m.id} value={`m:${m.id}`}>{m.title} ({pool(`m:${m.id}`).length})</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="qz-field"><span>Questions</span>
          <div className="ws-seg" role="group" aria-label="Number of questions">{[5, 10, 20].map((n) => <button key={n} type="button" aria-pressed={count === n} aria-selected={count === n} onClick={() => setCount(n)}>{n}</button>)}</div>
        </div>
        <label className="ws-check qz-missed"><input type="checkbox" checked={missedOnly} onChange={(e) => setMissedOnly(e.target.checked)} /> Only ones I missed ({pool(scope).filter((q) => missed.has(q.id)).length})</label>
        <button className="ws-primary" onClick={() => start()} disabled={!available}>Start · {Math.min(count, available)} questions</button>
      </div>

      <h2 className="ws-h2">Scores by track</h2>
      <div className="qz-history">
        {history.map(({ t, last, best, n }) => (
          <button key={t.id} className="ws-card qz-track" onClick={() => start(t.id, false, count)}>
            <strong>{t.title}</strong>
            <Bar value={last ?? 0} tone={last == null ? undefined : last >= 0.8 ? 'var(--green)' : last >= 0.6 ? 'var(--amber)' : 'var(--rose)'} />
            <small>{n ? `last ${Math.round(last! * 100)}% · best ${Math.round(best! * 100)}% · ${n} quiz${n === 1 ? '' : 'zes'}` : 'not taken yet · start →'}</small>
          </button>
        ))}
      </div>
      {data.data.attempts.length > 0 && (
        <>
          <h2 className="ws-h2">Recent</h2>
          <ul className="qz-recent">
            {data.data.attempts.slice(0, 8).map((a) => <li key={a.id}><span>{scopeTitle(a.scope)}</span><b>{a.correct}/{a.total}</b><small>{relTime(a.at)}</small></li>)}
          </ul>
        </>
      )}
    </section>
  );
}

function Runner({ run, title, onFinish, onRetry, onExit }: {
  run: { qs: Q[]; scope: string }; title: string; onFinish: (d: { id: string; chosen: number; ok: boolean }[]) => Promise<void>;
  onRetry: (ids: string[]) => void; onExit: () => void;
}) {
  const [i, setI] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ id: string; chosen: number; ok: boolean }[]>([]);
  const [finished, setFinished] = useState(false);
  const q = run.qs[i];
  const choose = useCallback((k: number) => {
    if (chosen !== null || finished || !q) return;
    setChosen(k);
    setAnswers((a) => [...a, { id: q.id, chosen: k, ok: k === q.answer }]);
  }, [chosen, finished, q]);
  const next = useCallback(() => {
    if (chosen === null) return;
    if (i + 1 < run.qs.length) { setI(i + 1); setChosen(null); }
    else { setFinished(true); void onFinish(answers); }
  }, [chosen, i, run.qs.length, answers, onFinish]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      const k = '1234'.indexOf(e.key) >= 0 ? '1234'.indexOf(e.key) : 'abcd'.indexOf(e.key.toLowerCase());
      if (k >= 0 && e.key.length === 1) { e.preventDefault(); choose(k); }
      else if (e.key === 'Enter' && chosen !== null && !finished) { e.preventDefault(); next(); }
      else if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choose, next, chosen, finished, onExit]);

  if (finished) {
    const right = answers.filter((a) => a.ok).length, wrong = run.qs.filter((x) => answers.find((a) => a.id === x.id && !a.ok));
    const pct = Math.round((right / answers.length) * 100);
    return (
      <div className="qz-summary">
        <p className="ws-eyebrow">QUIZ · {title.toUpperCase()}</p>
        <h1>{right} / {answers.length} <small>({pct}%)</small></h1>
        <p className="ws-sub">{pct >= 80 ? 'Solid. Come back in a few days to keep it.' : pct >= 60 ? 'Close. Review the misses below, then retry them.' : 'Worth another pass through these lectures, then retry.'}</p>
        <div className="qz-actions">
          {wrong.length > 0 && <button className="ws-primary" onClick={() => onRetry(wrong.map((x) => x.id))}>Retry the {wrong.length} I missed</button>}
          <button className="ws-ghost" onClick={onExit}>Done</button>
        </div>
        {wrong.length > 0 && <h2 className="ws-h2">Missed</h2>}
        <ul className="qz-misses">
          {wrong.map((x) => (
            <li key={x.id} className="ws-card">
              <Markdown text={x.q} />
              <p className="qz-correct">✓ {x.options[x.answer]}</p>
              <Markdown className="qz-explain" text={x.explain} />
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div className="qz-run">
      <div className="qz-top">
        <button className="ws-link" onClick={onExit}>← Quit</button>
        <span className="ws-label">{title} · {i + 1} / {run.qs.length}</span>
        <span className="qz-dots">{run.qs.map((x, k) => { const a = answers.find((y) => y.id === x.id); return <i key={x.id} className={a ? (a.ok ? 'ok' : 'no') : k === i ? 'cur' : ''} />; })}</span>
      </div>
      <article className="ws-card qz-q">
        <Markdown className="qz-text" text={q.q} />
        <ol className="qz-options">
          {q.options.map((o, k) => {
            const state = chosen === null ? '' : k === q.answer ? 'right' : k === chosen ? 'wrong' : 'dim';
            return (
              <li key={k}>
                <button className={`qz-opt ${state}`} onClick={() => choose(k)} disabled={chosen !== null} aria-pressed={chosen === k}>
                  <kbd>{LETTERS[k]}</kbd><Markdown text={o} />
                </button>
              </li>
            );
          })}
        </ol>
        {chosen !== null && (
          <div className={`qz-feedback ${chosen === q.answer ? 'ok' : 'no'}`} role="status">
            <strong>{chosen === q.answer ? 'Correct.' : `Not quite: the answer is ${LETTERS[q.answer]}.`}</strong>
            <Markdown text={q.explain} />
            <button className="ws-primary" onClick={next} autoFocus>{i + 1 < run.qs.length ? 'Next' : 'See results'} <kbd>Enter</kbd></button>
          </div>
        )}
      </article>
    </div>
  );
}
