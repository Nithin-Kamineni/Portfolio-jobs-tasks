// Backs the production D1 database up to data/backups/d1-YYYY-MM-DD.sql (git-ignored) and keeps the
// newest 14, like the dashboard's local SQLite backups. Run from site/: `npm run db:backup`
// (the PC runner will do it daily from P6 on; D1's own Time Travel keeps 30 days of history too).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(site, '..', 'data', 'backups');
const keep = Number(process.env.D1_BACKUP_KEEP ?? 14);
const p = (n) => String(n).padStart(2, '0');
const d = new Date();
const day = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
const file = path.join(dir, `d1-${day}.sql`);
fs.mkdirSync(dir, { recursive: true });
if (fs.existsSync(file)) {
  console.log(JSON.stringify({ made: null, existing: file }));
} else {
  const r = spawnSync('npx', ['wrangler', 'd1', 'export', 'DB', '--remote', '--output', file], { cwd: site, stdio: 'inherit', shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
  console.log(JSON.stringify({ made: file, bytes: fs.statSync(file).size }));
}
const all = fs.readdirSync(dir).filter((f) => /^d1-\d{4}-\d{2}-\d{2}\.sql$/.test(f)).sort();
for (const f of all.slice(0, Math.max(0, all.length - keep))) fs.rmSync(path.join(dir, f), { force: true });
