// "Check these yourself" (Home): which companies are listed, and the "I checked" event (never a manual_checks row).
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../server/app';
import { importLocal } from '../../server/sync';
import { lastJobSearch, setClock } from '../../server/repo';
import { makeFixture, type Fixture } from '../helpers';
import { checkedAgo, selfCheckColor, selfCheckCompanies, slugFor } from '../../shared/selfCheck';
import { slugFor as scriptSlug, domainFor } from '../../scripts/fetch-logos.mjs';
import type { Company } from '../../shared/types';

const CSV = `company,priority,enabled,ats,tenant,host,site,search_terms,careers_url,fit_notes,search_url,you_check,you_check_reason
NVIDIA,A,yes,workday,nvidia,nvidia.wd5.myworkdayjobs.com,NVIDIAExternalCareerSite,,https://nvidia.example/careers,"PhD Research Intern, architecture",,,
Meta,A,yes,manual,,,,,https://www.metacareers.com/jobs,MTIA,,,
Sandisk,B,yes,manual,,,,,https://careers.smartrecruiters.com/Sandisk,"NAND, ECC",,yes,SmartRecruiters board hides its job list
Rambus,B,yes,manual,,,,,https://www.rambus.com/careers/,Memory IP,,,
Ampere Computing,C,yes,manual,,,,,https://careers.amperecomputing.com/,Arm CPUs,,,
Tesla (AI hardware),C,no,manual,,,,,https://www.tesla.com/careers,AI hardware,,yes,Site blocks automated access (Chrome too)
Groq,C,no,manual,,,,,https://groq.example,disabled,,,
Rain AI,C,no,manual,,,,,https://rain.example,defunct,,,
`;

let fx: Fixture;
let app: ReturnType<typeof createApp>['app'];
const names = (cs: Company[]) => selfCheckCompanies(cs).map((c) => c.name);

beforeEach(() => {
  setClock(() => new Date('2026-10-17T14:00:00Z'));
  fx = makeFixture({ files: { 'targets/companies.csv': CSV } });
  importLocal(fx.ctx);
  app = createApp(fx.ctx, { exportDelayMs: 0 }).app;
});
afterEach(() => { fx?.cleanup(); setClock(() => new Date()); });

describe('Check these yourself', () => {
  it('lists you_check=yes rows (enabled or not) plus enabled manual companies whose last check was blocked/error; never the defunct ones', async () => {
    const check = (company: string, result: string) => fx.db.prepare('INSERT OR REPLACE INTO manual_checks(company, checked_at, result, found, added) VALUES (?,?,?,0,0)')
      .run(company, '2026-10-16T10:00:00Z', result);
    check('Rambus', 'blocked');
    check('Ampere Computing', 'ok');
    check('Meta', 'error');
    check('Groq', 'blocked'); // disabled: not listed even when blocked
    const cs = (await request(app).get('/api/companies').expect(200)).body as Company[];
    expect(cs.find((c) => c.name === 'Sandisk')).toMatchObject({ you_check: 'yes', you_check_reason: 'SmartRecruiters board hides its job list', self_checked_at: null });
    expect(names(cs).sort()).toEqual(['Meta', 'Rambus', 'Sandisk', 'Tesla (AI hardware)']);
    const list = selfCheckCompanies(cs);
    expect(list.find((c) => c.name === 'Rambus')!.reason).toBe("Claude's check was blocked (2026-10-16)");
    expect(list.find((c) => c.name === 'Meta')!.reason).toMatch(/failing/);
    expect(list.find((c) => c.name === 'Tesla (AI hardware)')).toMatchObject({ slug: 'tesla', reason: 'Site blocks automated access (Chrome too)', careers_url: 'https://www.tesla.com/careers' });
    check('Rambus', 'ok');
    const after = (await request(app).get('/api/companies')).body as Company[];
    expect(names(after)).not.toContain('Rambus');
  });

  it('"I checked" records a self_checked event (not a manual_checks row), shows on the company, and Undo reverts it', async () => {
    const before = lastJobSearch(fx.db);
    const r = (await request(app).post('/api/companies/self-check').send({ company: 'Tesla (AI hardware)' }).expect(200)).body;
    expect(r).toMatchObject({ company: 'Tesla (AI hardware)', at: '2026-10-17T14:00:00.000Z' });
    const ev = fx.db.prepare('SELECT entity, entity_id, kind FROM events WHERE id = ?').get(r.event_id);
    expect(ev).toEqual({ entity: 'company', entity_id: 'Tesla (AI hardware)', kind: 'self_checked' });
    expect(fx.db.prepare('SELECT count(*) n FROM manual_checks').get()).toEqual({ n: 0 });
    expect(lastJobSearch(fx.db)).toEqual(before); // the "last manual job search" countdown is untouched
    let cs = (await request(app).get('/api/companies')).body as Company[];
    expect(cs.find((c) => c.name === 'Tesla (AI hardware)')!.self_checked_at).toBe('2026-10-17T14:00:00.000Z');
    // the most-due company comes first: Sandisk (never) before Tesla (just checked)
    expect(names(cs)).toEqual(['Sandisk', 'Tesla (AI hardware)']);

    await request(app).post(`/api/companies/self-check/${r.event_id}/undo`).expect(200);
    cs = (await request(app).get('/api/companies')).body as Company[];
    expect(cs.find((c) => c.name === 'Tesla (AI hardware)')!.self_checked_at).toBeNull();
    await request(app).post('/api/companies/self-check').send({ company: 'Nobody Inc' }).expect(404);
    await request(app).post('/api/companies/self-check/999999/undo').expect(404);
  });

  it('age colors, texts and logo slugs', () => {
    const now = new Date('2026-10-17T14:00:00Z').getTime();
    const ago = (d: number) => new Date(now - d * 86400e3).toISOString();
    expect(selfCheckColor(null, now)).toBe('error');
    expect(selfCheckColor(ago(3), now)).toBe('success');
    expect(selfCheckColor(ago(7), now)).toBe('warning');
    expect(selfCheckColor(ago(14), now)).toBe('error');
    expect(checkedAgo(ago(3), now)).toBe('last checked 3 d ago');
    expect(checkedAgo(ago(0.25), now)).toBe('last checked 6 h ago');
    expect(checkedAgo(null, now)).toBe('never checked');
    for (const n of ['Tesla (AI hardware)', 'Amazon / AWS (Annapurna Labs)', 'Ampere Computing', 'Sandisk']) expect(scriptSlug(n)).toBe(slugFor(n));
    expect(slugFor('Tesla (AI hardware)')).toBe('tesla');
    expect(domainFor({ company: 'Sandisk', careers_url: 'https://careers.smartrecruiters.com/Sandisk' })).toBe('sandisk.com');
    expect(domainFor({ company: 'Foo', careers_url: 'https://foo.wd1.myworkdayjobs.com/x' })).toBeNull();
    expect(domainFor({ company: 'Bar', careers_url: 'https://careers.bar.com/jobs' })).toBe('bar.com');
  });
});
