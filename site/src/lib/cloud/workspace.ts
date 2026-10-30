// API for the workspace (/app/tasks): reading list, interview prep, docs, coding progress.
// Routed from src/pages/api/[...path].ts under /api/ws/…; every write is validated here, and every
// write is recorded in the change history (history.ts) so it can be undone from the History tab.
import { HttpError } from './repo';
import { studyApi } from './study';
import { absent, capture, historyApi, quote, record } from './history';
import { deadlines, docTasks, searchIndex } from './today';

type Body = Record<string, unknown>;
const now = () => new Date().toISOString();

const PAPER_STATUS = ['to_read', 'reading', 'read', 'skipped'];
const PAPER_STATUS_LABEL: Record<string, string> = { to_read: 'To read', reading: 'Reading', read: 'Read', skipped: 'Skipped' };
const PREP_STATUS = ['todo', 'doing', 'done', 'skipped'];
const PREP_STATUS_LABEL: Record<string, string> = { todo: 'To do', doing: 'In progress', done: 'Done', skipped: 'Skipped' };
const PREP_KIND = ['video', 'reading', 'course', 'exercise', 'project', 'concept'];
const CODING_STATUS = ['todo', 'attempted', 'solved'];

function str(b: Body, key: string, max: number, opts: { required?: boolean } = {}): string {
  const v = b[key] ?? '';
  if (typeof v !== 'string' || v.length > max || (opts.required && !v.trim())) throw new HttpError(400, `Invalid ${key}`);
  return v.trim();
}
function oneOf(b: Body, key: string, list: string[], fallback: string): string {
  const v = b[key] ?? fallback;
  if (typeof v !== 'string' || !list.includes(v)) throw new HttpError(400, `Invalid ${key}`);
  return v;
}
function url(b: Body, key = 'url'): string {
  const v = str(b, key, 2000);
  if (v && !/^https?:\/\//i.test(v)) throw new HttpError(400, `Invalid ${key}: use an http(s) link`);
  return v;
}
function domains(b: Body): string {
  const v = b.domains ?? [];
  if (!Array.isArray(v) || v.length > 12 || v.some((d) => typeof d !== 'string' || !/^[a-z0-9-]{1,30}$/.test(d))) throw new HttpError(400, 'Invalid domains');
  return JSON.stringify([...new Set(v as string[])]);
}
function year(b: Body): number | null {
  const v = b.year;
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1950 || n > 2100) throw new HttpError(400, 'Invalid year');
  return n;
}
function int(b: Body, key: string, max: number): number | null {
  const v = b[key];
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > max) throw new HttpError(400, `Invalid ${key}`);
  return n;
}
const impact = (b: Body) => str({ impact: b.impact == null ? '' : String(b.impact) }, 'impact', 100);
function version(b: Body): number {
  if (!Number.isInteger(b.version) || Number(b.version) < 1) throw new HttpError(400, 'version is required');
  return Number(b.version);
}
const conflict = (what: string) => new HttpError(409, `This ${what} changed in another tab. Reload before saving.`);
function intIds(v: unknown, max: number) {
  if (!Array.isArray(v) || v.length > max || v.some((i) => !Number.isInteger(i))) throw new HttpError(400, 'Invalid ids');
  return v as number[];
}

