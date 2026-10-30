// Fetches the full description of one posting, for jobs whose feed gave only a title
// (SimplifyJobs, SmartRecruiters, Workday jobs over the detail budget, the tracker.csv backfill).
// Uses the ATS's JSON API when the id/url says which one it is; otherwise reads the page's
// JSON-LD JobPosting, then its meta description. Returns { description, text, via }.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { http, parseCSV, stripHtml } from './util.js';

const COMPANIES_CSV = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'targets', 'companies.csv');
const MIN_META_CHARS = 300;

const decodeEntities = (s) => String(s || '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'").replace(/&amp;/g, '&');

const result = (html, via) => {
  const description = String(html || '').replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, '').trim();
  const text = stripHtml(description);
  if (text.length < 40) throw new Error(`No description found (${via})`);
  return { description, text, via };
};

async function workday(url, id) {
  const u = new URL(url);
  const parts = u.pathname.split('/').filter(Boolean);
  if (/^[a-z]{2}-[A-Z]{2}$/.test(parts[0])) parts.shift();
  const jobAt = parts.indexOf('job');
  if (jobAt < 1) throw new Error('Unrecognized Workday URL');
  const site = parts[jobAt - 1];
  const tenant = (String(id).match(/^wd:([^:]+):/) || [])[1] || u.hostname.split('.')[0];
  const x = await http(`https://${u.hostname}/wday/cxs/${tenant}/${site}/${parts.slice(jobAt).join('/')}`);
  return result(x.jobPostingInfo?.jobDescription, 'workday');
}

async function apple(positionId) {
  const x = (await http(`https://jobs.apple.com/api/v1/jobDetails/${positionId}`)).res || {};
  const para = (t) => String(t || '').split(/\n+/).filter(Boolean).map((l) => `<p>${l}</p>`).join('');
  const html = [['', x.jobSummary], ['Description', x.description], ['Minimum qualifications', x.minimumQualifications], ['Preferred qualifications', x.preferredQualifications]]
    .filter(([, v]) => v).map(([h, v]) => `${h ? `<h3>${h}</h3>` : ''}${para(v)}`).join('\n');
  return result(html, 'apple');
}

async function amazon(url) {
  const page = await http(url, { text: true });
  const a = page.indexOf('class="section description"'), b = page.indexOf('class="section app-download"');
  if (a < 0) throw new Error('No description section on the amazon.jobs page');
  let html = page.slice(page.indexOf('>', a) + 1, b > a ? page.lastIndexOf('<div', b) : undefined);
  const tail = html.search(/<h2[^>]*>\s*(Job details|Share this job)/i); // the side boxes after the qualifications
  if (tail > 0) html = html.slice(0, tail);
  return result(html, 'amazon');
}

/** Oracle HCM (Texas Instruments and others). The API host comes from the URL, or from companies.csv for custom career domains. */
async function oracle(url, site, reqId, companiesCsv = COMPANIES_CSV) {
  let host = (() => { try { const h = new URL(url).hostname; return /oraclecloud\.com$/.test(h) ? h : ''; } catch { return ''; } })();
  if (!host && fs.existsSync(companiesCsv)) {
    host = parseCSV(fs.readFileSync(companiesCsv, 'utf8')).find((c) => c.ats === 'oracle' && c.tenant === site)?.host || '';
  }
  if (!host) throw new Error('Unknown Oracle career-site host');
  const x = await http(`https://${host}/hcmRestApi/resources/latest/recruitingCEJobRequisitionDetails?expand=all&onlyData=true&finder=ById;Id=%22${reqId}%22,siteNumber=${site}`);
  const it = x.items?.[0];
  if (!it) throw new Error('Posting not found on the Oracle career site');
  return result([it.ExternalDescriptionStr, it.ExternalResponsibilitiesStr, it.ExternalQualificationsStr, it.CorporateDescriptionStr].filter(Boolean).join('\n'), 'oracle');
}

async function greenhouse(tenant, jobId) {
  const x = await http(`https://boards-api.greenhouse.io/v1/boards/${tenant}/jobs/${jobId}`);
  return result(decodeEntities(x.content), 'greenhouse');
}

async function lever(tenant, jobId) {
  const x = await http(`https://api.lever.co/v0/postings/${tenant}/${jobId}`);
  const html = [x.description, ...(x.lists || []).map((l) => `<h3>${l.text}</h3><ul>${l.content}</ul>`), x.additional].filter(Boolean).join('\n');
  return result(html || x.descriptionPlain, 'lever');
}

async function ashby(tenant, jobId) {
  const d = await http(`https://api.ashbyhq.com/posting-api/job-board/${tenant}`);
  const j = (d.jobs || []).find((x) => x.id === jobId);
  if (!j) throw new Error('Posting no longer listed on the Ashby board');
  return result(j.descriptionHtml || j.descriptionPlain, 'ashby');
}

async function smartrecruiters(tenant, jobId) {
  const x = await http(`https://api.smartrecruiters.com/v1/companies/${tenant}/postings/${jobId}`);
  const s = x.jobAd?.sections || {};
  const html = ['companyDescription', 'jobDescription', 'qualifications', 'additionalInformation']
    .map((k) => s[k]).filter((v) => v?.text).map((v) => `<h3>${v.title || ''}</h3>${v.text}`).join('\n');
  return result(html, 'smartrecruiters');
}

