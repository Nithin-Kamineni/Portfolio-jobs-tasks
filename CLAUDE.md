# CLAUDE.md: Portfolio · Tasks · Jobs

This repository is a template for a personal website with three optional parts: a public **portfolio**, a private **task manager** and a private **job tracker**. The person you are working with ("The owner") builds their own copy with you. This file is the combined guide; each part also has its own: `claude/portfolio.md`, `claude/tasks.md`, `claude/jobs.md`. Read the guide of every part that is switched on before changing it.

## Start of every session
1. Read `site/src/owner.config.ts`: `MODULES` says which parts are on, `OWNER` and `LINKS` who the site belongs to.
2. If `OWNER.name` is still `Your Name`, or the owner says **"set up my project"**, do **First-time setup** below.
3. Read `profile/master_profile.md` when you need facts about the owner. It is the only source of truth about them.
4. Keep a short log of what you did in `progress.md` (create it); read it at the start of the next session.

## First-time setup ("set up my project")
Ask, don't assume. One question at a time is fine; use your question tool if you have one.

1. **Which parts?** Ask: "What do you want to build: the portfolio, the task manager, the job tracker, any two, or all three?" Set `MODULES` in `site/src/owner.config.ts` (`true`/`false`). Parts that are off answer 404 and their links disappear; don't delete their code (the site imports shared types from `dashboard/shared`).
2. **About you** (all parts): name, two initials for the logo chip, e-mail and public links (GitHub, LinkedIn, Google Scholar). Fill `OWNER` and `LINKS`. Never put a phone number or home address in anything public.
3. **Profile**: ask the owner for their résumé (paste the text or a file) and fill `profile/master_profile.md` from it, section by section, marking anything unclear as `TODO (ask)`. Every later step uses only facts from this file.
4. **Per part**, follow its guide's setup section:
   - Portfolio → `claude/portfolio.md` (fill `site/src/components/site/content.ts`, photos, CV, highlights).
   - Tasks → `claude/tasks.md` (database, optional study pack, which tabs to keep).
   - Jobs → `claude/jobs.md` (field, target companies, keywords, work-authorization and degree rules, the watcher on GitHub, the dashboard on the PC).
5. **Run it**: `cd site && npm install && npm run db:migrate:local`, copy `site/.dev.vars.example` to `site/.dev.vars` and set `DEV_USER_EMAIL` to the owner's e-mail, then `npm run dev` and show them http://localhost:4321 (and /app if Tasks or Jobs are on). For Jobs, also `cd dashboard && npm install && npm start` (http://localhost:5178).
6. **Deploy (only if they want it)**: walk them through `docs/deploy-cloudflare.md`. They create the accounts and paste secrets; you run the commands they approve.

## Repository layout
```
site/        Astro + React website on a Cloudflare Worker. Public portfolio at /, private apps at /app/tasks and /app/jobs,
             API at /api (behind Cloudflare Access). D1 schema: site/migrations. Owner + modules: site/src/owner.config.ts
dashboard/   local job dashboard (Express + SQLite + React, http://localhost:5178) and its CLI: node dashboard/cli <command>
watcher/     job watcher (Node, no dependencies); scheduled by .github/workflows/job-watcher.yml
targets/     companies.csv (what the watcher reads), openalex_institutions.json (research contacts)
profile/     master_profile.md: the only source of facts about the owner
career/      message templates
examples/    study-pack/ (optional interview-prep content), sample-data.sql
docs/        deploy-cloudflare.md
claude/      per-part guides
```

## Commands
```
cd site && npm run dev                 # website on http://localhost:4321 (local D1; sign in with DEV_USER_EMAIL)
cd site && npm run db:migrate:local    # create / update the local database
cd site && npm run check && npm test   # type check + unit tests
cd site && npm run deploy              # build and deploy to Cloudflare (only when the owner asks)
cd site && npm run db:migrate          # apply migrations to the live D1 (before a deploy that needs them)
cd dashboard && npm start              # job dashboard on http://localhost:5178 (Jobs only)
node dashboard/cli help                # the job tracker's CLI (Jobs only; see claude/jobs.md)
```
New database tables or columns go in a new numbered file in `site/migrations/` (never edit an applied one). Test on the local database first, then `npm run db:migrate` before deploying.

