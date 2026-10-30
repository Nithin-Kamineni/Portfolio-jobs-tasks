// D1 port of dashboard/server/repo.ts. Local dashboard remains on SQLite.
import { DB, addDays, localDate } from './db';
import {companyKey, FOLLOW_UP_DAYS, isJobStatus, OUTREACH_STATUSES, OUTREACH_TYPES, CHANNELS, RELATIONSHIPS, EMAIL_CONFIDENCE, LINKEDIN_CONFIDENCE, REPLY_OUTCOMES, normalizeLinkedin, type JobStatus, type OutreachType, type ReplyOutcome} from '../../../../dashboard/shared/statuses';
import type {Company, CompanyNote, Contact, Job, Outreach, PaperEmailSearch, Settings, Stats, Paper} from '../../../../dashboard/shared/types';
import {deriveFlags, deriveTags} from '../../../../watcher/lib/tags.js';
import {stripHtml} from '../../../../watcher/lib/util.js';
import {descriptionDecision, descriptionText} from '../../../../dashboard/shared/description';
import {setStatus} from './status';
export class HttpError extends Error {
    constructor(public status: number, message: string) { super(message); }
}
// ---------- clock (tests replace it) ----------
let nowFn = () => new Date();
export const setClock = (fn: () => Date) => { nowFn = fn; };
export const now = () => nowFn();
export const nowIso = () => now().toISOString();
export const today = () => localDate(now());
const parseJson = <T>(s: unknown, fallback: T): T => { try {
    return s ? JSON.parse(String(s)) as T : fallback;
}
catch {
    return fallback;
} };
// ---------- jobs ----------
type Row = Record<string, unknown>;
export const RANK_STAGES = ['rule', 'quick', 'final'] as const;
export function rowToJob(r: Row, withDescription = false): Job {
    const job: Job = {
        id: String(r.id), company: String(r.company ?? ''), company_priority: String(r.company_priority ?? ''),
        title: String(r.title ?? ''), location: String(r.location ?? ''), url: String(r.url ?? ''), source: String(r.source ?? ''),
        ats: String(r.ats ?? ''), posted_date: String(r.posted_date ?? ''), posted_raw: String(r.posted_raw ?? ''),
        first_seen: String(r.first_seen ?? ''), score: r.score == null ? null : Number(r.score),
        hits: parseJson(r.hits_json, []), tags: parseJson(r.tags_json, []), flags: parseJson(r.flags_json, []),
        degrees: String(r.degrees ?? ''), sponsorship_flag: String(r.sponsorship_flag ?? ''),
        has_description: Boolean(r.has_description ?? (r.description && String(r.description).length > 0)),
        description_fetched_at: (r.description_fetched_at as string) ?? null,
        fit_score: r.fit_score == null ? null : Number(r.fit_score), fit_reason: (r.fit_reason as string) ?? null,
        ranked_at: (r.ranked_at as string) ?? null, status: (isJobStatus(r.status) ? r.status : 'new') as JobStatus,
        decision_at: (r.decision_at as string) ?? null, applied_date: (r.applied_date as string) ?? null,
        outcome_date: (r.outcome_date as string) ?? null, resume_version: String(r.resume_version ?? 'master'),
        application_dir: (r.application_dir as string) ?? null, notes: (r.notes as string) ?? null,
        referral_requested_at: (r.referral_requested_at as string) ?? null, updated_at: (r.updated_at as string) ?? null,
        claude_at: (r.claude_at as string) ?? null,
        rank_stage: (r.rank_stage as Job['rank_stage']) ?? null, rank_model: (r.rank_model as string) ?? null,
        previous_posting_id: (r.previous_posting_id as string) ?? null,
        fill_status: (r.fill_status as Job['fill_status']) ?? null, fill_report: (r.fill_report as string) ?? null, fill_at: (r.fill_at as string) ?? null,
    };
    if (withDescription)
        job.description = String(r.description ?? '');
    return job;
}
/** When a dashboard Claude run last wrote this job (events tagged with detail.run). */
const CLAUDE_AT = (entity: string, table: string) => `(SELECT max(e.at) FROM events e WHERE e.entity = '${entity}' AND e.entity_id = CAST(${table}.id AS TEXT) AND json_extract(e.detail_json, '$.run') IS NOT NULL) AS claude_at`;
const LIST_COLUMNS = `id, company, company_priority, title, location, url, source, ats, posted_date, posted_raw, first_seen, score,
  hits_json, tags_json, flags_json, degrees, sponsorship_flag, (length(description) > 0) AS has_description, description_fetched_at,
  fit_score, fit_reason, ranked_at, status, decision_at, applied_date, outcome_date, resume_version, application_dir, notes,
  referral_requested_at, updated_at, rank_stage, rank_model, previous_posting_id, fill_status, fill_report, fill_at, ${CLAUDE_AT('job', 'jobs')}`;