/** Eightfold PCSX (Qualcomm, Microsoft): tenant = domain, host from the posting URL. */
async function pcsx(url, domain, positionId) {
  const host = new URL(url).hostname;
  const x = await http(`https://${host}/api/pcsx/position_details?position_id=${positionId}&domain=${encodeURIComponent(domain)}&hl=en`);
  return result(x.data?.jobDescription, 'pcsx');
}

/** NLX / DirectEmployers microsites (Siemens EDA): tenant = job folder, id = the posting's 32-hex guid. */
async function nlx(folder, guid) {
  const x = await http(`https://microsites.dejobs.org/${folder}/data/${String(guid).toUpperCase()}.json`);
  return result(x.html_description || x.description, 'nlx');
}

/** Reads a JobPosting description from a posting page (JSON-LD first, then meta tags). */
export function descriptionFromHtml(page) {
  for (const m of String(page).matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1].trim());
      const nodes = [data, ...(Array.isArray(data) ? data : []), ...(data['@graph'] || [])].flat();
      const post = nodes.find((n) => n && (n['@type'] === 'JobPosting' || (Array.isArray(n['@type']) && n['@type'].includes('JobPosting'))));
      if (post?.description) return { html: decodeEntities(post.description), via: 'json-ld' };
    } catch { /* not valid JSON; try the next block */ }
  }
  const meta = String(page).match(/<meta[^>]+(?:name|property)=["'](?:og:)?description["'][^>]*content=["']([^"']+)["']/i)
    || String(page).match(/<meta[^>]+content=["']([^"']+)["'][^>]*(?:name|property)=["'](?:og:)?description["']/i);
  if (meta) return { html: decodeEntities(meta[1]), via: 'meta' };
  return null;
}

/** IBM careers: the page sits behind a bot check, but the search API's `body` field holds the whole posting text. */
async function ibm(jobId) {
  const d = await http('https://www-api.ibm.com/search/api/v2', {
    method: 'POST',
    body: {
      appId: 'careers', scopes: ['careers2'], size: 5, _source: ['url', 'body', 'description'],
      query: { bool: { must: [{ simple_query_string: { query: String(jobId), fields: ['url'] } }] } },
    },
  });
  const hit = (d.hits?.hits || []).map((h) => h._source || {}).find((j) => new RegExp(`jobId=${jobId}(\\D|$)`).test(String(j.url || '')));
  const text = String(hit?.body || hit?.description || '');
  const esc = (l) => l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = text.split(/\n+/).map((l) => l.trim()).filter(Boolean).map((l) => `<p>${esc(l)}</p>`).join('\n');
  return result(html, 'ibm');
}

export async function fetchDescription({ id = '', url = '' }, { companiesCsv } = {}) {
  const [kind, tenant, ...rest] = String(id).split(':');
  const jobId = rest.join(':');
  const host = (() => { try { return new URL(url).hostname; } catch { return ''; } })();

  if (kind === 'wd' || /myworkdayjobs\.com$/.test(host)) return workday(url, id);
  if (kind === 'gh') return greenhouse(tenant, jobId);
  if (kind === 'lv') return lever(tenant, jobId);
  if (kind === 'ab') return ashby(tenant, jobId);
  if (kind === 'sr') return smartrecruiters(tenant, jobId);
  if (kind === 'apple') return apple(tenant);
  if (kind === 'amzn' || /(^|\.)amazon\.jobs$/.test(host)) return amazon(url);
  if (kind === 'oracle') return oracle(url, tenant, jobId, companiesCsv);
  if (kind === 'pcsx' && host) return pcsx(url, tenant, jobId);
  if (kind === 'nlx') return nlx(tenant, jobId);
  if (kind === 'ibm' || /(^|\.)careers\.ibm\.com$/.test(host)) {
    const n = (kind === 'ibm' && tenant) || (url.match(/jobId=(\d+)/) || [])[1];
    if (n) return ibm(n);
  }

  // SimplifyJobs and other sources link straight to the ATS page; recognize the common ones by URL.
  let m;
  if ((m = url.match(/greenhouse\.io\/([^/?#]+)\/jobs\/(\d+)/))) return greenhouse(m[1], m[2]);
  if ((m = url.match(/greenhouse\.io\/embed\/job_app\?for=([^&]+)&token=(\d+)/))) return greenhouse(m[1], m[2]);
  if ((m = url.match(/jobs\.lever\.co\/([^/?#]+)\/([0-9a-f-]{36})/))) return lever(m[1], m[2]);
  if ((m = url.match(/jobs\.ashbyhq\.com\/([^/?#]+)\/([0-9a-f-]{36})/))) return ashby(m[1], m[2]);
  if ((m = url.match(/smartrecruiters\.com\/([^/?#]+)\/(\d+)/))) return smartrecruiters(m[1], m[2]);
  if ((m = url.match(/jobs\.apple\.com\/[^/]+\/details\/(\d+)/))) return apple(m[1]);
  if ((m = url.match(/oraclecloud\.com\/.*\/sites\/([^/]+)\/job\/(\d+)/))) return oracle(url, m[1], m[2], companiesCsv);
  if ((m = url.match(/^https?:\/\/(jobs\.sw\.siemens\.com)\/.*\/([0-9A-Fa-f]{32})\/job\/?/))) return nlx(m[1].replace(/\./g, '-'), m[2]);

  if (!/^https?:\/\//.test(url)) throw new Error('This job has no posting URL');
  const page = await http(url, { text: true });
  const found = descriptionFromHtml(page);
  if (!found || (found.via === 'meta' && stripHtml(found.html).length < MIN_META_CHARS)) {
    throw new Error('The posting page has no machine-readable description; open the posting instead');
  }
  return result(found.html, found.via);
}
