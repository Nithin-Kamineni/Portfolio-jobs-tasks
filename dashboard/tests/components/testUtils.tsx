import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { ColorModeProvider } from '../../web/src/components/ColorMode';
import { NotifyProvider } from '../../web/src/components/Notify';
import { ClaudeStepsProvider } from '../../web/src/components/ClaudeSteps';
import { RunsProvider } from '../../web/src/components/Runs';
import type { ClaudeFacts, Job, Outreach, Contact } from '../../shared/types';

export interface Call { method: string; path: string; body: unknown }
type Handler = (body: unknown, path: string) => unknown;

/** Replaces fetch with a tiny router: routes['POST /jobs/x/status'] = (body) => response. Unknown routes → 404. */
export function mockApi(routes: Record<string, Handler | unknown>) {
  const calls: Call[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost');
    const method = (init?.method || 'GET').toUpperCase();
    const path = decodeURIComponent(url.pathname.replace(/^\/api/, '')) + url.search;
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, path, body });
    const key = Object.keys(routes).find((k) => {
      const [m, p] = k.split(' ');
      return m === method && (p === path || p === path.split('?')[0] || (p.endsWith('*') && path.startsWith(p.slice(0, -1))));
    });
    if (!key) return new Response(JSON.stringify({ error: `No mock for ${method} ${path}` }), { status: 404 });
    const h = routes[key];
    try {
      const out = typeof h === 'function' ? (h as Handler)(body, path) : h;
      if (out instanceof Response) return out;
      return new Response(JSON.stringify(out ?? null), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      return new Response(JSON.stringify({ error: (e as Error).message }), { status: 409 });
    }
  });
  vi.stubGlobal('fetch', fetchMock);
  return { calls, fetchMock, find: (method: string, prefix: string) => calls.filter((c) => c.method === method && c.path.startsWith(prefix)) };
}

export const error = (status: number, message: string) => new Response(JSON.stringify({ error: message }), { status });

export function renderWithApp(ui: ReactElement, { route = '/', now }: { route?: string; now?: () => Date } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>
      <ColorModeProvider>
        <NotifyProvider>
          <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <RunsProvider><ClaudeStepsProvider now={now}>{children}</ClaudeStepsProvider></RunsProvider>
          </MemoryRouter>
        </NotifyProvider>
      </ColorModeProvider>
    </QueryClientProvider>
  );
  return { qc, ...render(ui, { wrapper: Wrapper }) };
}

export const FACTS: ClaudeFacts = {
  newCount: 0, toPrepare: [], referralRequested: [], referralNoContact: [], followUpsDue: 0, researcherCount: 50,
  watcherErrors: [], lastWeeklyReview: null, lastManualCheck: new Date().toISOString(), manualCompanies: ['Meta'], today: '2026-09-30',
};

export const META = {
  health: { lastRunAt: '2026-09-30T12:00:00Z', matches: 3, errors: [], digest: null, source: 'last_run' },
  lastSync: null,
  config: { outlookComposeUrl: 'https://outlook.office.com/mail/deeplink/compose', outlookMaxUrlLength: 2000, resumePath: 'C:\\repo\\Resume\\Resume.pdf', repoRoot: 'C:\\profitional\\Applications' },
};

export function job(o: Partial<Job> = {}): Job {
  return {
    id: 'wd:nvidia:1', company: 'NVIDIA', company_priority: 'A', title: 'PhD Research Intern, Architecture', location: 'Santa Clara, CA',
    url: 'https://nvidia.example/job/1', source: 'NVIDIA', ats: 'workday', posted_date: '2026-09-20', posted_raw: '', first_seen: '2026-09-29T22:09:00Z',
    score: 50, hits: ['phd'], tags: ['PhD', 'Architecture'], flags: [], degrees: '', sponsorship_flag: '', description: '<p>Design <b>GPU</b> memory systems.</p>',
    has_description: true, description_fetched_at: null, fit_score: 88, fit_reason: 'Memory systems + architecture research', ranked_at: null,
    status: 'ranked', decision_at: null, applied_date: null, outcome_date: null, resume_version: 'master', application_dir: null, notes: null,
    referral_requested_at: null, updated_at: null, ...o,
  };
}

export function contact(o: Partial<Contact> = {}): Contact {
  return {
    id: 1, name: 'Dr. Lee', company: 'NVIDIA', title_or_lab: 'NVIDIA Research', relationship: 'researcher', linkedin_url: 'https://linkedin.com/in/lee',
    email: 'lee@nvidia.com', email_source: 'ISCA 2026 paper', email_confidence: 'from_paper', work_summary: 'Works on HBM-PIM.',
    papers: [{ title: 'PIM for LLMs', venue: 'ISCA', year: 2026, url: 'https://doi.org/x' }], notes: null, created_at: '', updated_at: '', ...o,
  };
}

export function outreach(o: Partial<Outreach> = {}): Outreach {
  return {
    id: 1, type: 'cold_email', contact_id: 1, job_id: 'wd:nvidia:1', channel: 'email', subject: 'PIM question', body: 'Dear Dr. Lee,\n\nI read your paper.',
    status: 'ready', sent_at: null, follow_up_due: null, reply_notes: null, parent_id: null, created_by: 'claude', created_at: '2026-09-30T10:00:00Z',
    updated_at: '2026-09-30T10:00:00Z', contact_name: 'Dr. Lee', contact_company: 'NVIDIA', contact_email: 'lee@nvidia.com',
    contact_linkedin: 'https://linkedin.com/in/lee', contact_confidence: 'from_paper', job_title: 'PhD Research Intern', job_company: 'NVIDIA',
    follow_up_is_due: false, has_follow_up: false, ...o,
  };
}
