// Applications (2026-10-17): three phases, Referral → Applied ⇄ Interview. Every button just does it (an Undo shows in
// the message at the bottom); nothing opens a dialog. Grouped by company, because the note is per company.
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Chip, Divider, IconButton, Link, Menu, MenuItem, Stack, Tab, Tabs, Tooltip, Typography,
} from '@mui/material';
import AttachFile from '@mui/icons-material/AttachFile';
import MoreVert from '@mui/icons-material/MoreVert';
import OpenInNew from '@mui/icons-material/OpenInNew';
import TaskAlt from '@mui/icons-material/TaskAlt';
import RecordVoiceOverOutlined from '@mui/icons-material/RecordVoiceOverOutlined';
import Undo from '@mui/icons-material/Undo';
import { useJobs, useMeta, useSetStatus, useUndo } from '../api/hooks';
import { useNotify } from '../components/Notify';
import { EmptyState, PageHeader, TableSkeleton } from '../components/common';
import { CompanyNoteField, useCompanyNote } from '../components/CompanyNote';
import { PaperEmails, ReferralMessage } from '../components/ReferralTools';
import { copyText } from '../lib/clipboard';
import { fitColor, fitInfo, priorityColor, shortCompany, statusLabel } from '../lib/format';
import { shortDate } from '../lib/time';
import { readStore, writeStore } from '../lib/storage';
import { allowedNext, companyKey, PHASES, type JobStatus } from '../../../shared/statuses';
import type { Job } from '../../../shared/types';

type PhaseKey = (typeof PHASES)[number]['key'];

function useMove() {
  const setStatus = useSetStatus();
  const undo = useUndo();
  const notify = useNotify();
  const move = (job: Job, to: JobStatus) => {
    if (job.status === to) return;
    if (!allowedNext(job.status).includes(to)) {
      notify({ severity: 'warning', message: `Can't move from "${statusLabel(job.status)}" to "${statusLabel(to)}"` });
      return;
    }
    setStatus.mutate({ id: job.id, status: to }, {
      onSuccess: (r) => notify({ message: `${shortCompany(job.company)}: ${statusLabel(to)}`, action: { label: 'Undo', onClick: () => undo.mutate([r.eventId]) } }),
      onError: (e) => notify({ severity: 'error', message: (e as Error).message }),
    });
  };
  return { move, pending: setStatus.isPending };
}

/** Jobs of one phase grouped by company (companyKey), companies A→Z, roles by fit. */
function byCompany(jobs: Job[]): { key: string; company: string; priority: string; jobs: Job[] }[] {
  const groups = new Map<string, { key: string; company: string; priority: string; jobs: Job[] }>();
  for (const j of jobs) {
    const k = companyKey(j.company) || j.company;
    const g = groups.get(k) || { key: k, company: j.company, priority: j.company_priority, jobs: [] };
    g.jobs.push(j);
    groups.set(k, g);
  }
  return [...groups.values()]
    .map((g) => ({ ...g, jobs: g.jobs.sort((a, b) => fitInfo(b).sortKey - fitInfo(a).sortKey) }))
    .sort((a, b) => shortCompany(a.company).localeCompare(shortCompany(b.company)));
}

function MoreMenu({ job, onMove }: { job: Job; onMove: (to: JobStatus) => void }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const next = allowedNext(job.status).filter((s) => s === 'later' || s === 'skip');
  if (!next.length) return null;
  return (
    <>
      <Tooltip title="More"><IconButton size="small" aria-label={`More for ${job.title}`} onClick={(e) => setAnchor(e.currentTarget)}><MoreVert fontSize="small" /></IconButton></Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {next.map((s) => <MenuItem key={s} onClick={() => { setAnchor(null); onMove(s); }}>Move to {statusLabel(s)}</MenuItem>)}
      </Menu>
    </>
  );
}

