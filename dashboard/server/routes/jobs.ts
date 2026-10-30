import { Router } from 'express';
import type { Ctx } from '../sync';
import {
  bulkStatus, getJob, HttpError, listContacts, listJobs, listOutreach, requestReferral, setDescription, setStatus, undoEvent, updateJob,
  type JobFilters,
} from '../repo';
import { fetchDescription as realFetchDescription } from '../../../watcher/lib/describe.js';
import { spawn } from 'node:child_process';
import { savedJdFor } from '../descriptionKeeper';

export type DescriptionFetcher = (job: { id: string; url: string }) => Promise<{ description: string }>;

export function jobsRouter(ctx: Ctx, fetchDescription: DescriptionFetcher = realFetchDescription): Router {
  const r = Router();
  const { db } = ctx;

  r.get('/', (req, res) => {
    const q = req.query as Record<string, string | undefined>;
    const f: JobFilters = {
      status: q.status, priority: q.priority, company: q.company, tag: q.tag, q: q.q, sort: q.sort,
      order: q.order === 'asc' ? 'asc' : 'desc', limit: q.limit ? Number(q.limit) : undefined,
      referralRequested: q.referral_requested === '1' || q.referral_requested === 'true',
    };
    res.json(listJobs(db, f));
  });


  r.post('/bulk-status', (req, res) => {
    const { ids, status } = req.body || {};
    if (!Array.isArray(ids) || !ids.length) throw new HttpError(400, 'ids must be a non-empty array');
    res.json(bulkStatus(db, ids.map(String), String(status)));
  });

  r.get('/:id', (req, res) => {
    const job = getJob(db, req.params.id, true);
    const contacts = listContacts(db, { company: job.company });
    const ids = new Set(contacts.map((c) => c.id));
    const outreach = listOutreach(db).filter((o) => o.job_id === job.id || (o.contact_id != null && ids.has(o.contact_id)));
    res.json({ job, contacts, outreach });
  });

  r.patch('/:id', (req, res) => {
    res.json(updateJob(db, req.params.id, req.body || {}));
  });

  r.post('/:id/status', (req, res) => {
    const { status, note } = req.body || {};
    res.json(setStatus(db, req.params.id, String(status), { note }));
  });

  r.post('/:id/request-referral', (req, res) => {
    res.json(requestReferral(db, req.params.id, req.body?.on !== false));
  });

  // The plain-file copy of a Referral/Applied/Interview job's posting (applications/<dir>/JD.md, see descriptionKeeper.ts).
  r.get('/:id/saved-jd', (req, res) => {
    const s = savedJdFor(db, ctx.cfg.repoRoot, req.params.id);
    res.json({ path: s?.rel ?? null });
  });

  r.post('/:id/open-saved-jd', (req, res) => {
    const s = savedJdFor(db, ctx.cfg.repoRoot, req.params.id);
    if (!s) throw new HttpError(404, 'No saved JD file for this job yet');
    if (!process.env.VITEST && process.env.JOBWATCHER_OPEN_FILES !== 'off') { // opens in the default app (e.g. VS Code / Notepad)
      const child = spawn(process.platform === 'win32' ? 'explorer.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open', [s.file], { detached: true, stdio: 'ignore' });
      child.on('error', () => undefined);
      child.unref();
    }
    res.json({ opened: s.rel });
  });

  r.post('/:id/fetch-description', async (req, res, next) => {
    try {
      const job = getJob(db, req.params.id, false);
      let d: { description: string };
      try { d = await fetchDescription({ id: job.id, url: job.url }); }
      catch (e) { throw new HttpError(502, `Couldn't fetch the description: ${(e as Error).message}`); }
      res.json(setDescription(db, job.id, d.description));
    } catch (e) { next(e); }
  });

  return r;
}

export function eventsRouter(ctx: Ctx): Router {
  const r = Router();
  r.post('/:id/undo', (req, res) => { res.json(undoEvent(ctx.db, Number(req.params.id))); });
  return r;
}
