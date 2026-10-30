// Reading list: all papers in planned order, or one project's papers in that project's order.
// Filters sit above their columns; columns resize by dragging (widths remembered); papers can be hidden.
import { useEffect, useMemo, useRef, useState } from 'react';
import { api, Bar, useLoad, useStored } from '../api';
import { Btn, useSafeDelete, useToast, undoLatest } from '../ui';
import { targetId, useJumpTarget } from '../search/jump';

interface Paper {
  id: number; position: number; title: string; authors: string; venue: string; year: number | null; url: string;
  status: Status; domains: string; notes: string; extra: string; source: string; read_at: string | null; version: number;
  pages: number | null; citations: number | null; citations_at: string | null; impact: string; hidden: number;
}
interface Project { id: number; name: string; position: number; items: { paper_id: number; position: number; note: string }[] }
type Status = 'to_read' | 'reading' | 'read' | 'skipped';
const STATUS: Record<Status, string> = { to_read: 'To read', reading: 'Reading', read: 'Read', skipped: 'Skipped' };
const BASE_DOMAINS = ['hardware', 'compiler', 'pim', 'llm', 'accelerator', 'memory', 'modeling', 'reliability', 'quantization', 'analog', 'logic', 'survey'];
const TONES = ['var(--cyan)', 'var(--copper)', 'var(--violet)', 'var(--green)', 'var(--amber)', 'var(--rose)', 'var(--gold)'];
const tone = (d: string) => TONES[[...d].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7) % TONES.length];
const doms = (p: Paper): string[] => { try { return JSON.parse(p.domains); } catch { return []; } };
const extra = (p: Paper): Record<string, string> => { try { return JSON.parse(p.extra || '{}'); } catch { return {}; } };

// Long venue names, shortened for the table (the full name stays in the tooltip and the editor).
const VENUES: [RegExp, string][] = [
  [/high[- ]performance computer architecture/i, 'HPCA'], [/international symposium on computer architecture/i, 'ISCA'], [/microarchitecture/i, 'MICRO'],
  [/architectural support for programming languages/i, 'ASPLOS'], [/design automation conference/i, 'DAC'], [/design,? automation (and|&) test in europe/i, 'DATE'],
  [/computer[- ]aided design of integrated circuits/i, 'IEEE TCAD'], [/international conference on computer[- ]aided design/i, 'ICCAD'], [/solid[- ]state circuits conference/i, 'ISSCC'],
  [/journal of solid[- ]state circuits/i, 'JSSC'], [/transactions on computers/i, 'IEEE TC'], [/design automation of electronic systems/i, 'TODAES'],
  [/architecture and code optimization/i, 'TACO'], [/code generation and optimization/i, 'CGO'], [/parallel architectures and compilation/i, 'PACT'],
  [/computer architecture letters/i, 'IEEE CAL'], [/future generation computer systems/i, 'FGCS'], [/field programmable gate arrays/i, 'FPGA'],
  [/emerging topics in computing/i, 'IEEE TETC'], [/exploratory solid[- ]state computational/i, 'IEEE JxCDC'], [/emerging and selected topics in circuits/i, 'IEEE JETCAS'],
  [/electron devices meeting/i, 'IEDM'], [/european conference on solid[- ]state circuits/i, 'ESSCIRC'], [/nature computational science/i, 'Nat. Comput. Sci.'],
  [/transactions on information theory/i, 'IEEE TIT'], [/asiacrypt/i, 'ASIACRYPT'],
];
const shortVenue = (v: string) => (v.length > 18 ? VENUES.find(([re]) => re.test(v))?.[1] ?? v : v);

type Col = 'pos' | 'act' | 'title' | 'venue' | 'year' | 'pages' | 'cites' | 'impact' | 'dom' | 'status' | 'pnote' | 'notes';
const WIDTH: Record<Col, number> = { pos: 52, act: 44, title: 320, venue: 92, year: 62, pages: 64, cites: 70, impact: 70, dom: 150, status: 112, pnote: 104, notes: 200 };
const LABEL: Record<Col, string> = { pos: '#', act: '', title: 'Paper', venue: 'Venue', year: 'Year', pages: 'Pages', cites: 'Cites', impact: 'Impact', dom: 'Domains', status: 'Status', pnote: 'Project note', notes: 'Notes' };
type SortKey = 'order' | 'title' | 'venue' | 'year' | 'pages' | 'cites' | 'impact' | 'status';
const SORTABLE: Partial<Record<Col, SortKey>> = { pos: 'order', title: 'title', venue: 'venue', year: 'year', pages: 'pages', cites: 'cites', impact: 'impact', status: 'status' };
interface Filters { title: string; venue: string; year: string; pages: string; cites: string; impact: string; dom: string; status: string; pnote: string; notes: string }
const NO_FILTERS: Filters = { title: '', venue: '', year: '', pages: '', cites: '', impact: '', dom: '', status: '', pnote: '', notes: '' };

