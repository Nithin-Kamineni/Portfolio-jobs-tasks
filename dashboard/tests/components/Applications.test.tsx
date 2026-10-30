/** @vitest-environment jsdom */
// 2026-10-17 model: Applications = Referral | Applied | Interview; Home countdown. Every click just happens (no dialogs).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ApplicationsPage from '../../web/src/pages/ApplicationsPage';
import HomePage from '../../web/src/pages/HomePage';
import { referralMessage } from '../../web/src/components/ReferralTools';
import { FACTS, job, META, mockApi, renderWithApp } from './testUtils';
import type { PaperEmailSearch, Stats } from '../../shared/types';

afterEach(() => { vi.unstubAllGlobals(); });

const JOBS = [
  job({ id: 'r:1', company: 'NVIDIA', title: 'PIM Research Intern', status: 'apply_referral', url: 'https://nvidia.example/r1' }),
  job({ id: 'r:2', company: 'NVIDIA Corporation', title: 'HBM Intern', status: 'apply_referral', fit_score: 70 }),
  job({ id: 'a:1', company: 'Micron', company_priority: 'A', title: 'Memory Intern', status: 'applied', applied_date: '2026-10-10' }),
  job({ id: 'i:1', company: 'AMD', title: 'GPU Arch Intern', status: 'interview', applied_date: '2026-10-01' }),
  job({ id: 'n:1', company: 'Intel', title: 'New one', status: 'ranked' }),
];

function setup(route = '/applications', extra: Record<string, unknown> = {}) {
  const api = mockApi({
    'GET /claude-facts': FACTS, 'GET /meta': META, 'GET /jobs': JOBS,
    'GET /company-notes': [{ company_key: 'amd', company: 'AMD', note: 'Recruiter: Kim', updated_at: '' }],
    'POST /jobs/*': (b: unknown, path: string) => ({ job: { ...JOBS.find((j) => path.includes(encodeURIComponent(j.id)) || path.includes(j.id))!, status: (b as { status: string }).status }, eventId: 7 }),
    'POST /events/7/undo': JOBS[0],
    'GET /research/paper-emails': null,
    ...extra,
  });
  renderWithApp(<ApplicationsPage />, { route });
  return api;
}

