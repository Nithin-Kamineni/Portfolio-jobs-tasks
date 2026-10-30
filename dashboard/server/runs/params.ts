// Validates run parameters against the database. Parameters only ever reach Claude inside the prompt argument
// (never a shell), and only after these checks: job ids must exist, companies must be known.
import type { DB } from '../db';
import { getJob, HttpError } from '../repo';
import { companyKey } from '../../shared/statuses';
import type { PromptInfo } from './prompts';
import type { TaskDef } from './tasks';

type Row = Record<string, unknown>;

const toList = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : String(v ?? '').split(',')).map((s) => s.trim()).filter(Boolean);


/** The company's canonical name (targets/companies.csv, else as written on a job), or null if unknown. */
export function resolveCompany(db: DB, name: string): string | null {
  const k = companyKey(name);
  if (!k) return null;
  const known = (db.prepare('SELECT name FROM companies').all() as Row[]).map((r) => String(r.name)).find((n) => companyKey(n) === k);
  if (known) return known;
  const onJob = (db.prepare('SELECT DISTINCT company FROM jobs').all() as Row[]).map((r) => String(r.company)).find((n) => companyKey(n) === k);
  return onJob || null;
}

export function companyInfo(db: DB, name: string): NonNullable<PromptInfo['company']> {
  const row = db.prepare('SELECT * FROM companies WHERE name = ?').get(name) as Row | undefined;
  const k = companyKey(name);
  const knownUrls = (db.prepare('SELECT company, url FROM jobs').all() as Row[])
    .filter((r) => companyKey(String(r.company)) === k && r.url).map((r) => String(r.url));
  return { name, careersUrl: String(row?.careers_url ?? ''), searchUrl: String(row?.search_url ?? ''), knownUrls };
}

export function validateParams(task: TaskDef, raw: Record<string, unknown> = {}, db: DB): { params: Record<string, unknown>; info: Omit<PromptInfo, 'runId' | 'params'> } {
  const params: Record<string, unknown> = {};
  const info: Omit<PromptInfo, 'runId' | 'params'> = {};
  for (const k of Object.keys(raw)) {
    if (!(k in task.params)) throw new HttpError(400, `Unknown parameter "${k}" for ${task.id} (allowed: ${Object.keys(task.params).join(', ') || 'none'})`);
  }
  for (const [k, spec] of Object.entries(task.params)) {
    let v = raw[k];
    if (v === undefined || v === null || v === '') {
      if (spec.required) throw new HttpError(400, `${task.id} needs the parameter "${k}"`);
      if (spec.default !== undefined) params[k] = spec.default;
      continue;
    }
    switch (spec.kind) {
      case 'int': {
        const n = Number(v);
        if (!Number.isInteger(n)) throw new HttpError(400, `"${k}" must be a whole number`);
        if ((spec.min != null && n < spec.min) || (spec.max != null && n > spec.max)) throw new HttpError(400, `"${k}" must be between ${spec.min} and ${spec.max}`);
        v = n; break;
      }
      case 'ints': {
        const arr = toList(v).map(Number);
        if (arr.some((n) => !Number.isInteger(n))) throw new HttpError(400, `"${k}" must be a list of whole numbers`);
        v = arr; break;
      }
      case 'bool': v = v === true || v === 'true' || v === '1' || v === 1; break;
      case 'url': {
        let u: URL;
        try { u = new URL(String(v).trim()); } catch { throw new HttpError(400, `"${k}" must be a web address (https://…)`); }
        if (!/^https?:$/.test(u.protocol)) throw new HttpError(400, `"${k}" must be a web address (https://…)`);
        v = u.toString(); break;
      }
      case 'text': {
        v = String(v);
        if ((v as string).length > 2000) throw new HttpError(400, `"${k}" is too long (2000 characters at most)`);
        break;
      }
      case 'job': {
        const j = getJob(db, String(v), false);
        info.job = { id: j.id, company: j.company, title: j.title, url: j.url, applicationDir: j.application_dir };
        v = j.id; break;
      }
      case 'jobs': {
        const ids = toList(v);
        info.jobs = ids.map((id) => { const j = getJob(db, id, false); return { id: j.id, company: j.company, title: j.title }; });
        v = ids; break;
      }
      case 'company': {
        const name = resolveCompany(db, String(v));
        if (!name) throw new HttpError(400, `Unknown company "${String(v)}" (not in targets/companies.csv or on any job)`);
        info.company = companyInfo(db, name);
        v = name; break;
      }
      case 'companies': {
        const names = toList(v).map((c) => {
          const name = resolveCompany(db, c);
          if (!name) throw new HttpError(400, `Unknown company "${c}"`);
          return name;
        });
        v = names; break;
      }
    }
    params[k] = v;
  }
  return { params, info };
}

/** Tasks about one entity may queue one run per entity; the rest one run at a time (plan §3.5 dedupe). */
export function dedupeKey(task: TaskDef, params: Record<string, unknown>): string {
  const per = ['jobId', 'company'].filter((k) => params[k] != null).map((k) => `${k}=${String(params[k])}`);
  return [task.id, ...per].join('|');
}
