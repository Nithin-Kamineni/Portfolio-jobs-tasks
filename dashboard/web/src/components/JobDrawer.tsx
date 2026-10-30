import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import DOMPurify from 'dompurify';
import {
  Alert, Box, Button, Chip, CircularProgress, Divider, Drawer, IconButton, Link, Skeleton, Stack,
  TextField, Tooltip, Typography,
} from '@mui/material';
import Close from '@mui/icons-material/Close';
import OpenInNew from '@mui/icons-material/OpenInNew';
import KeyboardArrowUp from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import CloudDownloadOutlined from '@mui/icons-material/CloudDownloadOutlined';
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useFetchDescription, useJob, useSetStatus, useUndo, useUpdateJob } from '../api/hooks';
import { api, enc } from '../api/client';
import { useNotify } from './Notify';
import { allowedNext, type Decision } from '../../../shared/statuses';
import type { Job } from '../../../shared/types';
import { FLAG_HELP, fitColor, fitInfo, isHtml, previousOutcome, priorityColor, STAGE_INFO, statusColor, statusLabel } from '../lib/format';
import { relTime, shortDate } from '../lib/time';
import { ClaudeTouchedChip } from './Runs';
import { CompanyNoteField } from './CompanyNote';

/** Half the screen (The owner, 2026-09-30: easier to read the details), never narrower than 580 px. */
export const DRAWER_WIDTH = 'max(580px, 50vw)';

/** "Apply direct" = he applies on the career site himself, so it marks the job Applied at once (2026-10-17). */
const DECISION_BUTTONS: { status: Decision; label: string; key: string; help: string; color: 'secondary' | 'primary' | 'inherit' | 'error'; variant: 'contained' | 'outlined' }[] = [
  { status: 'apply_referral', label: 'Apply with referral', key: 'R', help: 'Moves it to Applications → Referral', color: 'secondary', variant: 'contained' },
  { status: 'applied', label: 'Apply direct', key: 'D', help: 'Marks it Applied (apply on the career site yourself)', color: 'primary', variant: 'contained' },
  { status: 'later', label: 'Later', key: 'L', help: 'Keep it for later', color: 'inherit', variant: 'outlined' },
  { status: 'skip', label: 'Skip', key: 'S', help: 'Not for you', color: 'error', variant: 'outlined' },
];

export interface JobDrawerProps {
  jobId: string | null;
  onClose: () => void;
  /** Select another job (J/K and auto-advance after a decision). */
  onSelect: (id: string) => void;
  prevId?: string | null;
  nextId?: string | null;
}

function Description({ job, onFetch, fetching, error }: { job: Job; onFetch: () => void; fetching: boolean; error?: string | null }) {
  const html = useMemo(() => {
    const d = job.description || '';
    if (!d || !isHtml(d)) return null;
    const clean = DOMPurify.sanitize(d, { USE_PROFILES: { html: true }, FORBID_TAGS: ['style', 'img', 'form', 'input', 'iframe'], FORBID_ATTR: ['style', 'class', 'id'] });
    return clean.replace(/<(\/?)h[12](\s|>)/gi, '<$1h3$2'); // keep the posting's headings below the drawer's own
  }, [job.description]);

  if (!job.description) {
    return (
      <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2, borderStyle: 'dashed', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {job.description_fetched_at ? 'The posting has no readable description.' : 'No description saved for this job yet.'}
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="center">
          <Button variant="outlined" size="small" onClick={onFetch} disabled={fetching} startIcon={fetching ? <CircularProgress size={14} /> : <CloudDownloadOutlined />}>
            {fetching ? 'Fetching…' : 'Fetch description'}
          </Button>
          <Button size="small" href={job.url} target="_blank" rel="noopener noreferrer" endIcon={<OpenInNew fontSize="small" />} disabled={!job.url}>Open posting</Button>
        </Stack>
        {error && <Alert severity="warning" sx={{ mt: 1.5, textAlign: 'left' }}>{error}</Alert>}
      </Box>
    );
  }
  const sx = {
    fontSize: 14, lineHeight: 1.6, color: 'text.primary', overflowWrap: 'anywhere',
    '& h1, & h2, & h3, & h4': { fontSize: 15, fontWeight: 650, mt: 2, mb: 0.5 },
    '& p': { my: 0.75 }, '& ul, & ol': { pl: 2.5, my: 0.5 }, '& a': { color: 'primary.main' },
  } as const;
  return html
    ? <Box sx={sx} data-testid="job-description" dangerouslySetInnerHTML={{ __html: html }} />
    : <Box sx={{ ...sx, whiteSpace: 'pre-wrap' }} data-testid="job-description">{job.description}</Box>;
}

