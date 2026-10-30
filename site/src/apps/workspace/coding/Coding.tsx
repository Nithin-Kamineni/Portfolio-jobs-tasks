// Practice roadmaps: DSA (NeetCode-style, solve on LeetCode) and HDL (Verilog/SystemVerilog on HDLBits,
// QuickSilicon and guided builds, plus a short SystemC branch). Roadmap view + all-problems tables;
// solved / starred / notes per problem live in D1 (coding_progress, keyed by slug).
import { useEffect, useMemo, useState } from 'react';
import { targetId, useJumpTarget } from '../search/jump';
import { api, Bar, useLoad, useStored } from '../api';
import RAW from './problems.json';
import HDL from './hdl.json';
import { EDGES, NODES, TOPICS } from './roadmap';

interface Problem {
  slug: string; title: string; topic: string; difficulty: 'Easy' | 'Medium' | 'Hard'; url: string;
  video?: string; site?: string; lang?: string; est?: number; tip?: string; statement?: string; guide?: string; nc150?: boolean; blind75?: boolean;
}
interface Progress { slug: string; status: 'todo' | 'attempted' | 'solved'; starred: number; notes: string; solved_at: string | null; review_on: string | null }
interface Track { topics: { id: string; title: string; blurb?: string }[]; nodes: { id: string; x: number; y: number }[]; edges: [string, string][]; problems: Problem[] }

const DSA: Track = {
  topics: TOPICS.map((t) => ({ id: t, title: t })),
  nodes: NODES.map((n) => ({ id: n.topic, x: n.x, y: n.y })),
  edges: EDGES,
  problems: (RAW as { slug: string; title: string; topic: string; difficulty: Problem['difficulty']; video: string; nc150: boolean; blind75: boolean }[])
    .map((p) => ({ ...p, url: `https://leetcode.com/problems/${p.slug}/` })),
};
type HdlRaw = { topics: { id: string; title: string; x: number; y: number; blurb: string }[]; edges: [string, string][]; problems: { slug: string; title: string; topic: string; difficulty: Problem['difficulty']; lang: string; url: string; site: string; est_min?: number; tip?: string; statement?: string; guide_url?: string }[] };
const H = HDL as unknown as HdlRaw;
const HDL_TRACK: Track = {
  topics: H.topics.map((t) => ({ id: t.id, title: t.title, blurb: t.blurb })),
  nodes: H.topics.map((t) => ({ id: t.id, x: t.x, y: t.y })),
  edges: H.edges,
  problems: H.problems.map((p) => ({ slug: p.slug, title: p.title, topic: p.topic, difficulty: p.difficulty, url: p.url, site: p.site, lang: p.lang, est: p.est_min, tip: p.tip, statement: p.statement, guide: p.guide_url })),
};

const DSA_LISTS = { nc150: 'NeetCode 150', blind75: 'Blind 75', all: 'All 420' } as const;
type ListId = keyof typeof DSA_LISTS;
const DIFF = ['Easy', 'Medium', 'Hard'] as const;

