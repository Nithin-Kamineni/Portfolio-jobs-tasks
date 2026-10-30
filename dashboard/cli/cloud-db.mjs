// Database administration stays behind the repository CLI, including migration/export.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const site = path.join(root, 'site');
const action = process.argv[3];
const remote = process.argv.includes('--remote');
const target = remote ? '--remote' : '--local';
let args;
if (action === 'migrate') args = ['d1', 'migrations', 'apply', 'DB', target];
else if (action === 'export-local') {
  const p = spawnSync(process.execPath, [path.join(site, 'scripts/export-sqlite.mjs')], { cwd: root, encoding: 'utf8' });
  console.log(p.stdout); if (p.stderr) console.error(p.stderr); process.exit(p.status ?? 1);
} else if (action === 'import') args = ['d1', 'execute', 'DB', target, '--file', path.join(root, 'data/d1-import.sql'), '--yes'];
else if (action === 'counts') args = ['d1', 'execute', 'DB', target, '--json', '--command', "SELECT 'jobs' AS name,count(*) AS n FROM jobs UNION ALL SELECT 'contacts',count(*) FROM contacts UNION ALL SELECT 'outreach',count(*) FROM outreach UNION ALL SELECT 'events',count(*) FROM events UNION ALL SELECT 'runs',count(*) FROM runs UNION ALL SELECT 'tasks',count(*) FROM tasks"];
else { console.error(JSON.stringify({error:'Use cloud-db migrate|export-local|import|counts [--remote]'})); process.exit(1); }
const p = spawnSync(process.execPath, [path.join(site, 'node_modules/wrangler/bin/wrangler.js'), ...args], { cwd: site, encoding:'utf8', env: {...process.env, CI:'true'}, maxBuffer: 8 * 1024 * 1024 });
console.log(JSON.stringify({ok:p.status===0,action,target,output:p.stdout,warning:p.stderr})); process.exit(p.status ?? 1);