/** Clicks that must not close the panel: inside it, on a job row (that switches the panel), and in menus/popovers/snackbars/dialogs. */
const KEEP_OPEN = '#job-drawer-paper, .MuiDataGrid-row, .MuiDataGrid-footerContainer, .MuiPopover-root, .MuiMenu-root, .MuiModal-root, .MuiDialog-root, .MuiSnackbar-root, .MuiPopper-root, [data-keep-drawer]';

/** The panel closes on a click anywhere outside it (it is a persistent drawer, so it has no backdrop of its own). */
export function useClickAway(open: boolean, onClose: () => void): void {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    const h = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (!t || !(t instanceof Element) || !t.isConnected) return;
      if (t === document.documentElement) return; // the page's scrollbar
      if (t.closest(KEEP_OPEN)) return;
      close.current();
    };
    document.addEventListener('pointerdown', h, true);
    return () => document.removeEventListener('pointerdown', h, true);
  }, [open]);
}

/** "Description saved <date>" and, for Referral/Applied/Interview jobs, the plain-file copy (applications/<dir>/JD.md). */
function DescriptionHeader({ job }: { job: Job }) {
  const kept = ['apply_referral', 'applied', 'interview'].includes(job.status);
  const saved = useQuery({ queryKey: ['saved-jd', job.id, job.status, job.description_fetched_at], queryFn: () => api.get<{ path: string | null }>(`/jobs/${enc(job.id)}/saved-jd`), enabled: kept });
  const open = useMutation({ mutationFn: () => api.post<{ opened: string }>(`/jobs/${enc(job.id)}/open-saved-jd`) });
  const notify = useNotify();
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: 'wrap', rowGap: 0.5 }}>
      <Typography variant="subtitle2">Description</Typography>
      {job.description && job.description_fetched_at && (
        <Typography variant="caption" color="text.secondary" data-testid="description-saved">Description saved {shortDate(job.description_fetched_at.slice(0, 10))}</Typography>
      )}
      <Box sx={{ flex: 1 }} />
      {kept && saved.data?.path && (
        <Tooltip title={saved.data.path}>
          <Button size="small" variant="outlined" data-testid="open-saved-jd" disabled={open.isPending}
            onClick={() => open.mutate(undefined, { onSuccess: (r) => notify({ message: `Opened ${r.opened}` }), onError: (e) => notify({ severity: 'error', message: (e as Error).message }) })}>
            Open saved JD
          </Button>
        </Tooltip>
      )}
    </Stack>
  );
}

function NotesField({ job }: { job: Job }) {
  const update = useUpdateJob();
  const [value, setValue] = useState(job.notes || '');
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const last = useRef(job.notes || '');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setValue(job.notes || ''); last.current = job.notes || ''; setState('idle'); }, [job.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = (v: string) => {
    if (v === last.current) return;
    setState('saving');
    update.mutate({ id: job.id, notes: v || null }, {
      onSuccess: () => { last.current = v; setState('saved'); },
      onError: () => setState('error'),
    });
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <TextField
      label="Notes on this role" multiline minRows={2} maxRows={8} fullWidth size="small" value={value}
      onChange={(e) => {
        const v = e.target.value; setValue(v); setState('idle');
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => save(v), 700);
      }}
      onBlur={() => { if (timer.current) clearTimeout(timer.current); save(value); }}
      helperText={state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : state === 'error' ? 'Could not save; try again' : 'Saves automatically'}
      slotProps={{ htmlInput: { 'data-testid': 'notes' } }}
    />
  );
}

