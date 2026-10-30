# Tasks guide (claude/tasks.md)

The private task manager at `/app/tasks` (behind the owner's login). Switched on by `MODULES.tasks` in `site/src/owner.config.ts`. Everything is stored in the Cloudflare D1 database (locally in `site/.wrangler/` during development) and every change is recorded in a history with Undo.

## The tabs
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

## Setup (first time)
1. `cd site && npm install && npm run db:migrate:local`.
2. Ask whether they want the **example study pack** (computer architecture, memory systems, RTL/CDC/STA, ML accelerators, GPUs, compilers, OS; ~500 flashcards, ~350 quiz questions, ~170 interview questions; see `examples/study-pack/README.md`). If yes: `npx wrangler d1 execute DB --local --file ../examples/study-pack/study-pack.sql` (and `--remote` after deploying). If their field is different, offer to write a pack for their field instead, in the same tables (`prep_tracks`, `prep_modules`, `prep_items`, `cards`, `quiz_questions`, `questions`), from sources you can cite; put each source in the row.
3. Optional sample data (a document, three papers, a deadline) to try things: `npx wrangler d1 execute DB --local --file ../examples/sample-data.sql`.
4. Ask which tabs they want. To hide one, remove it from `TABS` in `site/src/apps/workspace/WorkspaceApp.tsx` (keep its route if other pages link to it, or remove both).
5. `cp .dev.vars.example .dev.vars`, set `DEV_USER_EMAIL`, `npm run dev`, open http://localhost:4321/app/tasks and sign in with the local button.

## Commands the owner may type
- **"mock interview [topic | company | behavioral | research]"** (interactive only): play the interviewer. Ask for a 60-second intro first; then 4–6 questions one at a time from the `questions` table (or the topic/company named), adjusting difficulty, with 1–2 real follow-ups ("why?", "give me numbers"); don't reveal answers early. End with a scorecard: each answer rated 1–5 for correctness, structure, depth and clarity, what a strong answer had that theirs lacked, and the top 3 things to fix. Judge research answers only against `profile/master_profile.md`; never invent their results. About 30–40 minutes.
- **"add a deadline …"**: insert it with the API or tell them to use Today → Add.
- **"conference deadlines"**: the Today page's **Auto** button. It needs the Jobs part's dashboard running on the PC (the website queues the job, the PC runs Claude). The conference list is `CONFERENCES` in `dashboard/server/runs/prompts.ts` (default: chip-design / computer-architecture venues; change it to the owner's field). The run must read each date from the conference's **official** page, never invent one, and save them with `node dashboard/cli deadlines suggest --file <json>`; they arrive unticked for the owner to choose. Full rules: the "conference deadlines" section of `claude/jobs.md`.
- **"weekly review"** of study progress: summarize the prep log, flashcards reviewed, hours planned vs done; suggest next week's plan.

## Rules
- The owner's data is theirs: never delete rows to "clean up" without asking; deletes go through the app (they have Undo).
- New tables/columns: a new numbered migration in `site/migrations/`, then `npm run db:migrate:local`; for the live site `npm run db:migrate` before `npm run deploy`.
- Every write endpoint records a history entry (`record()` in `history.ts`) so it can be undone.
- Test in the browser (local dev) in the dark and light themes and at phone width before saying it's done.
