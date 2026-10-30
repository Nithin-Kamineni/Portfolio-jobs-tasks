// Task prompts. CLAUDE.md stays the single definition of each command; a prompt only says which command to run,
// with this run's limits and parameters, plus the headless rules (plan v2 §2, §3.2).
import { scratchDir } from './args';
import type { TaskDef } from './tasks';

export interface PromptInfo {
  runId: number;
  params: Record<string, unknown>;
  /** Resolved from params by the runner (validated against the database). */
  job?: { id: string; company: string; title: string; url: string; applicationDir?: string | null };
  jobs?: { id: string; company: string; title: string }[];
  company?: { name: string; careersUrl: string; searchUrl: string; knownUrls: string[] };
  /** The owner's note when continuing an earlier run. */
  note?: string;
}

export const CONFERENCES = 'DAC, DATE, ICCAD, ISCA, MICRO, ASPLOS, GLSVLSI, ASP-DAC';

const LINKEDIN_RULE = 'LinkedIn: one WebSearch per person ("<full name>" <company> LinkedIn); never open linkedin.com pages (blocked) and never guess a profile URL.';

const HEADER = 'You are running headless from the JobWatcher dashboard; nobody can answer questions during this run.';

const RULES = (runId: number) => [
  'Use only `node dashboard/cli …` to read and write jobs, contacts and outreach (every command prints JSON).',
  `Write any draft or scratch files (e-mail bodies for --body-file, descriptions for --description-file) with the Write tool under ${scratchDir(runId)}/ (it already exists; don't create it) and nowhere else in the repo unless the command says so.`,
  'The only shell commands you may run are `node dashboard/cli …` (plus any the command names explicitly); don\'t try others (they are denied and waste turns). `node dashboard/cli help` lists the commands.',
  'Keep every hard rule in CLAUDE.md: never submit applications, send e-mails or messages, create accounts, log in anywhere or type passwords; never invent facts or e-mail addresses; never try to get around a CAPTCHA, bot check or login wall.',
  'Do not ask questions. If you get blocked (missing information, a login page, a CAPTCHA, a failing command), stop and explain in your final message exactly what the owner needs to do.',
  'End with a short summary for the owner (a few lines of Markdown): what you did, counts, and anything that needs him.',
].join('\n- ');