export default function ReadingList() {
  const { data, setData, error, setError, loading, reload } = useLoad<Paper[]>('papers', []);
  const projects = useLoad<Project[]>('projects', []);
  const [view, setView] = useStored<number | 'all'>('ws.reading.view', 'all');
  const project = view === 'all' ? null : projects.data.find((p) => p.id === view) ?? null;
  const [f, setF] = useStored<Filters>('ws.reading.filters', NO_FILTERS);
  const [want, setWant] = useStored<string[]>('ws.reading.domains', []);
  const [showHidden, setShowHidden] = useStored('ws.reading.showHidden', false);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'order', dir: 1 });
  const [widths, setWidths] = useStored<Partial<Record<Col, number>>>('ws.reading.widths', {}, { local: true });
  const safeDelete = useSafeDelete();
  const toast = useToast();
  const reloadAll = async () => { await Promise.all([reload(), projects.reload()]); };
  const [edit, setEdit] = useState<Paper | 'new' | null>(null);
  // Row dragging: press anywhere on a row (not on a control) and move; a line shows where it will land.
  const [drag, setDrag] = useState<{ id: number; at: number; x: number; y: number } | null>(null);
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  const [menuFor, setMenuFor] = useState<number | null>(null);
  const [naming, setNaming] = useState<'new' | 'rename' | null>(null);
  const [addQ, setAddQ] = useState('');

  const cols: Col[] = ['pos', 'title', 'venue', 'year', 'pages', 'cites', 'impact', 'dom', 'status', ...(project ? ['pnote' as Col] : []), 'notes', 'act'];
  const w = (c: Col) => widths[c] ?? WIDTH[c];
  const byId = useMemo(() => new Map(data.map((p) => [p.id, p])), [data]);
  const inProject = useMemo(() => new Map(project?.items.map((i) => [i.paper_id, i]) ?? []), [project]);
  const allDomains = useMemo(() => [...new Set([...BASE_DOMAINS, ...data.flatMap(doms)])], [data]);
  const venues = useMemo(() => [...new Set(data.map((p) => shortVenue(p.venue)).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [data]);
  const years = useMemo(() => [...new Set(data.map((p) => p.year).filter(Boolean))].sort((a, b) => b! - a!) as number[], [data]);
  const impacts = useMemo(() => [...new Set(data.map((p) => p.impact).filter(Boolean))].sort(), [data]);
  const hiddenCount = data.filter((p) => p.hidden).length;

  // the rows of this view, in this view's order
  const base = useMemo(() => {
    if (!project) return [...data].sort((a, b) => a.position - b.position);
    return [...project.items].sort((a, b) => a.position - b.position).map((i) => byId.get(i.paper_id)).filter(Boolean) as Paper[];
  }, [data, project, byId]);
  const order = useMemo(() => new Map(base.map((p, i) => [p.id, i + 1])), [base]);

  const rows = useMemo(() => {
    const has = (hay: string, needle: string) => !needle || hay.toLowerCase().includes(needle.toLowerCase());
    const r = base.filter((p) => {
      const ds = doms(p);
      if (p.hidden && !showHidden) return false;
      if (want.length && !want.some((d) => ds.includes(d))) return false;
      if (!has(`${p.title} ${p.authors}`, f.title) || !has(p.notes, f.notes)) return false;
      if (f.venue && shortVenue(p.venue) !== f.venue) return false;
      if (f.year && String(p.year ?? '') !== f.year) return false;
      if (f.pages && !(p.pages != null && p.pages <= Number(f.pages))) return false;
      if (f.cites && !(p.citations != null && p.citations >= Number(f.cites))) return false;
      if (f.impact && p.impact !== f.impact) return false;
      if (f.dom && !ds.includes(f.dom)) return false;
      if (f.status && p.status !== f.status) return false;
      if (f.pnote && !has(inProject.get(p.id)?.note ?? '', f.pnote)) return false;
      return true;
    });
    if (sort.key === 'order') return sort.dir === 1 ? r : [...r].reverse();
    const val = (p: Paper): string | number => ({ title: p.title.toLowerCase(), venue: shortVenue(p.venue).toLowerCase(), year: p.year ?? -1, pages: p.pages ?? -1, cites: p.citations ?? -1, impact: p.impact, status: p.status, order: 0 })[sort.key];
    return [...r].sort((a, b) => { const x = val(a), y = val(b); return (x < y ? -1 : x > y ? 1 : 0) * sort.dir; });
  }, [base, f, want, showHidden, sort, inProject]);
  const filtering = JSON.stringify(f) !== JSON.stringify(NO_FILTERS) || want.length > 0;
  // Opened from search: make sure that paper's row is on screen (all papers, no filters, hidden shown if it is hidden).
  const jump = useJumpTarget('paper');
  useEffect(() => {
    const id = Number(targetId(jump));
    if (!id || loading || rows.some((p) => p.id === id)) return;
    const p = data.find((x) => x.id === id);
    if (!p) return;
    if (project && !inProject.has(id)) setView('all');
    if (filtering) { setF(NO_FILTERS); setWant([]); }
    if (p.hidden && !showHidden) setShowHidden(true);
    if (sort.key !== 'order') setSort({ key: 'order', dir: 1 });
  }, [jump, loading, rows]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- writes ----
  const fail = (e: unknown) => setError((e as Error).message);
  const save = async (p: Paper, patch: Partial<Paper> & { domains?: unknown }) => {
    setData((d) => d.map((x) => (x.id === p.id ? { ...x, ...patch, domains: 'domains' in patch ? JSON.stringify(patch.domains) : x.domains } as Paper : x)));
    try {
      const row = await api<Paper>(`papers/${p.id}`, 'PATCH', { ...patch, version: p.version });
      setData((d) => d.map((x) => (x.id === row.id ? row : x)));
      return row;
    } catch (e) { fail(e); setData((d) => d.map((x) => (x.id === p.id ? p : x))); throw e; }
  };
  const deletePaper = (p: Paper) => safeDelete({
    title: `Delete “${p.title}”?`,
    body: <p>It leaves the reading list and every project. To keep it out of sight instead, use <b>Hide</b>.</p>,
    confirm: 'Delete paper',
    run: async () => { try { await api(`papers/${p.id}`, 'DELETE'); setData((d) => d.filter((x) => x.id !== p.id)); void projects.reload(); } catch (e) { fail(e); throw e; } },
    done: `Deleted “${p.title.length > 50 ? p.title.slice(0, 47) + '…' : p.title}”.`, reload: reloadAll,
  }).catch(() => false);
  const proj = async (path: string, method: string, body?: unknown) => {
    try { projects.setData(await api<Project[]>(`projects${path}`, method, body)); } catch (e) { fail(e); }
  };
  // Put paper `id` before the visible row at index `at` (rows.length = after the last visible row).
  // With filters on, it lands next to the same neighbours in the full order.
  const moveTo = async (id: number, at: number) => {
    const from = rows.findIndex((p) => p.id === id);
    if (from < 0 || at === from || at === from + 1) return;
    const vis = rows.filter((p) => p.id !== id);
    const k = at > from ? at - 1 : at;
    const ids = base.map((p) => p.id).filter((x) => x !== id);
    if (k < vis.length) ids.splice(ids.indexOf(vis[k].id), 0, id);
    else if (vis.length) ids.splice(ids.indexOf(vis[vis.length - 1].id) + 1, 0, id);
    else return;
    if (project) {
      projects.setData((ps) => ps.map((p) => (p.id === project.id ? { ...p, items: ids.map((x, i) => ({ ...inProject.get(x)!, position: i + 1 })) } : p)));
      await proj(`/${project.id}/reorder`, 'POST', { ids });
    } else {
      setData((d) => d.map((p) => ({ ...p, position: ids.indexOf(p.id) + 1 })));
      try { await api('papers/reorder', 'POST', { ids }); } catch (er) { fail(er); void reload(); }
    }
  };
  // Where a drop at clientY lands: before the first row whose middle is below the pointer.
  const slotAt = (y: number) => {
    const trs = [...(bodyRef.current?.querySelectorAll<HTMLTableRowElement>('tr[data-id]') ?? [])];
    const i = trs.findIndex((tr) => { const r = tr.getBoundingClientRect(); return y < r.top + r.height / 2; });
    return i < 0 ? trs.length : i;
  };
  const startDrag = (p: Paper, e: React.PointerEvent) => {
    if (!canDrag || e.button !== 0) return;
    const el = e.target as HTMLElement;
    const onGrip = !!el.closest('.rl-grip');
    if (!onGrip && (el.closest('button, a, input, select, textarea, label, .rl-resize') || e.pointerType === 'touch')) return;
    const x0 = e.clientX, y0 = e.clientY;
    let live = false, at = -1, lastY = y0, raf = 0;
    const scroll = () => {
      // Near the top (under the sticky bars) or bottom of the window, the page scrolls along.
      const edge = 70, top = (document.querySelector('.ws-subnav')?.getBoundingClientRect().bottom ?? 0) + edge;
      const v = lastY < top ? -(top - lastY) / 4 : lastY > innerHeight - edge ? (lastY - innerHeight + edge) / 4 : 0;
      if (v) { scrollBy(0, v); at = slotAt(lastY); setDrag((d) => d && { ...d, at }); }
      raf = requestAnimationFrame(scroll);
    };
    const move = (ev: PointerEvent) => {
      lastY = ev.clientY;
      if (!live) {
        if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < 5) return;
        live = true;
        getSelection()?.removeAllRanges();
        document.body.classList.add('rl-dragging');
        raf = requestAnimationFrame(scroll);
      }
      ev.preventDefault();
      at = slotAt(ev.clientY);
      setDrag({ id: p.id, at, x: ev.clientX, y: ev.clientY });
    };
    const end = (ok: boolean) => {
      removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', cancel); removeEventListener('keydown', key);
      cancelAnimationFrame(raf);
      document.body.classList.remove('rl-dragging');
      setDrag(null);
      if (live && ok && at >= 0) void moveTo(p.id, at);
    };
    const up = () => end(true), cancel = () => end(false);
    const key = (ev: KeyboardEvent) => { if (ev.key === 'Escape') end(false); };
    addEventListener('pointermove', move, { passive: false }); addEventListener('pointerup', up); addEventListener('pointercancel', cancel); addEventListener('keydown', key);
  };
  useEffect(() => () => document.body.classList.remove('rl-dragging'), []);
  const dragFrom = drag ? rows.findIndex((p) => p.id === drag.id) : -1;
  const noop = !drag || drag.at === dragFrom || drag.at === dragFrom + 1;

  // ---- column resize ----
  const resizing = useRef<{ col: Col; x: number; w: number } | null>(null);
  const startResize = (col: Col, e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    resizing.current = { col, x: e.clientX, w: w(col) };
    const move = (ev: PointerEvent) => { const r = resizing.current; if (r) setWidths((ws) => ({ ...ws, [r.col]: Math.max(44, Math.round(r.w + ev.clientX - r.x)) })); };
    const up = () => { resizing.current = null; window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };

  const sortBy = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : 1 }));
  const canDrag = sort.key === 'order' && sort.dir === 1;
  const setFilter = (k: keyof Filters, v: string) => setF({ ...f, [k]: v });
  const by = (s: Status) => base.filter((p) => p.status === s && !p.hidden).length;
  const visibleTotal = base.filter((p) => !p.hidden && p.status !== 'skipped').length;
  const nextUp = base.find((p) => p.status === 'to_read' && !p.hidden);
  const addable = project ? data.filter((p) => !inProject.has(p.id) && (!addQ || p.title.toLowerCase().includes(addQ.toLowerCase()))).slice(0, 8) : [];

  return (
    <section className="ws-section rl">
      <header className="ws-head">
        <div>
          <p className="ws-eyebrow">READING LIST{project ? ` · ${project.name.toUpperCase()}` : ''}</p>
          <h1>{project ? project.name : 'Papers, in reading order.'}</h1>
          <p className="ws-sub">{nextUp ? <>Next up: <b>{nextUp.title}</b></> : 'Nothing left to read here.'}</p>
        </div>
        <button className="ws-primary" onClick={() => setEdit('new')}>+ Add paper</button>
      </header>
      {(error || projects.error) && <p className="ws-error" role="alert">{error || projects.error}</p>}

      <nav className="rl-projects" aria-label="Reading lists">
        <button className={`rl-proj${!project ? ' on' : ''}`} onClick={() => setView('all')}>All papers <small>{data.length}</small></button>
        {projects.data.map((p) => (
          <button key={p.id} className={`rl-proj${project?.id === p.id ? ' on' : ''}`} onClick={() => setView(p.id)} onDoubleClick={() => { setView(p.id); setNaming('rename'); }}
            title="Double-click to rename">{p.name} <small>{p.items.length}</small></button>
        ))}
        {naming ? (
          <form className="rl-name" onSubmit={async (e) => {
            e.preventDefault();
            const name = String(new FormData(e.currentTarget).get('name') ?? '').trim();
            if (!name) return setNaming(null);
            if (naming === 'rename' && project) await proj(`/${project.id}`, 'PATCH', { name });
            else {
              try { const list = await api<Project[]>('projects', 'POST', { name }); projects.setData(list); setView(Math.max(...list.map((x) => x.id))); } catch (er) { fail(er); }
            }
            setNaming(null);
          }}>
            <input name="name" autoFocus maxLength={100} defaultValue={naming === 'rename' ? project?.name : ''} placeholder="Project name, then Enter" onBlur={(e) => { if (!e.target.value.trim()) setNaming(null); }} onKeyDown={(e) => { if (e.key === 'Escape') setNaming(null); }} />
          </form>
        ) : <button className="rl-proj rl-proj-new" onClick={() => setNaming('new')}>+ New project</button>}
        {project && !naming && (
          <span className="rl-proj-tools">
            <Btn size="sm" icon="pencil" onClick={() => setNaming('rename')}>Rename</Btn>
            <Btn size="sm" icon="trash" tone="danger" onClick={() => void safeDelete({
              title: `Delete the project “${project.name}”?`,
              body: <p>Only the project list goes ({project.items.length} paper{project.items.length === 1 ? '' : 's'} in it). <b>The papers themselves stay in your reading list.</b></p>,
              confirm: 'Delete project',
              run: async () => { await proj(`/${project.id}`, 'DELETE'); setView('all'); },
              done: `Deleted the project “${project.name}”.`, reload: reloadAll,
            })}>Delete project</Btn>
          </span>
        )}
      </nav>

      <div className="rl-stats">
        <div className="ws-card"><span className="ws-label">Read</span><strong>{by('read')}<small> / {visibleTotal}</small></strong><Bar value={visibleTotal ? by('read') / visibleTotal : 0} /></div>
        <div className="ws-card"><span className="ws-label">Reading now</span><strong>{by('reading')}</strong></div>
        <div className="ws-card"><span className="ws-label">To read</span><strong>{by('to_read')}</strong></div>
        <div className="ws-card"><span className="ws-label">Hidden</span><strong>{base.filter((p) => p.hidden).length}</strong></div>
      </div>

      <div className="ws-toolbar">
        <div className="rl-domains" role="group" aria-label="Filter by domain">
          {allDomains.map((d) => (
            <button key={d} className={`ws-chip${want.includes(d) ? ' on' : ''}`} style={{ '--tone': tone(d) } as React.CSSProperties} aria-pressed={want.includes(d)}
              onClick={() => setWant(want.includes(d) ? want.filter((x) => x !== d) : [...want, d])}>{d}</button>
          ))}
        </div>
        <div className="ws-filters">
          <label className="ws-check"><input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} /> Show hidden ({hiddenCount})</label>
          <button className="ws-link" style={{ visibility: filtering ? 'visible' : 'hidden' }} onClick={() => { setF(NO_FILTERS); setWant([]); }}>Clear filters</button>
          <span className="ws-muted">{rows.length} shown</span>
        </div>
      </div>

      {project && (
        <div className="rl-add">
          <input type="search" placeholder="Add a paper to this project: type part of its title, Enter adds the first match" value={addQ} onChange={(e) => setAddQ(e.target.value)} aria-label="Find a paper to add"
            onKeyDown={async (e) => { if (e.key === 'Enter' && addQ && addable[0]) { e.preventDefault(); await proj(`/${project.id}/papers`, 'POST', { paper_id: addable[0].id }); setAddQ(''); } }} />
          {addQ && <ul className="rl-add-list">{addable.map((p) => <li key={p.id}><button onClick={async () => { await proj(`/${project.id}/papers`, 'POST', { paper_id: p.id }); setAddQ(''); }}>+ {p.title}</button></li>)}{!addable.length && <li className="ws-muted">No match.</li>}</ul>}
        </div>
      )}

      <div className="ws-table-wrap ws-card">
        <table className={`ws-table rl-table${drag ? ' is-dragging' : ''}`} style={{ width: cols.reduce((s, c) => s + w(c), 0) }}>
          <colgroup>{cols.map((c) => <col key={c} style={{ width: w(c) }} />)}</colgroup>
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c}>
                  {SORTABLE[c] ? <button onClick={() => sortBy(SORTABLE[c]!)}>{LABEL[c]}{sort.key === SORTABLE[c] ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}</button> : LABEL[c]}
                  {c !== 'act' && <span className="rl-resize" onPointerDown={(e) => startResize(c, e)} onDoubleClick={() => setWidths((ws) => { const n = { ...ws }; delete n[c]; return n; })} title="Drag to resize · double-click to reset" />}
                </th>
              ))}
            </tr>
            <tr className="rl-filter-row">
              {cols.map((c) => (
                <th key={c}>
                  {c === 'title' && <input type="search" placeholder="Title or author" value={f.title} onChange={(e) => setFilter('title', e.target.value)} aria-label="Filter by title or author" />}
                  {c === 'venue' && <select value={f.venue} onChange={(e) => setFilter('venue', e.target.value)} aria-label="Filter by venue"><option value="">All</option>{venues.map((v) => <option key={v}>{v}</option>)}</select>}
                  {c === 'year' && <select value={f.year} onChange={(e) => setFilter('year', e.target.value)} aria-label="Filter by year"><option value="">All</option>{years.map((y) => <option key={y}>{y}</option>)}</select>}
                  {c === 'pages' && <input inputMode="numeric" placeholder="≤" value={f.pages} onChange={(e) => setFilter('pages', e.target.value.replace(/\D/g, ''))} aria-label="At most this many pages" />}
                  {c === 'cites' && <input inputMode="numeric" placeholder="≥" value={f.cites} onChange={(e) => setFilter('cites', e.target.value.replace(/\D/g, ''))} aria-label="At least this many citations" />}
                  {c === 'impact' && <select value={f.impact} onChange={(e) => setFilter('impact', e.target.value)} aria-label="Filter by impact"><option value="">All</option>{impacts.map((v) => <option key={v}>{v}</option>)}</select>}
                  {c === 'dom' && <select value={f.dom} onChange={(e) => setFilter('dom', e.target.value)} aria-label="Filter by domain"><option value="">All</option>{allDomains.map((d) => <option key={d}>{d}</option>)}</select>}
                  {c === 'status' && <select value={f.status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Filter by status"><option value="">All</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>}
                  {c === 'pnote' && <input type="search" placeholder="Note" value={f.pnote} onChange={(e) => setFilter('pnote', e.target.value)} aria-label="Filter by project note" />}
                  {c === 'notes' && <input type="search" placeholder="Notes" value={f.notes} onChange={(e) => setFilter('notes', e.target.value)} aria-label="Filter by notes" />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody ref={bodyRef}>
            {rows.map((p, i) => (
              <tr key={p.id} data-id={p.id} data-find={`paper-${p.id}`} onPointerDown={(e) => startDrag(p, e)}
                className={`rl-row s-${p.status}${p.hidden ? ' is-hidden' : ''}${drag?.id === p.id ? ' dragging' : ''}${!noop && drag!.at === i ? ' drop-before' : ''}${!noop && i === rows.length - 1 && drag!.at === rows.length ? ' drop-after' : ''}`}>
                <td className="rl-c-pos">
                  {canDrag && <button type="button" className="rl-grip" aria-label={`Move “${p.title}” (drag, or press ↑ / ↓)`} title="Drag to reorder · or focus and press ↑ / ↓"
                    onKeyDown={(e) => { if (e.key === 'ArrowUp' && i > 0) { e.preventDefault(); void moveTo(p.id, i - 1); } if (e.key === 'ArrowDown' && i < rows.length - 1) { e.preventDefault(); void moveTo(p.id, i + 2); } }}>⋮⋮</button>}
                  {order.get(p.id)}
                </td>
                <td className="rl-c-title">
                  <button className="rl-title" onClick={() => setEdit(p)} title={p.title}>{p.title}</button>
                  {p.url && <a className="rl-open" href={p.url} target="_blank" rel="noreferrer" aria-label={`Open ${p.title}`}>↗</a>}
                  {p.authors && <span className="rl-authors" title={p.authors}>{p.authors}</span>}
                </td>
                <td className="rl-c-venue" title={p.venue}>{shortVenue(p.venue)}</td>
                <td className="rl-num">{p.year ?? ''}</td>
                <td className="rl-num">{p.pages ?? ''}</td>
                <td className="rl-num" title={p.citations_at ? `as of ${p.citations_at}` : undefined}>{p.citations ?? ''}</td>
                <td className="rl-num">{p.impact}</td>
                <td className="rl-c-dom">{doms(p).map((d) => <span key={d} className="ws-tag" style={{ '--tone': tone(d) } as React.CSSProperties}>{d}</span>)}</td>
                <td>
                  <select className={`rl-status s-${p.status}`} value={p.status} onChange={(e) => void save(p, { status: e.target.value as Status })} aria-label={`Status of ${p.title}`}>
                    {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
                {project && (
                  <td><input className="rl-pnote" defaultValue={inProject.get(p.id)?.note ?? ''} key={`${project.id}-${p.id}-${inProject.get(p.id)?.note}`} placeholder="skim, done…" aria-label={`Project note for ${p.title}`}
                    onBlur={(e) => { if (e.target.value !== (inProject.get(p.id)?.note ?? '')) void proj(`/${project.id}/papers/${p.id}`, 'PATCH', { note: e.target.value }); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} /></td>
                )}
                <td><span className="rl-notes" title={p.notes}>{p.notes}</span></td>
                <td className="rl-c-act">
                  <span className="rl-menu-wrap">
                    <button className="rl-act" title="More actions" aria-label={`Actions for ${p.title}`} aria-haspopup="menu" aria-expanded={menuFor === p.id} onClick={() => setMenuFor(menuFor === p.id ? null : p.id)}>⋯</button>
                    {menuFor === p.id && (
                      <span className="rl-menu" role="menu" onMouseLeave={() => setMenuFor(null)}>
                        <button role="menuitem" onClick={() => { setMenuFor(null); void save(p, { hidden: p.hidden ? 0 : 1 }); }}>{p.hidden ? 'Unhide' : 'Hide'}</button>
                        {project && <button role="menuitem" onClick={async () => { setMenuFor(null); await proj(`/${project.id}/papers/${p.id}`, 'DELETE'); toast({ text: `Removed from “${project.name}”.`, undo: async () => { await undoLatest(); await reloadAll(); } }); }}>Remove from “{project.name}”</button>}
                        {projects.data.filter((pr) => pr.id !== project?.id).map((pr) => {
                          const on = pr.items.some((i) => i.paper_id === p.id);
                          return <button role="menuitem" key={pr.id} onClick={() => { setMenuFor(null); void proj(on ? `/${pr.id}/papers/${p.id}` : `/${pr.id}/papers`, on ? 'DELETE' : 'POST', on ? undefined : { paper_id: p.id }); }}>{on ? `✓ In “${pr.name}” (remove)` : `Add to “${pr.name}”`}</button>;
                        })}
                        <button role="menuitem" className="danger" onClick={() => { setMenuFor(null); void deletePaper(p); }}>Delete paper</button>
                      </span>
                    )}
                  </span>
                </td>
              </tr>
            ))}
            {!rows.length && !loading && <tr><td colSpan={cols.length} className="ws-muted rl-none">{base.length ? 'No paper matches these filters.' : project ? 'This project has no papers yet. Use the box above to add some.' : 'No papers yet.'}</td></tr>}
          </tbody>
        </table>
      </div>
      {drag && <div className="rl-ghost" style={{ left: drag.x + 14, top: drag.y + 10 }} aria-hidden="true">{byId.get(drag.id)?.title}</div>}
      <p className="ws-muted rl-hint">{canDrag ? 'Drag a row (press anywhere on it that isn’t a control, or on ⋮⋮) to change the order; a line shows where it lands. Esc cancels. With ⋮⋮ focused, ↑ / ↓ move it.' : 'Sort by # (ascending) to drag rows.'} Drag a column edge to resize it; double-click the edge to reset.</p>

      {edit && <PaperPanel paper={edit === 'new' ? null : edit} domains={allDomains} onClose={() => setEdit(null)}
        onSave={async (body) => {
          if (edit === 'new') {
            const row = await api<Paper>('papers', 'POST', body);
            setData((d) => [...d, row]);
            if (project) await proj(`/${project.id}/papers`, 'POST', { paper_id: row.id });
          } else await save(edit, body as Partial<Paper>);
          setEdit(null);
        }}
        onDelete={edit === 'new' ? undefined : async () => { if (await deletePaper(edit)) setEdit(null); }} />}
    </section>
  );
}

function PaperPanel({ paper, domains, onClose, onSave, onDelete }: {
  paper: Paper | null; domains: string[]; onClose: () => void; onSave: (b: Record<string, unknown>) => Promise<void>; onDelete?: () => Promise<void>;
}) {
  const [f, setF] = useState({
    title: paper?.title ?? '', authors: paper?.authors ?? '', venue: paper?.venue ?? '', year: paper?.year ? String(paper.year) : '',
    url: paper?.url ?? '', status: paper?.status ?? 'to_read', notes: paper?.notes ?? '', domains: paper ? doms(paper) : [] as string[],
    pages: paper?.pages != null ? String(paper.pages) : '', citations: paper?.citations != null ? String(paper.citations) : '', impact: paper?.impact ?? '', hidden: !!paper?.hidden,
  });
  const [newDom, setNewDom] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof typeof f, v: unknown) => setF((x) => ({ ...x, [k]: v }));
  const toggle = (d: string) => set('domains', f.domains.includes(d) ? f.domains.filter((x) => x !== d) : [...f.domains, d]);
  const addDom = () => { const d = newDom.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, ''); if (d && !f.domains.includes(d)) set('domains', [...f.domains, d]); setNewDom(''); };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await onSave({ ...f, year: f.year ? Number(f.year) : null, pages: f.pages ? Number(f.pages) : null, citations: f.citations ? Number(f.citations) : null, hidden: f.hidden ? 1 : 0 }); }
    catch (er) { setErr((er as Error).message); } finally { setBusy(false); }
  };
  const ex = paper ? extra(paper) : {};
  return (
    <div className="ws-overlay" onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }} onKeyDown={(e) => { if (e.key === 'Escape' && !busy) onClose(); }}>
      <aside className="ws-drawer" role="dialog" aria-modal="true" aria-labelledby="rl-panel-title">
        <header><h2 id="rl-panel-title">{paper ? 'Edit paper' : 'Add a paper'}</h2><button className="ws-icon" onClick={onClose} aria-label="Close">✕</button></header>
        <form className="ws-form" onSubmit={submit}>
          <label>Title<input required autoFocus maxLength={500} value={f.title} onChange={(e) => set('title', e.target.value)} /></label>
          <label>Authors<input maxLength={2000} value={f.authors} onChange={(e) => set('authors', e.target.value)} /></label>
          <div className="ws-form-row">
            <label>Venue<input maxLength={300} value={f.venue} onChange={(e) => set('venue', e.target.value)} placeholder="ISCA, MICRO, arXiv…" /></label>
            <label>Year<input inputMode="numeric" pattern="\d{4}" value={f.year} onChange={(e) => set('year', e.target.value)} /></label>
          </div>
          <div className="ws-form-row">
            <label>Pages<input inputMode="numeric" pattern="\d*" value={f.pages} onChange={(e) => set('pages', e.target.value)} /></label>
            <label>Citations<input inputMode="numeric" pattern="\d*" value={f.citations} onChange={(e) => set('citations', e.target.value)} /></label>
            <label>Impact<input maxLength={100} value={f.impact} onChange={(e) => set('impact', e.target.value)} /></label>
          </div>
          <label>Link<input type="url" maxLength={2000} value={f.url} onChange={(e) => set('url', e.target.value)} placeholder="https://…" /></label>
          <div className="ws-form-row">
            <label>Status<select value={f.status} onChange={(e) => set('status', e.target.value)}>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label className="ws-check rl-hide-check"><input type="checkbox" checked={f.hidden} onChange={(e) => set('hidden', e.target.checked)} /> Hidden</label>
          </div>
          <fieldset><legend>Domains</legend>
            <div className="rl-domains">
              {[...new Set([...domains, ...f.domains])].map((d) => <button type="button" key={d} className={`ws-chip${f.domains.includes(d) ? ' on' : ''}`} style={{ '--tone': tone(d) } as React.CSSProperties} aria-pressed={f.domains.includes(d)} onClick={() => toggle(d)}>{d}</button>)}
            </div>
            <div className="ws-form-row"><input placeholder="New domain…" value={newDom} onChange={(e) => setNewDom(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDom(); } }} /><button type="button" className="ws-ghost" onClick={addDom}>Add</button></div>
          </fieldset>
          <label>Notes<textarea rows={6} maxLength={20000} value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Key idea, what to borrow, open questions…" /></label>
          {Object.keys(ex).length > 0 && <dl className="rl-extra-list">{Object.entries(ex).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}
          {paper && <p className="ws-muted">Source: {paper.source}{paper.read_at ? ` · read ${new Date(paper.read_at).toLocaleDateString()}` : ''}{paper.citations_at ? ` · citations as of ${paper.citations_at}` : ''}</p>}
          {err && <p className="ws-error" role="alert">{err}</p>}
          <footer>
            {onDelete && <Btn tone="danger" icon="trash" disabled={busy} onClick={async () => { setBusy(true); try { await onDelete(); } catch (er) { setErr((er as Error).message); } finally { setBusy(false); } }}>Delete paper</Btn>}
            <span style={{ flex: 1 }} />
            <button type="button" className="ws-ghost" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="ws-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          </footer>
        </form>
      </aside>
    </div>
  );
}
