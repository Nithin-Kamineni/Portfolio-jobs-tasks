// The Today page's own data: deadlines (with a countdown) and the checklist items inside documents.
// Routed from workspace.ts: /api/ws/deadlines… and /api/ws/doc-tasks….
import { HttpError } from './repo';
import { absent, capture, quote, record } from './history';

type Body = Record<string, unknown>;
const now = () => new Date().toISOString();
const KINDS = ['paper', 'application', 'exam', 'interview', 'other'];
const TZS = ['local', 'AoE', 'UTC'];

function text(b: Body, k: string, max: number, required = false): string {
  const v = b[k] ?? '';
  if (typeof v !== 'string' || v.length > max || (required && !v.trim())) throw new HttpError(400, `Invalid ${k}`);
  return v.trim();
}
function fields(b: Body, cur: Record<string, unknown> = {}) {
  const m = { ...cur, ...b };
  const due_on = text(m, 'due_on', 10, true);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due_on)) throw new HttpError(400, 'Invalid due_on: use YYYY-MM-DD');
  const due_time = m.due_time ? text(m, 'due_time', 5) : null;
  if (due_time && !/^\d{2}:\d{2}$/.test(due_time)) throw new HttpError(400, 'Invalid due_time: use HH:MM');
  const url = text(m, 'url', 2000);
  if (url && !/^https?:\/\//i.test(url)) throw new HttpError(400, 'Invalid url: use an http(s) link');
  const kind = String(m.kind ?? 'other'), tz = String(m.tz ?? 'local');
  if (!KINDS.includes(kind) || !TZS.includes(tz)) throw new HttpError(400, 'Invalid kind or tz');
  const size = String(m.size ?? 'M');
  if (!['L', 'M', 'S'].includes(size)) throw new HttpError(400, 'Invalid size: L, M or S');
  return { title: text(m, 'title', 200, true), due_on, due_time, tz, kind, note: text(m, 'note', 4000), url, size, shown: m.shown === undefined ? 1 : m.shown ? 1 : 0,
    done_at: m.done ? (cur.done_at ?? now()) : m.done === false ? null : (cur.done_at ?? null) };
}

export async function deadlines(db: D1Database, method: string, rest: string[], b: Body) {
  if (!rest.length && method === 'GET') return (await db.prepare('SELECT * FROM deadlines ORDER BY done_at IS NOT NULL, due_on, due_time').all()).results;
  if (!rest.length && method === 'POST') {
    const f = fields(b), at = now();
    const row = await db.prepare('INSERT INTO deadlines(title,due_on,due_time,tz,kind,note,url,size,shown,done_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) RETURNING *')
      .bind(f.title, f.due_on, f.due_time, f.tz, f.kind, f.note, f.url, f.size, 1, f.done_at, at, at).first<Record<string, unknown>>();
    await record(db, { area: 'today', action: 'create', label: `Added deadline ${quote(f.title)} (${f.due_on})`, before: [absent('deadlines', [{ id: row!.id }])] });
    return row;
  }
  // The deadline selector: which deadlines the Today page shows (everything listed counts as looked at).
  if (rest[0] === 'select' && method === 'POST') {
    const ids = (k: string) => (Array.isArray(b[k]) ? (b[k] as unknown[]).map(Number).filter(Number.isInteger) : []);
    const on = ids('shown'), off = ids('hidden'), all = [...on, ...off];
    if (!all.length) return { ok: true };
    if (all.length > 500) throw new HttpError(400, 'Too many deadlines');
    const before = await capture(db, 'deadlines', `id IN (${all.map(() => '?').join(',')})`, all, 'id,shown,seen');
    const at = now();
    await db.batch([
      ...(on.length ? [db.prepare(`UPDATE deadlines SET shown=1,seen=1,updated_at=? WHERE id IN (${on.map(() => '?').join(',')})`).bind(at, ...on)] : []),
      ...(off.length ? [db.prepare(`UPDATE deadlines SET shown=0,seen=1,updated_at=? WHERE id IN (${off.map(() => '?').join(',')})`).bind(at, ...off)] : []),
    ]);
    await record(db, { area: 'today', action: 'update', label: `Chose the deadlines on the Today page (${on.length} shown, ${off.length} hidden)`, before: [before] });
    return { ok: true };
  }
  const id = Number(rest[0]);
  const cur = Number.isInteger(id) ? await db.prepare('SELECT * FROM deadlines WHERE id=?').bind(id).first<Record<string, unknown>>() : null;
  if (!cur) throw new HttpError(404, 'Deadline not found');
  if (method === 'PATCH') {
    const before = await capture(db, 'deadlines', 'id=?', [id]);
    const f = fields(b, cur);
    const row = await db.prepare('UPDATE deadlines SET title=?,due_on=?,due_time=?,tz=?,kind=?,note=?,url=?,size=?,shown=?,done_at=?,updated_at=? WHERE id=? RETURNING *')
      .bind(f.title, f.due_on, f.due_time, f.tz, f.kind, f.note, f.url, f.size, f.shown, f.done_at, now(), id).first();
    const label = 'done' in b ? `${b.done ? 'Finished' : 'Reopened'} deadline ${quote(f.title)}`
      : 'size' in b && Object.keys(b).length === 1 ? `Made deadline ${quote(f.title)} ${({ L: 'large', M: 'medium', S: 'small' } as Record<string, string>)[f.size]}` : `Edited deadline ${quote(f.title)}`;
    await record(db, { area: 'today', action: 'update', label, entity: `deadline:${id}`, before: [before] });
    return row;
  }
  if (method === 'DELETE') {
    const before = await capture(db, 'deadlines', 'id=?', [id]);
    await db.prepare('DELETE FROM deadlines WHERE id=?').bind(id).run();
    await record(db, { area: 'today', action: 'delete', label: `Deleted deadline ${quote(cur.title)}`, before: [before] });
    return { ok: true };
  }
  throw new HttpError(404, 'Not found');
}

