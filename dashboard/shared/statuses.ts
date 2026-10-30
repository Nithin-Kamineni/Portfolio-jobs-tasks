// Job and outreach statuses, and which status changes are allowed. Shared by server, CLI and web.

/**
 * Job statuses (simplified 2026-10-17, the owner): applying is manual, so there is no "prepared" or "apply direct" holding
 * status any more. A decision is Referral (apply_referral), Applied (he applied directly), Later or Skip. After that:
 * Applied ⇄ Interview. "closed" = the posting is gone (set by rules); the dashboard hides it outside the All filter.
 */
export const JOB_STATUSES = ['new', 'ranked', 'apply_referral', 'later', 'skip', 'applied', 'interview', 'closed'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

/** What the owner decides on a new job. "Apply direct" sets applied straight away. */
export const DECISIONS = ['apply_referral', 'applied', 'later', 'skip'] as const;
export type Decision = (typeof DECISIONS)[number];

/** Statuses that start (or restart) a decision: moving from one of these sets decision_at. */
export const INBOX_STATUSES: readonly JobStatus[] = ['new', 'ranked', 'later', 'skip'];

/** Old status names still accepted as input (CLI, older prompts): apply_direct = applied. */
export const STATUS_ALIASES: Record<string, JobStatus> = { apply_direct: 'applied' };

/** Removed statuses: the error message when something still asks for one. */
export const REMOVED_STATUSES: Record<string, string> = {
  prepared: '"prepared" was removed (applying is manual). Use --dir with the current status to record a folder, or "applied" once the owner applied.',
  rejected: '"rejected" was removed. A rejected or ghosted application stays "applied" (add a note).',
  offer: '"offer" was removed. Keep the job in "interview" and add a note.',
};

/** The application phases the Applications page shows, in order. */
export const PHASES = [
  { key: 'referral', label: 'Referral', status: 'apply_referral' },
  { key: 'applied', label: 'Applied', status: 'applied' },
  { key: 'interview', label: 'Interview', status: 'interview' },
] as const satisfies readonly { key: string; label: string; status: JobStatus }[];

export const STATUS_LABEL: Record<JobStatus, string> = {
  new: 'New', ranked: 'Ranked', apply_referral: 'Referral', later: 'Later', skip: 'Skip',
  applied: 'Applied', interview: 'Interview', closed: 'Closed',
};

const TRANSITIONS: Record<JobStatus, readonly JobStatus[]> = {
  new: ['ranked', ...DECISIONS, 'closed'],
  ranked: [...DECISIONS, 'closed'],
  later: ['apply_referral', 'applied', 'skip', 'closed'],
  skip: ['apply_referral', 'applied', 'later', 'closed'],
  apply_referral: ['applied', 'later', 'skip', 'closed'],
  applied: ['interview'],
  interview: ['applied'],
  closed: [],
};

/** How an old status maps to the new model (the v7 migration, and old tracker.csv files on import). */
export const LEGACY_STATUS: Record<string, JobStatus> = { prepared: 'applied', apply_direct: 'applied', rejected: 'applied', offer: 'interview' };

/** The canonical status for an input (resolves aliases like apply_direct → applied); the input itself otherwise. */
export const normalizeStatus = (s: unknown): string => STATUS_ALIASES[String(s)] ?? String(s);

export const isJobStatus = (s: unknown): s is JobStatus => (JOB_STATUSES as readonly unknown[]).includes(s);

/** True when a job may move from `from` to `to`. Setting the same status again is a no-op, not a transition. */
export function canTransition(from: JobStatus, to: JobStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export const allowedNext = (from: JobStatus): readonly JobStatus[] => TRANSITIONS[from];

export const OUTREACH_TYPES = ['referral', 'cold_email', 'follow_up'] as const;
export type OutreachType = (typeof OUTREACH_TYPES)[number];

export const OUTREACH_STATUSES = ['draft', 'ready', 'sent', 'replied', 'no_reply', 'declined', 'referred'] as const;
export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];
export const REPLY_OUTCOMES = ['replied', 'no_reply', 'declined', 'referred'] as const;
export type ReplyOutcome = (typeof REPLY_OUTCOMES)[number];

export const CHANNELS = ['linkedin', 'email', 'text'] as const;
export type Channel = (typeof CHANNELS)[number];

export const RELATIONSHIPS = ['friend', 'dac', 'advisor_intro', 'researcher'] as const;
export type Relationship = (typeof RELATIONSHIPS)[number];

export const EMAIL_CONFIDENCE = ['verified', 'from_paper', 'pattern_guess'] as const;
export type EmailConfidence = (typeof EMAIL_CONFIDENCE)[number];

/** LinkedIn links Claude finds by web search start as search_match; the owner confirms or rejects them (plan v2 §2, §6.2). */
export const LINKEDIN_CONFIDENCE = ['search_match', 'confirmed', 'rejected'] as const;
export type LinkedinConfidence = (typeof LINKEDIN_CONFIDENCE)[number];


/** A LinkedIn profile URL in canonical form (https://www.linkedin.com/in/<slug>), or null if it isn't one. */
export function normalizeLinkedin(url: string | null | undefined): string | null {
  const m = String(url ?? '').trim().match(/^(?:https?:\/\/)?(?:[a-z]{2,3}\.|www\.)?linkedin\.com\/in\/([A-Za-z0-9\-_%.]{2,100})\/?(?:[?#].*)?$/i);
  return m ? `https://www.linkedin.com/in/${m[1]}` : null;
}

/** Days until a follow-up is due after "Mark sent". */
export const FOLLOW_UP_DAYS: Record<OutreachType, number | null> = { referral: 7, cold_email: 10, follow_up: null };

/**
 * A short key for matching company names across sources, e.g.
 * "Amazon / AWS (Annapurna Labs)" → "amazon", "SK hynix America" → "sk hynix", "NVIDIA" → "nvidia".
 */
export function companyKey(name: string | null | undefined): string {
  const words = String(name || '').toLowerCase().split(/[\s(/,]+/).filter(Boolean);
  if (!words.length) return '';
  return words[0].length <= 2 && words[1] ? `${words[0]} ${words[1]}` : words[0];
}