function RoleRow({ job, phase, highlighted, onMove, busy }: { job: Job; phase: PhaseKey; highlighted: boolean; onMove: (j: Job, to: JobStatus) => void; busy: boolean }) {
  const f = fitInfo(job);
  return (
    <Box id={`app-${job.id}`} data-testid="app-role" sx={{ py: 1, px: 1, mx: -1, borderRadius: 1.5, outline: highlighted ? 2 : 0, outlineColor: 'primary.main' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.35 }}>
            <Link component={RouterLink} to={`/jobs?status=all&job=${encodeURIComponent(job.id)}`} color="inherit" underline="hover">{job.title}</Link>
          </Typography>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25, flexWrap: 'wrap', rowGap: 0.5 }}>
            {f.value != null && <Chip size="small" variant={f.ranked ? 'filled' : 'outlined'} color={fitColor(f.value, f.ranked)} label={f.ranked ? `Fit ${f.value}` : `Score ${f.value}`} sx={{ height: 20 }} />}
            {job.location && <Typography variant="caption" color="text.secondary">{job.location}</Typography>}
            {phase !== 'referral' && job.applied_date && <Typography variant="caption" color="text.secondary">· applied {shortDate(job.applied_date)}</Typography>}
            {phase === 'interview' && job.outcome_date && <Typography variant="caption" color="text.secondary">· interview since {shortDate(job.outcome_date)}</Typography>}
          </Stack>
        </Box>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0, '& .MuiButton-root': { whiteSpace: 'nowrap' } }}>
          <Button size="small" endIcon={<OpenInNew fontSize="small" />} href={job.url} target="_blank" rel="noopener noreferrer" disabled={!job.url}>Open posting</Button>
          {phase === 'referral' && (
            <Button size="small" variant="contained" color="success" startIcon={<TaskAlt fontSize="small" />} disabled={busy} onClick={() => onMove(job, 'applied')}>Applied</Button>
          )}
          {phase === 'applied' && (
            <Button size="small" variant="outlined" color="success" startIcon={<RecordVoiceOverOutlined fontSize="small" />} disabled={busy} onClick={() => onMove(job, 'interview')}>Interview</Button>
          )}
          {phase === 'interview' && (
            <Tooltip title="Rejected or ghosted: back to Applied">
              <span><Button size="small" variant="outlined" startIcon={<Undo fontSize="small" />} disabled={busy} onClick={() => onMove(job, 'applied')}>Back to applied</Button></span>
            </Tooltip>
          )}
          {phase === 'referral' && <MoreMenu job={job} onMove={(to) => onMove(job, to)} />}
        </Stack>
      </Stack>
      {phase === 'referral' && <Box sx={{ mt: 1 }}><ReferralMessage job={job} /></Box>}
    </Box>
  );
}

function SavedNote({ company }: { company: string }) {
  const note = useCompanyNote(company);
  if (!note) return null;
  return <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }} data-testid="company-note-text">Note: {note}</Typography>;
}

