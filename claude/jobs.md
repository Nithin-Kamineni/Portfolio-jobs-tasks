# Jobs guide (claude/jobs.md)

A job tracker for one person's search (it was built for PhD internships in chip design / AI hardware; everything field-specific is configurable). Three pieces:

1. **The watcher** (`watcher/`, Node 22, no dependencies) reads the career sites in `targets/companies.csv` (Workday, Greenhouse, Lever, Ashby, SmartRecruiters, Google, Apple, Amazon, Microsoft, …), keeps the postings whose titles match `watcher/keywords.json`, scores them, and writes `jobs/inbox/*.jsonl` and a digest. GitHub Actions runs it three times a day (`.github/workflows/job-watcher.yml`) and opens an issue when there are new matches.
2. **The dashboard** (`dashboard/`, http://localhost:5178, on the owner's PC) imports the inbox into SQLite (`data/jobwatcher.db`), shows the jobs, and runs **Claude Code** for the heavy lifting: ranking jobs against the profile, checking career sites that can't be read automatically (Claude in Chrome), finding researchers to contact, drafting messages. The owner decides each job there.
3. **The website's `/app/jobs`** (optional, after deploying): the same data from any device. The dashboard syncs its database with the website's D1 every few minutes; buttons on the website queue work for the PC.

Switched on by `MODULES.jobs` in `site/src/owner.config.ts` (that only affects the website; the dashboard and watcher run regardless).

## Setup (first time)
Ask, one topic at a time, and write the answers into the files named.
1. **Profile** (`profile/master_profile.md`): fill it from the owner's résumé. Ranking, messages and applications use only this file.
2. **What they're looking for**: role type (internship / full-time / co-op), season, field, seniority, locations. Write it at the top of the profile ("Search") and use it below.
3. **Work authorization**: do they need visa sponsorship (e.g. F-1 CPT/OPT, H-1B)? If yes, keep the **citizenship rule** (roles requiring U.S. citizenship, security clearance or export-control eligibility get fit ≤ 5, reason "… rule"). If not, tell them the rule will be turned off and set the "Citizenship/clearance" branch in `dashboard/server/ranking.ts` (`ruleFor`) to skip.
4. **Degree rule**: `ruleFor` gives "Bachelor's only" roles fit 10 (meant for graduate students). Keep or remove it to match their degree.
5. **Field (the domain rule)**: rewrite `watcher/keywords.json` for their field: title words that make a posting a match, words that exclude it, and the description terms that score it. `ruleFor`'s domain rule (fit ≤ 5 for postings with no topic from their field, reason "Domain rule: …") uses the same file. Rename the reason text in `ranking.ts` from "no hardware topic" to their field.
6. **Companies** (`targets/companies.csv`): ask for 20–60 target companies. For each, find the careers site and its applicant-tracking system (the URL usually shows it: `myworkdayjobs.com` = workday with tenant/host/site, `greenhouse.io` = greenhouse with tenant, `jobs.lever.co`, `jobs.ashbyhq.com`, …). Use `ats=manual` for sites the watcher can't read (then the "check manual companies" command reads them with Claude in Chrome). `priority` A/B/C; `fit_notes` = why the company fits (keep it short). Test each new company: `node watcher/watch.js --dry --company "<name>"`.
7. **The watcher on GitHub**: the repo must be on GitHub. Enable the `schedule:` lines in `.github/workflows/job-watcher.yml` (commented out by default) and push. It commits `jobs/inbox`, `jobs/digests` and `watcher/state` back. Private repos have 2,000 free Actions minutes a month; if a full run is slow and the minutes run out, run the watcher from a separate small **public** repo that copies `watcher/` and `targets/companies.csv` from this one (the original setup did this), never with personal data in it.
8. **The dashboard**: `cd dashboard && npm install && npm start` (Windows: `start-dashboard.cmd`; start at login hidden: `install-autostart.cmd`, Linux `.sh`). It needs Claude Code installed and logged in (`claude` on the PATH) for the Claude runs, and Chrome with the Claude extension for the manual-company checks.
9. **Cloud sync (only after deploying the website)**: in `dashboard/config.json` set `cloudSync.enabled` and `runRequests.enabled` to `true`. They use `wrangler` from `site/` (log in once with `npx wrangler login`).
10. **Message templates** (`career/`): rewrite them in the owner's voice, facts from the profile only. Set the one-line pitch `OWNER_PITCH` in both `ReferralTools.tsx` files (`site/src/apps/jobs/components/`, `dashboard/web/src/components/`).

## The dashboard and its CLI
Jobs, decisions, contacts and outreach drafts live in `data/jobwatcher.db` (one per PC, not in git) behind the dashboard. The owner decides jobs there and tracks the phases Referral → Applied → Interview (one note per company). **You read and write the database only through the CLI**, run from the repo root. Every command prints JSON and is safe while the dashboard is open:

```
node dashboard/cli sync                                   # git pull + import new watcher files (jobs/inbox/*.jsonl)
node dashboard/cli jobs --status new [--company X] [--tag T] [--limit N] [--referral-requested]
node dashboard/cli job <id> [--fetch]                      # full job + contacts + outreach; --fetch gets a missing description
node dashboard/cli fetch --missing [--limit 25]           # fetch descriptions for jobs that have none
node dashboard/cli rank <id> --fit 0-100 --reason "…" [--stage rule|quick|final]   # new → ranked; a final score is never overwritten by a quick one
node dashboard/cli jobs --for-ranking [--limit 40]        # compact cards (relevant description part) of new, unscored jobs
node dashboard/cli prerank [--no-fetch]                   # fetch missing descriptions, settle clear cases by rule (citizenship 3, domain 5, BS-only 10)
node dashboard/cli job add --company … --title … --url … [--location …] [--posted YYYY-MM-DD] [--description-file f] --source "manual:<Company>"   # watcher filters apply; same URL = no-op
node dashboard/cli manual-checked <company> --found N --added M --result ok|blocked|error    # record a manual-company check
node dashboard/cli run <task> [--param k=v]… [--wait]      # start a dashboard Claude run (never from inside a run)
node dashboard/cli status <id> <status> [--note "…"] [--dir applications/…]
node dashboard/cli company-note <company> [--set "text"]  # the one note per company shown on every role
node dashboard/cli note <id> "text"
node dashboard/cli contact add --name … --company … --relationship friend|dac|advisor_intro|researcher [--email … --email-source … --confidence verified|from_paper|pattern_guess] [--linkedin URL --linkedin-confidence search_match --linkedin-source "web search: …"] [--openalex-id A…] [--title-or-lab …] [--summary "…"] [--papers '[…]']
node dashboard/cli contact list [--company X] [--relationship researcher]
node dashboard/cli research candidates [--companies A,B | --priority A,B] [--venues ISCA,…|all] [--since 2024] [--limit 80] [--ids 1,2]
node dashboard/cli research pdf-emails <pdf-url> | --doi <doi>
node dashboard/cli research mark <id,…> picked|skipped|new
node dashboard/cli research paper-emails <company> [--cached]
node dashboard/cli outreach add --type referral|cold_email|follow_up --contact <id> [--job <id>] [--parent <id>] [--subject "…"] --body-file draft.txt [--status ready]
node dashboard/cli outreach list [--status ready,sent] [--type …] [--due]
node dashboard/cli deadlines list | deadlines suggest --file found.json   # conference deadlines for the website's Today page
node dashboard/cli mark weekly_review|manual_companies_checked|watcher_errors_fixed
node dashboard/cli facts                                  # what's pending (new jobs to rank, watcher errors, due manual companies, …)
node dashboard/cli export                                 # regenerate jobs/tracker.csv
node dashboard/cli dedupe [--dry]                         # merge rows that are the same posting
node dashboard/cli cloud-sync [--dry] [--pull-all]        # two-way sync with the website's D1 (when enabled)
```
Job statuses: `new` → `ranked` → the owner's decision: `apply_referral` (the **Referral** phase) / `applied` / `later` / `skip`. Then `apply_referral` → `applied` ⇄ `interview` ("Back to applied" for rejected/ghosted). `closed` = posting gone. `jobs/tracker.csv` is a snapshot the dashboard regenerates; never edit it by hand. Write draft files for `--body-file` in the run's scratch folder (`data/scratch/run-<id>/`), not in the repo.

**Headless runs.** The dashboard's buttons run these same commands with `claude -p` from the repo root (one run at a time, only the tools each task needs; see `dashboard/server/runs/tasks.ts` and `prompts.ts`). When run headless: don't ask questions; stop and report instead (what you did, counts, what is blocked and exactly what the owner must do).

## Commands the owner may type
- **"process new jobs"**: `cli sync` → `cli jobs --status new` → `cli fetch --missing --limit 100` → read each description and check it against `profile/master_profile.md` → `cli rank <id> --fit 0-100 --reason "1–2 lines"`. Apply the **domain rule** (no topic from the owner's field → fit ≤ 10, reason starting "Domain rule:") and, if the owner needs sponsorship, the **citizenship rule** (citizenship/clearance/export-control roles → fit ≤ 5). Don't set decisions yourself. Finish with a short summary of the top jobs and "Decide in the dashboard". From the dashboard this runs as stages: code does sync + `cli prerank`; **quick rank** = `cli jobs --for-ranking` cards → `cli rank … --stage quick`; **final check** (quick fit ≥ `runs.finalMinFit` in `dashboard/config.json`) = `cli job <id>` → `cli rank … --stage final`. Never re-rank a scored job unless asked for a final check.
- **"process decisions"**: for each `cli jobs --status apply_referral` job: create `applications/<Company>_<Role>_<YYYY-MM-DD>/` (`JD.md`, `match.md`, optional `cover_letter.md`) and record it with `cli status <id> apply_referral --dir <folder>`.
- **"prepare <company> <role>"**: the same for one job (any status; record the folder with `cli status <id> <current status> --dir <folder>`). Use the owner's master résumé unless they ask for tailoring (rewording and reordering only).
- **"applied to <company> <role>"** (optionally "with referral from X"): `cli status <id> applied` (add `--note "Referral from X"`). **"interview at …"**: `cli status <id> interview`. **"rejected …"**: `cli status <id> applied --note "Rejected"`. **"skip …" / "later …"**: `cli status <id> skip|later`.
- **"cold emails"** (and **"cold emails for <Company>"**): find researchers at target companies from recent papers in the owner's field (`cli research candidates`; the venues are in `dashboard/server/research/venues.ts`, institutions in `targets/openalex_institutions.json`, both tuned for chip design: adapt them). For each person: an e-mail only if it is printed on their paper (`cli research pdf-emails`) or on an official page; **never invent an address**. LinkedIn: one web search `"<full name>" <company> LinkedIn`, keep a `linkedin.com/in/…` link only if the result shows the same name and company; never open LinkedIn pages. `cli contact add …`, then a draft under 150 words from `career/cold_email_templates.md` that mentions their specific paper, with `cli outreach add --type cold_email`.
- **"follow-ups"**: for each `cli outreach list --due`, a short polite follow-up with `cli outreach add --type follow_up --parent <id>`.
- **"check manual companies"** (Claude in Chrome): for each enabled `ats=manual` company in `targets/companies.csv`, list every student/new-grad (or the roles the owner targets) posting in the US on its careers site, and add new ones with `cli job add … --source "manual:<Company>"`. Read every results page; never click, type or fill forms; a login wall, CAPTCHA or bot check → stop and report "blocked". Finish with `cli manual-checked <company> --found N --added M --result ok|blocked|error`.
- **"conference deadlines"** (the website's Today → **Auto** button runs it on the PC): find the next abstract and paper submission deadlines of the conferences in `CONFERENCES` (`dashboard/server/runs/prompts.ts`). `cli deadlines list` first. WebSearch each conference's call for papers, then WebFetch the **official** page to read the dates (an aggregator only to find the official page). Keep AoE as `"tz": "AoE"`; convert other zones to UTC. Write one JSON array (`{"conference","year","kind":"abstract"|"paper","due_on","due_time","tz","source_url","note"}`) in the scratch folder and save it with `cli deadlines suggest --file <file>`. **Never invent a date**: every date must be on the page in `source_url`. Summarize per conference (found / not announced yet).
- **"fix watcher errors"**: read the errors in `watcher/state/last_run.json` (or the newest `jobs/digests/*.md`), fix the adapter in `watcher/lib/adapters.js` or `watcher/keywords.json`, test with `node watcher/watch.js --dry --company "<name>"`, commit, then `cli mark watcher_errors_fixed`.
- **"weekly review"**: summarize tracker stats (`cli jobs`, `cli outreach list`), deadlines and keyword tuning, then `cli mark weekly_review`.

## Rules (on top of the hard rules in CLAUDE.md)
- Never submit applications, send e-mails or messages, create accounts, log in or type passwords. Application forms are filled by the owner (dashboard: **Open posting** → apply → **Mark applied**).
- Never invent facts, e-mail addresses, LinkedIn URLs or dates.
- The profile, applications, `jobs/tracker.csv` and run logs get committed (the dashboard commits after runs when `runs.autoCommit` is on), so **the owner's copy of this repository must be private**. Résumé files (`Resume/`), the database (`data/jobwatcher.db`) and `site/.dev.vars` are git-ignored.