## Hard rules (all parts)
- **Never invent facts** about the owner: experience, numbers, skills, tools, co-authors, venues, dates. The only source is `profile/master_profile.md`. If something is missing, ask, or write `TODO (ask)`.
- Tailoring means rewording, reordering and choosing emphasis, never adding claims.
- **Never submit applications, send e-mails or messages, create accounts, log in anywhere or type passwords.** The owner does these. Messages you write are drafts.
- **Never put secrets in files or git**: Cloudflare secrets go in with `npx wrangler secret put NAME`, local ones in the git-ignored `site/.dev.vars`.
- Keep résumés with a phone number out of public places (the public CV in `site/public/cv/` must not have one).
- The owner's copy should be a **private** repository once it holds their profile, applications or job data. Résumé files, the job database and `.dev.vars` are git-ignored either way.
- UI: no pop-ups that open by themselves and no browser `alert`/`confirm`; deletes get an in-app confirmation and an Undo.

## Part guides
- **Portfolio** (`claude/portfolio.md`): where every piece of text and every image comes from, how to restyle, how to add a section.
- **Tasks** (`claude/tasks.md`): the tabs (Today, Reading list, Interview prep, Questions, Documents, Coding, History), the database, the study pack, the "mock interview" command, conference-deadline lookups.
- **Jobs** (`claude/jobs.md`): the watcher, the dashboard and its CLI, the statuses, and the commands the owner may type ("process new jobs", "prepare <company> <role>", "applied to …", "cold emails", "follow-ups", "fix watcher errors", "weekly review", …).

---

# The part guides (also in claude/: portfolio.md, tasks.md, jobs.md)

Each part's full guide follows. A part that is switched off in `MODULES` can be skipped.

## Portfolio guide (claude/portfolio.md)

The public one-page site at `/`: a header with the owner's name and headline, a hero image, then five sections (about, projects, experience, publications, résumé), a sticky navigation bar drawn as a five-stage CPU pipeline, and three colour themes (dark, dim, light). It is prerendered to static HTML at build time and needs no database.

Switched on by `MODULES.portfolio` in `site/src/owner.config.ts`. When it is off, `/` shows only a small page that links to the private app.

### Where everything comes from
| What | File |
|---|---|
| Name, initials (logo chip), headline, kicker, "open to" line, highlight chips, About paragraphs, what they're seeking, page title and description | `site/src/owner.config.ts` (`OWNER`) |
| E-mail, GitHub, LinkedIn, Google Scholar links | `site/src/owner.config.ts` (`LINKS`; an empty string hides a link in the header) |
| Education, recognition, skills, projects, experience, publications, stats, photos, the web résumé | `site/src/components/site/content.ts` |
| Hero image | `site/public/hero-placeholder.png` (replace the file, about 1600 × 900; or change the path in `site/src/components/App.tsx`) |
| About photos | `site/public/about/*.png|jpg`, listed in `PHOTOS` in content.ts (square; the first is the main one) |
| Downloadable CV | any PDF in `site/public/cv/` (the first one found is linked; without one the button shows as pending) |
| Favicon | `site/public/favicon.svg` (two letters in a rounded square: change `YN`) |
| Section order and names | `SECTIONS` in content.ts, and the section components in `site/src/components/site/Sections.tsx` |
| Colours, fonts, spacing | `site/src/styles/styles.css` (theme tokens at the top: dark, dim, light), `site/src/styles/site.css` (sections) |