export default function Coding() {
  const { data, setData, error, setError } = useLoad<Progress[]>('coding', []);
  const [kind, setKind] = useStored<'dsa' | 'hdl'>('ws.coding.kind', 'dsa');
  const [list, setList] = useStored<ListId>('ws.coding.list', 'nc150');
  const [view, setView] = useStored<'roadmap' | 'list'>('ws.coding.view', 'roadmap');
  const [topic, setTopic] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [diff, setDiff] = useState('');
  const [status, setStatus] = useState('');
  // Opened from search: the problem's track, the full list, no filters, its topic open.
  const jump = useJumpTarget('code');
  const want = targetId(jump);
  useEffect(() => {
    if (!jump || !want) return;
    if (jump.kind && jump.kind !== kind) setKind(jump.kind);
    if (jump.kind === 'dsa' && list !== 'all') setList('all');
    setView('list'); setQ(''); setDiff(''); setStatus(''); setTopic(null);
  }, [jump]); // eslint-disable-line react-hooks/exhaustive-deps

  const track = kind === 'hdl' ? HDL_TRACK : DSA;
  const title = (id: string) => track.topics.find((t) => t.id === id)?.title ?? id;
  const prog = useMemo(() => new Map(data.map((p) => [p.slug, p])), [data]);
  const inList = useMemo(() => (kind === 'hdl' ? HDL_TRACK.problems : DSA.problems.filter((p) => list === 'all' || p[list])), [kind, list]);
  const solved = (p: Problem) => prog.get(p.slug)?.status === 'solved';

  const save = async (p: Problem, patch: Partial<Progress>) => {
    const cur = prog.get(p.slug) ?? { slug: p.slug, status: 'todo', starred: 0, notes: '', solved_at: null, review_on: null };
    const next = { ...cur, ...patch } as Progress;
    setData((d) => [...d.filter((x) => x.slug !== p.slug), next]);
    try {
      const row = await api<Progress>(`coding/${p.slug}`, 'PUT', next);
      setData((d) => [...d.filter((x) => x.slug !== p.slug), row]);
    } catch (e) { setError((e as Error).message); }
  };

  const filtered = inList.filter((p) => {
    const st = prog.get(p.slug);
    if (diff && p.difficulty !== diff) return false;
    if (status === 'solved' && st?.status !== 'solved') return false;
    if (status === 'unsolved' && st?.status === 'solved') return false;
    if (status === 'starred' && !st?.starred) return false;
    return !q || p.title.toLowerCase().includes(q.toLowerCase());
  });
  const total = inList.length, done = inList.filter(solved).length;
  const hoursLeft = kind === 'hdl' ? Math.round(inList.filter((p) => !solved(p)).reduce((s, p) => s + (p.est ?? 0), 0) / 6) / 10 : 0;

  return (
    <section className="ws-section">
      <div className="ws-seg cd-kind" role="tablist" aria-label="Practice track">
        <button role="tab" aria-selected={kind === 'dsa'} onClick={() => { setKind('dsa'); setTopic(null); }}>DSA (LeetCode)</button>
        <button role="tab" aria-selected={kind === 'hdl'} onClick={() => { setKind('hdl'); setTopic(null); }}>HDL (RTL + SystemC)</button>
      </div>
      <header className="ws-head">
        <div>
          <p className="ws-eyebrow">CODING · {kind === 'hdl' ? 'HDL PRACTICE' : DSA_LISTS[list].toUpperCase()}</p>
          <h1>{kind === 'hdl' ? 'RTL practice roadmap' : 'Practice roadmap'}</h1>
          <p className="ws-sub">{kind === 'hdl' ? 'Muxes to async FIFO, AXI-Lite and a pipelined RISC-V core, plus a short SystemC branch.' : 'Solve on LeetCode, tick it here. Star the ones to revisit.'}</p>
        </div>
      </header>
      {error && <p className="ws-error" role="alert">{error}</p>}

      <div className="cd-stats">
        <div className="ws-card cd-total">
          <span className="ws-label">Solved</span>
          <strong>{done}<small> / {total}{kind === 'hdl' ? ` · ~${hoursLeft} h left` : ''}</small></strong>
          <Bar value={total ? done / total : 0} />
        </div>
        {DIFF.map((d) => {
          const all = inList.filter((p) => p.difficulty === d), s = all.filter(solved).length;
          return (
            <div key={d} className={`ws-card cd-diff ${d.toLowerCase()}`}>
              <span className="ws-label">{d}</span>
              <strong>{s}<small> / {all.length}</small></strong>
              <Bar value={all.length ? s / all.length : 0} tone={`var(--cd-${d.toLowerCase()})`} />
            </div>
          );
        })}
      </div>

      <div className="ws-toolbar">
        <div className="cd-controls">
          <div className="ws-seg" role="tablist" aria-label="View">
            <button role="tab" aria-selected={view === 'roadmap'} onClick={() => setView('roadmap')}>Roadmap</button>
            <button role="tab" aria-selected={view === 'list'} onClick={() => setView('list')}>All problems</button>
          </div>
          {kind === 'dsa' && (
            <div className="ws-seg" role="tablist" aria-label="Problem list">
              {(Object.keys(DSA_LISTS) as ListId[]).map((k) => <button key={k} role="tab" aria-selected={list === k} onClick={() => setList(k)}>{DSA_LISTS[k]}</button>)}
            </div>
          )}
        </div>
        {view === 'list' && (
          <div className="ws-filters">
            <input type="search" placeholder="Search problems…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search problems" />
            <select value={diff} onChange={(e) => setDiff(e.target.value)} aria-label="Difficulty"><option value="">Any difficulty</option>{DIFF.map((d) => <option key={d}>{d}</option>)}</select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="">Any status</option><option value="unsolved">Unsolved</option><option value="solved">Solved</option><option value="starred">Starred</option></select>
          </div>
        )}
      </div>

      {kind === 'hdl' && <p className="ws-muted cd-sv">All RTL problems accept SystemVerilog (logic, always_ff, always_comb, enums). HDLBits shows a Verilog template; just rewrite it in SV. SystemC exercises run in EDA Playground.</p>}
      {view === 'roadmap' ? (
        <Roadmap track={track} problems={inList} solved={solved} onOpen={setTopic} />
      ) : (
        track.topics.map((t) => {
          const rows = filtered.filter((p) => p.topic === t.id);
          return rows.length ? <TopicTable key={t.id} want={want} id={t.id} title={t.title} hdl={kind === 'hdl'} rows={rows} all={inList.filter((p) => p.topic === t.id)} prog={prog} save={save} /> : null;
        })
      )}

      {topic && (
        <div className="ws-overlay" onClick={(e) => { if (e.target === e.currentTarget) setTopic(null); }} onKeyDown={(e) => { if (e.key === 'Escape') setTopic(null); }}>
          <aside className="ws-drawer cd-drawer" role="dialog" aria-modal="true" aria-label={title(topic)}>
            <header><h2>{title(topic)}</h2><button className="ws-icon" onClick={() => setTopic(null)} aria-label="Close" autoFocus>✕</button></header>
            {track.topics.find((t) => t.id === topic)?.blurb && <p className="ws-sub cd-blurb">{track.topics.find((t) => t.id === topic)?.blurb}</p>}
            <TopicTable id={topic} title={title(topic)} hdl={kind === 'hdl'} rows={inList.filter((p) => p.topic === topic)} all={inList.filter((p) => p.topic === topic)} prog={prog} save={save} bare />
          </aside>
        </div>
      )}
    </section>
  );
}