export interface JobFilters {
    status?: string | string[];
    company?: string;
    priority?: string | string[];
    tag?: string;
    q?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    limit?: number;
    referralRequested?: boolean;
    forRanking?: boolean;
}
const SORTABLE: Record<string, string> = {
    fit: 'COALESCE(fit_score, score)', fit_score: 'fit_score', score: 'score', company: 'company', title: 'title',
    priority: "CASE company_priority WHEN 'A' THEN 1 WHEN 'B' THEN 2 WHEN 'C' THEN 3 ELSE 4 END",
    posted: 'posted_date', posted_date: 'posted_date', first_seen: 'first_seen', status: 'status', location: 'location',
    source: 'source', updated_at: 'updated_at', decision_at: 'decision_at', applied_date: 'applied_date',
};
const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : String(v ?? '').split(',')).map((s) => s.trim()).filter(Boolean);
export async function listJobs(db: DB, f: JobFilters = {}): Promise<Job[]> {
    const where: string[] = [];
    const args: unknown[] = [];
    const statuses = list(f.status);
    if (statuses.length) {
        where.push(`status IN (${statuses.map(() => '?').join(',')})`);
        args.push(...statuses);
    }
    const prios = list(f.priority);
    if (prios.length) {
        where.push(`company_priority IN (${prios.map(() => '?').join(',')})`);
        args.push(...prios);
    }
    if (f.company) {
        where.push('lower(company) LIKE ?');
        args.push(`%${f.company.toLowerCase()}%`);
    }
    if (f.tag) {
        where.push('EXISTS (SELECT 1 FROM json_each(tags_json) WHERE value = ?)');
        args.push(f.tag);
    }
    if (f.q) {
        where.push("(lower(title) LIKE ? OR lower(company) LIKE ? OR lower(location) LIKE ? OR lower(COALESCE(notes,'')) LIKE ?)");
        const q = `%${f.q.toLowerCase()}%`;
        args.push(q, q, q, q);
    }
    if (f.referralRequested)
        where.push('referral_requested_at IS NOT NULL');
    // v2: what the quick rank still has to score: new, never ranked (rules settle theirs first).
    if (f.forRanking)
        where.push("status = 'new' AND rank_stage IS NULL AND fit_score IS NULL");
    const sortCol = SORTABLE[f.sort || 'fit'] || SORTABLE.fit;
    const order = f.order === 'asc' ? 'ASC' : 'DESC';
    const sql = `SELECT ${LIST_COLUMNS} FROM jobs ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY ${sortCol} ${order} NULLS LAST, id ASC ${f.limit ? 'LIMIT ' + Math.max(1, Math.floor(f.limit)) : ''}`;
    return (await db.prepare(sql).all(...args)).map((r) => rowToJob(r as Row));
}
export async function getJob(db: DB, id: string, withDescription = true): Promise<Job> {
    const r = (await db.prepare(`SELECT *, (length(description) > 0) AS has_description, ${CLAUDE_AT('job', 'jobs')} FROM jobs WHERE id = ?`).get(id)) as Row | undefined;
    if (!r)
        throw new HttpError(404, `No job with id ${id}`);
    const job = rowToJob(r, withDescription);
    if (job.previous_posting_id) {
        job.previous_posting = ((await db.prepare('SELECT id, title, url, status, first_seen, decision_at, applied_date FROM jobs WHERE id = ?')
            .get(job.previous_posting_id)) as Job['previous_posting']) ?? null;
    }
    return job;
}
// ---------- run tagging: writes made by the CLI inside a dashboard Claude run (env JOBWATCHER_RUN_ID) ----------
let runTag: number | null = null;
let runModel: string | null = null;
export const setRunTag = (id: number | null, model: string | null = null) => { runTag = id && Number.isFinite(id) ? id : null; runModel = runTag ? model : null; };
/** "claude:run:12" inside a run, else "claude". */
export const claudeActor = () => (runTag ? `claude:run:${runTag}` : 'claude');
export async function addEvent(db: DB, entity: string, entityId: string | number | null, kind: string, detail: unknown = {}): Promise<number> {
    const d = runTag && detail && typeof detail === 'object' && !Array.isArray(detail) ? { ...(detail as object), run: runTag } : detail;
    return Number((await db.prepare('INSERT INTO events(at, entity, entity_id, kind, detail_json) VALUES (?,?,?,?,?)')
        .run(nowIso(), entity, entityId == null ? null : String(entityId), kind, JSON.stringify(d))).lastInsertRowid);
}
export async function lastEvent(db: DB, kind: string): Promise<{
    at: string;
    detail: unknown;
} | null> {
    const r = (await db.prepare('SELECT at, detail_json FROM events WHERE kind = ? AND undone_at IS NULL ORDER BY id DESC LIMIT 1').get(kind)) as Row | undefined;
    return r ? { at: String(r.at), detail: parseJson(r.detail_json, {}) } : null;
}
/**
 * Claude's fit check ("process new jobs"). Moves new → ranked; a job that's already decided keeps its status.
 * v2: `stage` = rule (code) | quick (light model) | final (Opus re-check); `model` = which model wrote it
 * (default: the run's model from JOBWATCHER_RUN_MODEL). A quick score never overwrites a final one.
 */
