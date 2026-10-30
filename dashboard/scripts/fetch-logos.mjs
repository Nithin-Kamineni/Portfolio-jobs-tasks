#!/usr/bin/env node
// Downloads the logo of each "Check these yourself" company once (Home card): every targets/companies.csv row with
// you_check=yes, plus the enabled ats=manual companies (they join the card when Claude's check is blocked).
// Writes dashboard/web/public/logos/<slug>.png and site/public/logos/<slug>.png; existing files are kept
// (--force downloads again). Source: Google's favicon service (128 px). Commit the new files.
//   node dashboard/scripts/fetch-logos.mjs [--force]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCSV } from '../../watcher/lib/util.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = [path.join(ROOT, 'dashboard', 'web', 'public', 'logos'), path.join(ROOT, 'site', 'public', 'logos')];

/** Same rule as slugFor in dashboard/shared/selfCheck.ts (a test checks they agree). */
export function slugFor(name) {
  return name.replace(/\(.*?\)/g, ' ').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'company';
}

/** Career boards on a shared host (SmartRecruiters, Workday, …) need the company's own domain. */
const DOMAINS = { sandisk: 'sandisk.com', tesla: 'tesla.com', meta: 'meta.com', rambus: 'rambus.com', 'ampere-computing': 'amperecomputing.com' };
const SHARED_HOSTS = /smartrecruiters|myworkdayjobs|greenhouse|lever\.co|icims|ashbyhq|gem\.com|jobvite|eightfold/i;

export function domainFor(row) {
  const slug = slugFor(row.company);
  if (DOMAINS[slug]) return DOMAINS[slug];
  try {
    const host = new URL(row.careers_url).hostname.replace(/^(www|careers|jobs|job-boards)\./, '');
    return SHARED_HOSTS.test(host) ? null : host;
  } catch { return null; }
}

const isYes = (v) => /^(yes|y|true|1)$/i.test(String(v ?? '').trim());

async function main() {
  const force = process.argv.includes('--force');
  const rows = parseCSV(fs.readFileSync(path.join(ROOT, 'targets', 'companies.csv'), 'utf8'))
    .filter((r) => r.company && (isYes(r.you_check) || (String(r.ats).toLowerCase() === 'manual' && !/^no$/i.test(String(r.enabled || '').trim()))));
  for (const d of OUT) fs.mkdirSync(d, { recursive: true });
  for (const r of rows) {
    const slug = slugFor(r.company);
    const files = OUT.map((d) => path.join(d, `${slug}.png`));
    if (!force && files.every((f) => fs.existsSync(f))) { console.log(`ok       ${slug}.png (${r.company})`); continue; }
    const domain = domainFor(r);
    if (!domain) { console.log(`skipped  ${r.company}: no domain (add it to DOMAINS in this script)`); continue; }
    const res = await fetch(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`);
    const type = res.headers.get('content-type') || '';
    if (!res.ok || !type.startsWith('image/')) { console.log(`failed   ${r.company}: HTTP ${res.status} ${type}`); continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    for (const f of files) fs.writeFileSync(f, buf);
    console.log(`fetched  ${slug}.png (${r.company}, ${domain}, ${buf.length} bytes)`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