function CompanyCard({ group, phase, highlight, onMove, busy }: {
  group: ReturnType<typeof byCompany>[number]; phase: PhaseKey; highlight: string | null; onMove: (j: Job, to: JobStatus) => void; busy: boolean;
}) {
  return (
    <Card component="section" aria-label={shortCompany(group.company)} data-testid={`company-${group.key}`}>
      <CardContent sx={{ pb: '16px !important' }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
          {group.priority && <Chip size="small" label={group.priority} color={priorityColor(group.priority)} />}
          <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 650, flex: 1 }}>{shortCompany(group.company)}</Typography>
          <Chip size="small" variant="outlined" label={`${group.jobs.length} role${group.jobs.length === 1 ? '' : 's'}`} />
        </Stack>
        {phase === 'applied' && <SavedNote company={group.company} />}
        <Stack divider={<Divider flexItem />} sx={{ mt: 0.5 }}>
          {group.jobs.map((j) => <RoleRow key={j.id} job={j} phase={phase} highlighted={j.id === highlight} onMove={onMove} busy={busy} />)}
        </Stack>
        {phase !== 'applied' && (
          <Stack spacing={1.5} sx={{ mt: 1.5 }}>
            <CompanyNoteField company={group.company} />
            {phase === 'referral' && <PaperEmails company={group.company} />}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

const HINT: Record<PhaseKey, string> = {
  referral: 'Ask someone for a referral: copy the LinkedIn message, or find R&D emails from papers. Click Applied once you applied.',
  applied: 'Applied directly or after a referral. Click Interview when a company invites you.',
  interview: 'Interviewing. Rejected or ghosted? "Back to applied".',
};

export default function ApplicationsPage() {
  const [params, setParams] = useSearchParams();
  const { data: jobs, isLoading, error } = useJobs();
  const { data: meta } = useMeta();
  const notify = useNotify();
  const actions = useMove();
  const highlight = params.get('job');
  const tabParam = params.get('tab') as PhaseKey | null;
  const tab: PhaseKey = PHASES.some((p) => p.key === tabParam) ? tabParam! : readStore<PhaseKey>('jw.apps.tab', 'referral');
  useEffect(() => { writeStore('jw.apps.tab', tab); }, [tab]);

  const byPhase = useMemo(() => Object.fromEntries(PHASES.map((p) => [p.key, (jobs || []).filter((j) => j.status === p.status)])) as Record<PhaseKey, Job[]>, [jobs]);
  const groups = useMemo(() => byCompany(byPhase[tab] || []), [byPhase, tab]);

  useEffect(() => {
    if (!highlight || !jobs?.length) return;
    const t = setTimeout(() => document.getElementById(`app-${highlight}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 100);
    return () => clearTimeout(t);
  }, [highlight, jobs?.length, tab]);

  const copyResume = async () => {
    if (!meta) return;
    notify((await copyText(meta.config.resumePath)) ? { message: `Resume path copied: ${meta.config.resumePath}` } : { severity: 'warning', message: 'Could not copy' });
  };

  return (
    <Box>
      <PageHeader
        title="Applications"
        subtitle={HINT[tab]}
        actions={<Button variant="outlined" startIcon={<AttachFile />} onClick={copyResume} disabled={!meta}>Copy resume path</Button>}
      />
      <Tabs value={tab} onChange={(_e, v: PhaseKey) => setParams((p) => { const n = new URLSearchParams(p); n.set('tab', v); n.delete('job'); return n; })}
        aria-label="Application phase" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        {PHASES.map((p) => (
          <Tab key={p.key} value={p.key} label={<span>{p.label} <Chip component="span" size="small" label={byPhase[p.key]?.length ?? 0} sx={{ ml: 0.5, height: 20 }} /></span>}
            aria-label={`${p.label} ${byPhase[p.key]?.length ?? 0}`} data-testid={`tab-${p.key}`} />
        ))}
      </Tabs>
      {error && <Typography color="error" sx={{ mb: 2 }}>Couldn't load: {(error as Error).message}</Typography>}
      {isLoading ? <TableSkeleton /> : groups.length === 0 ? (
        <Card><EmptyState title={tab === 'referral' ? 'No roles waiting for a referral' : tab === 'applied' ? 'Nothing applied yet' : 'No interviews yet'}
          action={tab !== 'interview' ? <Button component={RouterLink} to="/jobs" variant="outlined">Go to Jobs</Button> : undefined}>
          {tab === 'referral' ? 'On the Jobs page, "Apply with referral" (R) puts a role here.' : tab === 'applied' ? '"Apply direct" (D) on the Jobs page, or "Applied" on a referral, puts a role here.' : '"Interview" on an applied role moves it here.'}
        </EmptyState></Card>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: tab === 'applied' ? 'repeat(2, minmax(0, 1fr))' : '1fr', xl: 'repeat(2, minmax(0, 1fr))' }, gap: 2, alignItems: 'start' }}>
          {groups.map((g) => <CompanyCard key={g.key} group={g} phase={tab} highlight={highlight} onMove={actions.move} busy={actions.pending} />)}
        </Box>
      )}
    </Box>
  );
}
