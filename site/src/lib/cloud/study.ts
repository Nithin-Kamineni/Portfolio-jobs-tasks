// API for the study tools (/api/ws/…): flashcards with spaced repetition, quizzes, the weekly prep
// plan, settings and the interview-question bank. Every write is validated here.
import { HttpError } from './repo';
import { dayPlus, schedule, type Grade } from '../srs';
import { absent, capture, record } from './history';
import { quote } from './history';

type Body = Record<string, unknown>;
const now = () => new Date().toISOString();
const DAY = /^\d{4}-\d{2}-\d{2}$/;

function str(b: Body, key: string, max: number, required = false): string {
  const v = b[key] ?? '';
  if (typeof v !== 'string' || v.length > max || (required && !v.trim())) throw new HttpError(400, `Invalid ${key}`);
  return v.trim();
}
const id = (s: string) => { if (!/^[A-Za-z0-9_.-]{1,120}$/.test(s)) throw new HttpError(400, 'Invalid id'); return s; };
const json = (v: unknown, fallback: unknown) => { try { return JSON.parse(String(v)); } catch { return fallback; } };

// ---- flashcards -------------------------------------------------------------------------------
async function cards(db: D1Database, method: string, rest: string[], b: Body, q: Record<string, string>) {
  if (!rest.length && method === 'GET') {
    const today = dayPlus(0);
    const rows = (await db.prepare('SELECT * FROM cards ORDER BY track, module, id').all()).results;
    // Reviews in the last two days, bucketed by Eastern-time day: "reviewed today" and "new cards started today".
    const recent = (await db.prepare('SELECT card_id, at FROM card_reviews WHERE at >= ? ORDER BY at').bind(new Date(Date.now() - 2 * 864e5).toISOString()).all()).results as { card_id: string; at: string }[];
    const todays = recent.filter((r) => dayPlus(0, new Date(r.at)) === today);
    const firstEver = new Map((await db.prepare('SELECT card_id, MIN(at) m FROM card_reviews GROUP BY card_id').all()).results.map((r) => [(r as { card_id: string }).card_id, (r as { m: string }).m]));
    const newToday = [...new Set(todays.map((r) => r.card_id))].filter((c) => dayPlus(0, new Date(firstEver.get(c)!)) === today).length;
    return { today, cards: rows, reviewedToday: new Set(todays.map((r) => r.card_id)).size, newToday, track: q.track ?? '' };
  }
  if (!rest.length && method === 'POST') {
    const track = id(str(b, 'track', 40, true)), cid = `c-my-${Date.now().toString(36)}`;
    const row = await db.prepare('INSERT INTO cards(id,track,module,front,back,custom,created_at) VALUES(?,?,?,?,?,1,?) RETURNING *')
      .bind(cid, track, str(b, 'module', 80), str(b, 'front', 2000, true), str(b, 'back', 6000, true), now()).first<Body>();
    await record(db, { area: 'cards', action: 'create', label: `Added card ${quote(row!.front)}`, before: [absent('cards', [row!])] });
    return row;
  }
  const cid = id(rest[0]);
  const cur = await db.prepare('SELECT * FROM cards WHERE id=?').bind(cid).first<Record<string, unknown>>();
  if (!cur) throw new HttpError(404, 'Card not found');
  if (rest[1] === 'review' && method === 'POST') {
    const grade = Number(b.grade);
    if (![1, 2, 3, 4].includes(grade)) throw new HttpError(400, 'Invalid grade');
    const next = schedule({ ease: Number(cur.ease), interval_days: Number(cur.interval_days), reps: Number(cur.reps), lapses: Number(cur.lapses) }, grade as Grade);
    const at = now();
    const [, row] = await db.batch([
      db.prepare('INSERT INTO card_reviews(card_id,grade,at) VALUES(?,?,?)').bind(cid, grade, at),
      db.prepare('UPDATE cards SET ease=?,interval_days=?,reps=?,lapses=?,due_on=?,last_reviewed=? WHERE id=? RETURNING *')
        .bind(next.ease, next.interval_days, next.reps, next.lapses, dayPlus(next.interval_days), at, cid),
    ]);
    return row.results[0];
  }
  if (!rest[1] && method === 'PATCH') {
    const m = { ...cur, ...b };
    const row = await db.prepare('UPDATE cards SET front=?,back=?,suspended=? WHERE id=? RETURNING *')
      .bind(str(m, 'front', 2000, true), str(m, 'back', 6000, true), m.suspended ? 1 : 0, cid).first();
    const susp = 'suspended' in b && !('front' in b) && !('back' in b);
    await record(db, { area: 'cards', action: 'update', label: susp ? `${m.suspended ? 'Suspended' : 'Unsuspended'} card ${quote(cur.front)}` : `Edited card ${quote(cur.front)}`,
      entity: `card:${cid}:${susp ? 'suspend' : 'edit'}`, before: [{ table: 'cards', keys: [{ id: cid }], rows: [cur] }] });
    return row;
  }
  if (!rest[1] && method === 'DELETE') {
    if (!cur.custom) throw new HttpError(400, 'Built-in cards can be suspended, not deleted');
    const reviews = await capture(db, 'card_reviews', 'card_id=?', [cid]);
    await db.batch([db.prepare('DELETE FROM card_reviews WHERE card_id=?').bind(cid), db.prepare('DELETE FROM cards WHERE id=?').bind(cid)]);
    await record(db, { area: 'cards', action: 'delete', label: `Deleted card ${quote(cur.front)}`, before: [{ table: 'cards', keys: [{ id: cid }], rows: [cur] }, reviews] });
    return { ok: true };
  }
  throw new HttpError(404, 'Not found');
}

