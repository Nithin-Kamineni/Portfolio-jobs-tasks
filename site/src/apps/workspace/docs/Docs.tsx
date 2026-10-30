// "Tasks": many Google-Docs-style documents, autosaved to D1, in folders, with pinning and a bin (kept
// 30 days). The sidebar folds away; the documents have their own theme. Both, and which folders are
// open, are remembered on the server, so every device opens the same way.
import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { JSONContent } from '@tiptap/react';
import { api, relTime, useDebounced, useLoad, useStored, type ApiError } from '../api';
import { changesOf, clearDraft, readDraft, replaceDraft, writeDraft, type Draft, type DraftChanges } from './drafts';
import { Page, ReadOnlyDoc, Toolbar, useDocEditor } from './Editor';
import { Btn, useConfirm, useSafeDelete, useToast } from '../ui';

interface DocMeta { id: number; title: string; preview: string; pinned: number; folder_id: number | null; created_at: string; updated_at: string; deleted_at: string | null; version: number }
interface Doc extends DocMeta { content: string; text: string }
interface Folder { id: number; name: string; parent_id: number | null; position: number }
type DocTheme = 'site' | 'light' | 'dim' | 'dark';
const THEMES: [DocTheme, string][] = [['site', 'Same as site'], ['light', 'Light'], ['dim', 'Dim'], ['dark', 'Dark']];

