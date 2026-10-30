// Everything the portfolio shows comes from this file (plus site/src/owner.config.ts for your name and
// links). It ships with placeholder text: replace it with your own facts, from profile/master_profile.md.
// Your AI agent fills it in when you build the portfolio (see claude/portfolio.md). Don't add claims you
// can't back up.

export { LINKS } from '../../owner.config';

export interface Section { id: string; label: string; stage: string }

/** Nav order. The sticky nav draws these as the five stages of a CPU pipeline (decorative; rename freely). */
export const SECTIONS: Section[] = [
  { id: 'about', label: 'about', stage: 'IF' },
  { id: 'research', label: 'projects', stage: 'ID' },
  { id: 'experience', label: 'experience', stage: 'EX' },
  { id: 'publications', label: 'publications', stage: 'MEM' },
  { id: 'cv', label: 'resume/cv', stage: 'WB' },
];

/** Your public CV (no phone number), served from public/cv/ (see owner.config.ts); null hides the download. */
export const CV_PDF: string | null = __CV_PDF__;

export const EDUCATION = [
  { degree: 'Degree, Field of study', school: 'Your University', when: 'Start – End', note: 'GPA / advisor / honours (optional)' },
  { degree: 'Earlier degree, Field', school: 'Another University', when: 'Start – End', note: 'Relevant coursework' },
];

export const RECOGNITION = [
  'An award or fellowship',
  'A talk or presentation',
  'Reviewing, teaching or service',
];

export const SKILLS: { group: string; items: string }[] = [
  { group: 'Core skills', items: 'Skill one, skill two, skill three' },
  { group: 'Tools', items: 'Tool one, tool two, tool three' },
  { group: 'Languages & systems', items: 'Python, C++, Linux, Git' },
];

export interface Project {
  name: string;
  venue: string;
  /** Published work is cyan, under-review work violet. */
  review?: boolean;
  role: string;
  /** The one number a reader should take away, and what it measures. */
  metric: string;
  metricLabel: string;
  /** Methods and tools, for readers scanning for keywords. */
  tags: string[];
  what: string;
  why: string;
  extra?: string;
  links: { label: string; href: string }[];
}

export const PROJECTS: Project[] = [
  {
    name: 'Project One',
    metric: '10×',
    metricLabel: 'the headline result',
    tags: ['Method', 'Tool', 'Topic'],
    venue: 'Venue / course / company',
    role: 'your role',
    what: 'One or two sentences on what you built.',
    why: 'Why it matters, with the number that proves it.',
    links: [{ label: 'code', href: 'https://github.com/' }],
  },
  {
    name: 'Project Two',
    metric: '42%',
    metricLabel: 'improvement in something',
    tags: ['Method', 'Tool'],
    venue: 'Venue',
    review: true,
    role: 'your role',
    what: 'What it is.',
    why: 'Why it matters.',
    links: [],
  },
];

export interface Job { title: string; org: string; when: string; points: string[]; tags?: string[] }

export const EXPERIENCE: Job[] = [
  {
    title: 'Your Role',
    org: 'Organization',
    when: 'Start – present',
    tags: ['Tool one', 'Tool two'],
    points: ['What you did, with a result.', 'Another thing you did, with a number.'],
  },
  {
    title: 'Earlier Role',
    org: 'Organization',
    when: 'Start – End',
    points: ['What you did there.'],
  },
];

export interface Pub {
  venue: string;
  /** Year, or "under review". */
  when: string;
  review?: boolean;
  title: string;
  /** Author list; ME is shown in bold. */
  authors: string;
  href?: string;
  linkLabel?: string;
}

/** How your name appears in author lists (shown in bold). */
export const ME = 'Y. Name';

export const PUBS: Pub[] = [
  { venue: 'Conference', when: '2026', title: 'Title of a paper you wrote', authors: 'Y. Name, A. Coauthor, B. Advisor', href: 'https://example.org', linkLabel: 'paper' },
  { venue: 'Journal', when: 'under review', review: true, title: 'Title of a paper under review', authors: 'A. Coauthor, Y. Name, B. Advisor' },
];

/** A second, optional list (work outside your main field). Empty hides it. */
export const PUBS_INTERDISCIPLINARY: Pub[] = [];

// ---- About ---------------------------------------------------------------------------------

export interface Photo {
  src: string;
  alt: string;
  /** Where the colour wash starts (a face), as fractions of the square. */
  face?: [number, number];
}

/** Square images in public/about/ (re-encode your photos without EXIF location data). The first one is the main image. */
export const PHOTOS: Photo[] = [
  { src: '/about/placeholder-1.png', alt: 'Placeholder photo', face: [0.5, 0.4] },
  { src: '/about/placeholder-2.png', alt: 'Placeholder photo', face: [0.5, 0.4] },
  { src: '/about/placeholder-3.png', alt: 'Placeholder photo', face: [0.5, 0.4] },
];

/** A few numbers a reader can take away in a glance. */
export const STATS: { value: string; label: string }[] = [
  { value: '3', label: 'something you are proud of' },
  { value: '2026', label: 'a milestone' },
  { value: '10×', label: 'a headline result' },
  { value: '20+', label: 'something you did many times' },
];

// ---- Résumé (the web version of your PDF; never put your phone number here) -----------------

export const RESUME = {
  name: 'Your Name',
  summary: 'Two or three sentences: who you are, what you work on, your best result, and what you are looking for.',
  education: [
    { degree: 'Degree in Field', when: 'Start – End', school: 'Your University', lines: ['Advisor / focus', 'Relevant coursework'] },
  ],
  skills: [
    { k: 'Core skills', v: 'Skill one, skill two' },
    { k: 'Tools', v: 'Tool one, tool two' },
  ],
  jobs: [
    { title: 'Your Role', org: 'Organization', when: 'Start – Present', points: ['**Project**: what you did and the result.', 'Another bullet.'] },
  ],
  awards: ['An award', 'A talk'],
};