function taskLine(task: TaskDef, info: PromptInfo): string {
  const p = info.params;
  switch (task.id) {
    case 'process-new-jobs':
      return `Do the "process new jobs" command exactly as defined in CLAUDE.md, for at most ${p.limit ?? 40} jobs (status new, the highest watcher score first). Rank only jobs that are still \`new\`; never re-rank a ranked job.`;
    case 'quick-rank': {
      return [
        `Quick-rank step of "process new jobs" (CLAUDE.md). Read profile/master_profile.md once. Then run \`node dashboard/cli jobs --for-ranking --limit ${p.limit ?? 40}\`: it prints a compact card per job (the relevant part of the description; boilerplate removed).`,
        'For every card, write a fit score and a 1–2 line reason with `node dashboard/cli rank <id> --fit 0-100 --reason "…" --stage quick`. Apply the domain rule and the F-1 rule from CLAUDE.md.',
        'Do not open the full descriptions or the postings; the cards are enough for a quick score.',
      ].join('\n');
    }
    case 'final-check': {
      const list = (info.jobs || []).map((j) => `  - ${j.id}: ${j.company}, ${j.title}`).join('\n');
      return [
        'Final-check step of "process new jobs" (CLAUDE.md). Read profile/master_profile.md once. These jobs got a promising quick fit score from a lighter model (which tends to score borderline hardware roles too low):',
        list,
        'For each, read the full description with `node dashboard/cli job <id>` and confirm or correct the score and reason with `node dashboard/cli rank <id> --fit 0-100 --reason "…" --stage final`. Be accurate: the owner decides which of these to apply to.',
      ].join('\n');
    }
    case 'check-manual-companies': {
      const c = info.company;
      if (!c) return 'Do the "check manual companies" command as defined in CLAUDE.md.';
      return [
        `Do the "check manual companies" command (CLAUDE.md) for ONE company only: ${c.name}.`,
        `Careers site: ${c.careersUrl || '(unknown)'}. Search URL: ${c.searchUrl ? c.searchUrl.replace('{q}', 'intern') : '(none: use the careers site\'s own search URL if it has one)'}.`,
        'Use the search URL exactly as given; never replace it with the careers page. It can be a role filter (e.g. Meta\'s roles[0]=Internship) or a web-search query (e.g. Bing "site:jobs.smartrecruiters.com/Sandisk …" for a board that hides its own list); for a web search, open the result links that point to the company\'s job board and judge each by its own page (expired or past-season postings are not candidates).',
        `Goal: miss no posting, whatever the company calls it. If the site has an internship / student / university filter (role, job type or category), read that filtered list with an empty search word first. If the site can list ALL its US jobs without a search word and that list has at most ~400 jobs, read that whole list instead of searching. Otherwise search ${c.searchUrl ? 'the search URL' : 'the site'} for EACH of these words, not just the first (put the word in the URL in place of "intern"): "intern", "internship", "co-op", "student", "summer", "PhD", "graduate", "university", "fellowship". A word whose results are all already known or not student roles: move on quickly.`,
        'In Chrome: open each search in a new tab and read the result list with get_page_text or ONE javascript_tool call per page (return title, location and link of every result as JSON, plus the total the site shows, e.g. "57 jobs"). Read EVERY results page: go to the next page by changing the page/offset parameter in the URL; if more results load on scroll, scroll with javascript_tool (window.scrollTo) until the count stops growing. Stop only when you have as many results as the site says it has.',
        'Candidates = every US (or unspecified-location) posting for students: intern, internship, co-op, student program, summer program, student researcher, PhD / graduate research role, fellowship, residency, trainee or apprentice (any season: summer, fall, spring, winter 2027). Do NOT judge the topic yourself; `job add` applies the title, US-location and chip/hardware-domain filters and rejects what is out of scope.',
        'Open up to 25 candidates per run (the ones not already known, newest first). For each, read title, location, URL, posted date and the description text (get_page_text), write the description to a file in the scratch folder and add it with `node dashboard/cli job add --company "' + c.name + '" --title "…" --url "…" [--location "…"] [--posted YYYY-MM-DD] --description-file <file> --source "manual:' + c.name + '"`. A rejection from `job add` (not a match) is fine; move on. If more than 25 candidates are new, list the rest (title + URL) in your summary; the next run picks them up.',
        c.knownUrls.length ? `Already known postings (do NOT open these again):\n${c.knownUrls.slice(0, 60).map((u) => `  - ${u}`).join('\n')}` : 'No postings from this company are known yet.',
        'Use text, not pictures: get_page_text / find / one javascript_tool call; read_page only with filter "interactive"; no screenshots unless a page cannot be read any other way. Never click, type or fill anything; search by navigating to a URL. Close the tabs you opened when done.',
        `A login wall, CAPTCHA or bot check: stop and report "blocked"; never try to get around it. Finish with \`node dashboard/cli manual-checked "${c.name}" --found N --added M --result ok|blocked|error --note "…"\` (N = all US intern candidates you found; the note gives each search's total as the site showed it, e.g. "intern 57, internship 41, PhD intern 12; 3 pages read") and a one-line summary.`,
      ].join('\n');
    }
    case 'process-decisions': {
      const ids = Array.isArray(p.jobIds) && p.jobIds.length ? ` Only these jobs: ${(p.jobIds as string[]).join(', ')}.` : '';
      return `Do the "process decisions" command exactly as defined in CLAUDE.md.${ids} The application folders go under applications/.`;
    }
    case 'prepare-job': {
      const j = info.job!;
      return `Do the "prepare <company> <role>" command as defined in CLAUDE.md for this one job: ${j.company}, ${j.title} (job id ${j.id}, ${j.url}). The folder goes under applications/.`;
    }
    case 'cold-emails': {
      const companies = Array.isArray(p.companies) && p.companies.length ? (p.companies as string[]) : null;
      const picked = Array.isArray(p.candidateIds) && p.candidateIds.length ? (p.candidateIds as number[]) : null;
      const search = companies ? `--companies "${companies.join(',')}"` : '--priority A,B';
      return [
        `Do the "cold emails" command as defined in CLAUDE.md, but for at most ${p.count ?? 10} new researchers in this run.`,
        companies ? `Only these companies: ${companies.join(', ')}.` : '',
        picked
          ? `the owner picked these research candidates: start with \`node dashboard/cli research candidates --ids ${picked.join(',')}\` and do these people first.`
          : `Start with \`node dashboard/cli research candidates ${search} --limit 60\` (one call; it searches the papers for you).`,
        LINKEDIN_RULE,
      ].filter(Boolean).join('\n');
    }
    case 'cold-emails-company':
      return [
        `Do the "cold emails for <Company>" command as defined in CLAUDE.md for ${String(p.company)} (1–3 people).${info.job ? ` Link the drafts to job ${info.job.id} (${info.job.title}) with --job ${info.job.id}.` : ''}`,
        `Start with \`node dashboard/cli research candidates --companies "${String(p.company)}" --limit 15\`.`,
        LINKEDIN_RULE,
      ].join('\n');
    case 'follow-ups':
      return 'Do the "follow-ups" command exactly as defined in CLAUDE.md.';
    case 'weekly-review':
      return 'Do the "weekly review" command exactly as defined in CLAUDE.md. Your final message is saved and shown to the owner as the review, so write it for him (Markdown, short sections). Finish with `node dashboard/cli mark weekly_review`.';
    case 'conference-deadlines': {
      const list = String(p.conferences || '').trim() || CONFERENCES;
      return [
        `Do the "conference deadlines" command exactly as defined in CLAUDE.md for these conferences: ${list}.`,
        'Start with `node dashboard/cli deadlines list` (what earlier runs found). Write the JSON for `deadlines suggest --file` in the scratch folder.',
      ].join('\n');
    }
    case 'fix-watcher-errors':
      return 'Do the "fix watcher errors" command exactly as defined in CLAUDE.md. You may edit files under watcher/ only, test with `node watcher/watch.js --dry --company "<name>"`, and commit with git add/commit (never push). Finish with `node dashboard/cli mark watcher_errors_fixed` only if the errors are really fixed.';
  }
}

export function buildPrompt(task: TaskDef, info: PromptInfo): string {
  return `${HEADER}\n\n${taskLine(task, info)}\n\nRules for this run:\n- ${RULES(info.runId)}\n`;
}

/** The prompt for "Continue" (claude --resume <session>): the owner's note, then carry on. */
export function continuePrompt(note: string | undefined): string {
  const n = note?.trim();
  return `${HEADER}\n\n${n ? `the owner says: ${n}\n\n` : ''}Continue the task from where you stopped, with the same rules as before. End with a short summary.`;
}