### Setup (first time)
1. Fill `OWNER` and `LINKS` in `owner.config.ts` (ask the owner; facts only from `profile/master_profile.md`).
2. Fill `content.ts` section by section from the profile. Keep the shapes (TypeScript types are at the top of each block). For every project: one number that matters (`metric` + `metricLabel`), what it is, why it matters, tags, links. Ask before guessing anything.
3. Photos: ask the owner for 1–6 square photos. Re-encode them without EXIF location data (any image tool, or a quick script with sharp/squoosh), put them in `site/public/about/`, and list them in `PHOTOS` with alt text. No photos? Keep the placeholders or set `PHOTOS` to one image.
4. Hero image: ask for a wide picture (their work, a diagram, a photo) and replace `site/public/hero-placeholder.png`. They can also keep a plain colour block: delete the `<figure className="hero-image">` in `App.tsx`.
5. CV: ask for a public PDF **without a phone number** and put it in `site/public/cv/`.
6. Run `cd site && npm run dev` and review http://localhost:4321 together in all three themes (the moon/sun button) and at phone width.

### Rules
- Every word is a public claim: only facts from the profile, numbers exactly as the owner gives them, "under review" where that is true.
- Don't add trackers, analytics or third-party scripts without the owner asking.
- Keep the page fast: images under ~300 KB each (WebP or a reasonably compressed JPEG), no extra web fonts.
- Before sharing the link: `npm run build` must pass (it type-checks), and check the page at phone width.

### Ideas the owner may ask for
- A blog: add an Astro content collection under `site/src/content/` and pages under `site/src/pages/blog/`.
- Their own domain: Cloudflare → Workers → the site → Settings → Domains (see `docs/deploy-cloudflare.md`).
- Remove a section: delete it from `SECTIONS`, from `Sections.tsx` and from the nav links in `App.tsx`.

## Tasks guide (claude/tasks.md)

