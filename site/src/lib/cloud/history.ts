// Change history for the workspace: every write records what the rows it touches looked like before,
// so the History tab can undo any change, deletes included. An undo is recorded too (so it can be
// undone again). Before-states are "snapshots": for a set of primary keys, the rows that existed.
// Restoring a snapshot deletes keys that had no row and upserts the rows that did.
import { HttpError } from './repo';

type Row = Record<string, unknown>;
export interface Snap { table: string; keys: Row[]; rows: Row[] }

// Tables the history may touch, with their primary keys. Nothing else can be restored.
const PK: Record<string, string[]> = {
  papers: ['id'], reading_projects: ['id'], reading_project_papers: ['project_id', 'paper_id'],
  prep_tracks: ['id'], prep_items: ['id'], prep_log: ['id'], prep_plan: ['day', 'item_id'],
  prep_focus: ['id'], prep_focus_items: ['focus_id', 'item_id'],
  cards: ['id'], card_reviews: ['id'], questions: ['id'], docs: ['id'], doc_folders: ['id'], deadlines: ['id'], coding_progress: ['slug'], ws_settings: ['key'],
};
const COL = /^[a-z_]{1,40}$/;
const KEEP_DAYS = 180, KEEP_ROWS = 3000, MERGE_MS = 10 * 60 * 1000, MAX_BYTES = 1_500_000;
const now = () => new Date().toISOString();

function pk(table: string) {
  const k = PK[table];
  if (!k) throw new HttpError(500, `History cannot track ${table}`);
  return k;
}
const keyOf = (table: string, row: Row) => Object.fromEntries(pk(table).map((c) => [c, row[c]]));
const same = (table: string, a: Row, b: Row) => pk(table).every((c) => String(a[c]) === String(b[c]));

/** Rows of `table` matching `where` (SQL over that table), as a snapshot keyed by their primary keys. */
export async function capture(db: D1Database, table: string, where: string, binds: unknown[], cols = '*'): Promise<Snap> {
  pk(table);
  const rows = (await db.prepare(`SELECT ${cols} FROM ${table} WHERE ${where}`).bind(...binds).all()).results as Row[];
  return { table, keys: rows.map((r) => keyOf(table, r)), rows };
}
/** A snapshot of keys that do not exist yet (a create): restoring it deletes them. */
export const absent = (table: string, keys: Row[]): Snap => ({ table, keys: keys.map((k) => keyOf(table, k)), rows: [] });

/** The current state of the keys a snapshot covers (used to make an undo undoable). */
async function current(db: D1Database, s: Snap): Promise<Snap> {
  const cols = pk(s.table);
  if (!s.keys.length) return { table: s.table, keys: [], rows: [] };
  const rows: Row[] = [];
  for (let i = 0; i < s.keys.length; i += 40) {
    const chunk = s.keys.slice(i, i + 40);
    const where = chunk.map(() => `(${cols.map((c) => `${c}=?`).join(' AND ')})`).join(' OR ');
    rows.push(...((await db.prepare(`SELECT * FROM ${s.table} WHERE ${where}`).bind(...chunk.flatMap((k) => cols.map((c) => k[c]))).all()).results as Row[]));
  }
  return { table: s.table, keys: s.keys, rows };
}

/** Statements that put the snapshots back: deletes (children first), then upserts (parents first). */
function restore(db: D1Database, snaps: Snap[]) {
  const dels: D1PreparedStatement[] = [], ups: D1PreparedStatement[] = [];
  for (const s of [...snaps].reverse()) {
    const cols = pk(s.table);
    for (const k of s.keys) if (!s.rows.some((r) => same(s.table, r, k)))
      dels.push(db.prepare(`DELETE FROM ${s.table} WHERE ${cols.map((c) => `${c}=?`).join(' AND ')}`).bind(...cols.map((c) => k[c])));
  }
  // UPDATE for rows that exist, then INSERT OR IGNORE for rows that don't (a snapshot may hold only some
  // columns, e.g. positions; SQLite checks NOT NULL before a conflict, so an UPSERT would fail there).
  for (const s of snaps) {
    const keys = pk(s.table);
    for (const r of s.rows) {
      const cols = Object.keys(r).filter((c) => COL.test(c));
      const set = cols.filter((c) => !keys.includes(c));
      if (set.length) ups.push(db.prepare(`UPDATE ${s.table} SET ${set.map((c) => (c === 'version' ? 'version=version+1' : `${c}=?`)).join(',')} WHERE ${keys.map((c) => `${c}=?`).join(' AND ')}`)
        .bind(...set.filter((c) => c !== 'version').map((c) => r[c] ?? null), ...keys.map((c) => r[c])));
      ups.push(db.prepare(`INSERT OR IGNORE INTO ${s.table}(${cols.join(',')}) VALUES(${cols.map(() => '?').join(',')})`).bind(...cols.map((c) => r[c] ?? null)));
    }
  }
  return [...dels, ...ups];
}