// ---- papers -------------------------------------------------------------------------------------
async function papers(db: D1Database, method: string, rest: string[], b: Body) {
  if (!rest.length && method === 'GET') return (await db.prepare('SELECT * FROM papers ORDER BY position, id').all()).results;
  if (!rest.length && method === 'POST') {
    const at = now(), status = oneOf(b, 'status', PAPER_STATUS, 'to_read');
    const pos = await db.prepare('SELECT COALESCE(MAX(position),0)+1 AS p FROM papers').first<{ p: number }>();
    const row = await db.prepare('INSERT INTO papers(position,title,authors,venue,year,url,status,domains,notes,pages,citations,citations_at,impact,source,read_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING *')
      .bind(pos!.p, str(b, 'title', 500, { required: true }), str(b, 'authors', 2000), str(b, 'venue', 300), year(b), url(b), status, domains(b), str(b, 'notes', 20000),
        int(b, 'pages', 5000), int(b, 'citations', 10_000_000), int(b, 'citations', 10_000_000) === null ? null : at.slice(0, 10), impact(b), 'manual', status === 'read' ? at : null, at, at).first<Body>();
    await record(db, { area: 'reading', action: 'create', label: `Added paper ${quote(row!.title)}`, before: [absent('papers', [row!])] });
    return row;
  }
  if (rest[0] === 'reorder' && method === 'POST') {
    const ids = intIds(b.ids, 5000);
    const before = await capture(db, 'papers', '1=1', [], 'id,position');
    await db.batch(ids.map((id, i) => db.prepare('UPDATE papers SET position=? WHERE id=?').bind(i + 1, id)));
    await record(db, { area: 'reading', action: 'reorder', label: 'Reordered the reading list', entity: 'papers:reorder', before: [before] });
    return { ok: true };
  }
  const id = Number(rest[0]);
  if (!Number.isInteger(id)) throw new HttpError(404, 'Not found');
  if (method === 'PATCH') {
    const cur = await db.prepare('SELECT * FROM papers WHERE id=?').bind(id).first<Record<string, unknown>>();
    if (!cur) throw new HttpError(404, 'Paper not found');
    const m: Body = { ...cur, ...b, domains: 'domains' in b ? b.domains : JSON.parse(String(cur.domains)) };
    const status = oneOf(m, 'status', PAPER_STATUS, 'to_read'), at = now();
    const row = await db.prepare(`UPDATE papers SET title=?,authors=?,venue=?,year=?,url=?,status=?,domains=?,notes=?,pages=?,
        citations_at=CASE WHEN ? IS NOT citations THEN ? ELSE citations_at END,citations=?,impact=?,hidden=?,
        read_at=CASE WHEN ?='read' THEN COALESCE(read_at,?) ELSE NULL END,updated_at=?,version=version+1 WHERE id=? AND version=? RETURNING *`)
      .bind(str(m, 'title', 500, { required: true }), str(m, 'authors', 2000), str(m, 'venue', 300), year(m), url(m), status, domains(m), str(m, 'notes', 20000),
        int(m, 'pages', 5000), int(m, 'citations', 10_000_000), at.slice(0, 10), int(m, 'citations', 10_000_000), impact(m), m.hidden ? 1 : 0,
        status, at, at, id, version(b)).first();
    if (!row) throw conflict('paper');
    const keys = Object.keys(b).filter((k) => k !== 'version');
    const [kind, label] = keys.length === 1 && keys[0] === 'status' ? ['status', `Paper ${quote(cur.title)}: ${PAPER_STATUS_LABEL[status]}`]
      : keys.length === 1 && keys[0] === 'hidden' ? ['hidden', `${m.hidden ? 'Hid' : 'Unhid'} paper ${quote(cur.title)}`]
      : ['edit', `Edited paper ${quote(cur.title)}`];
    await record(db, { area: 'reading', action: 'update', label, entity: `paper:${id}:${kind}`, before: [{ table: 'papers', keys: [{ id }], rows: [cur] }] });
    return row;
  }
  if (method === 'DELETE') {
    const [paper, members] = [await capture(db, 'papers', 'id=?', [id]), await capture(db, 'reading_project_papers', 'paper_id=?', [id])];
    if (!paper.rows.length) throw new HttpError(404, 'Paper not found');
    await db.batch([db.prepare('DELETE FROM reading_project_papers WHERE paper_id=?').bind(id), db.prepare('DELETE FROM papers WHERE id=?').bind(id)]);
    await record(db, { area: 'reading', action: 'delete', label: `Deleted paper ${quote(paper.rows[0].title)}`, before: [paper, members] });
    return { ok: true };
  }
  throw new HttpError(404, 'Not found');
}

// ---- reading projects (ordered paper lists) ------------------------------------------------------
async function projects(db: D1Database, method: string, rest: string[], b: Body) {
  const list = async () => {
    const [ps, items] = await db.batch([
      db.prepare('SELECT * FROM reading_projects ORDER BY position, id'),
      db.prepare('SELECT project_id, paper_id, position, note FROM reading_project_papers ORDER BY project_id, position'),
    ]);
    const by = new Map<number, unknown[]>();
    for (const r of items.results as { project_id: number }[]) by.set(r.project_id, [...(by.get(r.project_id) ?? []), r]);
    return (ps.results as { id: number }[]).map((p) => ({ ...p, items: by.get(p.id) ?? [] }));
  };
  if (!rest.length && method === 'GET') return list();
  if (!rest.length && method === 'POST') {
    const at = now(), pos = await db.prepare('SELECT COALESCE(MAX(position),0)+1 AS p FROM reading_projects').first<{ p: number }>();
    const name = str(b, 'name', 100, { required: true });
    const row = await db.prepare('INSERT INTO reading_projects(name,position,created_at,updated_at) VALUES(?,?,?,?) RETURNING id').bind(name, pos!.p, at, at).first<{ id: number }>();
    await record(db, { area: 'reading', action: 'create', label: `Created project ${quote(name)}`, before: [absent('reading_projects', [row!])] });
    return list();
  }
  const id = Number(rest[0]);
  const proj = Number.isInteger(id) ? await db.prepare('SELECT * FROM reading_projects WHERE id=?').bind(id).first<Body>() : null;
  if (!proj) throw new HttpError(404, 'Project not found');
  const pid = Number(rest[2]);
  const paperTitle = async (p: number) => (await db.prepare('SELECT title FROM papers WHERE id=?').bind(p).first<{ title: string }>())?.title ?? `paper ${p}`;
  if (rest.length === 1 && method === 'PATCH') {
    const name = str(b, 'name', 100, { required: true });
    await db.prepare('UPDATE reading_projects SET name=?,updated_at=? WHERE id=?').bind(name, now(), id).run();
    await record(db, { area: 'reading', action: 'update', label: `Renamed project ${quote(proj.name)} to ${quote(name)}`, before: [{ table: 'reading_projects', keys: [{ id }], rows: [proj] }] });
  } else if (rest.length === 1 && method === 'DELETE') {
    const members = await capture(db, 'reading_project_papers', 'project_id=?', [id]);
    await db.batch([db.prepare('DELETE FROM reading_project_papers WHERE project_id=?').bind(id), db.prepare('DELETE FROM reading_projects WHERE id=?').bind(id)]);
    await record(db, { area: 'reading', action: 'delete', label: `Deleted project ${quote(proj.name)} (${members.rows.length} papers; the papers stay in the list)`, before: [{ table: 'reading_projects', keys: [{ id }], rows: [proj] }, members] });
  } else if (rest[1] === 'reorder' && method === 'POST') {
    const ids = intIds(b.ids, 2000);
    const before = await capture(db, 'reading_project_papers', 'project_id=?', [id]);
    await db.batch(ids.map((p, i) => db.prepare('UPDATE reading_project_papers SET position=? WHERE project_id=? AND paper_id=?').bind(i + 1, id, p)));
    await record(db, { area: 'reading', action: 'reorder', label: `Reordered project ${quote(proj.name)}`, entity: `project:${id}:reorder`, before: [before] });
  } else if (rest[1] === 'papers' && !rest[2] && method === 'POST') {
    const p = Number(b.paper_id);
    if (!Number.isInteger(p) || !(await db.prepare('SELECT id FROM papers WHERE id=?').bind(p).first())) throw new HttpError(400, 'Unknown paper');
    const res = await db.prepare('INSERT OR IGNORE INTO reading_project_papers(project_id,paper_id,position,note) VALUES(?,?,(SELECT COALESCE(MAX(position),0)+1 FROM reading_project_papers WHERE project_id=?),?)')
      .bind(id, p, id, str(b, 'note', 200)).run();
    if (res.meta.changes) await record(db, { area: 'reading', action: 'create', label: `Added ${quote(await paperTitle(p))} to project ${quote(proj.name)}`, before: [absent('reading_project_papers', [{ project_id: id, paper_id: p }])] });
  } else if (rest[1] === 'papers' && Number.isInteger(pid) && method === 'PATCH') {
    const before = await capture(db, 'reading_project_papers', 'project_id=? AND paper_id=?', [id, pid]);
    await db.prepare('UPDATE reading_project_papers SET note=? WHERE project_id=? AND paper_id=?').bind(str(b, 'note', 200), id, pid).run();
    await record(db, { area: 'reading', action: 'update', label: `Project note on ${quote(await paperTitle(pid))}`, entity: `project:${id}:note:${pid}`, before: [before] });
  } else if (rest[1] === 'papers' && Number.isInteger(pid) && method === 'DELETE') {
    const before = await capture(db, 'reading_project_papers', 'project_id=? AND paper_id=?', [id, pid]);
    await db.prepare('DELETE FROM reading_project_papers WHERE project_id=? AND paper_id=?').bind(id, pid).run();
    if (before.rows.length) await record(db, { area: 'reading', action: 'delete', label: `Removed ${quote(await paperTitle(pid))} from project ${quote(proj.name)}`, before: [before] });
  } else throw new HttpError(404, 'Not found');
  return list();
}

