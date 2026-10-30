// Prep focuses: named subsets of the curriculum (like reading-list projects), e.g. "Internships" or a
// role. The chosen focus is saved on the server and filters the overview, tracks, weekly plan,
// flashcards, quizzes and interview questions. "All concepts" shows everything.
import { useCallback, useMemo, useState } from 'react';
import { api, useLoad, useStored } from '../api';
import { Btn, useSafeDelete } from '../ui';
import type { PrepData } from './shared';

export interface Focus { id: number; name: string; description: string; position: number; preset: string; items: string[] }

export function useFocus(prep: PrepData) {
  const list = useLoad<Focus[]>('prep/focus', []);
  const [focusId, setFocusId] = useStored<number>('ws.prep.focus', 0);
  const current = list.data.find((f) => f.id === focusId) ?? null;
  const index = useMemo(() => {
    const items = new Set(current?.items ?? []);
    const modTrack = new Map(prep.modules.map((m) => [m.id, m.track_id]));
    const modules = new Set<string>(), tracks = new Set<string>();
    for (const i of prep.items) if (items.has(i.id)) { modules.add(i.module_id); tracks.add(modTrack.get(i.module_id) ?? ''); }
    return { items, modules, tracks };
  }, [current, prep]);
  /** Does a card / quiz question / interview question (by track and module) belong to the focus? */
  const matches = useCallback((track: string, module?: string) => {
    if (!current) return true;
    if (module && index.modules.has(module)) return true;
    const known = prep.modules.some((m) => m.id === module);
    // Unknown or missing module: decide by track; content outside the curriculum (e.g. coding) always shows.
    if (!known) return index.tracks.has(track) || !prep.tracks.some((t) => t.id === track);
    return false;
  }, [current, index, prep]);
  const save = useCallback(async (path: string, method: string, body?: unknown) => {
    const r = await api<{ focus: Focus[]; id: number }>(`prep/focus${path}`, method, body);
    list.setData(r.focus);
    return r.id;
  }, [list]);
  const toggle = useCallback(async (ids: string[], on: boolean) => {
    if (!current || !ids.length) return;
    list.setData((fs) => fs.map((f) => (f.id === current.id ? { ...f, items: on ? [...new Set([...f.items, ...ids])] : f.items.filter((x) => !ids.includes(x)) } : f)));
    try { await save(`/${current.id}/items`, 'POST', { ids, on }); } catch (e) { list.setError((e as Error).message); void list.reload(); }
  }, [current, save, list]);
  const filtered = useMemo<PrepData>(() => (current ? { ...prep, items: prep.items.filter((i) => index.items.has(i.id)) } : prep), [prep, current, index]);
  return { list, current, focusId, setFocusId, index, matches, save, toggle, filtered };
}
export type FocusCtx = ReturnType<typeof useFocus>;

const hoursOf = (prep: PrepData, ids: Set<string> | null) =>
  Math.round(prep.items.filter((i) => (!ids || ids.has(i.id)) && !i.optional && i.status !== 'skipped').reduce((s, i) => s + (i.est ?? 0), 0));

/** The focus chips: All concepts, each focus, + New; rename / delete / edit items for the chosen one. */
export function FocusBar({ f, prep, editing, setEditing, compact }: { f: FocusCtx; prep: PrepData; editing?: boolean; setEditing?: (v: boolean) => void; compact?: boolean }) {
  const [naming, setNaming] = useState<'new' | 'rename' | null>(null);
  const safeDelete = useSafeDelete();
  const fail = (e: unknown) => f.list.setError((e as Error).message);
  const submit = async (name: string) => {
    try {
      if (naming === 'rename' && f.current) await f.save(`/${f.current.id}`, 'PATCH', { name });
      else { const id = await f.save('', 'POST', { name, copy_from: f.current?.id }); f.setFocusId(id); setEditing?.(true); }
    } catch (e) { fail(e); }
    setNaming(null);
  };
  return (
    <div className={`pf-bar${compact ? ' compact' : ''}`}>
      <nav className="rl-projects pf-chips" aria-label="Prep focus">
        <span className="ws-label pf-label">Focus</span>
        <button className={`rl-proj${!f.current ? ' on' : ''}`} onClick={() => f.setFocusId(0)} title="Everything in the curriculum">All concepts <small>{hoursOf(prep, null)} h</small></button>
        {f.list.data.map((x) => (
          <button key={x.id} className={`rl-proj${f.current?.id === x.id ? ' on' : ''}`} onClick={() => f.setFocusId(x.id)} title={x.description || undefined}>
            {x.name} <small>{hoursOf(prep, new Set(x.items))} h</small>
          </button>
        ))}
        {!compact && (naming ? (
          <form className="rl-name" onSubmit={(e) => { e.preventDefault(); const n = String(new FormData(e.currentTarget).get('name') ?? '').trim(); if (n) void submit(n); else setNaming(null); }}>
            <input name="name" autoFocus maxLength={100} defaultValue={naming === 'rename' ? f.current?.name : ''} placeholder={naming === 'new' && f.current ? `New focus (copy of ${f.current.name}), then Enter` : 'Focus name, then Enter'}
              onBlur={(e) => { if (!e.target.value.trim()) setNaming(null); }} onKeyDown={(e) => { if (e.key === 'Escape') setNaming(null); }} />
          </form>
        ) : <button className="rl-proj rl-proj-new" onClick={() => setNaming('new')} title={f.current ? `Starts as a copy of “${f.current.name}”` : 'Starts empty; tick items to add them'}>+ New focus</button>)}
        {!compact && f.current && !naming && (
          <span className="rl-proj-tools">
            {setEditing && <Btn size="sm" icon={editing ? 'check' : 'edit'} tone={editing ? 'accent' : undefined} onClick={() => setEditing(!editing)} aria-pressed={editing}>{editing ? 'Done editing' : 'Edit items'}</Btn>}
            <Btn size="sm" icon="pencil" onClick={() => setNaming('rename')}>Rename</Btn>
            <Btn size="sm" icon="trash" tone="danger" onClick={() => {
              const cur = f.current!;
              void safeDelete({
                title: `Delete the focus “${cur.name}”?`,
                body: <p>Only the focus goes ({cur.items.length} items picked). <b>The items, your progress and notes stay in the curriculum.</b></p>,
                confirm: 'Delete focus',
                run: async () => { await f.save(`/${cur.id}`, 'DELETE'); f.setFocusId(0); },
                done: `Deleted the focus “${cur.name}”.`, reload: () => f.list.reload(),
              }).catch(fail);
            }}>Delete</Btn>
          </span>
        )}
      </nav>
      {f.current?.description && !compact && <p className="ws-muted pf-desc">{f.current.description}</p>}
      {f.list.error && <p className="ws-error" role="alert">{f.list.error}</p>}
    </div>
  );
}
