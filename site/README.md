# site/

The website: Astro 7 + React, deployed as one Cloudflare Worker with a D1 database.

- `/` the public portfolio (prerendered). Content: `src/owner.config.ts`, `src/components/site/content.ts`.
- `/app/tasks` the task manager (`src/apps/workspace/`), `/app/jobs` the job tracker (`src/apps/jobs/`), both behind Cloudflare Access.
- `/api/…` the API (`src/pages/api/[...path].ts`, `src/lib/cloud/`).
- `src/middleware.ts` checks the Access login on /app and /api (fails closed); locally `.dev.vars` → `DEV_USER_EMAIL` stands in for it.

```
npm install
cp .dev.vars.example .dev.vars        # set DEV_USER_EMAIL
npm run db:migrate:local             # local D1 (tables from migrations/)
npm run dev                          # http://localhost:4321  (/app → local "Sign in" button)
npm run check && npm test            # types + unit tests
npm run deploy                       # Cloudflare (see ../docs/deploy-cloudflare.md)
npm run db:migrate                   # migrations on the live D1 (before deploys that need them)
npm run db:backup                    # export the live D1 to ../data/backups/
```