// "5 min", "3 h", "2 d", then "Oct 17" (the year only when it is not this year): fits the narrow tree.
const shortTime = (iso: string) => {
  const s = (Date.now() - Date.parse(iso)) / 1000, d = new Date(iso);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} d`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...(d.getFullYear() === new Date().getFullYear() ? {} : { year: 'numeric' }) });
};
const byName = (a: Folder, b: Folder) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });

export default function Docs() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: docs, setData: setDocs, reload, error, setError, loading } = useLoad<DocMeta[]>('docs', []);
  const folders = useLoad<Folder[]>('doc-folders', []);
  const [q, setQ] = useState('');
  const [binOpen, setBinOpen] = useState(false);
  const [sideOpen, setSideOpen] = useStored('ws.docs.sideOpen', true);
  const [theme, setTheme] = useStored<DocTheme>('ws.docs.theme', 'site');
  const [openIds, setOpenIds] = useStored<number[]>('ws.docs.openFolders', []);
  const [naming, setNaming] = useState<{ parent: number | null } | { folder: Folder } | null>(null);
  const [drag, setDrag] = useState<{ doc?: number; folder?: number } | null>(null);
  const [over, setOver] = useState<number | 'top' | null>(null);
  const [menuFor, setMenuFor] = useState<number | null>(null);
  const [menuAt, setMenuAt] = useState({ top: 0, left: 0 }); // fixed position, so the scrolling list never clips it
  const safeDelete = useSafeDelete();
  const toast = useToast();
  // A folder menu closes on a click anywhere else, or Escape.
  useEffect(() => {
    if (menuFor == null) return;
    const down = (e: PointerEvent) => { if (!(e.target as HTMLElement).closest('.doc-folder-menu-wrap')) setMenuFor(null); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuFor(null); };
    addEventListener('pointerdown', down); addEventListener('keydown', key);
    return () => { removeEventListener('pointerdown', down); removeEventListener('keydown', key); };
  }, [menuFor]);
  const match = (d: DocMeta) => !q || `${d.title} ${d.preview}`.toLowerCase().includes(q.toLowerCase());
  const live = docs.filter((d) => !d.deleted_at), trashed = docs.filter((d) => d.deleted_at);
  const fById = useMemo(() => new Map(folders.data.map((f) => [f.id, f])), [folders.data]);
  const path = (fid: number | null): string => { const names: string[] = []; for (let f = fid != null ? fById.get(fid) : undefined; f && names.length < 10; f = f.parent_id != null ? fById.get(f.parent_id) : undefined) names.unshift(f.name); return names.join(' / '); };
  const current = live.find((d) => String(d.id) === id);
  const open = new Set(openIds);
  // Ctrl+S anywhere in Docs saves (DocEditor flushes) instead of the browser's "Save page" dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') e.preventDefault(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => { if (!id && !loading && live.length) nav(`/docs/${live[0].id}`, { replace: true }); }, [id, loading, live.length]); // eslint-disable-line react-hooks/exhaustive-deps
  // The open document's folders are expanded, so it is visible in the list.
  useEffect(() => {
    const add: number[] = [];
    for (let f = current?.folder_id != null ? fById.get(current.folder_id) : undefined; f; f = f.parent_id != null ? fById.get(f.parent_id) : undefined) if (!open.has(f.id)) add.push(f.id);
    if (add.length) setOpenIds((x) => [...x, ...add]);
  }, [current?.id, current?.folder_id, fById]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggleFolder = (fid: number) => setOpenIds((x) => (x.includes(fid) ? x.filter((y) => y !== fid) : [...x, fid]));

  const create = async (folder: number | null = null) => {
    try {
      const d = await api<Doc>('docs', 'POST', { title: 'Untitled document', folder_id: folder });
      setDocs((x) => [{ ...d, preview: '' }, ...x]);
      if (folder != null && !open.has(folder)) setOpenIds((x) => [...x, folder]);
      nav(`/docs/${d.id}`);
    } catch (e) { setError((e as Error).message); }
  };
  const patchMeta = (d: DocMeta) => setDocs((x) => x.map((y) => (y.id === d.id ? { ...y, ...d } : y)));
  const moveDoc = async (doc: DocMeta, folder: number | null) => {
    if ((doc.folder_id ?? null) === folder) return;
    patchMeta({ ...doc, folder_id: folder });
    try {
      await api<Doc>(`docs/${doc.id}`, 'PATCH', { folder_id: folder });
      if (folder != null && !open.has(folder)) setOpenIds((x) => [...x, folder]);
      toast({ text: `Moved “${doc.title || 'Untitled document'}” to ${folder == null ? 'the top level' : `“${fById.get(folder)?.name}”`}.`, undo: async () => { await api(`docs/${doc.id}`, 'PATCH', { folder_id: doc.folder_id }); patchMeta(doc); } });
    } catch (e) { patchMeta(doc); setError((e as Error).message); }
  };
  const moveFolder = async (f: Folder, parent: number | null) => {
    if (f.parent_id === parent || f.id === parent) return;
    try {
      await api(`doc-folders/${f.id}`, 'PATCH', { parent_id: parent });
      await folders.reload();
      if (parent != null && !open.has(parent)) setOpenIds((x) => [...x, parent]);
    } catch (e) { setError((e as Error).message); }
  };
  const saveFolder = async (name: string) => {
    const n = name.trim();
    const cur = naming;
    setNaming(null);
    if (!n || !cur) return;
    try {
      if ('folder' in cur) { if (n !== cur.folder.name) await api(`doc-folders/${cur.folder.id}`, 'PATCH', { name: n }); }
      else {
        const row = await api<Folder>('doc-folders', 'POST', { name: n, parent_id: cur.parent });
        setOpenIds((x) => [...x, row.id, ...(cur.parent != null && !x.includes(cur.parent) ? [cur.parent] : [])]);
      }
      await folders.reload();
    } catch (e) { setError((e as Error).message); }
  };
  const deleteFolder = (f: Folder) => {
    const n = live.filter((d) => d.folder_id === f.id).length + folders.data.filter((x) => x.parent_id === f.id).length;
    return safeDelete({
      title: `Delete the folder “${f.name}”?`,
      body: <p>{n ? `Its ${n} item${n === 1 ? '' : 's'} move up to ${f.parent_id != null ? `“${fById.get(f.parent_id)?.name}”` : 'the top level'}; no document is deleted.` : 'It is empty.'}</p>,
      confirm: 'Delete folder', tone: 'danger',
      run: async () => { try { await api(`doc-folders/${f.id}`, 'DELETE'); await Promise.all([folders.reload(), reload()]); } catch (e) { setError((e as Error).message); throw e; } },
      done: `Deleted the folder “${f.name}”.`, reload: async () => { await Promise.all([folders.reload(), reload()]); },
    }).catch(() => false);
  };
  const restore = async (d: DocMeta) => {
    try { const row = await api<Doc>(`docs/${d.id}`, 'PATCH', { deleted: false, version: d.version }); patchMeta({ ...row, preview: row.text.slice(0, 200) }); nav(`/docs/${d.id}`); }
    catch (e) { setError((e as Error).message); }
  };
  const destroy = (d: DocMeta) => safeDelete({
    title: `Delete “${d.title || 'Untitled document'}” now?`,
    body: <p>It leaves the bin today instead of in 30 days, and its version history goes with it.</p>,
    confirm: 'Delete now',
    run: async () => { try { await api(`docs/${d.id}`, 'DELETE'); setDocs((x) => x.filter((y) => y.id !== d.id)); } catch (e) { setError((e as Error).message); throw e; } },
    done: `Deleted “${d.title || 'Untitled document'}”.`, reload,
  }).catch(() => false);

  // ---- drag and drop: a document or folder onto a folder (anywhere on it or inside it), or onto the
  // list outside any folder for the top level. A closed folder opens after a short hover.
  // (Changing the page inside dragstart cancels the drag in Chrome, so the drag state is set a tick later.)
  const isInside = (fid: number, ancestor: number) => { for (let f = fById.get(fid); f; f = f.parent_id != null ? fById.get(f.parent_id) : undefined) if (f.id === ancestor) return true; return false; };
  const canDrop = (target: number | null) => !!drag && canDropFor(drag, target);
  const canDropFor = (d: { doc?: number; folder?: number }, target: number | null) => {
    if (d.doc != null) return (live.find((x) => x.id === d.doc)?.folder_id ?? null) !== target;
    if (d.folder == null) return false;
    const parent = fById.get(d.folder)?.parent_id ?? null;
    return parent !== target && (target === null || !isInside(target, d.folder));
  };
  const openTimer = useRef<{ id: number; t: ReturnType<typeof setTimeout> } | null>(null);
  const stopOpenTimer = () => { if (openTimer.current) clearTimeout(openTimer.current.t); openTimer.current = null; };
  const onOver = (target: number | null) => (e: DragEvent) => {
    if (!drag) return;
    e.stopPropagation();
    if (!canDrop(target)) { e.dataTransfer.dropEffect = 'none'; if (over !== null) setOver(null); return; }
    e.preventDefault(); e.dataTransfer.dropEffect = 'move';
    const key = target ?? 'top';
    if (over !== key) setOver(key);
    if (target != null && !open.has(target) && openTimer.current?.id !== target) {
      stopOpenTimer();
      openTimer.current = { id: target, t: setTimeout(() => setOpenIds((x) => (x.includes(target) ? x : [...x, target])), 650) };
    }
  };
  const onDrop = (target: number | null) => async (e: DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    const d = drag;
    endDrag();
    if (!d || !canDropFor(d, target)) return;
    if (d.doc != null) { const doc = live.find((x) => x.id === d.doc); if (doc) await moveDoc(doc, target); }
    else if (d.folder != null) { const f = fById.get(d.folder); if (f) await moveFolder(f, target); }
  };
  const endDrag = () => { stopOpenTimer(); setDrag(null); setOver(null); };
  const startDrag = (what: { doc?: number; folder?: number }, label: string) => (e: DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', label); e.dataTransfer.effectAllowed = 'move';
    window.setTimeout(() => setDrag(what));
  };

  const docRow = (d: DocMeta, showPath = false) => (
    <li key={`d${d.id}`} className={`dt-node dt-doc${String(d.id) === id ? ' on' : ''}${drag?.doc === d.id ? ' dragging' : ''}`}>
      <button className="dt-row" draggable onDragStart={startDrag({ doc: d.id }, d.title)} onDragEnd={endDrag}
        onClick={() => nav(`/docs/${d.id}`)} title={`${d.title || 'Untitled document'}\n${d.preview ? d.preview.slice(0, 120) : 'Empty'}\nEdited ${relTime(d.updated_at)} · drag onto a folder to move it`}>
        <span className="dt-caret" aria-hidden="true" />
        <DocIcon />
        <span className="dt-name">{d.title || 'Untitled document'}{showPath && d.folder_id != null && <small className="dt-path">{path(d.folder_id)}</small>}</span>
        {d.pinned ? <span className="dt-pin" title="Pinned" aria-label="Pinned">📌</span> : null}
        <small className="dt-time">{shortTime(d.updated_at)}</small>
      </button>
    </li>
  );
  const nameInput = (initial: string, key: string) => (
    <li key={key} className="dt-node dt-naming">
      <span className="dt-row">
        <span className="dt-caret" aria-hidden="true" /><FolderIcon />
        <input autoFocus defaultValue={initial} maxLength={100} placeholder="Folder name, then Enter" aria-label="Folder name"
          onBlur={(e) => void saveFolder(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setNaming(null); }} />
      </span>
    </li>
  );
  // Folders first (A–Z), then documents (pinned first, newest first); every folder's contents fold away.
  const tree = (parent: number | null): ReactNode[] => {
    const out: ReactNode[] = [];
    if (naming && 'parent' in naming && naming.parent === parent) out.push(nameInput('', `new-${parent ?? 'top'}`));
    for (const f of folders.data.filter((x) => x.parent_id === parent).sort(byName)) {
      if (naming && 'folder' in naming && naming.folder.id === f.id) { out.push(nameInput(f.name, `ren-${f.id}`)); continue; }
      const isOpen = open.has(f.id);
      const docsIn = live.filter((d) => d.folder_id === f.id);
      const kids = [...tree(f.id), ...docsIn.map((d) => docRow(d))];
      out.push(
        <li key={`f${f.id}`} className={`dt-node dt-folder${isOpen ? ' open' : ''}${over === f.id ? ' over' : ''}${drag?.folder === f.id ? ' dragging' : ''}`}
          onDragOver={onOver(f.id)} onDrop={onDrop(f.id)}>
          <div className="dt-folder-line">
            <button className="dt-row" onClick={() => toggleFolder(f.id)} aria-expanded={isOpen} draggable onDragStart={startDrag({ folder: f.id }, f.name)} onDragEnd={endDrag}
              title={`${f.name} · click to ${isOpen ? 'fold' : 'open'} · drag documents here`}>
              <span className="dt-caret" aria-hidden="true"><svg viewBox="0 0 16 16" width="12" height="12"><path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
              <FolderIcon open={isOpen} />
              <span className="dt-name">{f.name}</span>
              <small className="dt-count">{docsIn.length || ''}</small>
            </button>
            <span className="dt-acts">
              <button className="dt-act" title={`New document in “${f.name}”`} aria-label={`New document in ${f.name}`} onClick={() => void create(f.id)}><PlusDocIcon /></button>
              <span className="doc-folder-menu-wrap">
                <button className="dt-act" title="Folder actions" aria-label={`Actions for folder ${f.name}`} aria-haspopup="menu" aria-expanded={menuFor === f.id}
                  onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setMenuAt({ top: r.bottom + 4, left: Math.max(8, r.right - 200) }); setMenuFor(menuFor === f.id ? null : f.id); }}>⋯</button>
                {menuFor === f.id && (
                  <span className="doc-folder-menu" role="menu" style={menuAt}>
                    <button role="menuitem" onClick={() => { setMenuFor(null); void create(f.id); }}>New document here</button>
                    <button role="menuitem" onClick={() => { setMenuFor(null); setNaming({ parent: f.id }); if (!isOpen) toggleFolder(f.id); }}>New folder inside</button>
                    <button role="menuitem" onClick={() => { setMenuFor(null); setNaming({ folder: f }); }}>Rename</button>
                    {f.parent_id != null && <button role="menuitem" onClick={() => { setMenuFor(null); void moveFolder(f, null); }}>Move to the top level</button>}
                    <button role="menuitem" className="danger" onClick={() => { setMenuFor(null); void deleteFolder(f); }}>Delete folder…</button>
                  </span>
                )}
              </span>
            </span>
          </div>
          {isOpen && (
            <ul className="dt-children">
              {kids.length ? kids : <li className="dt-empty">Empty · drag documents here</li>}
            </ul>
          )}
        </li>,
      );
    }
    return out;
  };
  const searching = !!q.trim();
  const found = live.filter(match);
  const topDocs = live.filter((d) => d.folder_id == null || !fById.has(d.folder_id));
  const newFolder = () => { setQ(''); setNaming({ parent: null }); };

  return (
    <section className={`doc-layout${sideOpen ? '' : ' side-closed'}`} data-doc-theme={theme === 'site' ? undefined : theme}>
      {sideOpen ? (
        <aside className="doc-side" aria-label="Documents">
          <div className="doc-side-top">
            <button className="ws-primary doc-new" onClick={() => void create()}>+ Document</button>
            <button className="ws-ghost doc-new-folder" onClick={newFolder} title="New folder (drag documents into it)"><FolderPlusIcon /> Folder</button>
            <button className="ws-icon doc-side-btn" onClick={() => setSideOpen(false)} title="Hide the document list" aria-label="Hide the document list">«</button>
          </div>
          <input type="search" placeholder="Search documents…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search documents" />
          {!searching && folders.data.length > 0 && (
            <div className="dt-head">
              <span className="ws-label">Documents</span>
              <button className="ws-link" onClick={() => setOpenIds(openIds.length ? [] : folders.data.map((f) => f.id))}>{openIds.length ? 'Fold all' : 'Open all'}</button>
            </div>
          )}
          <ul className={`doc-tree${over === 'top' ? ' over' : ''}${drag ? ' dragging-any' : ''}`} onDragOver={onOver(null)} onDrop={onDrop(null)}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null); }}>
            {searching ? found.map((d) => docRow(d, true)) : (
              <>
                {tree(null)}
                {topDocs.map((d) => docRow(d))}
              </>
            )}
            {searching && !found.length && <li className="dt-empty">No match.</li>}
            {!searching && !live.length && !folders.data.length && !loading && <li className="dt-empty">No documents yet.</li>}
            {drag && !searching && <li className="dt-top-hint" aria-hidden="true">Drop here to move it out of its folder</li>}
          </ul>
          <section className="doc-bin">
            <button className="doc-bin-head" onClick={() => setBinOpen(!binOpen)} aria-expanded={binOpen}>
              <span>🗑 Bin ({trashed.length})</span><small>kept 30 days</small><span>{binOpen ? '▾' : '▸'}</span>
            </button>
            {binOpen && (
              <ul className="doc-bin-list">
                {trashed.filter(match).map((d) => {
                  const left = Math.max(0, 30 - Math.floor((Date.now() - Date.parse(d.deleted_at!)) / 864e5));
                  return (
                    <li key={d.id}>
                      <strong>{d.title || 'Untitled document'}</strong>
                      <small>Deleted {relTime(d.deleted_at)} · {left} day{left === 1 ? '' : 's'} left</small>
                      <span className="doc-bin-actions"><Btn size="sm" icon="undo" onClick={() => void restore(d)}>Restore</Btn><Btn size="sm" icon="trash" tone="danger" onClick={() => void destroy(d)}>Delete now</Btn></span>
                    </li>
                  );
                })}
                {!trashed.length && <li className="ws-muted">The bin is empty.</li>}
              </ul>
            )}
          </section>
        </aside>
      ) : (
        <aside className="doc-rail" aria-label="Documents (folded)">
          <button className="ws-icon" onClick={() => setSideOpen(true)} title="Show the document list" aria-label="Show the document list">»</button>
          <button className="ws-icon" onClick={() => void create()} title="New document" aria-label="New document">+</button>
        </aside>
      )}
      <div className="doc-main">
        {(error || folders.error) && <p className="ws-error" role="alert">{error || folders.error}</p>}
        {id ? <DocView key={id} id={Number(id)} onMeta={patchMeta} onTrashed={() => { void reload(); nav('/docs', { replace: true }); }}
            theme={theme} setTheme={setTheme} folders={folders.data} path={path} folderId={current?.folder_id ?? null} onMove={(f) => { if (current) void moveDoc(current, f); }} />
          : !loading && (
            <div className="ws-empty">
              <span>✎</span><h2>Your documents</h2>
              <p>Plans, notes, meeting notes, to-do lists: write them like in Google Docs. Everything saves as you type.</p>
              <button className="ws-primary" onClick={() => void create()}>Create a document</button>
            </div>
          )}
      </div>
    </section>
  );
}

interface ViewProps { theme: DocTheme; setTheme: (t: DocTheme) => void; folders: Folder[]; path: (f: number | null) => string; folderId: number | null; onMove: (folder: number | null) => void }

function DocView({ id, onMeta, onTrashed, ...rest }: { id: number; onMeta: (d: DocMeta) => void; onTrashed: () => void } & ViewProps) {
  const [doc, setDoc] = useState<Doc | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [err, setErr] = useState('');
  const [attempt, setAttempt] = useState(0);
  const nav = useNavigate();
  useEffect(() => {
    api<Doc>(`docs/${id}`).then((d) => { setDraft(readDraft(id)); setDoc(d); setErr(''); }, (e: ApiError) => {
      // A remembered document that no longer exists (deleted here or on another device): open the newest one instead.
      if (e.status === 404) return nav('/docs', { replace: true });
      setErr(e.message);
    });
  }, [id, attempt]); // eslint-disable-line react-hooks/exhaustive-deps
  // Not reachable (offline / signed out): try again when the connection or the window comes back.
  useEffect(() => {
    if (!err) return;
    const again = () => setAttempt((n) => n + 1);
    addEventListener('online', again); addEventListener('focus', again);
    const t = setInterval(again, 20000);
    return () => { removeEventListener('online', again); removeEventListener('focus', again); clearInterval(t); };
  }, [err]);
  if (err) return (
    <div className="ws-error doc-offline" role="alert">
      <p>{err}</p>
      {readDraft(id) && <p>Your unsaved changes to this document are kept on this device and are saved as soon as it opens again.</p>}
      <SignInLink />
    </div>
  );
  if (!doc) return <p className="ws-muted doc-loading">Opening…</p>;
  return <DocEditor key={`${doc.id}-${doc.version}`} doc={doc} draft={draft} onMeta={onMeta} onTrashed={onTrashed} onReload={() => { setDoc(null); setAttempt((n) => n + 1); }} {...rest} />;
}

/** Opens the sign-in in a new tab, so this page (and its unsaved text) stays where it is. */
function SignInLink() {
  return <a className="ws-link" href="/app/tasks/" target="_blank" rel="noopener">Sign in again (opens a new tab) ↗</a>;
}

type SaveState = 'saved' | 'saving' | 'unsaved' | 'offline' | 'conflict' | 'error';
const STATE_LABEL: Record<SaveState, string> = { saved: 'All changes saved', saving: 'Saving…', unsaved: 'Editing…', offline: 'Kept on this device', conflict: 'Edited elsewhere', error: 'Not saved' };

function DocEditor({ doc, draft, onMeta, onTrashed, onReload, theme, setTheme, folders, path, folderId, onMove }: { doc: Doc; draft: Draft | null; onMeta: (d: DocMeta) => void; onTrashed: () => void; onReload: () => void } & ViewProps) {
  // A draft made on top of this exact version is simply put back; one made on an older version (the
  // document was saved from somewhere else since) waits for a choice.
  const resume = draft && draft.base === doc.version ? draft : null;
  const [choice, setChoice] = useState<Draft | null>(draft && draft.base !== doc.version ? draft : null);
  const version = useRef(doc.version);
  const pending = useRef<DraftChanges>(resume ? changesOf(resume) : {});
  const inflight = useRef<Promise<void>>(Promise.resolve());
  const [title, setTitle] = useState(resume?.title ?? doc.title);
  const [pinned, setPinned] = useState(resume?.pinned ?? doc.pinned);
  const [state, setState] = useState<SaveState>(resume ? 'unsaved' : 'saved');
  const [msg, setMsg] = useState('');
  const [toast, setToast] = useState('');
  const [history, setHistory] = useState(false);
  const initial = useMemo<JSONContent | null>(() => { const c = resume?.content ?? doc.content; try { return c ? JSON.parse(c) : null; } catch { return null; } }, [doc.content]); // eslint-disable-line react-hooks/exhaustive-deps

  // Saves run one after another (never two PATCHes with the same version at once). Every change is
  // also in this device's draft until the server confirms it.
  const send = () => {
    inflight.current = inflight.current.then(async () => {
      const body = pending.current;
      if (!Object.keys(body).length) return;
      pending.current = {};
      setState('saving');
      try {
        const row = await api<Doc>(`docs/${doc.id}`, 'PATCH', { ...body, version: version.current });
        version.current = row.version;
        replaceDraft(doc.id, pending.current, row.version);
        onMeta({ ...row, preview: row.text.slice(0, 200) });
        setState(Object.keys(pending.current).length ? 'unsaved' : 'saved');
        setMsg('');
      } catch (e) {
        pending.current = { ...body, ...pending.current };
        const status = (e as ApiError).status;
        setState(status === 0 || status === 401 ? 'offline' : status === 409 ? 'conflict' : 'error');
        setMsg(status === 409
          ? 'This document was saved from another tab or device after you opened it. Your text is kept on this device: reload to choose which version to keep.'
          : status === 0 || status === 401 ? `${(e as Error).message} Your changes are kept on this device and are saved automatically when the connection or your sign-in is back.` : (e as Error).message);
      }
    });
    return inflight.current;
  };
  const [schedule, flush] = useDebounced(() => { void send(); }, 800);
  const draftOk = useRef(true);
  const queue = (p: DraftChanges) => {
    pending.current = { ...pending.current, ...p };
    draftOk.current = writeDraft(doc.id, p, version.current);
    setState((s) => (s === 'offline' || s === 'conflict' ? s : 'unsaved'));
    schedule();
  };
  const flash = (t: string) => { setToast(t); window.setTimeout(() => setToast((x) => (x === t ? '' : x)), 2600); };
  useEffect(() => { if (resume) { flash('Restored the changes this device hadn’t saved yet'); void send(); } }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // While saving fails because of the connection or the sign-in, keep trying: when the browser is back
  // online, when the window gets focus again (e.g. after signing in in another tab) and every 15 s.
  useEffect(() => {
    if (state !== 'offline' && state !== 'error') return;
    const retry = () => { if (Object.keys(pending.current).length) void send(); };
    addEventListener('online', retry); addEventListener('focus', retry);
    const t = setInterval(retry, 15000);
    return () => { removeEventListener('online', retry); removeEventListener('focus', retry); clearInterval(t); };
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const editor = useDocEditor(initial, doc.id, (json, text) => queue({ content: JSON.stringify(json), text }));
  useEffect(() => {
    // Closing the tab only asks when the changes could not be kept on this device (storage blocked or full).
    const warn = (e: BeforeUnloadEvent) => { if (Object.keys(pending.current).length) { flush(); if (!draftOk.current) e.preventDefault(); } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [flush]);

  // A left-over draft from before the latest saved version: use it (the saved version goes into the
  // version history first) or drop it.
  const applyDraft = async (d: Draft) => {
    try { await api(`docs/${doc.id}/versions`, 'POST'); } catch (e) { setMsg((e as Error).message); return; }
    setChoice(null);
    if (d.title !== undefined) setTitle(d.title);
    if (d.pinned !== undefined) setPinned(d.pinned);
    try { if (d.content !== undefined) editor?.commands.setContent(d.content ? JSON.parse(d.content) : '', { emitUpdate: false }); } catch { /* broken draft */ }
    const changes = changesOf(d);
    replaceDraft(doc.id, changes, version.current);
    pending.current = changes;
    void send();
    flash('This device’s version is back · the other one is in the version history');
  };
  const confirm = useConfirm();
  const dropDraft = async () => {
    if (!(await confirm({ title: 'Discard this device’s unsaved changes?', body: <p>The saved version stays as it is. The changes from this device can’t be brought back.</p>, confirm: 'Discard them' }))) return;
    clearDraft(doc.id); setChoice(null);
  };

  // Ctrl+S: save now and keep a version in the history.
  const saveVersion = async () => {
    flush();
    await send();
    if (pending.current && Object.keys(pending.current).length) return;
    try {
      const r = await api<{ saved: boolean }>(`docs/${doc.id}/versions`, 'POST');
      flash(r.saved ? 'Saved · version kept in history' : 'Saved · this version is already in the history');
    } catch (e) { setMsg((e as Error).message); }
  };
  const saveRef = useRef(saveVersion);
  saveRef.current = saveVersion;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); void saveRef.current(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const words = editor?.storage.characterCount?.words?.() ?? 0;
  const toTrash = async () => {
    if (!(await confirm({ title: `Move “${title || 'Untitled document'}” to the bin?`, body: <p>You can restore it from the bin (left, at the bottom) for 30 days.</p>, confirm: 'Move to bin' }))) return;
    flush();
    await send();
    try { await api(`docs/${doc.id}`, 'PATCH', { deleted: true, version: version.current }); onTrashed(); } catch (e) { setMsg((e as Error).message); setState('error'); }
  };
  const restored = (row: Doc) => {
    version.current = row.version;
    setTitle(row.title);
    try { editor?.commands.setContent(row.content ? JSON.parse(row.content) : '', { emitUpdate: false }); } catch { /* empty doc */ }
    onMeta({ ...row, preview: row.text.slice(0, 200) });
    setState('saved');
    setHistory(false);
    flash('Version restored · your previous text is in the history');
  };
  const folderOptions = useMemo(() => folders.map((f) => ({ id: f.id, label: path(f.id) })).sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true })), [folders, path]);

  return (
    <div className="doc-editor">
      <div className="doc-titlebar">
        <input className="doc-title" value={title} maxLength={300} aria-label="Document title" placeholder="Untitled document"
          onChange={(e) => { setTitle(e.target.value); queue({ title: e.target.value }); }} />
        <span className={`doc-state ${state}`} role="status">{STATE_LABEL[state]}</span>
        <select className="doc-select doc-folder-pick" value={folderId ?? ''} aria-label="Folder" title="Folder"
          onChange={(e) => onMove(e.target.value ? Number(e.target.value) : null)}>
          <option value="">📁 No folder</option>
          {folderOptions.map((f) => <option key={f.id} value={f.id}>📁 {f.label}</option>)}
        </select>
        <select className="doc-select doc-theme-pick" value={theme} onChange={(e) => setTheme(e.target.value as DocTheme)} aria-label="Document theme" title="Theme for documents (remembered on every device)">
          {THEMES.map(([v, label]) => <option key={v} value={v}>{v === 'site' ? '◐' : v === 'light' ? '☀' : '☾'} {label}</option>)}
        </select>
        <button className="ws-ghost" onClick={async () => { flush(); await send(); setHistory(true); }} aria-expanded={history}>History</button>
        <button className="ws-ghost" onClick={() => { const p = pinned ? 0 : 1; setPinned(p); queue({ pinned: p }); }} aria-pressed={!!pinned}>{pinned ? 'Unpin' : 'Pin'}</button>
        <Btn icon="trash" tone="danger" onClick={toTrash}>Move to bin</Btn>
      </div>
      {choice && (
        <div className="doc-draft-bar" role="alert">
          <p><b>This device has changes you made {relTime(choice.at)} that were never saved</b>, and the document was saved from somewhere else since then. Which version do you want?</p>
          <span><Btn icon="undo" tone="accent" onClick={() => void applyDraft(choice)}>Use this device’s version</Btn><Btn icon="close" onClick={() => void dropDraft()}>Keep the saved version</Btn></span>
          <small className="ws-muted">“Use this device’s version” keeps the saved one in the version history, so nothing is lost.</small>
        </div>
      )}
      {msg && (
        <p className={state === 'offline' ? 'doc-offline-bar' : 'ws-error'} role="alert">{msg}{' '}
          {state === 'conflict' ? <button className="ws-link" onClick={() => { flush(); onReload(); }}>Reload</button> : <button className="ws-link" onClick={() => void send()}>Retry now</button>}
          {state === 'offline' && <> · <SignInLink /></>}
        </p>
      )}
      {editor && <Toolbar editor={editor} docId={doc.id} />}
      <div className="doc-scroll">{editor && <Page editor={editor} />}</div>
      <p className="doc-foot ws-muted">{words} words · edited {relTime(doc.updated_at)} · <kbd>Ctrl</kbd>+<kbd>S</kbd> keeps a version</p>
      {toast && <div className="ws-toast" role="status">{toast}</div>}
      {history && <VersionPanel docId={doc.id} onClose={() => setHistory(false)} onRestored={restored} />}
    </div>
  );
}

interface VersionMeta { id: number; title: string; kind: 'auto' | 'manual' | 'restore'; created_at: string; words: number }
const KIND_LABEL = { auto: 'Autosaved', manual: 'Saved (Ctrl+S)', restore: 'Before a restore' };
function VersionPanel({ docId, onClose, onRestored }: { docId: number; onClose: () => void; onRestored: (row: Doc) => void }) {
  const list = useLoad<VersionMeta[]>(`docs/${docId}/versions`, []);
  const [sel, setSel] = useState<number | null>(null);
  const [preview, setPreview] = useState<{ id: number; title: string; content: JSONContent | null } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (sel === null && list.data.length) setSel(list.data[0].id); }, [list.data, sel]);
  useEffect(() => {
    if (sel === null) return;
    let live = true;
    api<{ id: number; title: string; content: string }>(`docs/${docId}/versions/${sel}`).then((v) => {
      if (!live) return;
      let content: JSONContent | null = null; try { content = v.content ? JSON.parse(v.content) : null; } catch { content = null; }
      setPreview({ id: v.id, title: v.title, content });
    }, (e: Error) => list.setError(e.message));
    return () => { live = false; };
  }, [sel, docId]); // eslint-disable-line react-hooks/exhaustive-deps
  const confirm = useConfirm();
  const restore = async () => {
    if (sel === null || !(await confirm({ title: 'Restore this version?', body: <p>Your current text is kept in the version history first, so nothing is lost.</p>, confirm: 'Restore', tone: 'accent' }))) return;
    setBusy(true);
    try { onRestored(await api<Doc>(`docs/${docId}/versions/${sel}/restore`, 'POST')); } catch (e) { list.setError((e as Error).message); } finally { setBusy(false); }
  };
  const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  return (
    <div className="ws-overlay" onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }} onKeyDown={(e) => { if (e.key === 'Escape' && !busy) onClose(); }}>
      <aside className="ws-drawer doc-history" role="dialog" aria-modal="true" aria-labelledby="doc-hist-title">
        <header><h2 id="doc-hist-title">Version history</h2><button className="ws-icon" onClick={onClose} aria-label="Close" autoFocus>✕</button></header>
        {list.error && <p className="ws-error" role="alert">{list.error}</p>}
        <div className="doc-hist-body">
          <ul className="doc-hist-list">
            {list.data.map((v, i) => (
              <li key={v.id}>
                {(i === 0 || day(list.data[i - 1].created_at) !== day(v.created_at)) && <span className="ws-label doc-hist-day">{day(v.created_at)}</span>}
                <button className={sel === v.id ? 'on' : ''} onClick={() => setSel(v.id)}>
                  <strong>{new Date(v.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</strong>
                  <small>{KIND_LABEL[v.kind]} · {v.words} words</small>
                </button>
              </li>
            ))}
            {!list.loading && !list.data.length && <li className="ws-muted">No versions yet. A version is kept every 10 minutes while you edit, and whenever you press Ctrl+S.</li>}
          </ul>
          <div className="doc-hist-preview">
            {preview ? <><h3>{preview.title}</h3><div className="doc-hist-page"><ReadOnlyDoc content={preview.content} /></div></> : <p className="ws-muted">Select a version to preview it.</p>}
          </div>
        </div>
        <footer className="doc-hist-foot">
          <button className="ws-ghost" onClick={onClose} disabled={busy}>Close</button>
          <button className="ws-primary" onClick={() => void restore()} disabled={busy || sel === null}>{busy ? 'Restoring…' : 'Restore this version'}</button>
        </footer>
      </aside>
    </div>
  );
}

// Sidebar icons: folders are filled amber, documents an outlined page, so they never look alike.
function FolderIcon({ open = false }: { open?: boolean }) {
  return (
    <svg className="dt-ico dt-ico-folder" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      {open
        ? <><path d="M2 5.5A1.5 1.5 0 013.5 4h4l1.6 1.8h7.4A1.5 1.5 0 0118 7.3V8H5.2a1.5 1.5 0 00-1.4 1L2 14.5z" fill="currentColor" opacity="0.55" /><path d="M3.8 9h14.7a.8.8 0 01.8 1l-1.7 5.4a1.5 1.5 0 01-1.4 1H3.4a.8.8 0 01-.8-1l1.6-5.6a1 1 0 01.9-.8z" fill="currentColor" /></>
        : <path d="M2 5.5A1.5 1.5 0 013.5 4h4l1.6 1.8h7.4A1.5 1.5 0 0118 7.3v7.2a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 012 14.5z" fill="currentColor" />}
    </svg>
  );
}
function DocIcon() {
  return (
    <svg className="dt-ico dt-ico-doc" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <path d="M5 2.5h6.5L15.5 6.5V17a.5.5 0 01-.5.5H5a.5.5 0 01-.5-.5V3a.5.5 0 01.5-.5z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M11.5 2.5V6.5h4M7 10h6M7 13h4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function FolderPlusIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M2 5.5A1.5 1.5 0 013.5 4h4l1.6 1.8h7.4A1.5 1.5 0 0118 7.3v7.2a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 012 14.5z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 8.5v5M7.5 11h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function PlusDocIcon() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
      <path d="M11 2.5H5a.5.5 0 00-.5.5v14a.5.5 0 00.5.5h10a.5.5 0 00.5-.5V7M11 2.5l4.5 4.5M11 2.5V7h4.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M10 9.5v5M7.5 12h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
