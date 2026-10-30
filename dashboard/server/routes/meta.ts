import { Router } from 'express';
import { resumePath } from '../config';
import { lastSync, sync, watcherHealth, type Ctx } from '../sync';
import { claudeFacts, getSettings, lastEvent, listCompanies, listCompanyNotes, mark, recordSelfCheck, setCompanyNote, stats, undoSelfCheck, updateSettings } from '../repo';
import type { AppMeta } from '../../shared/types';
import { BOOT_ID } from '../selfUpdate';
import { activeScheduler, readStatus } from '../cloudSync';

/** Source errors still worth a "fix watcher errors" hand-off: those from a run newer than the last "fixed" mark. */
export function openWatcherErrors(ctx: Ctx): string[] {
  const h = watcherHealth(ctx.cfg.repoRoot);
  const fixed = lastEvent(ctx.db, 'watcher_errors_fixed')?.at;
  return h.errors.length && (!fixed || !h.lastRunAt || h.lastRunAt > fixed) ? h.errors : [];
}

export function metaRouter(ctx: Ctx): Router {
  const r = Router();
  const { db, cfg } = ctx;

  r.get('/meta', (_req, res) => {
    const meta: AppMeta = {
      bootId: BOOT_ID,
      health: watcherHealth(cfg.repoRoot),
      lastSync: lastSync(db),
      cloudSync: readStatus(db, Boolean(activeScheduler()), Boolean(activeScheduler()?.running)),
      config: { outlookComposeUrl: cfg.outlookComposeUrl, outlookMaxUrlLength: cfg.outlookMaxUrlLength, resumePath: resumePath(cfg), repoRoot: cfg.repoRoot },
    };
    res.json(meta);
  });

  r.post('/sync', async (_req, res, next) => {
    try { res.json(await sync(ctx)); } catch (e) { next(e); }
  });

  r.get('/stats', (_req, res) => { res.json(stats(db)); });
  r.get('/claude-facts', (_req, res) => { res.json(claudeFacts(db, openWatcherErrors(ctx), getSettings(db, cfg.runs).manualCheckEveryHours, cfg.runs.finalMinFit)); });
  r.get('/companies', (_req, res) => { res.json(listCompanies(db)); });
  // "Check these yourself" (Home): POST {company} records an "I checked" event; .../undo reverts it.
  r.post('/companies/self-check', (req, res) => { res.json(recordSelfCheck(db, String(req.body?.company || ''))); });
  r.post('/companies/self-check/:id/undo', (req, res) => { res.json(undoSelfCheck(db, Number(req.params.id))); });
  // One note per company (Referral and Interview phases). POST {company, note}; an empty note clears it.
  r.get('/company-notes', (_req, res) => { res.json(listCompanyNotes(db)); });
  r.post('/company-notes', (req, res) => { res.json(setCompanyNote(db, String(req.body?.company || ''), req.body?.note)); });
  r.post('/marks', (req, res) => { res.json(mark(db, String(req.body?.kind), req.body?.note)); });
  r.get('/settings', (_req, res) => { res.json(getSettings(db, cfg.runs)); });
  r.patch('/settings', (req, res) => { res.json(updateSettings(db, cfg.runs, req.body || {})); });
  return r;
}