function Roadmap({ track, problems, solved, onOpen }: { track: Track; problems: Problem[]; solved: (p: Problem) => boolean; onOpen: (t: string) => void }) {
  const W = 160, H = 112, NW = 142, NH = 76, PAD = 20;
  const cols = Math.max(...track.nodes.map((n) => n.x)) + 1, rows = Math.max(...track.nodes.map((n) => n.y)) + 1;
  const width = cols * W + PAD * 2 - (W - NW), height = rows * H + PAD * 2 - (H - NH);
  const pos = new Map(track.nodes.map((n) => [n.id, { x: PAD + n.x * W, y: PAD + n.y * H }]));
  return (
    <div className="cd-map-wrap">
      <div className="cd-map" style={{ width, height }}>
        <svg width={width} height={height} aria-hidden="true">
          {track.edges.map(([a, b]) => {
            const p = pos.get(a), q = pos.get(b);
            if (!p || !q) return null;
            const x1 = p.x + NW / 2, y1 = p.y + NH, x2 = q.x + NW / 2, y2 = q.y, my = (y1 + y2) / 2;
            return <path key={a + b} d={`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`} />;
          })}
        </svg>
        {track.nodes.map((n) => {
          const all = problems.filter((p) => p.topic === n.id), s = all.filter(solved).length, p = pos.get(n.id)!;
          const pct = all.length ? s / all.length : 0;
          const t = track.topics.find((x) => x.id === n.id);
          return (
            <button key={n.id} className={`cd-node${all.length && s === all.length ? ' done' : ''}`} style={{ left: p.x, top: p.y, width: NW, height: NH }} onClick={() => onOpen(n.id)} title={t?.blurb}>
              <span>{t?.title ?? n.id}</span>
              <span className="cd-load" role="progressbar" aria-valuemin={0} aria-valuemax={all.length} aria-valuenow={s} aria-label={`${s} of ${all.length} solved`}>
                <span style={{ width: `${pct * 100}%` }} />
              </span>
              <small>{s} / {all.length}<b>{Math.round(pct * 100)}%</b></small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TopicTable({ want, id, title, hdl, rows, all, prog, save, bare }: {
  want?: string | null; id: string; title: string; hdl: boolean; rows: Problem[]; all: Problem[]; prog: Map<string, Progress>; save: (p: Problem, patch: Partial<Progress>) => void; bare?: boolean;
}) {
  const [open, setOpen] = useStored<boolean>(`ws.coding.open.${id}`, true);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  useEffect(() => { if (want && rows.some((p) => p.slug === want) && !open) setOpen(true); }, [want]); // eslint-disable-line react-hooks/exhaustive-deps
  const done = all.filter((p) => prog.get(p.slug)?.status === 'solved').length;
  const table = (
    <table className="ws-table cd-table">
      <thead><tr>
        <th className="cd-c-status">Status</th><th className="cd-c-star">Star</th><th>Problem</th><th className="cd-c-diff">Difficulty</th>
        {hdl ? <th className="cd-c-video">Where</th> : <th className="cd-c-video">Solution</th>}
        <th className="cd-c-notes">Notes</th>
      </tr></thead>
      <tbody>
        {rows.map((p) => {
          const st = prog.get(p.slug);
          return (
            <tr key={p.slug} className={st?.status === 'solved' ? 'is-done' : ''} data-find={`code-${p.slug}`}>
              <td><input type="checkbox" checked={st?.status === 'solved'} onChange={(e) => save(p, { status: e.target.checked ? 'solved' : 'todo' })} aria-label={`Solved: ${p.title}`} /></td>
              <td><button className={`ws-star${st?.starred ? ' on' : ''}`} onClick={() => save(p, { starred: st?.starred ? 0 : 1 })} aria-pressed={!!st?.starred} aria-label={`Star ${p.title}`}>★</button></td>
              <td>
                <a href={p.url} target="_blank" rel="noreferrer">{p.title}</a>
                {hdl && <span className="cd-meta">{p.lang}{p.est ? ` · ${p.est} min` : ''}</span>}
                {p.tip && <p className="cd-tip">{p.tip}</p>}
                {p.statement && <p className="cd-statement">{p.statement}{p.guide && <> <a href={p.guide} target="_blank" rel="noreferrer">Guide ↗</a></>}</p>}
                {!p.statement && p.guide && <a className="cd-guide" href={p.guide} target="_blank" rel="noreferrer">Guide ↗</a>}
                {noteFor === p.slug && (
                  <textarea className="cd-note" autoFocus defaultValue={st?.notes ?? ''} placeholder="Approach, pitfalls, complexity…" rows={3}
                    onBlur={(e) => { setNoteFor(null); if (e.target.value !== (st?.notes ?? '')) save(p, { notes: e.target.value }); }} />
                )}
                {noteFor !== p.slug && st?.notes && <p className="cd-note-view">{st.notes}</p>}
              </td>
              <td><span className={`cd-pill ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span></td>
              <td>{hdl ? <span className="cd-site">{p.site}</span> : p.video ? <a className="cd-video" href={`https://www.youtube.com/watch?v=${p.video}`} target="_blank" rel="noreferrer" aria-label={`Video solution for ${p.title}`}>▶ Video</a> : <span className="ws-muted">—</span>}</td>
              <td><button className="ws-link" onClick={() => setNoteFor(noteFor === p.slug ? null : p.slug)}>{st?.notes ? 'Edit' : 'Add'}</button></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
  if (bare) return <><p className="ws-muted cd-drawer-count">{done} / {all.length} solved</p>{table}</>;
  return (
    <section className="ws-card cd-topic">
      <button className="cd-topic-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="cd-caret">{open ? '▾' : '▸'}</span><h2>{title}</h2>
        <span className="cd-topic-count">{done} / {all.length}</span><Bar value={all.length ? done / all.length : 0} />
      </button>
      {open && <div className="ws-table-wrap">{table}</div>}
    </section>
  );
}
