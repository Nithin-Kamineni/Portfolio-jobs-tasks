/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JobDrawer } from '../../web/src/components/JobDrawer';
import { contact, error, FACTS, job, META, mockApi, renderWithApp } from './testUtils';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

function setup(jobOverrides = {}, extraRoutes: Record<string, unknown> = {}, props: Partial<Parameters<typeof JobDrawer>[0]> = {}) {
  const j = job(jobOverrides);
  const api = mockApi({
    'GET /claude-facts': FACTS, 'GET /meta': META, 'GET /company-notes': [],
    [`GET /jobs/${j.id}`]: { job: j, contacts: [], outreach: [] },
    [`POST /jobs/${j.id}/status`]: (b: unknown) => ({ job: { ...j, status: (b as { status: string }).status }, eventId: 41 }),
    'POST /events/41/undo': { ...j },
    ...extraRoutes,
  });
  const onClose = vi.fn(); const onSelect = vi.fn();
  renderWithApp(<JobDrawer jobId={j.id} onClose={onClose} onSelect={onSelect} prevId="prev:1" nextId="next:1" {...props} />);
  return { api, j, onClose, onSelect };
}

describe('JobDrawer', () => {
  it('shows the header, fit reason, tags and sanitized description', async () => {
    setup({ description: '<p>Hello <b>HBM</b></p><script>alert(1)</script><img src=x onerror="alert(2)">' });
    expect(await screen.findByRole('heading', { name: 'PhD Research Intern, Architecture' })).toBeInTheDocument();
    expect(screen.getByText('Memory systems + architecture research')).toBeInTheDocument();
    expect(screen.getByText('Fit 88')).toBeInTheDocument();
    const d = screen.getByTestId('job-description');
    expect(d.innerHTML).toContain('<b>HBM</b>');
    expect(d.innerHTML).not.toMatch(/script|onerror|<img/);
  });

  it('decision button posts the status, shows Undo, and advances to the next job', async () => {
    const user = userEvent.setup();
    const { api, onSelect } = setup();
    await user.click(await screen.findByRole('button', { name: /^Skip/ }));
    await waitFor(() => expect(api.find('POST', '/jobs/wd:nvidia:1/status')[0].body).toEqual({ status: 'skip' }));
    expect(await screen.findByText(/Skip: NVIDIA/)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); // no pop-ups after a decision
    expect(onSelect).toHaveBeenCalledWith('next:1');
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    await waitFor(() => expect(api.find('POST', '/events/41/undo')).toHaveLength(1));
    expect(onSelect).toHaveBeenLastCalledWith('wd:nvidia:1');
  });

  it.each([
    ['r', 'apply_referral'], ['d', 'applied'], ['l', 'later'], ['s', 'skip'],
  ])('keyboard shortcut %s → %s', async (key, status) => {
    const { api } = setup();
    await screen.findByRole('heading', { name: 'PhD Research Intern, Architecture' });
    fireEvent.keyDown(window, { key });
    await waitFor(() => expect(api.find('POST', '/jobs/wd:nvidia:1/status')[0]?.body).toEqual({ status }));
  });

  it('J/K move, O opens the posting, Esc closes', async () => {
    const open = vi.fn(); vi.stubGlobal('open', open);
    const { onSelect, onClose } = setup();
    await screen.findByRole('heading', { name: 'PhD Research Intern, Architecture' });
    fireEvent.keyDown(window, { key: 'j' });
    expect(onSelect).toHaveBeenLastCalledWith('next:1');
    fireEvent.keyDown(window, { key: 'k' });
    expect(onSelect).toHaveBeenLastCalledWith('prev:1');
    fireEvent.keyDown(window, { key: 'o' });
    expect(open).toHaveBeenCalledWith('https://nvidia.example/job/1', '_blank', 'noopener');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('shortcuts are ignored while typing in the notes', async () => {
    const { api } = setup();
    const notes = await screen.findByTestId('notes');
    fireEvent.keyDown(notes, { key: 's' });
    await new Promise((r) => setTimeout(r, 50));
    expect(api.find('POST', '/jobs/wd:nvidia:1/status')).toHaveLength(0);
  });

  it('notes autosave with a PATCH', async () => {
    const user = userEvent.setup();
    const { api } = setup({}, { 'PATCH /jobs/wd:nvidia:1': (b: unknown) => ({ ...job(), ...(b as object) }) });
    await user.type(await screen.findByTestId('notes'), 'Ask Ana');
    await waitFor(() => expect(api.find('PATCH', '/jobs/wd:nvidia:1').at(-1)?.body).toEqual({ notes: 'Ask Ana' }), { timeout: 3000 });
    expect(await screen.findByText('Saved')).toBeInTheDocument();
  });

  it('missing description: Fetch description calls the server; failures show the message', async () => {
    const user = userEvent.setup();
    const { api } = setup({ description: '', has_description: false }, { 'POST /jobs/wd:nvidia:1/fetch-description': error(502, "Couldn't fetch the description: HTTP 403") });
    await user.click(await screen.findByRole('button', { name: 'Fetch description' }));
    await waitFor(() => expect(api.find('POST', '/jobs/wd:nvidia:1/fetch-description')).toHaveLength(1));
    expect(await screen.findByText(/HTTP 403/)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Open posting/ })[0]).toHaveAttribute('href', 'https://nvidia.example/job/1');
  });

  it('decision buttons are disabled when the transition is not allowed', async () => {
    setup({ status: 'interview' });
    await screen.findByRole('heading', { name: 'PhD Research Intern, Architecture' });
    const group = screen.getByRole('group', { name: 'Decision' });
    for (const name of [/Apply with referral/, /Apply direct/, /^Later/, /^Skip/]) expect(within(group).getByRole('button', { name })).toBeDisabled();
  });

  it('"Apply direct" marks the job Applied at once, with Undo and no dialog', async () => {
    const user = userEvent.setup();
    const { api } = setup();
    await user.click(await screen.findByRole('button', { name: /Apply direct/ }));
    await waitFor(() => expect(api.find('POST', '/jobs/wd:nvidia:1/status')[0].body).toEqual({ status: 'applied' }));
    expect(await screen.findByText(/Applied: NVIDIA/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('the company note (shared by every role of the company) autosaves; contacts are listed without outreach links', async () => {
    const user = userEvent.setup();
    const j = job();
    const api = mockApi({
      'GET /claude-facts': FACTS, 'GET /meta': META, 'GET /company-notes': [{ company_key: 'nvidia', company: 'NVIDIA', note: 'Asked Ana', updated_at: '' }],
      [`GET /jobs/${j.id}`]: { job: j, contacts: [contact({ relationship: 'friend', name: 'Ana' })], outreach: [] },
      'POST /company-notes': (b: unknown) => ({ company_key: 'nvidia', company: 'NVIDIA', note: (b as { note: string }).note, updated_at: '' }),
    });
    renderWithApp(<JobDrawer jobId={j.id} onClose={vi.fn()} onSelect={vi.fn()} />);
    const note = await screen.findByTestId('company-note-nvidia');
    await waitFor(() => expect(note).toHaveValue('Asked Ana'));
    expect(screen.getByText('Contacts at NVIDIA: Ana (friend)')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Outreach' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /referral draft/ })).not.toBeInTheDocument();
    await user.type(note, ' on Oct 17');
    await waitFor(() => expect(api.find('POST', '/company-notes').at(-1)?.body).toEqual({ company: 'NVIDIA', note: 'Asked Ana on Oct 17' }), { timeout: 3000 });
  });

  it('shows an error when the job cannot be loaded, and a skeleton while loading', async () => {
    mockApi({ 'GET /claude-facts': FACTS, 'GET /meta': META, 'GET /jobs/gone:1': error(404, 'No job with id gone:1') });
    renderWithApp(<JobDrawer jobId="gone:1" onClose={vi.fn()} onSelect={vi.fn()} />);
    expect(await screen.findByText('No job with id gone:1')).toBeInTheDocument();
  });

  it('renders nothing visible when no job is selected', async () => {
    mockApi({ 'GET /claude-facts': FACTS, 'GET /meta': META });
    renderWithApp(<JobDrawer jobId={null} onClose={vi.fn()} onSelect={vi.fn()} />);
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    expect(screen.queryByRole('group', { name: 'Decision' })).not.toBeInTheDocument();
  });
});

describe('JobDrawer v2: ranking stage, re-post note, phase link', () => {
  it('shows who wrote the score and the earlier posting of a re-posted role', async () => {
    setup({
      rank_stage: 'final', rank_model: 'opus', previous_posting_id: 'wd:nvidia:0',
      previous_posting: { id: 'wd:nvidia:0', title: 'PhD Research Intern, Architecture (2026)', url: 'https://x.example', status: 'skip', first_seen: '2026-08-01T00:00:00Z', decision_at: '2026-08-02T00:00:00Z', applied_date: null },
    });
    expect(await screen.findByTestId('drawer-stage')).toHaveTextContent('Checked by Opus (final check) · opus');
    const note = screen.getByTestId('repost-note');
    expect(note).toHaveTextContent(/Re-posted\. Earlier posting: PhD Research Intern, Architecture \(2026\).*you skipped it/);
    expect(within(note).getByRole('link')).toHaveAttribute('href', '/jobs?status=all&job=wd%3Anvidia%3A0');
  });

  it('a Referral job links to its Applications phase; no Claude run buttons (prepare, find someone) any more', async () => {
    setup({ status: 'apply_referral' });
    expect(await screen.findByRole('link', { name: 'Open in Applications' })).toHaveAttribute('href', '/applications?tab=referral&job=wd%3Anvidia%3A1');
    expect(screen.queryByRole('button', { name: /Prepare this job/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Find someone at/ })).not.toBeInTheDocument();
  });
});