// ---- interview prep -----------------------------------------------------------------------------
async function prep(db: D1Database, method: string, rest: string[], b: Body) {
  if (!rest.length && method === 'GET') {
    const since = new Date(Date.now() - 371 * 864e5).toISOString();
    const [tracks, modules, items, log] = await db.batch([
      db.prepare('SELECT * FROM prep_tracks ORDER BY position'),
      db.prepare('SELECT * FROM prep_modules ORDER BY track_id, position'),
      db.prepare('SELECT * FROM prep_items ORDER BY module_id, position'),
      db.prepare('SELECT item_id, status, at FROM prep_log WHERE at>=? ORDER BY at').bind(since),
    ]);
    return { tracks: tracks.results, modules: modules.results, items: items.results, log: log.results };
  }
  if (rest[0] === 'focus') return focus(db, method, rest.slice(1), b);
  if (rest[0] === 'tracks' && rest[1] && method === 'PATCH') {
    // hidden: drop a track from the dashboard; suggested=false: keep a suggested track for good.
    const cur = await db.prepare('SELECT * FROM prep_tracks WHERE id=?').bind(rest[1]).first<{ id: string; title: string; hidden: number; suggested: number }>();
    if (!cur) throw new HttpError(404, 'Track not found');
    const hidden = 'hidden' in b ? (b.hidden ? 1 : 0) : cur.hidden, suggested = 'suggested' in b ? (b.suggested ? 1 : 0) : cur.suggested;
    const row = await db.prepare('UPDATE prep_tracks SET hidden=?,suggested=? WHERE id=? RETURNING *').bind(hidden, suggested, rest[1]).first();
    await record(db, { area: 'prep', action: 'update', label: hidden !== cur.hidden ? `${hidden ? 'Hid' : 'Restored'} track ${quote(cur.title)}` : `Kept suggested track ${quote(cur.title)}`, before: [{ table: 'prep_tracks', keys: [{ id: cur.id }], rows: [cur] }] });
    return row;
  }
  if (rest[0] === 'items' && !rest[1] && method === 'POST') {
    const moduleId = str(b, 'module_id', 80, { required: true });
    const mod = await db.prepare('SELECT id FROM prep_modules WHERE id=?').bind(moduleId).first();
    if (!mod) throw new HttpError(400, 'Unknown module');
    const pos = await db.prepare('SELECT COALESCE(MAX(position),0)+1 AS p FROM prep_items WHERE module_id=?').bind(moduleId).first<{ p: number }>();
    const est = b.est === '' || b.est == null ? null : Number(b.est);
    if (est !== null && !(est >= 0 && est < 1000)) throw new HttpError(400, 'Invalid est');
    const id = `${moduleId}-c${Date.now().toString(36)}`;
    const row = await db.prepare('INSERT INTO prep_items(id,module_id,position,title,kind,url,est,custom,updated_at) VALUES(?,?,?,?,?,?,?,1,?) RETURNING *')
      .bind(id, moduleId, pos!.p, str(b, 'title', 300, { required: true }), oneOf(b, 'kind', PREP_KIND, 'concept'), url(b), est, now()).first<Body>();
    // An item added while a focus is open joins that focus.
    const fid = Number(b.focus_id);
    if (Number.isInteger(fid) && fid > 0) await db.prepare('INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) SELECT id,? FROM prep_focus WHERE id=?').bind(id, fid).run();
    await record(db, { area: 'prep', action: 'create', label: `Added prep item ${quote(row!.title)}`, before: [absent('prep_items', [row!]), absent('prep_focus_items', Number.isInteger(fid) && fid > 0 ? [{ focus_id: fid, item_id: id }] : [])] });
    return row;
  }
  if (rest[0] === 'items' && rest[1]) {
    const id = rest[1];
    const cur = await db.prepare('SELECT * FROM prep_items WHERE id=?').bind(id).first<Record<string, unknown>>();
    if (!cur) throw new HttpError(404, 'Item not found');
    if (method === 'DELETE') {
      if (!cur.custom) throw new HttpError(400, 'Only items you added can be deleted; mark others as skipped');
      const before = [{ table: 'prep_items', keys: [{ id }], rows: [cur] }, await capture(db, 'prep_log', 'item_id=?', [id]), await capture(db, 'prep_plan', 'item_id=?', [id]), await capture(db, 'prep_focus_items', 'item_id=?', [id])];
      await db.batch([db.prepare('DELETE FROM prep_items WHERE id=?').bind(id), db.prepare('DELETE FROM prep_log WHERE item_id=?').bind(id),
        db.prepare('DELETE FROM prep_plan WHERE item_id=?').bind(id), db.prepare('DELETE FROM prep_focus_items WHERE item_id=?').bind(id)]);
      await record(db, { area: 'prep', action: 'delete', label: `Deleted prep item ${quote(cur.title)}`, before });
      return { ok: true };
    }
    if (method === 'PATCH') {
      const m = { ...cur, ...b };
      const status = oneOf(m, 'status', PREP_STATUS, 'todo');
      const confidence = Number(m.confidence ?? 0);
      if (!Number.isInteger(confidence) || confidence < 0 || confidence > 5) throw new HttpError(400, 'Invalid confidence');
      const at = now();
      // Dismissed from "Continue" until the status changes again.
      const hideContinue = 'hide_continue' in b ? (b.hide_continue ? 1 : 0) : status !== cur.status ? 0 : Number(cur.hide_continue ?? 0);
      const stmts = [db.prepare(`UPDATE prep_items SET status=?,confidence=?,my_notes=?,hide_continue=?,
          started_at=CASE WHEN ? IN ('doing','done') THEN COALESCE(started_at,?) ELSE started_at END,
          done_at=CASE WHEN ?='done' THEN COALESCE(done_at,?) ELSE NULL END,updated_at=? WHERE id=?`)
        .bind(status, confidence, str(m, 'my_notes', 20000), hideContinue, status, at, status, at, at, id)];
      if (status !== cur.status) stmts.push(db.prepare('INSERT INTO prep_log(item_id,status,at) VALUES(?,?,?)').bind(id, status, at));
      await db.batch(stmts);
      const field = 'status' in b ? 'status' : 'confidence' in b ? 'confidence' : 'my_notes' in b ? 'notes' : 'continue';
      const label = field === 'status' ? `${quote(cur.title)}: ${PREP_STATUS_LABEL[status]}` : field === 'confidence' ? `${quote(cur.title)}: confidence ${confidence}/5`
        : field === 'notes' ? `Notes on ${quote(cur.title)}` : `Removed ${quote(cur.title)} from Continue`;
      await record(db, { area: 'prep', action: 'update', label, entity: `prep:${id}:${field}`, before: [{ table: 'prep_items', keys: [{ id }], rows: [cur] }] });
      return db.prepare('SELECT * FROM prep_items WHERE id=?').bind(id).first();
    }
  }
  throw new HttpError(404, 'Not found');
}