The private task manager at `/app/tasks` (behind the owner's login). Switched on by `MODULES.tasks` in `site/src/owner.config.ts`. Everything is stored in the Cloudflare D1 database (locally in `site/.wrangler/` during development) and every change is recorded in a history with Undo.

### The tabs
| Tab | What it does | Code |
|---|---|---|
| **Today** | Deadlines with live countdowns (cards in three sizes; a selector chooses which show), open checklist items from all documents grouped by due date, and "study today": due flashcards, today's weekly-plan items, and the next item from the top of each list | `site/src/apps/workspace/today/` |
| **Reading list** | Papers in reading order (drag to reorder), projects (sub-lists), filters, notes | `reading/` |
| **Interview prep** | Tracks → modules → items (videos, readings, exercises) with status and confidence; focuses (named subsets); weekly plan; flashcards with spaced repetition; quizzes | `prep/` |
| **Questions** | Interview questions: answer first, then reveal the model answer | `questions/` |
| **Tasks** (documents) | Google-Docs-style editor: folders, lists as you type, checklists with due dates, images, highlights, version history; unsaved text is kept on the device when offline | `docs/` |
| **Coding** | DSA (NeetCode 150 / Blind 75 / all) and HDL practice roadmaps with progress and notes | `coding/` |
| **History** | Every change, with Undo/Redo | `history/` |
| Search (Ctrl+K) | Searches everything above; opening a result scrolls to the words and flashes them | `search/` |

Server side: `site/src/lib/cloud/workspace.ts` (most areas), `study.ts` (cards, quiz, plan, questions), `today.ts` (deadlines, document tasks, search index), `history.ts` (undo). All routes are under `/api/ws/…`.

### Setup (first time)
1. `cd site && npm install && npm run db:migrate:local`.
2. Ask whether they want the **example study pack** (computer architecture, memory systems, RTL/CDC/STA, ML accelerators, GPUs, compilers, OS; ~500 flashcards, ~350 quiz questions, ~170 interview questions; see `examples/study-pack/README.md`). If yes: `npx wrangler d1 execute DB --local --file ../examples/study-pack/study-pack.sql` (and `--remote` after deploying). If their field is different, offer to write a pack for their field instead, in the same tables (`prep_tracks`, `prep_modules`, `prep_items`, `cards`, `quiz_questions`, `questions`), from sources you can cite; put each source in the row.
3. Optional sample data (a document, three papers, a deadline) to try things: `npx wrangler d1 execute DB --local --file ../examples/sample-data.sql`.
4. Ask which tabs they want. To hide one, remove it from `TABS` in `site/src/apps/workspace/WorkspaceApp.tsx` (keep its route if other pages link to it, or remove both).
5. `cp .dev.vars.example .dev.vars`, set `DEV_USER_EMAIL`, `npm run dev`, open http://localhost:4321/app/tasks and sign in with the local button.

### Commands the owner may type
- **"mock interview [topic | company | behavioral | research]"** (interactive only): play the interviewer. Ask for a 60-second intro first; then 4–6 questions one at a time from the `questions` table (or the topic/company named), adjusting difficulty, with 1–2 real follow-ups ("why?", "give me numbers"); don't reveal answers early. End with a scorecard: each answer rated 1–5 for correctness, structure, depth and clarity, what a strong answer had that theirs lacked, and the top 3 things to fix. Judge research answers only against `profile/master_profile.md`; never invent their results. About 30–40 minutes.
- **"add a deadline …"**: insert it with the API or tell them to use Today → Add.
- **"conference deadlines"**: the Today page's **Auto** button. It needs the Jobs part's dashboard running on the PC (the website queues the job, the PC runs Claude). The conference list is `CONFERENCES` in `dashboard/server/runs/prompts.ts` (default: chip-design / computer-architecture venues; change it to the owner's field). The run must read each date from the conference's **official** page, never invent one, and save them with `node dashboard/cli deadlines suggest --file <json>`; they arrive unticked for the owner to choose. Full rules: the "conference deadlines" section of `claude/jobs.md`.
- **"weekly review"** of study progress: summarize the prep log, flashcards reviewed, hours planned vs done; suggest next week's plan.

### Rules
- The owner's data is theirs: never delete rows to "clean up" without asking; deletes go through the app (they have Undo).
- New tables/columns: a new numbered migration in `site/migrations/`, then `npm run db:migrate:local`; for the live site `npm run db:migrate` before `npm run deploy`.
- Every write endpoint records a history entry (`record()` in `history.ts`) so it can be undone.
- Test in the browser (local dev) in the dark and light themes and at phone width before saying it's done.

## Jobs guide (claude/jobs.md)

A job tracker for one person's search (it was built for PhD internships in chip design / AI hardware; everything field-specific is configurable). Three pieces:

1. **The watcher** (`watcher/`, Node 22, no dependencies) reads the career sites in `targets/companies.csv` (Workday, Greenhouse, Lever, Ashby, SmartRecruiters, Google, Apple, Amazon, Microsoft, …), keeps the postings whose titles match `watcher/keywords.json`, scores them, and writes `jobs/inbox/*.jsonl` and a digest. GitHub Actions runs it three times a day (`.github/workflows/job-watcher.yml`) and opens an issue when there are new matches.
2. **The dashboard** (`dashboard/`, http://localhost:5178, on the owner's PC) imports the inbox into SQLite (`data/jobwatcher.db`), shows the jobs, and runs **Claude Code** for the heavy lifting: ranking jobs against the profile, checking career sites that can't be read automatically (Claude in Chrome), finding researchers to contact, drafting messages. The owner decides each job there.
3. **The website's `/app/jobs`** (optional, after deploying): the same data from any device. The dashboard syncs its database with the website's D1 every few minutes; buttons on the website queue work for the PC.

Switched on by `MODULES.jobs` in `site/src/owner.config.ts` (that only affects the website; the dashboard and watcher run regardless).

### Setup (first time)
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

### The dashboard and its CLI
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

### Commands the owner may type
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

### Rules (on top of the hard rules in CLAUDE.md)
- Never submit applications, send e-mails or messages, create accounts, log in or type passwords. Application forms are filled by the owner (dashboard: **Open posting** → apply → **Mark applied**).
- Never invent facts, e-mail addresses, LinkedIn URLs or dates.
- The profile, applications, `jobs/tracker.csv` and run logs get committed (the dashboard commits after runs when `runs.autoCommit` is on), so **the owner's copy of this repository must be private**. Résumé files (`Resume/`), the database (`data/jobwatcher.db`) and `site/.dev.vars` are git-ignored.