export function JobDrawer({ jobId, onClose, onSelect, prevId, nextId }: JobDrawerProps) {
  const open = Boolean(jobId);
  const { data, isLoading, error } = useJob(jobId);
  const setStatus = useSetStatus();
  const undo = useUndo();
  const fetchDesc = useFetchDescription();
  const notify = useNotify();
  const job = data?.job;
  const resetFetch = fetchDesc.reset;
  useEffect(() => { resetFetch(); }, [jobId, resetFetch]);

  const decide = async (status: Decision) => {
    if (!job || setStatus.isPending) return;
    if (job.status === status) { notify({ severity: 'info', message: `Already "${statusLabel(status)}"` }); return; }
    if (!allowedNext(job.status).includes(status) || ['applied', 'interview'].includes(job.status)) { notify({ severity: 'warning', message: `A job that's "${statusLabel(job.status)}" can't be set to "${statusLabel(status)}"` }); return; }
    const advanceTo = nextId || prevId || null;
    try {
      const r = await setStatus.mutateAsync({ id: job.id, status });
      notify({
        message: `${statusLabel(status)}: ${job.company} · ${job.title}`,
        action: r.eventId ? { label: 'Undo', onClick: () => undo.mutate([r.eventId], { onSuccess: () => { onSelect(job.id); notify({ severity: 'info', message: 'Undone' }); } }) } : undefined,
      });
      if (advanceTo) onSelect(advanceTo);
    } catch (e) {
      notify({ severity: 'error', message: (e as Error).message });
    }
  };

  // Keyboard shortcuts while the drawer is open: R D L S decide, J/K next/previous, O open posting, Esc close.
  const handler = useRef<(e: KeyboardEvent) => void>(() => undefined);
  handler.current = (e: KeyboardEvent) => {
    if (!open || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
    if (document.querySelector('.MuiDialog-root')) return; // a dialog has the keyboard
    const k = e.key.toLowerCase();
    const map: Record<string, Decision> = { r: 'apply_referral', d: 'applied', l: 'later', s: 'skip' };
    if (map[k]) { e.preventDefault(); void decide(map[k]); }
    else if (k === 'j' && nextId) { e.preventDefault(); onSelect(nextId); }
    else if (k === 'k' && prevId) { e.preventDefault(); onSelect(prevId); }
    else if (k === 'o' && job?.url) { e.preventDefault(); window.open(job.url, '_blank', 'noopener'); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => handler.current(e);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  useClickAway(open, onClose);

  const fit = job ? fitInfo(job) : null;
  return (
    <Drawer anchor="right" variant="persistent" open={open}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: DRAWER_WIDTH }, boxSizing: 'border-box', borderLeft: 1, borderColor: 'divider', boxShadow: 6 } }}
      slotProps={{ paper: { role: 'complementary', 'aria-label': 'Job details', id: 'job-drawer-paper' } as object }}>
      <Box sx={{ height: 64, flexShrink: 0 }} />
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Tooltip title="Previous (K)"><span><IconButton size="small" aria-label="Previous job" disabled={!prevId} onClick={() => prevId && onSelect(prevId)}><KeyboardArrowUp /></IconButton></span></Tooltip>
        <Tooltip title="Next (J)"><span><IconButton size="small" aria-label="Next job" disabled={!nextId} onClick={() => nextId && onSelect(nextId)}><KeyboardArrowDown /></IconButton></span></Tooltip>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1, pl: 1 }}>R · D · L · S decide &nbsp; J/K move &nbsp; O open &nbsp; Esc close</Typography>
        <Tooltip title="Close (Esc)"><IconButton aria-label="Close" onClick={onClose} data-testid="drawer-close"><Close /></IconButton></Tooltip>
      </Stack>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
        {isLoading && <Stack spacing={1}><Skeleton width="50%" height={28} /><Skeleton height={40} /><Skeleton height={120} /><Skeleton height={220} /></Stack>}
        {error && <Alert severity="error">{(error as Error).message}</Alert>}
        {job && fit && (
          <Stack spacing={2.25}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                {job.company_priority && <Chip size="small" label={job.company_priority} color={priorityColor(job.company_priority)} />}
                <Typography variant="subtitle2" color="text.secondary">{job.company}</Typography>
                <Box sx={{ flex: 1 }} />
                <ClaudeTouchedChip at={job.claude_at} />
                <Chip size="small" label={statusLabel(job.status)} color={statusColor(job.status)} variant="outlined" data-testid="drawer-status" />
              </Stack>
              <Typography variant="h6" component="h2" sx={{ lineHeight: 1.3 }}>{job.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {[job.location, job.posted_date ? `posted ${shortDate(job.posted_date)}` : job.posted_raw, `found ${relTime(job.first_seen)}`, job.source].filter(Boolean).join(' · ')}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }} role="group" aria-label="Decision">
              {DECISION_BUTTONS.map((b) => {
                // Decisions are for the inbox (and Referral); Applied/Interview move on the Applications page.
                const allowed = job.status === b.status || (allowedNext(job.status).includes(b.status) && !['applied', 'interview'].includes(job.status));
                return (
                  <Tooltip key={b.status} title={allowed ? `${b.help} · shortcut ${b.key}` : `Not possible from "${statusLabel(job.status)}"`}>
                    <span>
                      <Button size="small" variant={job.status === b.status ? 'contained' : b.variant} color={b.color} disabled={!allowed || setStatus.isPending}
                        onClick={() => void decide(b.status)} aria-keyshortcuts={b.key}>
                        {b.label} <Box component="kbd" sx={{ ml: 0.75, fontSize: 11, opacity: 0.75, fontFamily: 'inherit' }}>{b.key}</Box>
                      </Button>
                    </span>
                  </Tooltip>
                );
              })}
              <Button size="small" href={job.url} target="_blank" rel="noopener noreferrer" endIcon={<OpenInNew fontSize="small" />} disabled={!job.url}>Open posting</Button>
            </Stack>
            {['apply_referral', 'applied', 'interview'].includes(job.status) && (
              <Alert severity="success" sx={{ py: 0 }} action={
                <Button color="inherit" size="small" component={RouterLink} to={`/applications?tab=${job.status === 'apply_referral' ? 'referral' : job.status}&job=${encodeURIComponent(job.id)}`}>Open in Applications</Button>
              }>
                {job.status === 'apply_referral' ? 'In the Referral phase.' : job.status === 'applied' ? `Applied${job.applied_date ? ` ${shortDate(job.applied_date)}` : ''}.` : 'Interviewing.'}
              </Alert>
            )}

            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip size="small" color={fitColor(fit.value, fit.ranked)} label={fit.ranked ? `Fit ${fit.value}` : `Watcher score ${fit.value ?? '–'}`} />
                <Typography variant="body2" color={job.fit_reason ? 'text.primary' : 'text.secondary'}>
                  {job.fit_reason || 'Not checked by Claude yet ("Process new jobs" ranks it against your profile).'}
                </Typography>
              </Stack>
              {fit.ranked && job.rank_stage && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }} data-testid="drawer-stage">
                  {STAGE_INFO[job.rank_stage]?.help}{job.rank_model && job.rank_model !== 'rules' ? ` · ${job.rank_model}` : ''}
                </Typography>
              )}
            </Box>

            {job.previous_posting && (
              <Alert severity="info" data-testid="repost-note" sx={{ py: 0.5 }}>
                Re-posted. Earlier posting: <Link component={RouterLink} to={`/jobs?status=all&job=${encodeURIComponent(job.previous_posting.id)}`}>{job.previous_posting.title}</Link>
                {' '}(first seen {shortDate(job.previous_posting.first_seen)}), {previousOutcome(job.previous_posting)}.
              </Alert>
            )}

            {(job.tags.length > 0 || job.flags.length > 0) && (
              <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
                {job.tags.map((t) => <Chip key={t} size="small" label={t} variant="outlined" />)}
                {job.flags.map((f) => (
                  <Tooltip key={f} title={FLAG_HELP[f] || f}>
                    <Chip size="small" color="warning" icon={<WarningAmberRounded />} label={f} />
                  </Tooltip>
                ))}
              </Stack>
            )}

            <CompanyNoteField company={job.company} />
            {data.contacts.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                Contacts at {job.company.split(/[(/]/)[0].trim()}: {data.contacts.map((c) => [c.name, c.relationship.replace('_', ' ')].join(' (') + ')').join(', ')}
              </Typography>
            )}

            <NotesField job={job} />

            <Divider />
            <Box>
              <DescriptionHeader job={job} />
              <Description job={job} fetching={fetchDesc.isPending} error={fetchDesc.error ? (fetchDesc.error as Error).message : null}
                onFetch={() => fetchDesc.mutate(job.id, { onSuccess: () => notify({ message: 'Description saved' }) })} />
            </Box>
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}