// ---- prep focuses: named subsets of the curriculum (cards, quizzes and questions follow them) -----
async function focus(db: D1Database, method: string, rest: string[], b: Body) {
  const list = async () => {
    const [fs, items] = await db.batch([
      db.prepare('SELECT * FROM prep_focus ORDER BY position, id'),
      db.prepare('SELECT focus_id, item_id FROM prep_focus_items'),
    ]);
    const by = new Map<number, string[]>();
    for (const r of items.results as { focus_id: number; item_id: string }[]) by.set(r.focus_id, [...(by.get(r.focus_id) ?? []), r.item_id]);
    return (fs.results as { id: number }[]).map((f) => ({ ...f, items: by.get(f.id) ?? [] }));
  };
  if (!rest.length && method === 'GET') return list();
  if (!rest.length && method === 'POST') {
    const at = now(), name = str(b, 'name', 100, { required: true });
    const pos = await db.prepare('SELECT COALESCE(MAX(position),0)+1 AS p FROM prep_focus').first<{ p: number }>();
    const row = await db.prepare('INSERT INTO prep_focus(name,description,position,created_at,updated_at) VALUES(?,?,?,?,?) RETURNING id').bind(name, str(b, 'description', 500), pos!.p, at, at).first<{ id: number }>();
    // Optionally start from a copy of another focus.
    const from = Number(b.copy_from);
    if (Number.isInteger(from) && from > 0) await db.prepare('INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) SELECT ?, item_id FROM prep_focus_items WHERE focus_id=?').bind(row!.id, from).run();
    const added = await capture(db, 'prep_focus_items', 'focus_id=?', [row!.id]);
    await record(db, { area: 'prep', action: 'create', label: `Created focus ${quote(name)}`, before: [absent('prep_focus', [row!]), absent('prep_focus_items', added.keys)] });
    return { focus: await list(), id: row!.id };
  }
  const id = Number(rest[0]);
  const cur = Number.isInteger(id) ? await db.prepare('SELECT * FROM prep_focus WHERE id=?').bind(id).first<Body>() : null;
  if (!cur) throw new HttpError(404, 'Focus not found');
  const self = { table: 'prep_focus', keys: [{ id }], rows: [cur] };
  if (rest.length === 1 && method === 'PATCH') {
    const name = 'name' in b ? str(b, 'name', 100, { required: true }) : String(cur.name);
    const description = 'description' in b ? str(b, 'description', 500) : String(cur.description);
    await db.prepare('UPDATE prep_focus SET name=?,description=?,updated_at=? WHERE id=?').bind(name, description, now(), id).run();
    await record(db, { area: 'prep', action: 'update', label: name !== cur.name ? `Renamed focus ${quote(cur.name)} to ${quote(name)}` : `Edited focus ${quote(name)}`, before: [self] });
  } else if (rest.length === 1 && method === 'DELETE') {
    const items = await capture(db, 'prep_focus_items', 'focus_id=?', [id]);
    await db.batch([db.prepare('DELETE FROM prep_focus_items WHERE focus_id=?').bind(id), db.prepare('DELETE FROM prep_focus WHERE id=?').bind(id)]);
    await record(db, { area: 'prep', action: 'delete', label: `Deleted focus ${quote(cur.name)} (${items.rows.length} items; the items stay in the curriculum)`, before: [self, items] });
  } else if (rest[1] === 'items' && method === 'POST') {
    // {ids: [...], on: true|false}: add or remove items (a whole module at once from the UI).
    const ids = b.ids;
    if (!Array.isArray(ids) || !ids.length || ids.length > 500 || ids.some((i) => typeof i !== 'string' || !/^[A-Za-z0-9_.-]{1,120}$/.test(i))) throw new HttpError(400, 'Invalid ids');
    const keys = (ids as string[]).map((item_id) => ({ focus_id: id, item_id }));
    const have = new Set(((await db.prepare('SELECT item_id FROM prep_focus_items WHERE focus_id=?').bind(id).all()).results as { item_id: string }[]).map((r) => r.item_id));
    const on = b.on !== false;
    const touched = keys.filter((k) => have.has(k.item_id) !== on);
    if (touched.length) {
      await db.batch(touched.map((k) => on ? db.prepare('INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(?,?)').bind(id, k.item_id)
        : db.prepare('DELETE FROM prep_focus_items WHERE focus_id=? AND item_id=?').bind(id, k.item_id)));
      const one = touched.length === 1 ? await db.prepare('SELECT title FROM prep_items WHERE id=?').bind(touched[0].item_id).first<{ title: string }>() : null;
      const what = one ? quote(one.title) : `${touched.length} items`;
      await record(db, { area: 'prep', action: on ? 'create' : 'delete', label: on ? `Added ${what} to focus ${quote(cur.name)}` : `Removed ${what} from focus ${quote(cur.name)}`,
        before: [{ table: 'prep_focus_items', keys: touched, rows: on ? [] : touched }] });
    }
  } else throw new HttpError(404, 'Not found');
  return { focus: await list(), id };
}

