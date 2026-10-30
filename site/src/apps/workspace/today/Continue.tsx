// Today → Continue: what is in progress, then the earliest open item from the top of each list (interview
// prep in curriculum order within the current focus, the reading list in reading order, the coding lists,
// interview questions). A click opens the item in its page (scrolled to and flashed); ↗ opens its link.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, readStore, useLoad, useStored } from '../api';
import { itemsByTrack, KIND, type Item, type PrepData } from '../prep/shared';
import { useFocus } from '../prep/focus';
import { setJump } from '../search/jump';

interface Paper { id: number; title: string; url: string; status: string; hidden: number; position: number; version: number }
interface Problem { slug: string; title: string; url: string; topic: string; difficulty: string }
interface Question { id: string; question: string; status: string; category: string }

export function Continue({ prep }: { prep: ReturnType<typeof useLoad<PrepData>> }) {
  const nav = useNavigate();
  const focus = useFocus(prep.data);
  const papers = useLoad<Paper[]>('papers', []);
  const coding = useLoad<{ slug: string; status: string }[]>('coding', []);
  const questions = useLoad<Question[]>('questions', []);
  const [perTrack, setPerTrack] = useStored('ws.today.nextPerTrack', true);
  const [problems, setProblems] = useState<{ dsa: Problem[]; hdl: Problem[] }>({ dsa: [], hdl: [] });
  // The coding lists come with the app (same order as the Coding page's tables).
  useEffect(() => {
    void Promise.all([import('../coding/problems.json'), import('../coding/hdl.json'), import('../coding/roadmap')]).then(([d, h, r]) => {
      const list = readStore<string>('ws.coding.list', 'nc150') as 'nc150' | 'blind75' | 'all';
      const topicOrder = (t: string) => (r.TOPICS as readonly string[]).indexOf(t);
      const dsa = (d.default as unknown as (Problem & { nc150: boolean; blind75: boolean })[]).filter((p) => list === 'all' || p[list])
        .map((p) => ({ ...p, url: `https://leetcode.com/problems/${p.slug}/` })).sort((a, b) => topicOrder(a.topic) - topicOrder(b.topic));
      const H = h.default as unknown as { topics: { id: string }[]; problems: Problem[] };
      const ht = new Map(H.topics.map((t, i) => [t.id, i]));
      setProblems({ dsa, hdl: [...H.problems].sort((a, b) => (ht.get(a.topic) ?? 0) - (ht.get(b.topic) ?? 0)) });
    });
  }, []);

  const data = focus.filtered;
  const { byTrack } = useMemo(() => itemsByTrack(data), [data]);
  const trackName = (id: string) => (data.tracks.find((t) => t.id === id)?.title ?? id).replace(/\s*\(.*\)\s*$/, '');
  const visible = data.tracks.filter((t) => !t.hidden && (byTrack.get(t.id) ?? []).length);
  const doing = data.items.filter((i) => i.status === 'doing' && !i.hide_continue).sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? '')).slice(0, 3);
  const trackOf = (i: Item) => visible.find((t) => (byTrack.get(t.id) ?? []).includes(i))?.id ?? '';
  // The earliest open item from the top: one per track (or just the very first one).
  const nextItems = visible.map((t) => (byTrack.get(t.id) ?? []).find((i) => i.status === 'todo' && !i.optional)).filter(Boolean) as Item[];
  const next = perTrack ? nextItems.filter((i) => !doing.includes(i)).slice(0, 6) : nextItems.slice(0, 1);
  const reading = papers.data.filter((p) => !p.hidden && p.status === 'reading').sort((a, b) => a.position - b.position);
  const nextPaper = papers.data.filter((p) => !p.hidden && p.status === 'to_read').sort((a, b) => a.position - b.position)[0];
  const solved = new Set(coding.data.filter((c) => c.status === 'solved').map((c) => c.slug));
  const nextDsa = problems.dsa.find((p) => !solved.has(p.slug)), nextHdl = problems.hdl.find((p) => !solved.has(p.slug));
  const nextQ = questions.data.find((q) => q.status === 'new' && focus.matches((q as unknown as { track: string }).track, (q as unknown as { module: string }).module));

  const setItem = async (i: Item, status: Item['status']) => {
    prep.setData((d) => ({ ...d, items: d.items.map((x) => (x.id === i.id ? { ...x, status } : x)) }));
    try { await api(`prep/items/${i.id}`, 'PATCH', { status }); } catch (e) { prep.setError((e as Error).message); void prep.reload(); }
  };
  const setPaper = async (p: Paper, status: string) => {
    papers.setData((d) => d.map((x) => (x.id === p.id ? { ...x, status } : x)));
    try { const row = await api<Paper>(`papers/${p.id}`, 'PATCH', { status, version: p.version }); papers.setData((d) => d.map((x) => (x.id === row.id ? row : x))); }
    catch (e) { papers.setError((e as Error).message); void papers.reload(); }
  };
  const go = (path: string, at: string, find: string) => { setJump({ path, at, find, words: [] }); nav(path); };

  const itemRow = (i: Item, label?: string) => (
    <li key={i.id}>
      <input type="checkbox" checked={i.status === 'done'} onChange={(e) => void setItem(i, e.target.checked ? 'done' : 'doing')} aria-label={`Done: ${i.title}`} />
      <span className="td-kind" title={KIND[i.kind].label}>{KIND[i.kind].icon}</span>
      <button className="td-go" onClick={() => go(`/prep/${trackOf(i)}`, `item-${i.id}`, i.title)} title="Show it in Interview prep">{i.title}{label && <small>{label}</small>}</button>
      {i.url && <a className="td-ext" href={i.url} target="_blank" rel="noreferrer" aria-label={`Open ${i.title}`} onClick={() => { if (i.status === 'todo') void setItem(i, 'doing'); }}>↗</a>}
    </li>
  );
  const paperRow = (p: Paper, label: string) => (
    <li key={p.id}>
      <input type="checkbox" checked={p.status === 'read'} onChange={(e) => void setPaper(p, e.target.checked ? 'read' : 'reading')} aria-label={`Read: ${p.title}`} />
      <span className="td-kind" aria-hidden="true">📄</span>
      <button className="td-go" onClick={() => go('/reading', `paper-${p.id}`, p.title)} title="Show it in the reading list">{p.title}<small>{label}</small></button>
      {p.url && <a className="td-ext" href={p.url} target="_blank" rel="noreferrer" aria-label={`Open ${p.title}`} onClick={() => { if (p.status === 'to_read') void setPaper(p, 'reading'); }}>↗</a>}
    </li>
  );
  const codeRow = (p: Problem | undefined, kind: 'dsa' | 'hdl') => p && (
    <li key={kind}>
      <span className="td-kind" aria-hidden="true">⌨</span>
      <button className="td-go" onClick={() => { setJump({ path: '/coding', at: `code-${p.slug}`, find: p.title, words: [], kind }); nav('/coding'); }} title="Show it in Coding">{p.title}<small>{kind === 'dsa' ? 'DSA' : 'HDL'} · {p.difficulty}</small></button>
      <a className="td-ext" href={p.url} target="_blank" rel="noreferrer" aria-label={`Open ${p.title}`}>↗</a>
    </li>
  );

  return (
    <div className="ws-card td-tile td-continue">
      <div className="td-cont-head">
        <span className="ws-label">Continue · next from the top{focus.current ? ` · ${focus.current.name}` : ''}</span>
        <label className="ws-check td-per-track"><input type="checkbox" checked={perTrack} onChange={(e) => setPerTrack(e.target.checked)} /> one per track</label>
      </div>
      <h4>Interview prep</h4>
      <ul className="td-items">
        {doing.map((i) => itemRow(i, `in progress · ${trackName(trackOf(i))}`))}
        {next.map((i) => itemRow(i, `next · ${trackName(trackOf(i))}`))}
        {!doing.length && !next.length && <li className="ws-muted">Everything in this focus is done.</li>}
      </ul>
      {(reading.length > 0 || nextPaper) && (
        <>
          <h4>Reading list</h4>
          <ul className="td-items">
            {reading.map((p) => paperRow(p, 'reading now'))}
            {nextPaper && paperRow(nextPaper, 'next to read')}
          </ul>
        </>
      )}
      {(nextDsa || nextHdl) && <><h4>Coding</h4><ul className="td-items">{codeRow(nextDsa, 'dsa')}{codeRow(nextHdl, 'hdl')}</ul></>}
      {nextQ && (
        <>
          <h4>Interview questions</h4>
          <ul className="td-items">
            <li><span className="td-kind" aria-hidden="true">?</span><button className="td-go" onClick={() => { setJump({ path: `/questions/${nextQ.id}`, at: 'question-view', find: nextQ.question.slice(0, 60), words: [] }); nav(`/questions/${nextQ.id}`); }}>{nextQ.question}<small>not practised yet · {nextQ.category}</small></button></li>
          </ul>
        </>
      )}
    </div>
  );
}
