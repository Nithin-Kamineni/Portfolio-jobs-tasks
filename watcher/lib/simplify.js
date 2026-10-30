// The SimplifyJobs Summer internship list (a public JSON file on GitHub).

import { http } from './util.js';

export async function simplifyJobs(kw, targetNames) {
  const cfg = kw.simplify; if (!cfg?.url) return [];
  const all = await http(cfg.url, { retries: 2 });
  const terms = new Set(cfg.terms || []), cats = new Set(cfg.categories || []);
  return all
    .filter((j) => j.active && j.is_visible !== false && (j.terms || []).some((t) => terms.has(t)) && cats.has(j.category))
    .map((j) => {
      const deg = j.degrees || [];
      return {
        id: `simplify:${j.id}`, company: j.company_name, title: j.title, location: (j.locations || []).join('; '),
        url: j.url, posted: j.date_posted ? new Date(j.date_posted * 1000).toISOString().slice(0, 10) : '',
        description: '', minScore: cfg.minScore,
        bonus: (deg.includes('PhD') ? cfg.phdBonus || 0 : 0) + (deg.includes("Master's") ? cfg.mastersBonus || 0 : 0)
          + (deg.length && !deg.includes('PhD') && !deg.includes("Master's") ? cfg.bachelorsOnlyPenalty || 0 : 0)
          + (/citizenship is required/i.test(j.sponsorship || '') ? cfg.citizenshipPenalty || 0 : 0)
          + (targetNames.some((n) => j.company_name.toLowerCase().includes(n)) ? 3 : 0),
        source: 'SimplifyJobs', sponsorship: j.sponsorship, degrees: deg.join('/'),
      };
    });
}