// ---- docs ---------------------------------------------------------------------------------------
async function docs(db: D1Database, method: string, rest: string[], b: Body) {
  if (!rest.length && method === 'GET') {
    // The bin keeps documents for 30 days.
    await db.prepare('DELETE FROM docs WHERE deleted_at IS NOT NULL AND deleted_at < ?').bind(new Date(Date.now() - 30 * 864e5).toISOString()).run();
    return (await db.prepare('SELECT id,title,substr(text,1,200) AS preview,pinned,folder_id,created_at,updated_at,deleted_at,version FROM docs ORDER BY pinned DESC, updated_at DESC').all()).results;
  }
  if (!rest.length && method === 'POST') {
    const at = now();
    return db.prepare('INSERT INTO docs(title,content,text,folder_id,created_at,updated_at) VALUES(?,?,?,?,?,?) RETURNING *')
      .bind(str(b, 'title', 300) || 'Untitled document', str(b, 'content', 900_000), str(b, 'text', 300_000), await folderRef(db, b.folder_id), at, at).first();
  }
  const id = Number(rest[0]);
  if (!Number.isInteger(id)) throw new HttpError(404, 'Not found');
  if (rest[1] === 'versions') return versions(db, id, method, rest.slice(2));
  if (method === 'GET') {
    const row = await db.prepare('SELECT * FROM docs WHERE id=?').bind(id).first();
    if (!row) throw new HttpError(404, 'Document not found');
    return row;
  }
  if (method === 'PATCH') {
    const cur = await db.prepare('SELECT * FROM docs WHERE id=?').bind(id).first<Record<string, unknown>>();
    if (!cur) throw new HttpError(404, 'Document not found');
    // Moving to or out of the bin never conflicts with edits: it touches only deleted_at.
    if ('deleted' in b && !['title', 'content', 'text', 'pinned'].some((k) => k in b)) {
      const row = await db.prepare('UPDATE docs SET deleted_at=?,version=version+1 WHERE id=? RETURNING *').bind(b.deleted ? now() : null, id).first();
      await record(db, { area: 'docs', action: b.deleted ? 'delete' : 'update', label: `${b.deleted ? 'Moved' : 'Restored'} document ${quote(cur.title)} ${b.deleted ? 'to' : 'from'} the bin`,
        before: [{ table: 'docs', keys: [{ id }], rows: [{ id, deleted_at: cur.deleted_at }] }] });
      return row;
    }
    // Moving into another folder touches only folder_id and keeps the version, so an open editor's next save doesn't conflict.
    if ('folder_id' in b && !['title', 'content', 'text', 'pinned', 'deleted'].some((k) => k in b)) {
      const to = await folderRef(db, b.folder_id);
      const row = await db.prepare('UPDATE docs SET folder_id=? WHERE id=? RETURNING *').bind(to, id).first();
      const name = to == null ? 'the top level' : quote((await db.prepare('SELECT name FROM doc_folders WHERE id=?').bind(to).first<{ name: string }>())?.name);
      await record(db, { area: 'docs', action: 'update', label: `Moved document ${quote(cur.title)} to ${name}`, before: [{ table: 'docs', keys: [{ id }], rows: [{ id, folder_id: cur.folder_id }] }] });
      return row;
    }
    const m = { ...cur, ...b };
    const deleted = cur.deleted_at;
    const row = await db.prepare('UPDATE docs SET title=?,content=?,text=?,pinned=?,deleted_at=?,updated_at=?,version=version+1 WHERE id=? AND version=? RETURNING *')
      .bind(str(m, 'title', 300) || 'Untitled document', str(m, 'content', 900_000), str(m, 'text', 300_000), m.pinned ? 1 : 0, deleted, now(), id, version(b)).first();
    if (!row) throw conflict('document');
    await autoVersion(db, row as Record<string, unknown>, cur);
    // Text edits have their own version history; renames and pins are recorded here.
    if ('title' in b && b.title !== cur.title) await record(db, { area: 'docs', action: 'update', label: `Renamed document ${quote(cur.title)} to ${quote((row as Body).title)}`, entity: `doc:${id}:title`, before: [{ table: 'docs', keys: [{ id }], rows: [{ id, title: cur.title }] }] });
    else if ('pinned' in b && Number(!!b.pinned) !== Number(cur.pinned)) await record(db, { area: 'docs', action: 'update', label: `${b.pinned ? 'Pinned' : 'Unpinned'} document ${quote(cur.title)}`, before: [{ table: 'docs', keys: [{ id }], rows: [{ id, pinned: cur.pinned }] }] });
    return row;
  }
  if (method === 'DELETE') {
    // Only from the trash: a document is moved to the trash first (PATCH deleted:true).
    const before = await capture(db, 'docs', 'id=? AND deleted_at IS NOT NULL', [id]);
    const res = await db.prepare('DELETE FROM docs WHERE id=? AND deleted_at IS NOT NULL').bind(id).run();
    if (!res.meta.changes) throw new HttpError(400, 'Move the document to the trash first');
    await db.prepare('DELETE FROM doc_versions WHERE doc_id=?').bind(id).run();
    await record(db, { area: 'docs', action: 'delete', label: `Deleted document ${quote(before.rows[0]?.title)} for good (its version history is gone)`, before: [before] });
    return { ok: true };
  }
  throw new HttpError(404, 'Not found');
}