/**
 * Record a change. `entity` merges quick repeated edits of one thing: if the newest entry has the same
 * entity, is under 10 minutes old and not undone, it keeps its (older) before-state and gets the new label.
 */
export async function record(db: D1Database, e: { area: string; action: string; label: string; entity?: string; before: Snap[] }) {
  const label = e.label.length > 300 ? e.label.slice(0, 297) + '…' : e.label;
  if (e.entity) {
    const last = await db.prepare('SELECT id, at, entity, undone_at FROM ws_history ORDER BY id DESC LIMIT 1').first<{ id: number; at: string; entity: string; undone_at: string | null }>();
    if (last && last.entity === e.entity && !last.undone_at && Date.now() - Date.parse(last.at) < MERGE_MS) {
      await db.prepare('UPDATE ws_history SET at=?, label=? WHERE id=?').bind(now(), label, last.id).run();
      return last.id;
    }
  }
  let before = JSON.stringify(e.before);
  if (before.length > MAX_BYTES) before = JSON.stringify([]); // too large to keep; the entry still shows what happened
  const row = await db.prepare('INSERT INTO ws_history(at,area,action,label,entity,before) VALUES(?,?,?,?,?,?) RETURNING id')
    .bind(now(), e.area, e.action, before === '[]' && e.before.length ? `${label} (too large to undo)` : label, e.entity ?? '', before).first<{ id: number }>();
  if (row!.id % 50 === 0) {
    await db.prepare('DELETE FROM ws_history WHERE at < ? OR id <= ?').bind(new Date(Date.now() - KEEP_DAYS * 864e5).toISOString(), row!.id - KEEP_ROWS).run();
  }
  return row!.id;
}

export async function historyApi(db: D1Database, method: string, rest: string[], q: Record<string, string>) {
  if (!rest.length && method === 'GET') {
    const before = Number(q.before) || 2 ** 31, limit = Math.min(300, Math.max(1, Number(q.limit) || 150));
    const area = q.area && /^[a-z]{1,20}$/.test(q.area) ? q.area : '';
    const rows = (await db.prepare(`SELECT id,at,area,action,label,undone_at,undo_of,length(before)>2 AS undoable FROM ws_history WHERE id<? ${area ? 'AND area=?' : ''} ORDER BY id DESC LIMIT ?`)
      .bind(...(area ? [before, area, limit] : [before, limit])).all()).results;
    return rows;
  }
  const id = Number(rest[0]);
  if (Number.isInteger(id) && rest[1] === 'undo' && method === 'POST') {
    const h = await db.prepare('SELECT * FROM ws_history WHERE id=?').bind(id).first<{ id: number; area: string; label: string; before: string; undone_at: string | null }>();
    if (!h) throw new HttpError(404, 'Change not found');
    if (h.undone_at) throw new HttpError(409, 'This change was already undone');
    const snaps = JSON.parse(h.before) as Snap[];
    if (!snaps.length) throw new HttpError(400, 'This change was too large to keep, so it cannot be undone');
    const inverse = await Promise.all(snaps.map((s) => current(db, s)));
    const at = now();
    await db.batch([
      ...restore(db, snaps),
      db.prepare('UPDATE ws_history SET undone_at=? WHERE id=?').bind(at, id),
      db.prepare('INSERT INTO ws_history(at,area,action,label,entity,before,undo_of) VALUES(?,?,?,?,?,?,?)')
        .bind(at, h.area, 'undo', h.label.startsWith('Undid: ') ? `Redid: ${h.label.slice(7)}` : `Undid: ${h.label.replace(/^Redid: /, '')}`, '', JSON.stringify(inverse), id),
    ]);
    return { ok: true, area: h.area };
  }
  throw new HttpError(404, 'Not found');
}

/** A title in quotes for history labels, shortened. */
export const quote = (s: unknown) => { const t = String(s ?? ''); return `“${t.length > 60 ? t.slice(0, 57) + '…' : t}”`; };
