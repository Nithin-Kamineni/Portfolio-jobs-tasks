// A stored job description is never lost (The owner, 2026-10-17: "once I get an interview, companies may remove the
// posting; this app will be my only way to read the job description"). Used by the dashboard and the website.

/** Plain text of a description (tags and entities removed, whitespace collapsed). */
export function descriptionText(html: string | null | undefined): string {
  return String(html || '')
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Text that reads like a "this job is gone" page rather than a posting. */
const GONE = /\b(no longer (available|accepting|active|open|posted)|(job|position|posting|requisition|page) (has been |was )?(closed|removed|expired|filled|deleted|not found)|(this|the) (job|position|posting) (is )?(closed|expired|unavailable)|page not found|404 not found|position has been filled|we couldn'?t find|job not found|sorry,? (this|the) (job|position))\b/i;

export const MIN_DESCRIPTION_CHARS = 200;

export type DescriptionDecision =
  | { action: 'store'; replaced: boolean }                                  // save the new text (replaced: an older text existed)
  | { action: 'keep'; reason: string };                                      // keep the stored text, ignore the new one

/**
 * Whether a newly fetched/imported description may replace the stored one.
 * - nothing stored yet → store anything non-empty
 * - the same text → keep (nothing to do)
 * - empty, a "posting removed" page, shorter than MIN_DESCRIPTION_CHARS, or under 60 % of the stored text → keep the stored one
 * - otherwise (a substantial, different text) → store; the caller keeps the previous text in an event.
 */
export function descriptionDecision(stored: string | null | undefined, incoming: string | null | undefined): DescriptionDecision {
  const oldText = descriptionText(stored);
  const newText = descriptionText(incoming);
  if (!oldText) return newText ? { action: 'store', replaced: false } : { action: 'keep', reason: 'the new description is empty' };
  if (!newText) return { action: 'keep', reason: 'the new description is empty' };
  if (newText === oldText) return { action: 'keep', reason: 'unchanged' };
  if (GONE.test(newText) && newText.length < Math.max(1500, oldText.length * 0.6)) return { action: 'keep', reason: 'the posting page says the job is gone' };
  if (newText.length < MIN_DESCRIPTION_CHARS && newText.length < oldText.length) return { action: 'keep', reason: `the new text is only ${newText.length} characters` };
  if (newText.length < oldText.length * 0.6) return { action: 'keep', reason: `the new text is much shorter (${newText.length} vs ${oldText.length} characters)` };
  return { action: 'store', replaced: true };
}

/** Statuses whose description is also saved as applications/<dir>/JD.md (and fetched right away if missing). */
export const KEEP_DESCRIPTION_STATUSES = ['apply_referral', 'applied', 'interview'] as const;
export const keepsDescription = (status: string | null | undefined) => (KEEP_DESCRIPTION_STATUSES as readonly string[]).includes(String(status));
