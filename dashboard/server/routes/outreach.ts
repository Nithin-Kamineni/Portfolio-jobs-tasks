import { Router } from 'express';
import type { Ctx } from '../sync';
import {
  addContact, addOutreach, decideLinkedin, getContact, getOutreach, listContacts, listOutreach, markSent, recordReply, updateContact, updateOutreach,
} from '../repo';

export function contactsRouter(ctx: Ctx): Router {
  const r = Router();
  const { db } = ctx;
  r.get('/', (req, res) => {
    const q = req.query as Record<string, string | undefined>;
    res.json(listContacts(db, { company: q.company, relationship: q.relationship }));
  });
  r.get('/:id', (req, res) => {
    const id = Number(req.params.id);
    res.json({ contact: getContact(db, id), outreach: listOutreach(db, { contactId: id }) });
  });
  r.post('/', (req, res) => { res.status(201).json(addContact(db, req.body || {})); });
  r.patch('/:id', (req, res) => { res.json(updateContact(db, Number(req.params.id), req.body || {})); });
  // "Yes, that's them" / "Wrong person" on a LinkedIn link Claude found by web search.
  r.post('/:id/linkedin', (req, res) => { res.json(decideLinkedin(db, Number(req.params.id), (req.body || {}).decision)); });
  return r;
}

export function outreachRouter(ctx: Ctx): Router {
  const r = Router();
  const { db } = ctx;
  r.get('/', (req, res) => {
    const q = req.query as Record<string, string | undefined>;
    res.json(listOutreach(db, { type: q.type, status: q.status, due: q.due === '1' || q.due === 'true', jobId: q.job, company: q.company }));
  });
  r.get('/:id', (req, res) => { res.json(getOutreach(db, Number(req.params.id))); });
  r.post('/', (req, res) => { res.status(201).json(addOutreach(db, { created_by: 'owner', ...(req.body || {}) })); });
  r.patch('/:id', (req, res) => { res.json(updateOutreach(db, Number(req.params.id), req.body || {})); });
  r.post('/:id/sent', (req, res) => { res.json(markSent(db, Number(req.params.id))); });
  r.post('/:id/reply', (req, res) => {
    const { outcome, notes } = req.body || {};
    res.json(recordReply(db, Number(req.params.id), String(outcome), notes));
  });
  return r;
}