// ---- quizzes ----------------------------------------------------------------------------------
async function quiz(db: D1Database, method: string, rest: string[], b: Body) {
  if (!rest.length && method === 'GET') {
    const [qs, attempts] = await db.batch([
      db.prepare('SELECT * FROM quiz_questions ORDER BY track, module, id'),
      db.prepare('SELECT id,scope,total,correct,details,at FROM quiz_attempts ORDER BY at DESC LIMIT 200'),
    ]);
    return { questions: qs.results.map((r) => ({ ...(r as Body), options: json((r as Body).options, []) })), attempts: attempts.results.map((r) => ({ ...(r as Body), details: json((r as Body).details, []) })) };
  }
  if (rest[0] === 'attempts' && method === 'POST') {
    const total = Number(b.total), correct = Number(b.correct);
    if (!Number.isInteger(total) || total < 1 || total > 200 || !Number.isInteger(correct) || correct < 0 || correct > total) throw new HttpError(400, 'Invalid score');
    const details = Array.isArray(b.details) ? b.details.slice(0, 200) : [];
    return db.prepare('INSERT INTO quiz_attempts(scope,total,correct,details,at) VALUES(?,?,?,?,?) RETURNING *')
      .bind(str(b, 'scope', 80, true), total, correct, JSON.stringify(details), now()).first();
  }
  throw new HttpError(404, 'Not found');
}