export async function rankJob(db: DB, id: string, fit: number, reason: string, opts: {
    stage?: string;
    model?: string;
} = {}): Promise<Job> {
    if (!Number.isFinite(fit) || fit < 0 || fit > 100)
        throw new HttpError(400, '--fit must be a number from 0 to 100');
    if (!reason?.trim())
        throw new HttpError(400, '--reason is required');
    if (opts.stage && !(RANK_STAGES as readonly string[]).includes(opts.stage))
        throw new HttpError(400, `--stage must be one of ${RANK_STAGES.join(', ')}`);
    const job = (await getJob(db, id, false));
    if (opts.stage && opts.stage !== 'final' && job.rank_stage === 'final')
        throw new HttpError(409, `${id} already has a final (checked) score; only --stage final can change it`);
    const at = nowIso();
    const model = opts.model || (opts.stage === 'rule' ? 'rules' : runModel) || null;
    (await db.prepare('UPDATE jobs SET fit_score=?, fit_reason=?, ranked_at=?, rank_stage=?, rank_model=?, updated_at=? WHERE id=?')
        .run(Math.round(fit), reason.trim(), at, opts.stage || null, model, at, id));
    (await addEvent(db, 'job', id, 'rank', { fit: Math.round(fit), ...(opts.stage ? { stage: opts.stage } : {}), ...(job.fit_score != null ? { from: job.fit_score } : {}) }));
    if (job.status === 'new')
        (await setStatus(db, id, 'ranked', { by: claudeActor() }));
    return (await getJob(db, id, false));
}
const JOB_EDITABLE = ['notes', 'application_dir', 'resume_version', 'applied_date'] as const;
export async function updateJob(db: DB, id: string, patch: Partial<Record<(typeof JOB_EDITABLE)[number], string | null>>): Promise<Job> {
    (await getJob(db, id, false));
    const keys = JOB_EDITABLE.filter((k) => k in patch);
    if (!keys.length)
        throw new HttpError(400, `Nothing to update (editable: ${JOB_EDITABLE.join(', ')})`);
    (await db.prepare(`UPDATE jobs SET ${keys.map((k) => `${k}=?`).join(', ')}, updated_at=? WHERE id=?`)
        .run(...keys.map((k) => patch[k] ?? null), nowIso(), id));
    return (await getJob(db, id, false));
}
/** Like the dashboard: a stored description is never replaced by an empty, much shorter or "posting removed" text; a replaced text stays in an event. */
export async function setDescription(db: DB, id: string, description: string): Promise<Job> {
    const job = (await getJob(db, id, false));
    const stored = String(((await db.prepare('SELECT description FROM jobs WHERE id = ?').get(id)) as Row | undefined)?.description || '');
    if (stored) {
        const d = descriptionDecision(stored, description);
        if (d.action === 'keep') {
            if (d.reason !== 'unchanged') (await addEvent(db, 'job', id, 'description_kept', { reason: d.reason, chars: descriptionText(description).length }));
            return (await getJob(db, id, true));
        }
        (await addEvent(db, 'job', id, 'description_replaced', { previous: stored, previous_fetched_at: job.description_fetched_at, chars: descriptionText(description).length }));
    }
    const text = stripHtml(description);
    const tags = deriveTags({ title: job.title, description: text, hits: job.hits });
    const flags = deriveFlags({ title: job.title, description: text, sponsorship: job.sponsorship_flag, degrees: job.degrees, posted: job.posted_date, now: now() });
    (await db.prepare('UPDATE jobs SET description=?, description_fetched_at=?, tags_json=?, flags_json=?, updated_at=? WHERE id=?')
        .run(description, nowIso(), JSON.stringify(tags), JSON.stringify(flags), nowIso(), id));
    return (await getJob(db, id, true));
}
export async function requestReferral(db: DB, id: string, on = true): Promise<Job> {
    (await getJob(db, id, false));
    (await db.prepare('UPDATE jobs SET referral_requested_at=?, updated_at=? WHERE id=?').run(on ? nowIso() : null, nowIso(), id));
    (await addEvent(db, 'job', id, on ? 'referral_requested' : 'referral_request_cleared'));
    return (await getJob(db, id, false));
}
// ---------- contacts ----------
function rowToContact(r: Row): Contact {
    return { ...(r as unknown as Contact), papers: parseJson<Paper[]>(r.papers_json, []), papers_json: undefined } as Contact;
}
export async function listContacts(db: DB, f: {
    company?: string;
    relationship?: string;
} = {}): Promise<Contact[]> {
    let rows = (await db.prepare(`SELECT *, ${CLAUDE_AT('contact', 'contacts')} FROM contacts ORDER BY company, name`).all()) as Row[];
    if (f.relationship)
        rows = rows.filter((r) => list(f.relationship).includes(String(r.relationship)));
    if (f.company) {
        const k = companyKey(f.company);
        rows = rows.filter((r) => companyKey(String(r.company)) === k);
    }
    return rows.map(rowToContact);
}
export async function getContact(db: DB, id: number): Promise<Contact> {
    const r = (await db.prepare(`SELECT *, ${CLAUDE_AT('contact', 'contacts')} FROM contacts WHERE id = ?`).get(id)) as Row | undefined;
    if (!r)
        throw new HttpError(404, `No contact ${id}`);
    return rowToContact(r);
}
export interface ContactInput {
    name?: string;
    company?: string;
    title_or_lab?: string | null;
    relationship?: string;
    linkedin_url?: string | null;
    email?: string | null;
    email_source?: string | null;
    email_confidence?: string | null;
    work_summary?: string | null;
    papers?: Paper[] | string;
    notes?: string | null;
    linkedin_confidence?: string | null;
    linkedin_source?: string | null;
    openalex_id?: string | null;
}
/** "https://openalex.org/A5012345678" or "A5012345678" → "A5012345678". */
export function normalizeOpenalexId(v: string | null | undefined): string | null {
    const m = String(v ?? '').trim().match(/^(?:https?:\/\/openalex\.org\/)?(A\d{4,})$/i);
    return m ? m[1].toUpperCase() : null;
}
const sameName = (a: string, b: string) => a.toLowerCase().replace(/[^a-z]/g, '') === b.toLowerCase().replace(/[^a-z]/g, '');
function checkContact(c: ContactInput) {
    if (c.relationship && !(RELATIONSHIPS as readonly string[]).includes(c.relationship))
        throw new HttpError(400, `relationship must be one of ${RELATIONSHIPS.join(', ')}`);
    if (c.email_confidence && !(EMAIL_CONFIDENCE as readonly string[]).includes(c.email_confidence))
        throw new HttpError(400, `confidence must be one of ${EMAIL_CONFIDENCE.join(', ')}`);
    if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email))
        throw new HttpError(400, `"${c.email}" is not an email address`);
    if (c.email && !c.email_confidence)
        throw new HttpError(400, 'An email needs a confidence (verified | from_paper | pattern_guess)');
    if (c.linkedin_confidence && !(LINKEDIN_CONFIDENCE as readonly string[]).includes(c.linkedin_confidence))
        throw new HttpError(400, `linkedin confidence must be one of ${LINKEDIN_CONFIDENCE.join(', ')}`);
}
/**
 * Normalizes the LinkedIn/OpenAlex fields of a contact write. A link must be a linkedin.com/in/… profile; a link Claude
 * adds during a run without a confidence is a search_match (unverified) until the owner confirms it; a link the owner rejected
 * is refused.
 */