// ---- document folders -----------------------------------------------------------------------------
async function folderRef(db: D1Database, v: unknown): Promise<number | null> {
  if (v === null || v === undefined || v === '') return null;
  const id = Number(v);
  if (!Number.isInteger(id) || !(await db.prepare('SELECT 1 FROM doc_folders WHERE id=?').bind(id).first())) throw new HttpError(400, 'Invalid folder');
  return id;
}
async function docFolders(db: D1Database, method: string, rest: string[], b: Body) {
  if (!rest.length && method === 'GET') return (await db.prepare('SELECT * FROM doc_folders ORDER BY position, id').all()).results;
  if (!rest.length && method === 'POST') {
    const parent = await folderRef(db, b.parent_id), at = now();
    const pos = (await db.prepare('SELECT COALESCE(MAX(position),0)+1 AS p FROM doc_folders').first<{ p: number }>())!.p;
    const row = await db.prepare('INSERT INTO doc_folders(name,parent_id,position,created_at,updated_at) VALUES(?,?,?,?,?) RETURNING *')
      .bind(str(b, 'name', 100, { required: true }), parent, pos, at, at).first<Record<string, unknown>>();
    await record(db, { area: 'docs', action: 'create', label: `Created folder ${quote(row!.name)}`, before: [absent('doc_folders', [{ id: row!.id }])] });
    return row;
  }
  const id = Number(rest[0]);
  const cur = Number.isInteger(id) ? await db.prepare('SELECT * FROM doc_folders WHERE id=?').bind(id).first<Record<string, unknown>>() : null;
  if (!cur) throw new HttpError(404, 'Folder not found');
  if (method === 'PATCH') {
    let parent = cur.parent_id as number | null;
    if ('parent_id' in b) {
      parent = await folderRef(db, b.parent_id);
      // A folder cannot go inside itself or one of its own subfolders.
      for (let p = parent; p != null; p = (await db.prepare('SELECT parent_id FROM doc_folders WHERE id=?').bind(p).first<{ parent_id: number | null }>())?.parent_id ?? null)
        if (p === id) throw new HttpError(400, 'A folder cannot go inside itself');
    }
    const name = 'name' in b ? str(b, 'name', 100, { required: true }) : String(cur.name);
    const row = await db.prepare('UPDATE doc_folders SET name=?,parent_id=?,updated_at=? WHERE id=? RETURNING *').bind(name, parent, now(), id).first();
    await record(db, { area: 'docs', action: 'update', entity: `folder:${id}`,
      label: name !== cur.name ? `Renamed folder ${quote(cur.name)} to ${quote(name)}` : `Moved folder ${quote(cur.name)}`,
      before: [{ table: 'doc_folders', keys: [{ id }], rows: [{ id, name: cur.name, parent_id: cur.parent_id }] }] });
    return row;
  }
  if (method === 'DELETE') {
    // Its documents and subfolders move up one level; nothing inside is deleted.
    const folder = await capture(db, 'doc_folders', 'id=?', [id]);
    const subs = await capture(db, 'doc_folders', 'parent_id=?', [id], 'id,parent_id');
    const docsIn = await capture(db, 'docs', 'folder_id=?', [id], 'id,folder_id');
    await db.batch([
      db.prepare('UPDATE doc_folders SET parent_id=? WHERE parent_id=?').bind(cur.parent_id, id),
      db.prepare('UPDATE docs SET folder_id=? WHERE folder_id=?').bind(cur.parent_id, id),
      db.prepare('DELETE FROM doc_folders WHERE id=?').bind(id),
    ]);
    const n = docsIn.rows.length;
    await record(db, { area: 'docs', action: 'delete', label: `Deleted folder ${quote(cur.name)}${n ? ` (its ${n} document${n === 1 ? '' : 's'} moved up a level)` : ''}`, before: [folder, subs, docsIn] });
    return { ok: true };
  }
  throw new HttpError(404, 'Not found');
}

