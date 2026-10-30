// Topic tags, warning flags and field normalization for job records.
// Used by the watcher (inbox records) and by the dashboard (import, and after fetching a description).

/** @type {[string, RegExp][]} */
const TAG_RULES = [
  ['PhD', /\bph\.?\s?d\b|\bdoctoral\b/],
  ['Memory/PIM', /in-memory|processing[- ]in[- ]memory|compute[- ]in[- ]memory|near[- ]memory|\bpim\b|\bcim\b|memory (architecture|system|subsystem)|\bdram\b|\bhbm\d?e?\b|\bsram\b|\breram\b|memristor|\bnand\b|flash memory|\bcxl\b|emerging memory/],
  ['Reliability/ECC', /\becc\b|error[- ]correct|reliability|fault[- ]toleran|resilien|soft error|\bras\b/],
  ['Compiler/MLIR', /compiler|\bmlir\b|\bllvm\b/],
  ['Architecture', /computer architecture|microarchitecture|architecture research|(cpu|gpu|soc|hardware|memory|accelerator|systems?|silicon|chip|dl|ml|ai) architect|performance model|design space exploration|timeloop|accelergy/],
  ['AI accelerator', /ai accelerator|ml accelerator|\baccelerators?\b|\bnpu\b|\btpu\b|trainium|inferentia|\bmtia\b|\bmaia\b/],
  ['ASIC/RTL', /\basic\b|\brtl\b|\bverilog\b|\bsystemverilog\b|\bvhdl\b|logic design|\bvlsi\b|physical design|\bfpga\b/],
  ['Verification', /verification|\buvm\b|\bdv\b|formal/],
  ['EDA', /\beda\b|electronic design automation|\bcad\b|place and route|synthesis tool/],
  ['GPU/CUDA', /\bgpus?\b|\bcuda\b|\bkernels?\b/],
];

/** @type {string[]} */
export const ALL_TAGS = TAG_RULES.map(([t]) => t);
export const ALL_FLAGS = ['No sponsorship', 'Citizenship/clearance', "Bachelor's only", 'Posted > 30 days'];

/**
 * Topic tags from the title, the watcher's keyword hits and the description.
 * @param {{title?: string, description?: string, hits?: string[]}} [job]
 * @returns {string[]}
 */
export function deriveTags({ title = '', description = '', hits = [] } = {}) {
  const text = ` ${[title, (hits || []).join(' ; '), description].join(' \n ')} `.toLowerCase();
  return TAG_RULES.filter(([, rx]) => rx.test(text)).map(([t]) => t);
}

const NO_SPONSOR = /(not|unable to|cannot|can ?not|won'?t|will not|does not|do not)\s+(offer|provide|sponsor|support)\w*\s+(visa\s+|immigration\s+|work\s+)*sponsorship|no\s+(visa\s+)?sponsorship|sponsorship\s+(is\s+)?not\s+(available|offered|provided)|without (the )?need (for|of) (visa )?sponsorship|must be (legally )?authorized to work .{0,40}without .{0,20}sponsorship/;
const CITIZEN = /u\.?s\.? citizen(ship)?\b|citizenship is required|security clearance|secret clearance|ts\/sci|\bitar\b|export control|u\.?s\.? person|green card holder|permanent resident/;

/**
 * Warning flags. `sponsorship` is SimplifyJobs' field (e.g. "Does Not Offer Sponsorship", "U.S. Citizenship is Required"),
 * `degrees` is "PhD/Master's/Bachelor's"-style, `posted` an ISO date, `now` the reference date (ISO or Date).
 * @param {{description?: string, sponsorship?: string, degrees?: string, title?: string, posted?: string, now?: Date|string}} [job]
 * @returns {string[]}
 */
export function deriveFlags({ description = '', sponsorship = '', degrees = '', title = '', posted = '', now = new Date() } = {}) {
  const flags = [];
  const d = ` ${description} `.toLowerCase();
  const sp = String(sponsorship || '').toLowerCase();
  if (/does not offer sponsorship|no sponsorship/.test(sp) || NO_SPONSOR.test(d)) flags.push('No sponsorship');
  if (/citizenship/.test(sp) || CITIZEN.test(d) || CITIZEN.test(` ${title} `.toLowerCase())) flags.push('Citizenship/clearance');
  const deg = String(degrees || '');
  const t = ` ${title} `.toLowerCase();
  const bachelorTitle = /\b(undergrad(uate)?|bachelor'?s?)\b/.test(t) && !/\b(master'?s?|ms|phd|ph\.d|graduate)\b/.test(t.replace(/undergrad(uate)?/g, ''));
  if ((deg && !/phd|master/i.test(deg)) || bachelorTitle) flags.push("Bachelor's only");
  if (posted && /^\d{4}-\d{2}-\d{2}/.test(posted)) {
    const ref = new Date(now); const p = new Date(posted.slice(0, 10) + 'T00:00:00Z');
    if (!isNaN(p) && (ref - p) / 86400000 > 30) flags.push('Posted > 30 days');
  }
  return flags;
}

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
const iso = (d) => d.toISOString().slice(0, 10);

/**
 * Turns the many "posted" formats into YYYY-MM-DD, relative to `now` for Workday's
 * "Posted Today" / "Posted Yesterday" / "Posted 14 Days Ago" / "Posted 30+ Days Ago". Unknown → ''.
 * @param {string|null|undefined} posted
 * @param {Date|string} [now]
 * @returns {string}
 */
export function normalizePosted(posted, now = new Date()) {
  const s = String(posted || '').trim();
  if (!s) return '';
  const ref = new Date(now);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  if (/^\d{10,13}$/.test(s)) return iso(new Date(Number(s) * (s.length === 10 ? 1000 : 1)));
  const lc = s.toLowerCase();
  if (/today|just posted/.test(lc)) return iso(ref);
  if (/yesterday/.test(lc)) return iso(new Date(ref - 86400000));
  const ago = lc.match(/(\d+)\+?\s+days?\s+ago/);
  if (ago) return iso(new Date(ref - Number(ago[1]) * 86400000));
  const m = lc.match(/([a-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/);
  if (m && m[1] in MONTHS) return iso(new Date(Date.UTC(Number(m[3]), MONTHS[m[1]], Number(m[2]))));
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) return iso(new Date(Date.UTC(Number(us[3]), Number(us[1]) - 1, Number(us[2]))));
  return '';
}

/**
 * Which applicant-tracking system a posting URL belongs to.
 * @param {string|null|undefined} url
 * @returns {string}
 */
export function atsFromUrl(url) {
  const u = String(url || '').toLowerCase();
  const rules = [
    ['workday', /myworkdayjobs\.com|myworkdaysite\.com/], ['greenhouse', /greenhouse\.io/], ['lever', /lever\.co/],
    ['ashby', /ashbyhq\.com/], ['smartrecruiters', /smartrecruiters\.com/], ['icims', /icims\.com/],
    ['eightfold', /eightfold\.ai|careers\.qualcomm\.com|careers\.microsoft\.com/], ['oracle', /oraclecloud\.com/],
    ['successfactors', /successfactors|jobs\.sap\.com/], ['taleo', /taleo\.net/], ['rippling', /rippling\.com/],
    ['amazon', /amazon\.jobs/], ['google', /google\.com\/about\/careers/], ['apple', /jobs\.apple\.com/], ['ibm', /ibm\.com/],
    ['jibe', /careers\.amd\.com/], ['radancy', /careers\.arm\.com|careers\.synopsys\.com/],
  ];
  return (rules.find(([, rx]) => rx.test(u)) || ['other'])[0];
}
