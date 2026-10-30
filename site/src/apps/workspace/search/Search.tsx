// Global search (Ctrl+K, or Ctrl+Shift+F inside a document): a panel docked on the right that stays
// open while you visit results. Results are grouped by part of the site, show where they are
// (page › sub-page) and the matching text; opening one scrolls to the words and flashes them.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { AREA_LABEL, Index, wordsRe, type Area, type Hit, type Rec } from './engine';
import { setJump } from './jump';
import './search.css';

type Row = Record<string, unknown>;
interface IndexData { at: string; docs: Row[]; folders: Row[]; papers: Row[]; tracks: Row[]; modules: Row[]; items: Row[]; cards: Row[]; quiz: Row[]; questions: Row[]; coding: Row[]; deadlines: Row[] }
const S = (v: unknown) => (v == null ? '' : String(v));
const list = (v: unknown): string[] => { try { const a = JSON.parse(S(v)); return Array.isArray(a) ? a.map(String) : []; } catch { return []; } };
const md = (s: string) => s.replace(/```[\s\S]*?```/g, ' ').replace(/[#*_`>]+/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ').trim();
const KIND_PREP: Record<string, string> = { video: 'Video', reading: 'Reading', course: 'Course', exercise: 'Exercise', project: 'Project', concept: 'Concept' };

async function buildRecords(d: IndexData): Promise<Rec[]> {
  const out: Rec[] = [];
  const folder = new Map(d.folders.map((f) => [Number(f.id), f]));
  const folderPath = (id: unknown) => { const names: string[] = []; for (let f = id != null ? folder.get(Number(id)) : undefined; f && names.length < 8; f = f.parent_id != null ? folder.get(Number(f.parent_id)) : undefined) names.unshift(S(f.name)); return names; };
  for (const x of d.docs) out.push({ key: `doc-${x.id}`, area: 'docs', title: S(x.title) || 'Untitled document', crumbs: ['Tasks', ...folderPath(x.folder_id)], fields: [{ name: 'title', text: S(x.title), weight: 3 }, { name: 'text', text: S(x.text), weight: 1 }], go: { path: `/docs/${x.id}` } });
  for (const x of d.papers) out.push({ key: `paper-${x.id}`, area: 'papers', title: S(x.title), crumbs: ['Reading list', [S(x.venue), S(x.year)].filter(Boolean).join(' ')].filter(Boolean),
    fields: [{ name: 'title', text: S(x.title), weight: 3 }, { name: 'authors', text: S(x.authors), weight: 1.4 }, { name: 'venue', text: `${S(x.venue)} ${S(x.year)}`, weight: 1 }, { name: 'notes', text: S(x.notes), weight: 1.2 }], go: { path: '/reading', at: `paper-${x.id}` } });
  const track = new Map(d.tracks.map((t) => [S(t.id), S(t.title).replace(/\s*\(.*\)\s*$/, '')]));
  const mod = new Map(d.modules.map((m) => [S(m.id), m]));
  for (const t of d.tracks) out.push({ key: `track-${t.id}`, area: 'prep', title: S(t.title), crumbs: ['Interview prep', 'Tracks'], fields: [{ name: 'title', text: S(t.title), weight: 3 }, { name: 'summary', text: `${S(t.summary)} ${S(t.goal)}`, weight: 1 }], go: { path: `/prep/${t.id}` } });
  for (const m of d.modules) out.push({ key: `mod-${m.id}`, area: 'prep', title: S(m.title), crumbs: ['Interview prep', track.get(S(m.track_id)) ?? ''], fields: [{ name: 'title', text: S(m.title), weight: 2.6 }], go: { path: `/prep/${m.track_id}`, at: `mod-${m.id}` } });
  for (const i of d.items) {
    const m = mod.get(S(i.module_id));
    out.push({ key: `item-${i.id}`, area: 'prep', title: S(i.title), crumbs: ['Interview prep', track.get(S(m?.track_id)) ?? '', S(m?.title), KIND_PREP[S(i.kind)] ?? ''].filter(Boolean),
      fields: [{ name: 'title', text: S(i.title), weight: 3 }, { name: 'note', text: S(i.note), weight: 1 }, { name: 'my_notes', text: S(i.my_notes), weight: 1.3 }], go: { path: `/prep/${m?.track_id ?? ''}`, at: `item-${i.id}` } });
  }
  for (const c of d.cards) out.push({ key: `card-${c.id}`, area: 'cards', title: md(S(c.front)), crumbs: ['Interview prep', 'Flashcards', track.get(S(c.track)) ?? ''], fields: [{ name: 'front', text: md(S(c.front)), weight: 2.6 }, { name: 'back', text: md(S(c.back)), weight: 1 }], go: { path: '/prep/cards', at: `card-${c.id}` } });
  for (const q of d.quiz) out.push({ key: `quiz-${q.id}`, area: 'quiz', title: md(S(q.q)), crumbs: ['Interview prep', 'Quiz', track.get(S(q.track)) ?? ''], fields: [{ name: 'question', text: md(S(q.q)), weight: 2.6 }, { name: 'options', text: list(q.options).join(' · '), weight: 1 }, { name: 'explain', text: md(S(q.explain)), weight: 1 }], go: { path: '/prep/quiz', at: `quiz-${q.id}` } });
  for (const q of d.questions) out.push({ key: `question-${q.id}`, area: 'questions', title: md(S(q.question)), crumbs: ['Questions', S(q.category)],
    fields: [{ name: 'question', text: md(S(q.question)), weight: 3 }, { name: 'topics', text: [...list(q.topics), ...list(q.concepts)].join(' · '), weight: 1.5 }, { name: 'answer', text: md(S(q.answer_md)), weight: 1 }, { name: 'my_answer', text: S(q.my_answer), weight: 1.2 }], go: { path: `/questions/${q.id}`, at: 'question-view' } });
  for (const x of d.deadlines) out.push({ key: `deadline-${x.id}`, area: 'today', title: S(x.title), crumbs: ['Today', 'Deadlines', S(x.due_on)], fields: [{ name: 'title', text: S(x.title), weight: 3 }, { name: 'note', text: S(x.note), weight: 1 }], go: { path: '/today', at: `deadline-${x.id}` } });
  // Coding problems come with the app; only their notes are in the database.
  const notes = new Map(d.coding.map((c) => [S(c.slug), S(c.notes)]));
  const [{ default: dsa }, { default: hdl }] = await Promise.all([import('../coding/problems.json'), import('../coding/hdl.json')]);
  for (const p of dsa as { slug: string; title: string; topic: string; difficulty: string }[])
    out.push({ key: `code-${p.slug}`, area: 'coding', title: p.title, crumbs: ['Coding', 'DSA', p.topic], fields: [{ name: 'title', text: p.title, weight: 3 }, { name: 'topic', text: `${p.topic} ${p.difficulty}`, weight: 1 }, { name: 'notes', text: notes.get(p.slug) ?? '', weight: 1.2 }], go: { path: '/coding', at: `code-${p.slug}`, kind: 'dsa' } });
  const H = hdl as unknown as { topics: { id: string; title: string }[]; problems: { slug: string; title: string; topic: string; tip?: string; statement?: string }[] };
  const ht = new Map(H.topics.map((t) => [t.id, t.title]));
  for (const p of H.problems)
    out.push({ key: `code-${p.slug}`, area: 'coding', title: p.title, crumbs: ['Coding', 'HDL', ht.get(p.topic) ?? p.topic], fields: [{ name: 'title', text: p.title, weight: 3 }, { name: 'about', text: `${p.tip ?? ''} ${p.statement ?? ''}`, weight: 1 }, { name: 'notes', text: notes.get(p.slug) ?? '', weight: 1.2 }], go: { path: '/coding', at: `code-${p.slug}`, kind: 'hdl' } });
  return out;
}

// One index for the session; refreshed in the background when the panel opens and it's > 1 min old.
let cache: { index: Index; at: number } | null = null;
let loading: Promise<Index> | null = null;
function loadIndex(force = false): Promise<Index> {
  if (cache && !force && Date.now() - cache.at < 60000) return Promise.resolve(cache.index);
  if (!loading) loading = api<IndexData>('search-index').then(buildRecords).then((recs) => { const index = new Index(recs); cache = { index, at: Date.now() }; return index; }).finally(() => { loading = null; });
  return loading;
}

function Marked({ text, words }: { text: string; words: string[] }): ReactNode {
  const re = wordsRe(words);
  if (!re || !text) return text;
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push(text.slice(last, m.index));
    out.push(<mark key={m.index}>{m[0]}</mark>);
    last = m.index! + m[0].length;
  }
  out.push(text.slice(last));
  return out;
}

const PER_GROUP = 4;
export function SearchPanel({ open, onClose, query, setQuery }: { open: boolean; onClose: () => void; query: string; setQuery: (q: string) => void }) {
  const nav = useNavigate();
  const [index, setIndex] = useState<Index | null>(cache?.index ?? null);
  const [err, setErr] = useState('');
  const [debounced, setDebounced] = useState(query);
  const [expanded, setExpanded] = useState<Set<Area>>(new Set());
  const [sel, setSel] = useState(0);
  const [visited, setVisited] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    input.current?.focus(); input.current?.select();
    loadIndex(!!cache && Date.now() - cache.at > 60000).then((i) => { setIndex(i); setErr(''); }, (e: Error) => setErr(e.message));
  }, [open]);
  useEffect(() => { const t = setTimeout(() => setDebounced(query), 70); return () => clearTimeout(t); }, [query]);
  useEffect(() => { setExpanded(new Set()); setSel(0); }, [debounced]);
  const result = useMemo(() => (index && debounced.trim() ? index.search(debounced) : null), [index, debounced]);
  const groups = useMemo(() => {
    if (!result) return [];
    const by = new Map<Area, Hit[]>();
    for (const h of result.hits) by.set(h.rec.area, [...(by.get(h.rec.area) ?? []), h]);
    return [...by].map(([area, hits]) => ({ area, hits, top: hits[0].score })).sort((a, b) => b.top - a.top);
  }, [result]);
  const shown = groups.flatMap((g) => (expanded.has(g.area) ? g.hits : g.hits.slice(0, PER_GROUP)));
  const go = useCallback((h: Hit) => {
    setVisited(h.rec.key);
    setJump({ ...h.rec.go, find: debounced, words: h.words, field: h.field, open: h.field === 'my_notes' || h.field === 'answer' || h.field === 'my_answer' });
    nav(h.rec.go.path);
  }, [debounced, nav]);
  useEffect(() => { listRef.current?.querySelector('.sr-hit.sel')?.scrollIntoView({ block: 'nearest' }); }, [sel]);
  if (!open) return null;
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(shown.length - 1, s + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === 'Enter' && shown[sel]) { e.preventDefault(); go(shown[sel]); }
  };
  return (
    <aside className="ws-search" role="search" aria-label="Search the workspace" onKeyDown={onKey}>
      <div className="sr-top">
        <span className="sr-ico" aria-hidden="true">⌕</span>
        <input ref={input} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documents, papers, prep, cards, quiz, questions, coding…" aria-label="Search" aria-controls="sr-results" />
        {query && <button className="sr-x" onClick={() => { setQuery(''); input.current?.focus(); }} aria-label="Clear" title="Clear">✕</button>}
        <button className="sr-close" onClick={onClose} title="Close (Esc)" aria-label="Close search">Esc</button>
      </div>
      <div className="sr-body" id="sr-results" ref={listRef}>
        {err && <p className="ws-error">{err}</p>}
        {!index && !err && <p className="sr-note">Building the search index…</p>}
        {index && !debounced.trim() && (
          <div className="sr-note">
            <p>Type a word or two. Spelling mistakes, word endings and words written together or apart are fine.</p>
            <p>↑ ↓ choose · Enter opens · the panel stays open, so you can try the next result · Esc closes.</p>
            <p className="ws-muted">{index.size.toLocaleString()} items searchable.</p>
          </div>
        )}
        {result && (
          <>
            <p className="sr-count">
              {result.hits.length ? `${result.hits.length}${result.hits.length >= 400 ? '+' : ''} result${result.hits.length === 1 ? '' : 's'}` : 'Nothing found'}
              {result.partial && result.hits.length > 0 && <span className="sr-partial"> · nothing has every word; these are the closest</span>}
            </p>
            {groups.map((g) => {
              const hits = expanded.has(g.area) ? g.hits : g.hits.slice(0, PER_GROUP);
              return (
                <section key={g.area} className="sr-group">
                  <h3>{AREA_LABEL[g.area]} <small>{g.hits.length}</small></h3>
                  {hits.map((h) => {
                    const i = shown.indexOf(h);
                    return (
                      <button key={h.rec.key} className={`sr-hit${i === sel ? ' sel' : ''}${visited === h.rec.key ? ' visited' : ''}`} onClick={() => { setSel(i); go(h); }} onMouseMove={() => i !== sel && setSel(i)}>
                        <span className="sr-crumbs">{h.rec.crumbs.filter(Boolean).join(' › ')}</span>
                        <strong className="sr-title"><Marked text={h.rec.title.length > 140 ? h.rec.title.slice(0, 137) + '…' : h.rec.title} words={h.words} /></strong>
                        {h.snippet && <span className="sr-snip"><Marked text={h.snippet} words={h.words} /></span>}
                      </button>
                    );
                  })}
                  {g.hits.length > PER_GROUP && (
                    <button className="ws-link sr-more" onClick={() => setExpanded((s) => { const n = new Set(s); if (n.has(g.area)) n.delete(g.area); else n.add(g.area); return n; })}>
                      {expanded.has(g.area) ? 'Show fewer' : `Show all ${g.hits.length} in ${AREA_LABEL[g.area]}`}
                    </button>
                  )}
                </section>
              );
            })}
            {!result.hits.length && <p className="sr-note">No item contains “{debounced.trim()}”, even allowing for typos. Try a shorter or different word.</p>}
          </>
        )}
      </div>
    </aside>
  );
}
