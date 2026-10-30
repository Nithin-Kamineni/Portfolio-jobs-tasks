# Deploying to Cloudflare (optional)

Everything runs on your PC without this. Deploy when you want the portfolio online and the private apps on any device. All of it fits Cloudflare's **free plan** (Workers, D1, Zero Trust up to 50 users).

**Who does what:** you create the accounts, log in and paste secrets; your AI agent runs the commands you approve and checks the result. It never types passwords or stores secrets in files.

What you'll have at the end:
- `https://my-site.<your-subdomain>.workers.dev` (or `https://<name>.pages.dev`, or your own domain) serving the portfolio publicly;
- `/app/…` and `/api/…` behind **Cloudflare Access**: a Google login that only your account passes;
- a D1 database for Tasks, deadlines and (if you use Jobs) the job tracker's cloud copy.

## 0. Accounts and the first deploy
1. Create a free Cloudflare account (https://dash.cloudflare.com). In Workers & Pages, pick your `workers.dev` subdomain.
2. From `site/`: `npx wrangler login` (opens a browser; you approve).
3. Name the site: in `site/wrangler.jsonc` change `"name": "my-site"` if you like.
4. Create the database: `npx wrangler d1 create jobwatcher`, paste the printed `database_id` into `site/wrangler.jsonc`.
5. `npm run db:migrate` (creates the tables in the live database), then `npm run deploy`.
6. Optional: load the study pack into the live database: `npx wrangler d1 execute DB --remote --file ../examples/study-pack/study-pack.sql`.

Until step 3 below is done, `/app` answers **403** and `/api` **401** for everyone (the site fails closed without the login settings); the portfolio works normally.

## 1. Google login client (Google Cloud console, ~5 min)
1. https://console.cloud.google.com → create a project (any name, e.g. `my-site-login`).
2. **APIs & Services → OAuth consent screen**: External, app name e.g. `My apps`, your e-mail as support and developer contact. No scopes. Save. Either add your Google account as a test user, or publish (no verification is needed for the basic profile/e-mail scopes).
3. **Credentials → Create credentials → OAuth client ID**, type *Web application*:
   - Authorized JavaScript origins: `https://<team>.cloudflareaccess.com`
   - Authorized redirect URIs: `https://<team>.cloudflareaccess.com/cdn-cgi/access/callback`
   `<team>` is your Zero Trust team name (step 2.1). Copy the **Client ID** and **Client secret**.

## 2. Zero Trust (https://one.dash.cloudflare.com)
1. **Enable Zero Trust** (free plan); choose a team name → your team domain is `<team>.cloudflareaccess.com`.
2. **Integrations → Identity providers → Add new → Google**: paste the Client ID and secret, Save, **Test**. (Optional fallback: One-time PIN.)
3. **Access → Applications → Create → Self-hosted**:
   - Name: e.g. `My apps`. Session duration: 24 h.
   - **Public hostname** twice: your site's hostname with path `app`, and again with path `api`.
   - Policy: *Allow*, selector **Emails** = the Google account you sign in with.
   - Identity providers: Google; turn on **Instant authentication**.
   - Create, then copy the application's **Audience (AUD) Tag**.
4. Jobs only, for the PC dashboard and the watcher: **Service authentication → Create service token** (e.g. `jobs-cli`). Copy the Client ID and Secret (shown once), then add a second policy to the application: *Service Auth* → that token.

## 3. Secrets into the Worker (you paste; never in files or git)
From `site/`:
```
npx wrangler secret put ACCESS_TEAM_DOMAIN     # <team>.cloudflareaccess.com
npx wrangler secret put ACCESS_AUD             # the AUD tag from 2.3
npx wrangler secret put ALLOWED_EMAIL          # the Google account(s) from the policy, comma-separated
npx wrangler secret put ALLOWED_SERVICE_IDS    # optional: the service token's Client ID (Jobs)
```
Secrets apply immediately.

## 4. Check it (security checklist)
- In a logged-out (private) browser window, `/app/` shows the Google login, not your data; `curl -I https://<site>/api/me` redirects to the login and never returns JSON.
- After signing in with your account, `/app/tasks` opens. Any other Google account is refused.
- `git status` shows no `.dev.vars` and no secrets.
- The public page never reads the database (only `src/pages/app/**` and `src/pages/api/**` do).

## 5. Jobs: connect the PC dashboard (optional)
In `dashboard/config.json` set `cloudSync.enabled` and `runRequests.enabled` to `true` and restart the dashboard. It syncs `data/jobwatcher.db` with D1 through `wrangler` (logged in from step 0) every few minutes, and picks up work queued by the website's buttons (e.g. Today → Auto).

## Updating later
- Code changes: `cd site && npm run deploy`.
- Database changes: a new numbered file in `site/migrations/`, then `npm run db:migrate` **before** the deploy. Back up first: `npm run db:backup` (D1 Time Travel also keeps 30 days).

## Addresses
- **workers.dev** (default): `"workers_dev": true` in `site/wrangler.jsonc`.
- **pages.dev**: deploy `pages-proxy/` (a tiny Pages project that forwards to the Worker): set `name`/`service` in `pages-proxy/wrangler.toml` to your Worker's name, then `cd pages-proxy && npx --prefix ../site wrangler pages deploy dist --project-name <name> --branch main`, and point the Access application at the pages.dev hostname. You can then set `"workers_dev": false`.
- **Your own domain**: Workers → your site → Settings → Domains & Routes → Add custom domain; update the Access application's hostnames.