// ---- images in documents --------------------------------------------------------------------------
// Uploaded as the raw file body (not JSON) from the editor, which shrinks big photos first. Documents
// refer to them as /api/ws/doc-images/<id>, so document rows and their versions stay small.
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'];
export const MAX_IMAGE_BYTES = 1_800_000;
export async function saveDocImage(db: D1Database, mime: string, data: ArrayBuffer, docId: unknown) {
  if (!IMAGE_TYPES.includes(mime)) throw new HttpError(415, 'Use a PNG, JPEG, WebP, GIF or AVIF image');
  if (!data.byteLength) throw new HttpError(400, 'Empty image');
  if (data.byteLength > MAX_IMAGE_BYTES) throw new HttpError(413, 'Image too large (max 1.8 MB after shrinking)');
  const doc = Number(docId);
  const row = await db.prepare('INSERT INTO doc_images(doc_id,mime,size,data,created_at) VALUES(?,?,?,?,?) RETURNING id')
    .bind(Number.isInteger(doc) && doc > 0 ? doc : null, mime, data.byteLength, data, now()).first<{ id: number }>();
  return { id: row!.id, src: `/api/ws/doc-images/${row!.id}` };
}
export async function readDocImage(db: D1Database, id: number) {
  const row = await db.prepare('SELECT mime, data FROM doc_images WHERE id=?').bind(id).first<{ mime: string; data: ArrayBuffer | number[] }>();
  if (!row) throw new HttpError(404, 'Image not found');
  return { mime: row.mime, data: row.data instanceof ArrayBuffer ? row.data : new Uint8Array(row.data).buffer };
}

// ---- document version history ---------------------------------------------------------------------
// An automatic snapshot at most every 10 minutes while the content changes, a manual one on Ctrl+S or
// "Save version", and one of the current text before every restore. The newest 100 per document stay.
const VERSION_GAP_MS = 10 * 60 * 1000;
async function snapshot(db: D1Database, doc: Record<string, unknown>, kind: 'auto' | 'manual' | 'restore') {
  const last = await db.prepare('SELECT title, content FROM doc_versions WHERE doc_id=? ORDER BY id DESC LIMIT 1').bind(doc.id).first<{ title: string; content: string }>();
  if (last && last.content === doc.content && last.title === doc.title) return false; // nothing new to keep
  await db.batch([
    db.prepare('INSERT INTO doc_versions(doc_id,title,content,text,kind,created_at) VALUES(?,?,?,?,?,?)').bind(doc.id, doc.title, doc.content, doc.text, kind, now()),
    db.prepare('DELETE FROM doc_versions WHERE doc_id=? AND id NOT IN (SELECT id FROM doc_versions WHERE doc_id=? ORDER BY id DESC LIMIT 100)').bind(doc.id, doc.id),
  ]);
}
async function autoVersion(db: D1Database, row: Record<string, unknown>, before: Record<string, unknown>) {
  if (row.content === before.content) return;
  const last = await db.prepare('SELECT created_at FROM doc_versions WHERE doc_id=? ORDER BY id DESC LIMIT 1').bind(row.id).first<{ created_at: string }>();
  if (!last) await snapshot(db, before.content ? before : row, 'auto');
  else if (Date.now() - Date.parse(last.created_at) >= VERSION_GAP_MS) await snapshot(db, row, 'auto');
}
async function versions(db: D1Database, docId: number, method: string, rest: string[]) {
  const doc = await db.prepare('SELECT * FROM docs WHERE id=?').bind(docId).first<Record<string, unknown>>();
  if (!doc) throw new HttpError(404, 'Document not found');
  if (!rest.length && method === 'GET')
    return (await db.prepare("SELECT id,title,kind,created_at,length(text) - length(replace(trim(text),' ','')) + (trim(text)<>'') AS words FROM doc_versions WHERE doc_id=? ORDER BY id DESC").bind(docId).all()).results;
  if (!rest.length && method === 'POST') return { saved: (await snapshot(db, doc, 'manual')) !== false };
  const vid = Number(rest[0]);
  const v = await db.prepare('SELECT * FROM doc_versions WHERE id=? AND doc_id=?').bind(vid, docId).first<Record<string, unknown>>();
  if (!v) throw new HttpError(404, 'Version not found');
  if (!rest[1] && method === 'GET') return v;
  if (rest[1] === 'restore' && method === 'POST') {
    await snapshot(db, doc, 'restore');
    return db.prepare('UPDATE docs SET title=?,content=?,text=?,updated_at=?,version=version+1 WHERE id=? RETURNING *').bind(v.title, v.content, v.text, now(), docId).first();
  }
  throw new HttpError(404, 'Not found');
}

