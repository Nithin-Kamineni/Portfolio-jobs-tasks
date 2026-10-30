// Builds an Outlook on the web "compose" deeplink. The dashboard never sends mail itself:
// the link opens a pre-filled draft in Outlook, where the owner attaches the CV and presses Send.

export const DEFAULT_COMPOSE_BASE = 'https://outlook.office.com/mail/deeplink/compose';
/** Outlook's web servers reject very long query strings, so above this length the body is left out (and copied instead). */
export const DEFAULT_MAX_URL_LENGTH = 2000;

export interface ComposeInput { to?: string | null; subject?: string | null; body?: string | null }
export interface ComposeOptions { base?: string; maxLength?: number }
export interface ComposeLink {
  url: string;
  /** false when the body made the link too long: the UI then copies the body to the clipboard for pasting. */
  bodyIncluded: boolean;
  length: number;
}

/** Percent-encodes a value; line breaks become CRLF (%0D%0A), which Outlook shows as new lines. */
export function encodeComposeValue(v: string): string {
  return encodeURIComponent(v.replace(/\r\n?/g, '\n').replace(/\n/g, '\r\n'));
}

export function buildOutlookCompose(input: ComposeInput, opts: ComposeOptions = {}): ComposeLink {
  const base = opts.base || DEFAULT_COMPOSE_BASE;
  const maxLength = opts.maxLength ?? DEFAULT_MAX_URL_LENGTH;
  const params = (withBody: boolean) => [
    input.to ? `to=${encodeComposeValue(input.to.trim())}` : '',
    input.subject ? `subject=${encodeComposeValue(input.subject)}` : '',
    withBody && input.body ? `body=${encodeComposeValue(input.body)}` : '',
  ].filter(Boolean).join('&');
  const make = (withBody: boolean) => { const q = params(withBody); return q ? `${base}?${q}` : base; };

  const full = make(true);
  if (full.length <= maxLength || !input.body) return { url: full, bodyIncluded: Boolean(input.body), length: full.length };
  const short = make(false);
  return { url: short, bodyIncluded: false, length: short.length };
}

export const wordCount = (s: string | null | undefined): number => String(s || '').trim().split(/\s+/).filter(Boolean).length;
