import { Router } from 'express';
import type { Ctx } from '../sync';
import { HttpError } from '../repo';
import { findCandidates, listCandidates, setCandidateStatus } from '../research/candidates';
import type { ResearchHttp } from '../research/http';
import { getPaperEmailSearch, listPaperEmailSearches, startPaperEmailSearch } from '../research/paperEmails';

/** Research candidates (plan v2 §6.3): list and mark them, and search papers without Claude ("Search papers"). */
export function researchRouter(ctx: Ctx, opts: { http?: () => ResearchHttp } = {}): Router {
  const r = Router();
  let searching = false;
  r.get('/candidates', (req, res) => {
    const q = req.query as Record<string, string | undefined>;
    const status = (q.status || 'new,picked').split(',').filter(Boolean);
    const all = listCandidates(ctx.db);
    const counts = Object.fromEntries(['new', 'picked', 'skipped', 'contacted'].map((s) => [s, all.filter((c) => c.status === s).length]));
    res.json({ candidates: listCandidates(ctx.db, { status, limit: Math.min(500, Number(q.limit) || 200) }), counts });
  });
  r.post('/candidates/status', (req, res) => {
    const { ids, status } = req.body || {};
    if (!Array.isArray(ids)) throw new HttpError(400, 'ids must be a list');
    res.json({ candidates: setCandidateStatus(ctx.db, ids.map(Number), String(status)) });
  });
  r.post('/search', async (req, res, next) => {
    if (searching) return next(new HttpError(409, 'A paper search is already running'));
    searching = true;
    try {
      const b = req.body || {};
      const out = await findCandidates(ctx, {
        companies: Array.isArray(b.companies) ? b.companies.map(String) : undefined,
        priority: Array.isArray(b.priority) ? b.priority.map(String) : undefined,
        limit: 200,
      }, opts.http?.());
      res.json({ ...out, candidates: undefined, listed: out.candidates.length });
    } catch (e) { next(e); } finally { searching = false; }
  });
  // "Find R&D emails from papers" (Referral phase): GET the cached result for a company (or all), POST to (re)start it.
  r.get('/paper-emails', (req, res) => {
    const company = String((req.query as Record<string, string | undefined>).company || '');
    res.json(company ? getPaperEmailSearch(ctx.db, company) : listPaperEmailSearches(ctx.db));
  });
  r.post('/paper-emails', (req, res) => {
    const company = String(req.body?.company || '').trim();
    if (!company) throw new HttpError(400, 'company is required');
    res.status(202).json(startPaperEmailSearch(ctx, company, opts.http?.()));
  });
  return r;
}