// ---- coding -------------------------------------------------------------------------------------
async function coding(db: D1Database, method: string, rest: string[], b: Body) {
  if (!rest.length && method === 'GET') return (await db.prepare('SELECT * FROM coding_progress').all()).results;
  const slug = rest[0];
  if (slug && method === 'PUT') {
    if (!/^[a-z0-9-]{1,120}$/.test(slug)) throw new HttpError(400, 'Invalid problem');
    const status = oneOf(b, 'status', CODING_STATUS, 'todo'), at = now();
    const review = b.review_on ? str(b, 'review_on', 10) : null;
    if (review && !/^\d{4}-\d{2}-\d{2}$/.test(review)) throw new HttpError(400, 'Invalid review_on');
    const before = await capture(db, 'coding_progress', 'slug=?', [slug]);
    const row = await db.prepare(`INSERT INTO coding_progress(slug,status,starred,notes,solved_at,review_on,updated_at) VALUES(?,?,?,?,?,?,?)
        ON CONFLICT(slug) DO UPDATE SET status=excluded.status,starred=excluded.starred,notes=excluded.notes,
        solved_at=CASE WHEN excluded.status='solved' THEN COALESCE(coding_progress.solved_at,excluded.solved_at) ELSE NULL END,
        review_on=excluded.review_on,updated_at=excluded.updated_at RETURNING *`)
      .bind(slug, status, b.starred ? 1 : 0, str(b, 'notes', 20000), status === 'solved' ? at : null, review, at).first();
    const name = typeof b.title === 'string' && b.title ? quote(b.title) : slug;
    await record(db, { area: 'coding', action: 'update', label: `Coding ${name}: ${status === 'todo' ? 'to do' : status}${b.starred ? ' ★' : ''}`, entity: `coding:${slug}`, before: [before.rows.length ? before : absent('coding_progress', [{ slug }])] });
    return row;
  }
  throw new HttpError(404, 'Not found');
}

// ---- view state that follows the owner across devices ------------------------------------------------
async function ui(db: D1Database, method: string, rest: string[], b: Body) {
  if (!rest.length && method === 'GET') {
    const rows = (await db.prepare('SELECT key, value FROM ws_ui').all()).results as { key: string; value: string }[];
    return Object.fromEntries(rows.map((r) => { try { return [r.key, JSON.parse(r.value)]; } catch { return [r.key, null]; } }));
  }
  const key = rest[0];
  if (key && method === 'PUT') {
    if (!/^[a-zA-Z][a-zA-Z0-9_.:-]{0,80}$/.test(key)) throw new HttpError(400, 'Invalid key');
    const value = JSON.stringify(b.value ?? null);
    if (value.length > 8000) throw new HttpError(400, 'Value too large');
    await db.prepare('INSERT INTO ws_ui(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at').bind(key, value, now()).run();
    return { ok: true };
  }
  throw new HttpError(404, 'Not found');
}

export async function workspaceApi(db: D1Database, method: string, path: string, b: Body, q: Record<string, string> = {}) {
  const [area, ...rest] = path.split('/').filter(Boolean).map(decodeURIComponent);
  const study = await studyApi(db, area, method, rest, b, q);
  if (study !== null) return study;
  if (area === 'papers') return papers(db, method, rest, b);
  if (area === 'projects') return projects(db, method, rest, b);
  if (area === 'prep') return prep(db, method, rest, b);
  if (area === 'docs') return docs(db, method, rest, b);
  if (area === 'doc-folders') return docFolders(db, method, rest, b);
  if (area === 'deadlines') return deadlines(db, method, rest, b);
  if (area === 'doc-tasks') return docTasks(db, method, rest, b);
  if (area === 'search-index' && method === 'GET') return searchIndex(db);
  if (area === 'coding') return coding(db, method, rest, b);
  if (area === 'ui') return ui(db, method, rest, b);
  if (area === 'history') return historyApi(db, method, rest, q);
  throw new HttpError(404, 'Not found');
}