// ---- checklist items in documents --------------------------------------------------------------
interface PMNode { type: string; attrs?: Record<string, unknown>; content?: PMNode[]; text?: string }
const plain = (n: PMNode): string => (n.text ?? '') + (n.content ?? []).filter((c) => c.type !== 'taskList' && c.type !== 'bulletList' && c.type !== 'orderedList').map(plain).join(n.type === 'paragraph' ? '' : ' ');
/** Every task item of a document, in document order (nested ones too). */
function tasksOf(doc: PMNode) {
  const out: { node: PMNode; text: string; checked: boolean; due: string | null }[] = [];
  const walk = (n: PMNode) => {
    if (n.type === 'taskItem') out.push({ node: n, text: plain(n).replace(/\s+/g, ' ').trim(), checked: !!n.attrs?.checked, due: (n.attrs?.due as string) || null });
    for (const c of n.content ?? []) walk(c);
  };
  walk(doc);
  return out;
}

export async function docTasks(db: D1Database, method: string, rest: string[], b: Body) {
  if (!rest.length && method === 'GET') {
    const docs = (await db.prepare("SELECT id,title,folder_id,content,updated_at FROM docs WHERE deleted_at IS NULL AND content LIKE '%\"taskItem\"%'").all()).results as { id: number; title: string; folder_id: number | null; content: string; updated_at: string }[];
    const out: unknown[] = [];
    for (const d of docs) {
      let json: PMNode; try { json = JSON.parse(d.content); } catch { continue; }
      tasksOf(json).forEach((t, index) => { if (!t.checked && t.text) out.push({ doc_id: d.id, doc_title: d.title, folder_id: d.folder_id, index, text: t.text, due: t.due }); });
    }
    return out;
  }
  // PATCH doc-tasks/<docId>/<index> {checked, text}: tick an item from the Today page. The text must
  // still match, so an item that moved or changed meanwhile is never ticked by mistake.
  const docId = Number(rest[0]), index = Number(rest[1]);
  if (method === 'PATCH' && Number.isInteger(docId) && Number.isInteger(index)) {
    const cur = await db.prepare('SELECT * FROM docs WHERE id=? AND deleted_at IS NULL').bind(docId).first<Record<string, unknown>>();
    if (!cur) throw new HttpError(404, 'Document not found');
    let json: PMNode; try { json = JSON.parse(String(cur.content)); } catch { throw new HttpError(409, 'The document could not be read'); }
    const t = tasksOf(json)[index];
    if (!t || t.text !== String(b.text ?? '')) throw new HttpError(409, 'This item changed in its document. Reload the Today page.');
    t.node.attrs = { ...t.node.attrs, checked: !!b.checked };
    const row = await db.prepare('UPDATE docs SET content=?,updated_at=?,version=version+1 WHERE id=? AND version=? RETURNING id,version')
      .bind(JSON.stringify(json), now(), docId, cur.version).first();
    if (!row) throw new HttpError(409, 'The document is being edited. Try again.');
    await record(db, { area: 'docs', action: 'update', label: `${b.checked ? 'Ticked' : 'Unticked'} “${t.text.slice(0, 60)}” in ${quote(cur.title)}`,
      before: [{ table: 'docs', keys: [{ id: docId }], rows: [{ id: docId, content: cur.content }] }] });
    return row;
  }
  throw new HttpError(404, 'Not found');
}

// ---- the search index: everything searchable in the workspace, in one request ----------------------
// The browser builds its own word index from this (search/engine.ts); coding problems come from the
// bundled roadmap files, only their notes are here.
export async function searchIndex(db: D1Database) {
  const all = (sql: string) => db.prepare(sql).all().then((r) => r.results);
  const [docs, folders, papers, tracks, modules, items, cards, quiz, questions, coding, dls] = await Promise.all([
    all('SELECT id,title,text,folder_id FROM docs WHERE deleted_at IS NULL'),
    all('SELECT id,name,parent_id FROM doc_folders'),
    all('SELECT id,title,authors,venue,year,notes,status,hidden FROM papers'),
    all('SELECT id,title,summary,goal,hidden FROM prep_tracks'),
    all('SELECT id,track_id,title FROM prep_modules'),
    all('SELECT id,module_id,title,note,my_notes,kind,status FROM prep_items'),
    all('SELECT id,track,front,back,suspended FROM cards'),
    all('SELECT id,track,q,options,explain FROM quiz_questions'),
    all('SELECT id,category,question,answer_md,topics,concepts,my_answer FROM questions'),
    all("SELECT slug,notes FROM coding_progress WHERE notes<>''"),
    all('SELECT id,title,due_on,note,kind,done_at FROM deadlines'),
  ]);
  return { at: new Date().toISOString(), docs, folders, papers, tracks, modules, items, cards, quiz, questions, coding, deadlines: dls };
}