function linkedinFields(c: ContactInput, old: Contact | null): ContactInput {
    const out: ContactInput = { ...c };
    if ('linkedin_url' in c) {
        if (c.linkedin_url) {
            const url = normalizeLinkedin(c.linkedin_url);
            if (!url)
                throw new HttpError(400, `"${c.linkedin_url}" is not a LinkedIn profile link (https://www.linkedin.com/in/…)`);
            if (old?.linkedin_rejected && normalizeLinkedin(old.linkedin_rejected) === url)
                throw new HttpError(400, `the owner marked ${url} as the wrong person; don't suggest it again`);
            out.linkedin_url = url;
            if (!c.linkedin_confidence && runTag && old?.linkedin_url !== url)
                out.linkedin_confidence = 'search_match';
        }
        else {
            out.linkedin_url = null;
            if (!('linkedin_confidence' in c))
                out.linkedin_confidence = null;
        }
    }
    if (c.linkedin_confidence === 'search_match' && !(out.linkedin_url || old?.linkedin_url))
        throw new HttpError(400, '--linkedin-confidence needs a --linkedin link');
    if ('openalex_id' in c && c.openalex_id) {
        const id = normalizeOpenalexId(c.openalex_id);
        if (!id)
            throw new HttpError(400, `"${c.openalex_id}" is not an OpenAlex author id (A…)`);
        out.openalex_id = id;
    }
    return out;
}
const papersJson = (p: Paper[] | string | undefined) => {
    if (p == null)
        return undefined;
    const arr = typeof p === 'string' ? parseJson<Paper[] | null>(p, null) : p;
    if (!Array.isArray(arr))
        throw new HttpError(400, '--papers must be a JSON array like [{"title":"…","venue":"ISCA","year":2026,"url":"…"}]');
    return JSON.stringify(arr);
};
/** Marks research candidates that are now contacts (by OpenAlex id, else by name + company). */
export async function linkCandidates(db: DB): Promise<void> {
    const cands = (await db.prepare("SELECT id, openalex_id, name, company, status, contact_id FROM research_candidates").all()) as Row[];
    if (!cands.length)
        return;
    const contacts = (await db.prepare('SELECT id, name, company, openalex_id FROM contacts').all()) as Row[];
    const byOa = new Map(contacts.filter((c) => c.openalex_id).map((c) => [String(c.openalex_id), Number(c.id)]));
    const upd = db.prepare("UPDATE research_candidates SET status='contacted', contact_id=?, updated_at=? WHERE id=?");
    for (const r of cands) {
        const hit = byOa.get(String(r.openalex_id))
            ?? contacts.find((c) => companyKey(String(c.company)) === companyKey(String(r.company)) && sameName(String(c.name), String(r.name)))?.id;
        if (hit != null && (r.status !== 'contacted' || Number(r.contact_id) !== Number(hit)))
            (await upd.run(Number(hit), nowIso(), Number(r.id)));
    }
}
export async function addContact(db: DB, input: ContactInput): Promise<Contact> {
    if (!input.name?.trim())
        throw new HttpError(400, 'name is required');
    checkContact(input);
    const c = linkedinFields(input, null);
    const dupe = ((await db.prepare('SELECT id, name, company, openalex_id FROM contacts').all()) as Row[]).find((r) => (c.openalex_id && r.openalex_id === c.openalex_id)
        || (companyKey(String(r.company)) === companyKey(c.company || '') && sameName(String(r.name), c.name!)));
    if (dupe)
        throw new HttpError(409, `Already a contact: #${dupe.id} ${dupe.name} (${dupe.company}). Use "contact update ${dupe.id}" to change it.`);
    const at = nowIso();
    const id = Number((await db.prepare(`INSERT INTO contacts(name, company, title_or_lab, relationship, linkedin_url, email, email_source, email_confidence,
      work_summary, papers_json, notes, linkedin_confidence, linkedin_source, openalex_id, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run(c.name!.trim(), c.company?.trim() || '', c.title_or_lab ?? null, c.relationship || 'researcher', c.linkedin_url ?? null, c.email?.trim() || null, c.email_source ?? null, c.email_confidence ?? null, c.work_summary ?? null, papersJson(c.papers) ?? '[]', c.notes ?? null, c.linkedin_url ? (c.linkedin_confidence ?? null) : null, c.linkedin_url ? (c.linkedin_source ?? null) : null, c.openalex_id ?? null, at, at)).lastInsertRowid);
    (await addEvent(db, 'contact', id, 'created'));
    (await linkCandidates(db));
    return (await getContact(db, id));
}
export async function updateContact(db: DB, id: number, input: ContactInput): Promise<Contact> {
    const old = (await getContact(db, id));
    checkContact({ ...old, papers: undefined, ...input });
    const c = linkedinFields(input, old);
    const cols: Record<string, unknown> = {};
    for (const k of ['name', 'company', 'title_or_lab', 'relationship', 'linkedin_url', 'email', 'email_source', 'email_confidence', 'work_summary', 'notes',
        'linkedin_confidence', 'linkedin_source', 'openalex_id'] as const) {
        if (k in c)
            cols[k] = c[k] ?? null;
    }
    if ('papers' in c)
        cols.papers_json = papersJson(c.papers);
    const keys = Object.keys(cols);
    if (!keys.length)
        return old;
    (await db.prepare(`UPDATE contacts SET ${keys.map((k) => `${k}=?`).join(', ')}, updated_at=? WHERE id=?`).run(...keys.map((k) => cols[k]), nowIso(), id));
    if ('linkedin_url' in c)
        (await addEvent(db, 'contact', id, 'linkedin_set', { url: c.linkedin_url ?? null, confidence: cols.linkedin_confidence ?? null }));
    if ('openalex_id' in c || 'name' in c || 'company' in c)
        (await linkCandidates(db));
    return (await getContact(db, id));
}
/** The owner's answer on a LinkedIn link: "Yes, that's them" (confirmed) or "Wrong person" (rejected; the link is cleared and remembered). */
export async function decideLinkedin(db: DB, id: number, decision: 'confirm' | 'reject'): Promise<Contact> {
    const c = (await getContact(db, id));
    if (!c.linkedin_url)
        throw new HttpError(409, `${c.name} has no LinkedIn link to ${decision}`);
    if (decision === 'confirm') {
        (await db.prepare("UPDATE contacts SET linkedin_confidence='confirmed', updated_at=? WHERE id=?").run(nowIso(), id));
    }
    else if (decision === 'reject') {
        (await db.prepare("UPDATE contacts SET linkedin_confidence='rejected', linkedin_rejected=linkedin_url, linkedin_url=NULL, updated_at=? WHERE id=?").run(nowIso(), id));
    }
    else
        throw new HttpError(400, 'decision must be confirm or reject');
    (await addEvent(db, 'contact', id, `linkedin_${decision === 'confirm' ? 'confirmed' : 'rejected'}`, { url: c.linkedin_url }));
    return (await getContact(db, id));
}
// ---------- outreach ----------
const OUTREACH_SELECT = `SELECT o.*, c.name AS contact_name, c.company AS contact_company, c.email AS contact_email,
  c.linkedin_url AS contact_linkedin, c.email_confidence AS contact_confidence, c.linkedin_confidence AS contact_linkedin_confidence, c.linkedin_source AS contact_linkedin_source, j.title AS job_title, j.company AS job_company,
  EXISTS (SELECT 1 FROM outreach f WHERE f.parent_id = o.id) AS has_follow_up
  FROM outreach o LEFT JOIN contacts c ON c.id = o.contact_id LEFT JOIN jobs j ON j.id = o.job_id`;
function rowToOutreach(r: Row): Outreach {
    const o = r as unknown as Outreach;
    o.has_follow_up = Boolean(r.has_follow_up);
    o.follow_up_is_due = o.status === 'sent' && !!o.follow_up_due && o.follow_up_due <= today() && !o.has_follow_up;
    return o;
}
export interface OutreachFilters {
    type?: string;
    status?: string;
    due?: boolean;
    jobId?: string;
    contactId?: number;
    company?: string;
}
export async function listOutreach(db: DB, f: OutreachFilters = {}): Promise<Outreach[]> {
    const where: string[] = [];
    const args: unknown[] = [];
    const types = list(f.type);
    const statuses = list(f.status);
    if (types.length) {
        where.push(`o.type IN (${types.map(() => '?').join(',')})`);
        args.push(...types);
    }
    if (statuses.length) {
        where.push(`o.status IN (${statuses.map(() => '?').join(',')})`);
        args.push(...statuses);
    }
    if (f.jobId) {
        where.push('o.job_id = ?');
        args.push(f.jobId);
    }
    if (f.contactId) {
        where.push('o.contact_id = ?');
        args.push(f.contactId);
    }
    let rows = (await db.prepare(`${OUTREACH_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY o.updated_at DESC, o.id DESC`).all(...args)).map((r) => rowToOutreach(r as Row));
    if (f.due)
        rows = rows.filter((o) => o.follow_up_is_due);
    if (f.company) {
        const k = companyKey(f.company);
        rows = rows.filter((o) => companyKey(o.contact_company) === k || companyKey(o.job_company) === k);
    }
    return rows;
}
export async function getOutreach(db: DB, id: number): Promise<Outreach> {
    const r = (await db.prepare(`${OUTREACH_SELECT} WHERE o.id = ?`).get(id)) as Row | undefined;
    if (!r)
        throw new HttpError(404, `No outreach item ${id}`);
    return rowToOutreach(r);
}
export interface OutreachInput {
    type?: string;
    contact_id?: number | null;
    job_id?: string | null;
    channel?: string | null;
    subject?: string | null;
    body?: string | null;
    status?: string;
    parent_id?: number | null;
    created_by?: string;
    reply_notes?: string | null;
    follow_up_due?: string | null;
}
export async function addOutreach(db: DB, o: OutreachInput): Promise<Outreach> {
    const type = o.type as OutreachType;
    if (!(OUTREACH_TYPES as readonly string[]).includes(type))
        throw new HttpError(400, `type must be one of ${OUTREACH_TYPES.join(', ')}`);
    if (o.status && !['draft', 'ready'].includes(o.status))
        throw new HttpError(400, 'New outreach must start as draft or ready');
    if (o.contact_id != null)
        (await getContact(db, Number(o.contact_id)));
    if (o.job_id)
        (await getJob(db, o.job_id, false));
    let contactId = o.contact_id ?? null;
    let jobId = o.job_id ?? null;
    if (o.parent_id != null) {
        const parent = (await getOutreach(db, Number(o.parent_id)));
        contactId ??= parent.contact_id;
        jobId ??= parent.job_id;
    }
    if (!contactId)
        throw new HttpError(400, 'contact is required (add the contact first)');
    if (!o.body?.trim())
        throw new HttpError(400, 'body is required');
    const channel = o.channel || (type === 'cold_email' ? 'email' : type === 'referral' ? 'linkedin' : (o.parent_id ? (await getOutreach(db, Number(o.parent_id))).channel : 'email'));
    if (!(CHANNELS as readonly string[]).includes(String(channel)))
        throw new HttpError(400, `channel must be one of ${CHANNELS.join(', ')}`);
    const at = nowIso();
    const id = Number((await db.prepare(`INSERT INTO outreach(type, contact_id, job_id, channel, subject, body, status, parent_id, created_by, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
        .run(type, contactId, jobId, channel, o.subject ?? null, o.body, o.status || 'draft', o.parent_id ?? null, o.created_by || 'claude', at, at)).lastInsertRowid);
    (await addEvent(db, 'outreach', id, 'created', { type, by: o.created_by || 'claude' }));
    return (await getOutreach(db, id));
}
export async function updateOutreach(db: DB, id: number, o: OutreachInput): Promise<Outreach> {
    const old = (await getOutreach(db, id));
    if (o.status && !(OUTREACH_STATUSES as readonly string[]).includes(o.status))
        throw new HttpError(400, `status must be one of ${OUTREACH_STATUSES.join(', ')}`);
    if (o.channel && !(CHANNELS as readonly string[]).includes(o.channel))
        throw new HttpError(400, `channel must be one of ${CHANNELS.join(', ')}`);
    const cols: Record<string, unknown> = {};
    for (const k of ['subject', 'body', 'status', 'channel', 'reply_notes', 'follow_up_due', 'job_id'] as const)
        if (k in o)
            cols[k] = o[k] ?? null;
    const keys = Object.keys(cols);
    if (!keys.length)
        return old;
    (await db.prepare(`UPDATE outreach SET ${keys.map((k) => `${k}=?`).join(', ')}, updated_at=? WHERE id=?`).run(...keys.map((k) => cols[k]), nowIso(), id));
    if (o.status && o.status !== old.status)
        (await addEvent(db, 'outreach', id, 'status', { from: old.status, to: o.status }));
    return (await getOutreach(db, id));
}
/** "Mark sent" / "Yes, I sent it": status sent, sent_at now, follow-up due in 7 (referral) or 10 (cold email) days. */
export async function markSent(db: DB, id: number): Promise<Outreach> {
    const o = (await getOutreach(db, id));
    if (!['draft', 'ready'].includes(o.status))
        throw new HttpError(409, `Already ${o.status}`);
    const days = FOLLOW_UP_DAYS[o.type];
    const at = nowIso();
    (await db.prepare("UPDATE outreach SET status='sent', sent_at=?, follow_up_due=?, updated_at=? WHERE id=?")
        .run(at, days == null ? null : addDays(today(), days), at, id));
    (await addEvent(db, 'outreach', id, 'sent', { type: o.type }));
    return (await getOutreach(db, id));
}
/** Records how a sent message went: referred / declined / no_reply / replied. A reply to a follow-up also closes its parent. */
export async function recordReply(db: DB, id: number, outcome: string, notes?: string): Promise<Outreach> {
    if (!(REPLY_OUTCOMES as readonly string[]).includes(outcome))
        throw new HttpError(400, `outcome must be one of ${REPLY_OUTCOMES.join(', ')}`);
    const o = (await getOutreach(db, id));
    if (['draft', 'ready'].includes(o.status))
        throw new HttpError(409, 'Mark it sent first');
    const at = nowIso();
    (await db.prepare('UPDATE outreach SET status=?, reply_notes=COALESCE(?, reply_notes), updated_at=? WHERE id=?').run(outcome as ReplyOutcome, notes ?? null, at, id));
    if (o.parent_id)
        (await db.prepare("UPDATE outreach SET status=?, updated_at=? WHERE id=? AND status IN ('sent','no_reply')").run(outcome, at, o.parent_id));
    (await addEvent(db, 'outreach', id, 'reply', { outcome }));
    return (await getOutreach(db, id));
}
// ---------- companies, stats, hand-off facts ----------
export async function listCompanies(db: DB): Promise<Company[]> {
    const companies = (await db.prepare('SELECT * FROM companies ORDER BY priority, name').all()) as Row[];
    const openJobs = (await db.prepare("SELECT company, status FROM jobs WHERE status NOT IN ('skip','closed')").all()) as Row[];
    const contacts = (await db.prepare('SELECT company FROM contacts').all()) as Row[];
    const checks = new Map(((await db.prepare('SELECT * FROM manual_checks').all()) as Row[]).map((r) => [String(r.company), r]));
    const selfChecked = new Map(((await db.prepare("SELECT entity_id, max(at) AS at FROM events WHERE entity = 'company' AND kind = 'self_checked' AND undone_at IS NULL GROUP BY entity_id").all()) as Row[]).map((r) => [String(r.entity_id), String(r.at)]));
    const count = (rows: Row[], name: string) => rows.filter((r) => companyKey(String(r.company)) === companyKey(name)).length;
    return companies.map((c) => {
        const ch = checks.get(String(c.name));
        return {
            name: String(c.name), priority: String(c.priority ?? ''), ats: String(c.ats ?? ''), careers_url: String(c.careers_url ?? ''),
            fit_notes: String(c.fit_notes ?? ''), enabled: String(c.enabled ?? ''), open_jobs: count(openJobs, String(c.name)),
            contacts: count(contacts, String(c.name)), manual: String(c.ats ?? '').toLowerCase() === 'manual', search_url: String(c.search_url ?? ''),
            last_check: ch ? { checked_at: (ch.checked_at as string) ?? null, result: (ch.result as string) ?? null, found: ch.found == null ? null : Number(ch.found), added: ch.added == null ? null : Number(ch.added) } : null,
        you_check: String(c.you_check ?? ''), you_check_reason: String(c.you_check_reason ?? ''), self_checked_at: selfChecked.get(String(c.name)) ?? null,
        };
    });
}
/** When the owner last ran a job search by hand (a "Process new jobs" / manual-company run, or a recorded manual check). */
export async function lastJobSearch(db: DB): Promise<Stats['lastJobSearch']> {
    const run = (await db.prepare(`SELECT task, COALESCE(finished_at, started_at, created_at) AS at FROM runs
      WHERE parent_id IS NULL AND task IN ('process-new-jobs', 'check-manual-companies') AND status IN ('succeeded', 'needs_user', 'running')
      ORDER BY at DESC LIMIT 1`).get()) as Row | undefined;
    const check = (await db.prepare('SELECT company, checked_at AS at FROM manual_checks WHERE checked_at IS NOT NULL ORDER BY checked_at DESC LIMIT 1').get()) as Row | undefined;
    const marked = await lastEvent(db, 'manual_companies_checked');
    const all = [
        run ? { at: String(run.at), what: run.task === 'process-new-jobs' ? 'Process new jobs' : 'Manual company check' } : null,
        check ? { at: String(check.at), what: `Manual check: ${check.company}` } : null,
        marked ? { at: marked.at, what: 'Manual companies checked' } : null,
    ].filter((x): x is { at: string; what: string } => Boolean(x));
    return all.sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime())[0] ?? null;
}
export async function stats(db: DB): Promise<Stats> {
    const byStatus: Record<string, number> = {};
    for (const r of (await db.prepare('SELECT status, count(*) n FROM jobs GROUP BY status').all()) as Row[])
        byStatus[String(r.status)] = Number(r.n);
    const n = (...s: string[]) => s.reduce((a, k) => a + (byStatus[k] || 0), 0);
    return {
        byStatus,
        kpis: { new: n('new'), awaiting: n('new', 'ranked'), referral: n('apply_referral'), applied: n('applied'), interviews: n('interview') },
        lastJobSearch: await lastJobSearch(db),
    };
}
// ---------- company notes (one per company, shown on every role of that company) ----------
export async function listCompanyNotes(db: DB): Promise<CompanyNote[]> {
    return (await db.prepare("SELECT company_key, company, note, updated_at FROM company_notes WHERE note != '' ORDER BY company").all()) as unknown as CompanyNote[];
}
export async function setCompanyNote(db: DB, company: string, note: unknown): Promise<CompanyNote> {
    const key = companyKey(company);
    if (!key) throw new HttpError(400, 'company is required');
    if (typeof note !== 'string') throw new HttpError(400, 'note must be text');
    if (note.length > 20000) throw new HttpError(400, 'note is too long (20,000 characters at most)');
    const at = nowIso();
    await db.prepare(`INSERT INTO company_notes(company_key, company, note, updated_at) VALUES (?,?,?,?)
      ON CONFLICT(company_key) DO UPDATE SET note = excluded.note, updated_at = excluded.updated_at`).run(key, company.trim(), note, at);
    await addEvent(db, 'company', key, 'company_note', { length: note.length });
    return (await db.prepare('SELECT company_key, company, note, updated_at FROM company_notes WHERE company_key = ?').get(key)) as unknown as CompanyNote;
}
/** The cached "Find R&D emails from papers" result (the search itself runs on the PC). */
export async function getPaperEmailSearch(db: DB, company: string): Promise<PaperEmailSearch | null> {
    const r = (await db.prepare('SELECT * FROM paper_email_searches WHERE company_key = ?').get(companyKey(company))) as Row | undefined;
    if (!r) return null;
    const result = parseJson<Partial<PaperEmailSearch['result']>>(r.result_json, {});
    return {
        company: String(r.company), company_key: String(r.company_key), status: r.status as PaperEmailSearch['status'],
        started_at: String(r.started_at), finished_at: (r.finished_at as string) ?? null, error: (r.error as string) ?? null,
        result: { total: 0, checked: 0, papers: 0, hits: [], warnings: [], institution: null, ...result },
    };
}
// ---------- "Check these yourself" (Home): an "I checked" click is an event, never a manual_checks row ----------
export interface SelfCheckResult { company: string; event_id: number; at: string }
export async function recordSelfCheck(db: DB, company: string): Promise<SelfCheckResult> {
    const row = (await db.prepare('SELECT name FROM companies WHERE name = ?').get(company.trim())) as Row | undefined;
    if (!row) throw new HttpError(404, 'Unknown company');
    const id = await addEvent(db, 'company', String(row.name), 'self_checked');
    const at = String(((await db.prepare('SELECT at FROM events WHERE id = ?').get(id)) as Row).at);
    return { company: String(row.name), event_id: id, at };
}
/** Undo of an "I checked" click (the toast's Undo). */
export async function undoSelfCheck(db: DB, eventId: number): Promise<{ company: string; undone: boolean }> {
    const ev = (await db.prepare("SELECT entity_id, undone_at FROM events WHERE id = ? AND entity = 'company' AND kind = 'self_checked'").get(eventId)) as Row | undefined;
    if (!ev) throw new HttpError(404, 'No such check');
    if (!ev.undone_at) await db.prepare('UPDATE events SET undone_at = ? WHERE id = ?').run(nowIso(), eventId);
    return { company: String(ev.entity_id), undone: true };
}
/** Records a hand-off as done (e.g. "weekly_review", "manual_companies_checked") so its reminder clears. */
export const MARK_KINDS = ['weekly_review', 'manual_companies_checked', 'watcher_errors_fixed'] as const;
export async function mark(db: DB, kind: string, note?: string): Promise<{
    kind: string;
    at: string;
}> {
    if (!(MARK_KINDS as readonly string[]).includes(kind))
        throw new HttpError(400, `kind must be one of ${MARK_KINDS.join(', ')}`);
    (await addEvent(db, 'system', null, kind, { note: note || '' }));
    return { kind, at: (await lastEvent(db, kind))!.at };
}
// ---------- settings (defaults from config.json; changed in the dashboard) ----------
export async function getSettings(db: DB, defaults: {
    autoCommit: boolean;
    manualCheckEveryHours: number;
}): Promise<Settings> {
    const rows = (await db.prepare('SELECT key, value FROM settings').all()) as {
        key: string;
        value: string;
    }[];
    const m = new Map(rows.map((r) => [r.key, r.value]));
    const hours = m.has('manualCheckEveryHours') ? Number(m.get('manualCheckEveryHours')) : defaults.manualCheckEveryHours;
    return {
        autoCommit: m.has('autoCommit') ? m.get('autoCommit') === 'true' : defaults.autoCommit,
        manualCheckEveryHours: Number.isFinite(hours) && hours >= 0 ? hours : defaults.manualCheckEveryHours,
    };
}
export async function updateSettings(db: DB, defaults: {
    autoCommit: boolean;
    manualCheckEveryHours: number;
}, patch: Partial<Settings>): Promise<Settings> {
    const set = db.prepare('INSERT INTO settings(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
    if ('autoCommit' in patch) {
        if (typeof patch.autoCommit !== 'boolean')
            throw new HttpError(400, 'autoCommit must be true or false');
        (await set.run('autoCommit', String(patch.autoCommit)));
    }
    if ('manualCheckEveryHours' in patch) {
        const h = Number(patch.manualCheckEveryHours);
        if (!Number.isFinite(h) || h < 0 || h > 24 * 60)
            throw new HttpError(400, 'manualCheckEveryHours must be a number of hours (0 = every time)');
        (await set.run('manualCheckEveryHours', String(h)));
    }
    (await addEvent(db, 'system', null, 'settings', patch));
    return (await getSettings(db, defaults));
}