// ---- weekly plan + settings -------------------------------------------------------------------
async function plan(db: D1Database, method: string, rest: string[], b: Body, q: Record<string, string>) {
  if (!rest.length && method === 'GET') {
    const from = q.from && DAY.test(q.from) ? q.from : dayPlus(-7), to = q.to && DAY.test(q.to) ? q.to : dayPlus(14);
    return (await db.prepare('SELECT day,item_id,position FROM prep_plan WHERE day BETWEEN ? AND ? ORDER BY day, position').bind(from, to).all()).results;
  }
  if (rest[0] === 'elsewhere' && rest.length === 1 && method === 'GET') {
    // Items planned on any day outside from..to, so "Up next" never offers an item that already has a day.
    if (!q.from || !DAY.test(q.from) || !q.to || !DAY.test(q.to)) throw new HttpError(400, 'Invalid day');
    const r = await db.prepare('SELECT DISTINCT item_id FROM prep_plan WHERE day < ? OR day > ?').bind(q.from, q.to).all<{ item_id: string }>();
    return r.results.map((x) => x.item_id);
  }
  const day = str(b, 'day', 10, true);
  if (!DAY.test(day)) throw new HttpError(400, 'Invalid day');
  const item = id(str(b, 'item_id', 120, true));
  if (!(await db.prepare('SELECT id FROM prep_items WHERE id=?').bind(item).first())) throw new HttpError(400, 'Unknown item');
  if (!rest.length && method === 'PUT') {
    // Put an item on a day (moving it if it was planned on another day this week).
    const fromDay = typeof b.from === 'string' && DAY.test(b.from) ? b.from : null;
    const before = await capture(db, 'prep_plan', 'item_id=? AND day IN (?,?)', [item, day, fromDay ?? day]);
    const title = (await db.prepare('SELECT title FROM prep_items WHERE id=?').bind(item).first<{ title: string }>())?.title;
    const pos = Number.isFinite(Number(b.position)) ? Number(b.position)
      : ((await db.prepare('SELECT COALESCE(MAX(position),0)+1 p FROM prep_plan WHERE day=?').bind(day).first<{ p: number }>())!.p);
    await db.batch([
      ...(fromDay ? [db.prepare('DELETE FROM prep_plan WHERE day=? AND item_id=?').bind(fromDay, item)] : []),
      db.prepare('INSERT INTO prep_plan(day,item_id,position) VALUES(?,?,?) ON CONFLICT(day,item_id) DO UPDATE SET position=excluded.position').bind(day, item, pos),
    ]);
    await record(db, { area: 'plan', action: 'update', label: fromDay && fromDay !== day ? `Moved ${quote(title)} from ${fromDay} to ${day}` : `Planned ${quote(title)} on ${day}`,
      entity: `plan:${item}`, before: [{ table: 'prep_plan', keys: [{ day, item_id: item }, ...(fromDay && fromDay !== day ? [{ day: fromDay, item_id: item }] : [])], rows: before.rows }] });
    return { ok: true };
  }
  if (!rest.length && method === 'DELETE') {
    const before = await capture(db, 'prep_plan', 'day=? AND item_id=?', [day, item]);
    await db.prepare('DELETE FROM prep_plan WHERE day=? AND item_id=?').bind(day, item).run();
    const title = (await db.prepare('SELECT title FROM prep_items WHERE id=?').bind(item).first<{ title: string }>())?.title;
    if (before.rows.length) await record(db, { area: 'plan', action: 'delete', label: `Took ${quote(title)} off ${day}`, before: [before] });
    return { ok: true };
  }
  throw new HttpError(404, 'Not found');
}
async function settings(db: D1Database, method: string, rest: string[], b: Body) {
  if (!rest.length && method === 'GET') return Object.fromEntries(((await db.prepare('SELECT key,value FROM ws_settings').all()).results as { key: string; value: string }[]).map((r) => [r.key, r.value]));
  const key = rest[0];
  if (key && method === 'PUT') {
    if (!['weekly_hours', 'new_cards_per_day'].includes(key)) throw new HttpError(400, 'Unknown setting');
    const v = Number(b.value);
    if (!Number.isFinite(v) || v < 0 || v > 200) throw new HttpError(400, 'Invalid value');
    const before = await capture(db, 'ws_settings', 'key=?', [key]);
    await db.prepare('INSERT INTO ws_settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key, String(v)).run();
    await record(db, { area: 'settings', action: 'update', label: `Setting ${key.replace(/_/g, ' ')}: ${v}`, entity: `setting:${key}`, before: [before.rows.length ? before : absent('ws_settings', [{ key }])] });
    return { [key]: String(v) };
  }
  throw new HttpError(404, 'Not found');
}

// ---- interview questions ----------------------------------------------------------------------
async function questions(db: D1Database, method: string, rest: string[], b: Body) {
  const parse = (r: Record<string, unknown>) => ({ ...r, topics: json(r.topics, []), concepts: json(r.concepts, []), companies: json(r.companies, []) });
  if (!rest.length && method === 'GET') return (await db.prepare('SELECT * FROM questions ORDER BY category, id').all()).results.map((r) => parse(r as Record<string, unknown>));
  if (!rest.length && method === 'POST') {
    const qid = `q-my-${Date.now().toString(36)}`;
    const row = await db.prepare('INSERT INTO questions(id,category,question,answer_md,difficulty,track,module,custom,updated_at) VALUES(?,?,?,?,?,?,?,1,?) RETURNING *')
      .bind(qid, str(b, 'category', 80, true), str(b, 'question', 4000, true), str(b, 'answer_md', 20000), ['Easy', 'Medium', 'Hard'].includes(String(b.difficulty)) ? String(b.difficulty) : 'Medium', str(b, 'track', 40), str(b, 'module', 80), now()).first<Body>();
    await record(db, { area: 'questions', action: 'create', label: `Added question ${quote(row!.question)}`, before: [absent('questions', [row!])] });
    return parse(row as Record<string, unknown>);
  }
  const qid = id(rest[0]);
  const cur = await db.prepare('SELECT * FROM questions WHERE id=?').bind(qid).first<Record<string, unknown>>();
  if (!cur) throw new HttpError(404, 'Question not found');
  if (method === 'PATCH') {
    const m = { ...cur, ...b };
    if (!['new', 'practiced', 'confident'].includes(String(m.status))) throw new HttpError(400, 'Invalid status');
    const row = await db.prepare('UPDATE questions SET status=?,starred=?,my_answer=?,updated_at=? WHERE id=? RETURNING *')
      .bind(String(m.status), m.starred ? 1 : 0, str(m, 'my_answer', 20000), now(), qid).first();
    const field = 'status' in b ? 'status' : 'starred' in b ? 'star' : 'answer';
    const STATUS: Record<string, string> = { new: 'not practiced', practiced: 'practiced', confident: 'confident' };
    await record(db, { area: 'questions', action: 'update', entity: `question:${qid}:${field}`, before: [{ table: 'questions', keys: [{ id: qid }], rows: [cur] }],
      label: field === 'status' ? `Question ${quote(cur.question)}: ${STATUS[String(m.status)]}` : field === 'star' ? `${m.starred ? 'Starred' : 'Unstarred'} question ${quote(cur.question)}` : `Your answer to ${quote(cur.question)}` });
    return parse(row as Record<string, unknown>);
  }
  if (method === 'DELETE') {
    if (!cur.custom) throw new HttpError(400, 'Only questions you added can be deleted');
    await db.prepare('DELETE FROM questions WHERE id=?').bind(qid).run();
    await record(db, { area: 'questions', action: 'delete', label: `Deleted question ${quote(cur.question)}`, before: [{ table: 'questions', keys: [{ id: qid }], rows: [cur] }] });
    return { ok: true };
  }
  throw new HttpError(404, 'Not found');
}

export async function studyApi(db: D1Database, area: string, method: string, rest: string[], b: Body, q: Record<string, string>) {
  if (area === 'cards') return cards(db, method, rest, b, q);
  if (area === 'quiz') return quiz(db, method, rest, b);
  if (area === 'plan') return plan(db, method, rest, b, q);
  if (area === 'settings') return settings(db, method, rest, b);
  if (area === 'questions') return questions(db, method, rest, b);
  return null;
}