describe('Applications: Referral | Applied | Interview', () => {
  it('tabs with counts; Referral groups roles by company with one LinkedIn message per role, the company note and the paper search', async () => {
    setup();
    expect(await screen.findByRole('tab', { name: 'Referral 2' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Applied 1' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Interview 1' })).toBeInTheDocument();
    const card = screen.getByRole('region', { name: 'NVIDIA' }); // "NVIDIA" and "NVIDIA Corporation" are one company
    expect(within(card).getAllByTestId('app-role')).toHaveLength(2);
    expect(within(card).getAllByTestId('referral-message')[0]).toHaveTextContent(/Hi \[Name\].*PIM Research Intern role at NVIDIA: https:\/\/nvidia\.example\/r1/);
    expect(within(card).getByLabelText('Note for NVIDIA')).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: /Find R&D emails from papers/ })).toBeInTheDocument();
    expect(screen.queryByText('Offer')).not.toBeInTheDocument();
    expect(screen.queryByText('Rejected')).not.toBeInTheDocument();
  });

  it('the message is short, generic and uses only profile facts', () => {
    const m = referralMessage({ company: 'Acme (Labs)', title: 'PIM Intern', url: 'https://acme.example/1' });
    expect(m).toMatch(/^Hi \[Name\]/);
    expect(m).toContain('PIM Intern role at Acme: https://acme.example/1');
    expect(m).toMatch(/Your Name, a \[your role\]/);
    expect(m.replace(/https?:\/\/\S+/g, '').split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(80);
  });

  it('"Applied" on a referral posts applied with Undo and no dialog', async () => {
    const user = userEvent.setup();
    const api = setup();
    const card = await screen.findByRole('region', { name: 'NVIDIA' });
    await user.click(within(card).getAllByRole('button', { name: 'Applied' })[0]);
    await waitFor(() => expect(api.find('POST', '/jobs/r:1/status')[0]?.body).toEqual({ status: 'applied' }));
    expect(await screen.findByText('NVIDIA: Applied')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Applied → "Interview"; Interview → "Back to applied", with the company note', async () => {
    const user = userEvent.setup();
    const api = setup('/applications?tab=applied');
    await user.click(await screen.findByRole('button', { name: 'Interview' }));
    await waitFor(() => expect(api.find('POST', '/jobs/a:1/status')[0]?.body).toEqual({ status: 'interview' }));
    await user.click(screen.getByRole('tab', { name: 'Interview 1' }));
    const amd = await screen.findByRole('region', { name: 'AMD' });
    await waitFor(() => expect(within(amd).getByLabelText('Note for AMD')).toHaveValue('Recruiter: Kim'));
    await user.click(within(amd).getByRole('button', { name: 'Back to applied' }));
    await waitFor(() => expect(api.find('POST', '/jobs/i:1/status')[0]?.body).toEqual({ status: 'applied' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Find R&D emails from papers: starts the search, shows progress, then name, e-mail and the paper', async () => {
    const user = userEvent.setup();
    let state: PaperEmailSearch | null = null;
    const base = { company: 'NVIDIA', company_key: 'nvidia', started_at: '2026-10-17T10:00:00Z', finished_at: null, error: null };
    const api = setup('/applications', {
      'GET /research/paper-emails': () => state,
      'POST /research/paper-emails': () => {
        state = { ...base, status: 'done', finished_at: '2026-10-17T10:01:00Z', result: { total: 2, checked: 2, papers: 2, institution: 'NVIDIA', warnings: [], hits: [{ name: 'Ada Example', email: 'ada@nvidia.example', paper: { title: 'HBM-PIM for LLMs', venue: 'ISCA', year: 2026, url: 'https://doi.org/10.1/x', pdf_url: 'https://arxiv.example/pdf/1' } }] } };
        return { ...base, status: 'running', result: { total: 2, checked: 1, papers: 1, hits: [], warnings: [], institution: 'NVIDIA' } };
      },
    });
    const card = await screen.findByRole('region', { name: 'NVIDIA' });
    await user.click(within(card).getByRole('button', { name: /Find R&D emails from papers/ }));
    await waitFor(() => expect(api.find('POST', '/research/paper-emails')[0]?.body).toEqual({ company: 'NVIDIA' }));
    expect(await within(card).findByText(/checked 1 of 2 people/)).toBeInTheDocument();
    expect(await within(card).findByText('ada@nvidia.example', {}, { timeout: 4000 })).toBeInTheDocument();
    expect(within(card).getByText('Ada Example')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: 'HBM-PIM for LLMs' })).toHaveAttribute('href', 'https://doi.org/10.1/x');
    expect(within(card).getByRole('button', { name: 'Search again' })).toBeInTheDocument();
  });
});

describe('Home: last manual job search countdown', () => {
  const stats = (lastJobSearch: Stats['lastJobSearch']): Stats => ({ byStatus: {}, kpis: { new: 1, awaiting: 3, referral: 2, applied: 5, interviews: 1 }, lastJobSearch });
  const home = (s: Stats) => {
    mockApi({ 'GET /claude-facts': FACTS, 'GET /meta': META, 'GET /stats': s, 'GET /jobs': JOBS, 'GET /runs': { runs: [], paused: null } });
    renderWithApp(<HomePage />);
  };

  it.each([
    [2, 'success', /^2 h \d+ min \d\d s ago$/], [30, 'warning', /^1 d 6 h \d+ min \d\d s ago$/], [80, 'error', /^3 d 8 h/],
  ])('%s h ago → %s', async (hours, color, text) => {
    home(stats({ at: new Date(Date.now() - (hours as number) * 3600e3).toISOString(), what: 'Process new jobs' }));
    const age = await screen.findByTestId('search-age');
    expect(age).toHaveAttribute('data-color', color);
    expect(age.textContent).toMatch(text);
    expect(within(screen.getByTestId('search-countdown')).getByRole('button', { name: /Process new jobs/ })).toBeInTheDocument();
  });

  it('never searched → "Never", red; KPIs link to the phases; no outreach tiles', async () => {
    home(stats(null));
    expect(await screen.findByTestId('search-age')).toHaveTextContent('Never');
    expect(screen.getByTestId('search-age')).toHaveAttribute('data-color', 'error');
    expect(screen.getByRole('link', { name: 'Referral: 2' })).toHaveAttribute('href', '/applications?tab=referral');
    expect(screen.getByRole('link', { name: 'Interview: 1' })).toHaveAttribute('href', '/applications?tab=interview');
    expect(screen.queryByText(/Follow-ups/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Prepared/)).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
