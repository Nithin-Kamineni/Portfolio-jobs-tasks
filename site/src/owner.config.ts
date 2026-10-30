// Who this site belongs to, and which parts of the product are switched on.
// Your AI agent fills this in at setup (see CLAUDE.md → "First-time setup"). Everything here is public:
// never put a phone number, a home address or a password in this file.

/** Which parts of the product this build serves. Turned off = its pages and API answer 404 and its links are hidden. */
export const MODULES = {
  /** The public one-page portfolio at / */
  portfolio: true,
  /** The private task manager at /app/tasks (Today, documents, reading list, interview prep, …) */
  tasks: true,
  /** The private job tracker at /app/jobs (needs the local dashboard on your PC: see claude/jobs.md) */
  jobs: true,
};

export const OWNER = {
  name: 'Your Name',
  /** Two letters for the round logo chip (tap it five times on the portfolio to open the private app). */
  initials: 'YN',
  /** Small line above the headline. */
  kicker: 'Your role · Your field · Your organization',
  /** The big headline on the portfolio. */
  headline: 'One sentence about the work you do',
  /** One or two sentences under the headline. */
  lede: 'What you build, and why it matters.',
  /** The green "open to" line; empty hides it. */
  available: 'Open to new opportunities',
  /** Browser tab title and the description search engines show. */
  siteTitle: 'Your Name',
  description: 'Your Name: your role and field, in one sentence.',
  /** Highlight chips under the headline (e.g. your best papers or projects); empty list hides them. */
  highlights: [
    { label: 'Venue ’26', name: 'Project One' },
    { label: 'Venue ’25', name: 'Project Two' },
  ] as { label: string; name: string; muted?: boolean }[],
  /** The "About" text: a few short paragraphs, then what you are looking for. */
  about: [
    'A short paragraph about who you are and what you work on.',
    'A second paragraph about your background.',
  ],
  seeking: 'The kind of role or collaboration you are looking for.',
};

/** Public links (replace the placeholders). An empty string hides the link in the top header; the sticky bar and the footer
 *  show all four, so remove a link there too (StickyNav.tsx, Sections.tsx) if you don't have one. */
export const LINKS = {
  email: 'you@example.com',
  scholar: 'https://scholar.google.com/',
  linkedin: 'https://www.linkedin.com/',
  github: 'https://github.com/',
};
