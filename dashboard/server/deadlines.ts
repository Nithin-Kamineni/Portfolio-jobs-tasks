// Conference deadlines found by the "conference deadlines" Claude run (CLAUDE.md). They go straight into the website's
// D1 `deadlines` table (site/migrations/0021, 0022) as hidden suggestions (shown = 0): the owner picks the ones to show in
// the Today page's deadline selector. One row per conference + year + kind (auto_key); a later run updates the date
// (and marks it changed) but never touches whether it is shown.
import { lit, type D1 } from './cloudSync';
import { HttpError } from './repo';

export interface FoundDeadline {
  conference: string;   // DAC, DATE, ICCAD, ISCA, MICRO, ASPLOS, GLSVLSI, ASP-DAC…
  year: number;         // the conference's year (DAC 2027), not the deadline's
  kind: 'abstract' | 'paper';
  due_on: string;       // YYYY-MM-DD
  due_time?: string | null; // HH:MM in tz; empty = end of day
  tz?: 'AoE' | 'UTC' | 'local';
  source_url: string;   // the page the date was read from (call for papers, important dates)
  note?: string;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/, TIME = /^\d{2}:\d{2}$/;

export function validateFound(list: unknown): FoundDeadline[] {
  if (!Array.isArray(list) || !list.length) throw new HttpError(400, 'Expected a JSON array of deadlines');
  if (list.length > 60) throw new HttpError(400, 'At most 60 deadlines per call');
  return list.map((x, i) => {
    const o = x as Record<string, unknown>;
    const bad = (what: string) => new HttpError(400, `Item ${i + 1}: ${what}`);
    const conference = String(o.conference ?? '').trim();
    if (!/^[A-Za-z][A-Za-z0-9 -]{1,20}$/.test(conference)) throw bad('conference must be a short name like "DAC"');
    const year = Number(o.year);
    if (!Number.isInteger(year) || year < 2024 || year > 2035) throw bad('year must be the conference year, e.g. 2027');
    const kind = o.kind === 'abstract' || o.kind === 'paper' ? o.kind : null;
    if (!kind) throw bad('kind must be "abstract" or "paper"');
    const due_on = String(o.due_on ?? '');
    if (!DAY.test(due_on) || Number.isNaN(Date.parse(due_on))) throw bad('due_on must be YYYY-MM-DD');
    const due_time = o.due_time ? String(o.due_time) : null;
    if (due_time && !TIME.test(due_time)) throw bad('due_time must be HH:MM (24 h)');
    const tz = o.tz == null || o.tz === '' ? 'AoE' : o.tz;
    if (tz !== 'AoE' && tz !== 'UTC' && tz !== 'local') throw bad('tz must be AoE, UTC or local (convert other zones to UTC)');
    const source_url = String(o.source_url ?? '');
    if (!/^https?:\/\/\S+$/.test(source_url)) throw bad('source_url (the page you read the date on) is required');
    const note = String(o.note ?? '').slice(0, 500);
    return { conference, year, kind, due_on, due_time, tz, source_url, note };
  });
}

export const autoKey = (d: FoundDeadline) => `${d.conference.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${d.year}-${d.kind}`;
export const autoTitle = (d: FoundDeadline) => `${d.conference} ${d.year}: ${d.kind === 'abstract' ? 'abstract registration' : 'paper submission'}`;

/** One INSERT … ON CONFLICT per deadline: new ones arrive hidden and unseen; known ones get the new date. */
export function upsertSql(list: FoundDeadline[], at: string): string {
  return list.map((d) => {
    const v = [autoTitle(d), d.due_on, d.due_time ?? null, d.tz ?? 'AoE', 'paper', d.note ?? '', d.source_url, 'auto', d.source_url, autoKey(d), `${d.conference} ${d.year}`, 0, 0, at, at, at].map(lit).join(',');
    return `INSERT INTO deadlines(title,due_on,due_time,tz,kind,note,url,source,source_url,auto_key,conf,shown,seen,created_at,updated_at,found_at) VALUES(${v})
ON CONFLICT(auto_key) WHERE auto_key IS NOT NULL DO UPDATE SET
  changed_at=CASE WHEN deadlines.due_on<>excluded.due_on OR COALESCE(deadlines.due_time,'')<>COALESCE(excluded.due_time,'') OR deadlines.tz<>excluded.tz THEN excluded.found_at ELSE deadlines.changed_at END,
  seen=CASE WHEN deadlines.due_on<>excluded.due_on OR COALESCE(deadlines.due_time,'')<>COALESCE(excluded.due_time,'') OR deadlines.tz<>excluded.tz THEN 0 ELSE deadlines.seen END,
  due_on=excluded.due_on, due_time=excluded.due_time, tz=excluded.tz, note=excluded.note, url=excluded.url, source_url=excluded.source_url,
  updated_at=excluded.updated_at, found_at=excluded.found_at;`;
  }).join('\n');
}

export async function listAuto(d1: D1) {
  const [rows] = await d1.query(["SELECT auto_key,title,due_on,due_time,tz,source_url,shown,found_at FROM deadlines WHERE source='auto' ORDER BY due_on"]);
  return rows;
}
export async function suggest(d1: D1, list: unknown, at = new Date().toISOString()) {
  const found = validateFound(list);
  const before = new Set((await listAuto(d1)).map((r) => String(r.auto_key)));
  await d1.exec(upsertSql(found, at));
  return { saved: found.length, new: found.filter((d) => !before.has(autoKey(d))).map(autoKey), updated: found.filter((d) => before.has(autoKey(d))).map(autoKey) };
}
