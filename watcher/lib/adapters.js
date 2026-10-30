// Career-site adapters. Each returns [{id, company, title, location, url, posted, description, detail?}].
// `detail` is an async function that fetches the full description on demand (feeds that list titles only).
//
// Completeness rules (no posting may be lost to paging): every adapter pages until the site's own total is
// reached or a page comes back empty, never stops at a fixed page count, and trusts only the FIRST page's total
// (Workday sends total 0 on later pages). MAX_PAGES is only a runaway guard; hitting it, or a site that caps its
// results, adds a warning to the returned array (`.warnings`), which the watcher reports as a source error.

import { http, sleep, stripHtml, UA } from './util.js';

export const MAX_PAGES = 1000;

// Sites that list their whole board without a search word are read in full, so no posting depends on how the
// company words its titles (the title filter decides). Search words are used only where a full read is impossible.
const WHOLE_BOARD = [''];

/** The result list plus the warnings the watcher should report (e.g. "results may be incomplete"). */
const done = (out, warnings) => Object.assign([...out.values()], { warnings });

export const adapters = {
  // Workday: the whole board (up to its 2000 limit), then intern facets + search words for bigger boards.
  // Workday sends the total only on page 1 and wraps around past the end (both handled in scan).
  async workday(c, terms) {
    const base = `https://${c.host}/wday/cxs/${c.tenant}/${c.site}`;
    const out = new Map(); const warnings = [];
    const add = (j) => {
      if (!j.externalPath || out.has(j.externalPath)) return false;
      out.set(j.externalPath, {
        id: `wd:${c.tenant}:${(j.bulletFields || [])[0] || j.externalPath}`,
        company: c.company, title: j.title, location: j.locationsText || '',
        url: `https://${c.host}/${c.site}${j.externalPath}`, posted: j.postedOn || '', description: '',
        detail: async () => {
          const x = await http(`${base}${j.externalPath}`);
          const info = x.jobPostingInfo || {};
          const locs = [info.location, ...(info.additionalLocations || [])].filter(Boolean).join('; ');
          return { description: stripHtml(info.jobDescription), location: locs || j.locationsText || '' };
        },
      });
      return true;
    };
    /** One search, every page. Returns whether it saw the whole result list, and page 1 (for its facets). */
    const scan = async (searchText, appliedFacets = {}) => {
      let total = null, got = 0, first = null, seen = new Set();
      for (let page = 0; page < MAX_PAGES; page++) {
        let d;
        try { d = await http(`${base}/jobs`, { method: 'POST', body: { appliedFacets, limit: 20, offset: page * 20, searchText } }); }
        catch (e) { if (!out.size) throw e; warnings.push(`a list stopped at ${page * 20} of ${total} jobs (${e.message}); kept what was read`); break; }
        if (page === 0) { total = d.total ?? 0; first = d; }
        const ps = d.jobPostings || [];
        const fresh = ps.filter((j) => j.externalPath && !seen.has(j.externalPath));
        if (!fresh.length) break; // empty page, or Workday wrapped around to page 1
        for (const j of fresh) { seen.add(j.externalPath); add(j); }
        got += fresh.length;
        if (got >= total) break;
        await sleep(250);
      }
      return { total, got, first, complete: got >= total && total !== 2000 }; // exactly 2000 = Workday's cap
    };
    // The whole board first: every posting, whatever its title says. Workday shows at most 2000 per list, so a board
    // over that (NVIDIA) is completed with its intern facets (worker type / job family "Intern", "Co-op", "Student",
    // "Trainee") and every search word.
    const all = await scan('');
    if (!all.complete) {
      const facets = [];
      const walk = (list, param) => {
        for (const f of list || []) for (const v of f.values || []) {
          if (v.values) walk([v], f.facetParameter || param);
          else if (/intern|co-?op|student|trainee|apprentic|graduate|university|early career/i.test(v.descriptor || '')) facets.push([f.facetParameter || param, v.id]);
        }
      };
      walk(all.first?.facets);
      for (const [param, id] of facets) {
        const r = await scan('', { [param]: [id] });
        if (!r.complete) warnings.push(`an intern facet has ${r.total} jobs but only ${r.got} could be read`);
      }
      for (const t of terms) await scan(t);
      if (!facets.length) warnings.push(`board has ${all.total}+ jobs (over Workday's 2000 limit) and no intern facet; used the search words`);
    }
    return done(out, warnings);
  },

  async greenhouse(c) {
    const d = await http(`https://boards-api.greenhouse.io/v1/boards/${c.tenant}/jobs?content=true`);
    return (d.jobs || []).map((j) => ({
      id: `gh:${c.tenant}:${j.id}`, company: c.company, title: j.title, location: j.location?.name || '',
      url: j.absolute_url, posted: j.updated_at || '', description: stripHtml(j.content),
    }));
  },

  async lever(c) {
    const d = await http(`https://api.lever.co/v0/postings/${c.tenant}?mode=json`);
    return (d || []).map((j) => ({
      id: `lv:${c.tenant}:${j.id}`, company: c.company, title: j.text,
      location: [j.categories?.location, ...(j.categories?.allLocations || [])].filter(Boolean).join('; '),
      url: j.hostedUrl, posted: j.createdAt ? new Date(j.createdAt).toISOString().slice(0, 10) : '',
      description: [j.descriptionPlain, j.additionalPlain, ...(j.lists || []).map((l) => `${l.text} ${stripHtml(l.content)}`)].join(' '),
    }));
  },

  async ashby(c) {
    const d = await http(`https://api.ashbyhq.com/posting-api/job-board/${c.tenant}`);
    return (d.jobs || []).filter((j) => j.isListed !== false).map((j) => ({
      id: `ab:${c.tenant}:${j.id}`, company: c.company, title: j.title,
      location: [j.location, ...(j.secondaryLocations || []).map((s) => s.location)].filter(Boolean).join('; '),
      url: j.jobUrl, posted: (j.publishedAt || '').slice(0, 10), description: j.descriptionPlain || stripHtml(j.descriptionHtml),
    }));
  },

  async smartrecruiters(c, terms) {
    const out = new Map();
    for (const term of WHOLE_BOARD) {
      let total = null;
      for (let page = 0; page < MAX_PAGES; page++) {
        const d = await http(`https://api.smartrecruiters.com/v1/companies/${c.tenant}/postings?q=${encodeURIComponent(term)}&limit=100&offset=${page * 100}`);
        if (page === 0) total = d.totalFound ?? 0;
        const js = d.content || [];
        for (const j of js) {
          out.set(j.id, {
            id: `sr:${c.tenant}:${j.id}`, company: c.company, title: j.name,
            location: [j.location?.city, j.location?.region, j.location?.country].filter(Boolean).join(', '),
            url: `https://jobs.smartrecruiters.com/${c.tenant}/${j.id}`, posted: (j.releasedDate || '').slice(0, 10), description: '',
          });
        }
        if (!js.length || (page + 1) * 100 >= total) break;
        await sleep(300);
      }
    }
    return [...out.values()];
  },

  async eightfold(c, terms) {
    const out = new Map();
    for (const term of terms) {
      let total = null;
      for (let page = 0; page < MAX_PAGES; page++) {
        const d = await http(`https://${c.host}/api/apply/v2/jobs?domain=${encodeURIComponent(c.tenant)}&query=${encodeURIComponent(term)}&start=${page * 10}&num=10&sort_by=relevance`);
        if (page === 0) total = d.count ?? 0;
        const ps = d.positions || [];
        for (const j of ps) {
          out.set(j.id, {
            id: `ef:${c.tenant}:${j.id}`, company: c.company, title: j.name,
            location: (j.locations || [j.location]).filter(Boolean).join('; '),
            url: j.canonicalPositionUrl || `https://${c.host}/careers/job/${j.id}`,
            posted: j.t_create ? new Date(j.t_create * 1000).toISOString().slice(0, 10) : '',
            description: stripHtml(j.job_description || ''),
          });
        }
        if (!ps.length || (page + 1) * 10 >= total) break;
        await sleep(300);
      }
    }
    return [...out.values()];
  },

  // Eightfold "PCSX" search (Qualcomm, Microsoft). host = careers host, tenant = domain. The list has no
  // descriptions; `detail` reads one from position_details.
  async pcsx(c, terms) {
    const out = new Map(); const warnings = [];
    for (const term of WHOLE_BOARD) {
      let total = null;
      for (let page = 0; page < MAX_PAGES; page++) {
        let d;
        try { d = await http(`https://${c.host}/api/pcsx/search?domain=${encodeURIComponent(c.tenant)}&query=${encodeURIComponent(term)}&location=&start=${page * 10}`); }
        catch (e) { if (!out.size) throw e; warnings.push(`stopped at ${page * 10} of ${total} jobs (${e.message}); kept what was read`); break; }
        if (page === 0) total = d.data?.count ?? 0;
        const ps = d.data?.positions || [];
        for (const j of ps) {
          if (out.has(j.id)) continue;
          out.set(j.id, {
            id: `pcsx:${c.tenant}:${j.id}`, company: c.company, title: j.name,
            location: (j.standardizedLocations || j.locations || []).join('; '),
            url: `https://${c.host}${j.positionUrl}`,
            posted: j.postedTs ? new Date(j.postedTs * 1000).toISOString().slice(0, 10) : '', description: '',
            detail: async () => {
              const x = await http(`https://${c.host}/api/pcsx/position_details?position_id=${j.id}&domain=${encodeURIComponent(c.tenant)}&hl=en`);
              return { description: stripHtml(x.data?.jobDescription) };
            },
          });
        }
        if (!ps.length || (page + 1) * 10 >= total) break;
        await sleep(300);
      }
    }
    return done(out, warnings);
  },

  // AMD's careers site (Jibe front end over iCIMS). host = careers.amd.com
  async jibe(c, terms) {
    const out = new Map();
    for (const term of WHOLE_BOARD) {
      let total = null;
      for (let page = 1; page <= MAX_PAGES; page++) {
        const d = await http(`https://${c.host}/api/jobs?keywords=${encodeURIComponent(term)}&page=${page}&limit=50`);
        if (page === 1) total = d.totalCount ?? d.count ?? Infinity;
        const js = d.jobs || [];
        for (const { data: j } of js) {
          out.set(j.req_id, {
            id: `jibe:${c.host}:${j.req_id}`, company: c.company, title: j.title,
            location: j.full_location || [j.city, j.state, j.country].filter(Boolean).join(', '),
            url: j.meta_data?.canonical_url || `https://${c.host}/jobs/${j.slug}`, posted: (j.posted_date || '').slice(0, 10),
            description: stripHtml(j.description),
          });
        }
        if (!js.length || page * 50 >= total) break;
        await sleep(300);
      }
    }
    return [...out.values()];
  },

  // Oracle HCM candidate experience (Texas Instruments). host = oracle host, tenant = siteNumber, site = public careers base URL
  async oracle(c, terms) {
    const out = new Map();
    for (const term of WHOLE_BOARD) {
      let total = null;
      for (let page = 0; page < MAX_PAGES; page++) {
        const d = await http(`https://${c.host}/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&expand=requisitionList.secondaryLocations&finder=findReqs;siteNumber=${c.tenant},limit=200,offset=${page * 200}${term ? `,keyword=%22${encodeURIComponent(term)}%22` : ''},sortBy=POSTING_DATES_DESC`);
        const it = d.items?.[0] || {};
        if (page === 0) total = it.TotalJobsCount ?? 0;
        const js = it.requisitionList || [];
        for (const j of js) {
          out.set(j.Id, {
            id: `oracle:${c.tenant}:${j.Id}`, company: c.company, title: j.Title,
            location: [j.PrimaryLocation, ...(j.secondaryLocations || []).map((s) => s.Name)].filter(Boolean).join('; '),
            url: `${c.site}/job/${j.Id}`, posted: j.PostedDate || '', description: stripHtml(j.ShortDescriptionStr),
          });
        }
        if (!js.length || (page + 1) * 200 >= total) break;
        await sleep(300);
      }
    }
    return [...out.values()];
  },

  // Rippling ATS (Positron). tenant = board slug
  async rippling(c) {
    const out = new Map();
    for (let page = 0; page < MAX_PAGES; page++) {
      const d = await http(`https://ats.rippling.com/api/v2/board/${c.tenant}/jobs?page=${page}&pageSize=100`);
      for (const j of d.items || []) {
        out.set(j.id, {
          id: `rp:${c.tenant}:${j.id}`, company: c.company, title: j.name,
          location: (j.locations || []).map((l) => l.name).join('; '), url: j.url, posted: '', description: '',
        });
      }
      if (!d.items?.length || page + 1 >= (d.totalPages ?? 1)) break;
      await sleep(300);
    }
    return [...out.values()];
  },

  // Radancy TalentBrew career sites (Arm, Synopsys): JSON wrapping an HTML fragment. host = careers host
  async radancy(c, terms) {
    const out = new Map();
    for (const term of WHOLE_BOARD) {
      let total = null;
      for (let page = 1; page <= MAX_PAGES; page++) {
        const d = await http(`https://${c.host}/search-jobs/results?CurrentPage=${page}&RecordsPerPage=50&Keywords=${encodeURIComponent(term)}&SearchResultsModuleName=Search+Results&SearchFiltersModuleName=Search+Filters&SearchType=5`,
          { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
        const html = d.results || ''; let n = 0;
        if (page === 1) total = Number((html.match(/data-total-results="(\d+)"/) || [])[1] ?? Infinity);
        for (const li of html.match(/<li[\s\S]*?<\/li>/g) || []) {
          const a = li.match(/<a[^>]*href="([^"]+)"[^>]*data-job-id="(\d+)"[^>]*>([\s\S]*?)<\/a>/);
          if (!a) continue; n++;
          const loc = (li.match(/class="[^"]*location[^"]*">([\s\S]*?)</) || [])[1] || '';
          out.set(a[2], {
            id: `rd:${c.host}:${a[2]}`, company: c.company, title: stripHtml(a[3]), location: stripHtml(loc),
            url: `https://${c.host}${a[1]}`, posted: '', description: '',
          });
        }
        if (!n || page * 50 >= total) break;
        await sleep(300);
      }
    }
    return [...out.values()];
  },

  // NLX / DirectEmployers microsites (Siemens Digital Industries Software = Siemens EDA: jobs.sw.siemens.com).
  // The search page is rendered in the browser, so: every posting URL from the sitemap (the complete list; the
  // JSON feed stops at 500 and robots.txt asks tools to stay off it), then each candidate's own JSON record
  // (title, location, description) from microsites.dejobs.org. Only postings whose URL slug looks like a student
  // role are opened. host = the careers host, tenant = the site's "job-folder" (e.g. jobs-sw-siemens-com).
  async nlx(c) {
    const xml = (u) => http(u, { text: true });
    const index = await xml(`https://${c.host}/sitemap.xml`);
    const maps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => /jobs_\d+\.xml/.test(u));
    const urls = [];
    for (const m of maps.length ? maps : [`https://${c.host}/sitemaps/jobs_1.xml`]) {
      urls.push(...[...(await xml(m)).matchAll(/<loc>([^<]+\/job\/)<\/loc>/g)].map((x) => x[1]));
    }
    const out = new Map(); const warnings = [];
    if (!urls.length) warnings.push('the sitemap lists no jobs; the site may have changed');
    // Must cover every titleMustMatchAny word (keywords.json): the URL slug is the title.
    const student = /intern|co-?op|student|phd|graduate|trainee|apprentic|summer|fall|spring|winter|research|fellowship|residency|externship|practicum/i;
    for (const url of urls) {
      const m = url.match(/\/([^/]+)\/([0-9A-F]{32})\/job\/$/i);
      if (!m || !student.test(m[1])) continue;
      const guid = m[2].toUpperCase();
      try {
        // (Its is_posted field is false even for live postings; being in the sitemap is what counts.)
        const j = await http(`https://microsites.dejobs.org/${c.tenant}/data/${guid}.json`);
        out.set(guid, {
          id: `nlx:${c.tenant}:${guid}`, company: c.company, title: j.title_exact || j.title || '',
          // "Rotterdam, NLD" → "Rotterdam, NLD, Netherlands": the US filter knows country names, not ISO codes.
          location: (j.all_locations?.length ? j.all_locations : [j.location_exact || j.location])
            .map((l) => (typeof l === 'string' ? l : l?.location_exact || l?.location || l?.name || '')).filter(Boolean)
            .map((l) => (j.country && !String(l).includes(j.country) ? `${l}, ${j.country}` : l)).join('; '),
          url, posted: (j.date_new || j.date_added || '').slice(0, 10), description: stripHtml(j.html_description || j.description),
        });
      } catch (e) { warnings.push(`could not read ${guid}: ${e.message}`); }
      await sleep(150);
    }
    return done(out, warnings.slice(0, 5));
  },

  // IBM careers search API (Elasticsearch-style). No tenant needed.
  async ibm(c, terms) {
    const out = new Map();
    for (const term of terms) {
      let total = null;
      for (let page = 0; page < MAX_PAGES; page++) {
        const d = await http('https://www-api.ibm.com/search/api/v2', {
          method: 'POST',
          body: {
            appId: 'careers', scopes: ['careers2'], size: 100, from: page * 100,
            query: { bool: { must: [{ simple_query_string: { query: term, fields: ['title^3', 'description^2', 'body^1'] } }] } },
            _source: ['title', 'url', 'description', 'body', 'field_keyword_19', 'field_keyword_05', 'dcdate'],
          },
        });
        if (page === 0) total = d.hits?.total?.value ?? d.hits?.total ?? Infinity;
        const hs = d.hits?.hits || [];
        for (const h of hs) {
          const j = h._source || {}; if (!j.url) continue;
          out.set(j.url, {
            id: `ibm:${(j.url.match(/jobId=(\d+)/) || [])[1] || h._id}`, company: c.company, title: j.title,
            location: [j.field_keyword_19, j.field_keyword_05].filter(Boolean).join(', '), url: j.url,
            posted: j.dcdate || '', description: stripHtml(j.body || j.description), // body = the whole posting; description = a teaser
          });
        }
        if (!hs.length || (page + 1) * 100 >= total) break;
        await sleep(500);
      }
    }
    return [...out.values()];
  },

  // Google careers: no JSON API; job data is embedded in the results page (AF_initDataCallback ds:1), 20 per page.
  // ds:1 = [jobs, ?, total, pageSize] (the total moved from [1] to [2] in 2026; read both, and stop on an empty page).
  async google(c, terms) {
    const out = new Map();
    for (const term of terms) {
      for (let page = 1; page <= MAX_PAGES; page++) {
        const res = await fetch(`https://www.google.com/about/careers/applications/jobs/results?q=${encodeURIComponent(term)}&page=${page}`,
          { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'en-US' }, signal: AbortSignal.timeout(30000) });
        if (!res.ok) throw new Error(`HTTP ${res.status} for Google careers`);
        const html = await res.text();
        const i = html.indexOf("AF_initDataCallback({key: 'ds:1'"); if (i < 0) break;
        const s = html.indexOf('data:', i) + 5, e = html.indexOf(', sideChannel', s);
        const d = JSON.parse(html.slice(s, e)); const jobs = d[0] || [];
        for (const j of jobs) {
          const slug = String(j[1]).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          out.set(j[0], {
            id: `google:${j[0]}`, company: c.company, title: j[1],
            location: (j[9] || []).map((l) => l[0]).join('; '),
            url: `https://www.google.com/about/careers/applications/jobs/results/${j[0]}-${slug}`,
            posted: j[12]?.[0] ? new Date(j[12][0] * 1000).toISOString().slice(0, 10) : '',
            description: stripHtml([j[3]?.[1], j[4]?.[1], j[10]?.[1], j[19]?.[1]].join(' ')),
          });
        }
        const total = typeof d[2] === 'number' ? d[2] : typeof d[1] === 'number' ? d[1] : Infinity;
        if (!jobs.length || page * 20 >= total) break;
        await sleep(1000);
      }
    }
    return [...out.values()];
  },

  // Apple: anonymous CSRF token, then search restricted to US student internships (Apple posts ~20 broad pipeline roles).
  async apple(c) {
    const t = await fetch('https://jobs.apple.com/api/v1/CSRFToken', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
    const tok = t.headers.get('x-apple-csrf-token');
    if (!tok) throw new Error(`Apple gave no CSRF token (HTTP ${t.status}); the site may be blocking this network`);
    const cookie = (t.headers.getSetCookie?.() || []).map((x) => x.split(';')[0]).join('; ');
    const out = new Map();
    for (let page = 1; page <= MAX_PAGES; page++) {
      const d = await http('https://jobs.apple.com/api/v1/search', {
        method: 'POST', headers: { 'x-apple-csrf-token': tok, Cookie: cookie },
        body: {
          query: '', page, locale: 'en-us', sort: 'newest',
          filters: { teams: [{ team: 'teamsAndSubTeams-STDNT', subTeam: 'subTeam-INTRN' }], locations: ['postLocation-USA'], range: { standardWeeklyHours: { start: null, end: null } } },
          format: { longDate: 'MMMM D, YYYY', mediumDate: 'MMM D, YYYY' },
        },
      });
      const rs = d.res?.searchResults || [];
      for (const j of rs) {
        out.set(j.positionId, {
          id: `apple:${j.positionId}`, company: c.company, title: j.postingTitle,
          location: (j.locations || []).map((l) => l.name).join('; '),
          url: `https://jobs.apple.com/en-us/details/${j.positionId}/${j.transformedPostingTitle}`,
          posted: (j.postDateInGMT || '').slice(0, 10), description: j.jobSummary || '',
        });
      }
      if (!rs.length || out.size >= (d.res?.totalRecords ?? 0)) break;
      await sleep(500);
    }
    return [...out.values()];
  },

  async amazon(c, terms) {
    const out = new Map();
    for (const term of terms) {
      let total = null;
      for (let page = 0; page < MAX_PAGES; page++) {
        const d = await http(`https://www.amazon.jobs/en/search.json?base_query=${encodeURIComponent(term)}&country=USA&result_limit=100&offset=${page * 100}&sort=recent`);
        if (page === 0) total = d.hits ?? 0;
        const js = d.jobs || [];
        for (const j of js) {
          out.set(j.id_icims || j.id, {
            id: `amzn:${j.id_icims || j.id}`, company: `${c.company}${j.company_name ? ` (${j.company_name})` : ''}`,
            title: j.title, location: j.normalized_location || j.location || '',
            url: `https://www.amazon.jobs${j.job_path}`, posted: j.posted_date || '',
            description: stripHtml([j.description, j.basic_qualifications, j.preferred_qualifications].join(' ')),
          });
        }
        if (!js.length || (page + 1) * 100 >= total) break;
        await sleep(300);
      }
    }
    return [...out.values()];
  },
};
