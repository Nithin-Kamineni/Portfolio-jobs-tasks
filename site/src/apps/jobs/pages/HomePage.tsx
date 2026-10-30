import { useEffect, useState, type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardActionArea, CardContent, CardHeader, Chip, Link, List, ListItem, ListItemText, Stack, Typography,
} from '@mui/material';
import HowToVoteOutlined from '@mui/icons-material/HowToVoteOutlined';
import HandshakeOutlined from '@mui/icons-material/HandshakeOutlined';
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined';
import RecordVoiceOverOutlined from '@mui/icons-material/RecordVoiceOverOutlined';
import MonitorHeartOutlined from '@mui/icons-material/MonitorHeartOutlined';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import Grid from '@mui/material/Grid2';
import { useJobs, useMeta, useStats } from '../api/hooks';
import { CardSkeleton, EmptyState, PageHeader } from '../components/common';
import { useClaudeSteps } from '../components/ClaudeSteps';
import SelfCheckCard from '../components/SelfCheckCard';
import { fmtTokens, fmtUsd, RunButton, useRuns } from '../components/Runs';
import { weekTotals } from './RunsPage';
import { relTime } from '../lib/time';
import { fitInfo, fmtElapsed, searchAgeColor, shortCompany } from '../lib/format';

function Kpi({ label, value, to, icon, color }: { label: string; value: number; to: string; icon: ReactNode; color: string }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea component={RouterLink} to={to} sx={{ height: '100%' }} aria-label={`${label}: ${value}`}>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{label}</Typography>
            <Box sx={{ color, display: 'flex', fontSize: 22 }} aria-hidden>{icon}</Box>
          </Stack>
          <Typography variant="h4" component="div" sx={{ mt: 1 }}>{value}</Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

/** A clock that ticks every second (the countdown re-renders, nothing else). */
function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

/** "Last manual job search: 2 d 4 h 12 min ago": green for a day, amber after 24 h, red after 72 h; the button runs it. */
function SearchCountdown({ last, nothingNew }: { last: { at: string; what: string } | null | undefined; nothingNew?: boolean }) {
  const now = useNow();
  const age = last ? now - new Date(last.at).getTime() : Infinity;
  const color = last ? searchAgeColor(age) : 'error';
  return (
    <Card data-testid="search-countdown" sx={{ mb: 3, borderLeft: 6, borderColor: `${color}.main` }}>
      <CardContent sx={{ pb: '16px !important' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <TimerOutlined sx={{ fontSize: 44, color: `${color}.main`, display: { xs: 'none', md: 'block' } }} aria-hidden />
          <Box sx={{ flex: 1 }}>
            <Typography variant="overline" color="text.secondary">Last manual job search</Typography>
            <Typography variant="h4" component="p" sx={{ fontWeight: 700, color: `${color}.main`, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }} data-testid="search-age" data-color={color}>
              {last ? `${fmtElapsed(age, true)} ago` : 'Never'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {last ? `${last.what} · ${new Date(last.at).toLocaleString()}. ` : ''}
              {color === 'success' ? 'Fresh.' : color === 'warning' ? 'Over a day: time to run it again.' : 'Over 3 days (or never): run it now.'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'flex-end' }, gap: 0.5 }}>
            <RunButton task="process-new-jobs" variant="contained" size="large" sx={{ whiteSpace: 'nowrap' }}>Process new jobs</RunButton>
            {nothingNew && <Typography variant="caption" color="text.secondary" data-testid="nothing-new">No new jobs to rank right now · still checks the manual companies</Typography>}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const { data: stats, isLoading, error } = useStats();
  const { data: jobs } = useJobs();
  const { data: meta } = useMeta();
  const claude = useClaudeSteps();
  const runs = useRuns();
  const week = weekTotals(runs.runs);

  const k = stats?.kpis;
  const health = meta?.health;
  const staleRun = health?.lastRunAt ? (Date.now() - new Date(health.lastRunAt).getTime()) / 3600e3 > 26 : false;
  const referral = (jobs || []).filter((j) => j.status === 'apply_referral').sort((a, b) => fitInfo(b).sortKey - fitInfo(a).sortKey);
  // The button is always clickable: with no new jobs a press still checks the manual companies (Meta, Rambus…).
  const noNew = Boolean(claude.facts && claude.facts.newCount === 0);

  return (
    <Box>
      <PageHeader title="Home" subtitle="What needs you today. Every card links to the matching list." />
      {error && <Alert severity="error" sx={{ mb: 2 }}>Couldn't load: {(error as Error).message}</Alert>}

      {stats ? <SearchCountdown last={stats.lastJobSearch} nothingNew={noNew} /> : <Box sx={{ mb: 3 }}><CardSkeleton rows={2} /></Box>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {isLoading || !k ? Array.from({ length: 4 }, (_, i) => <Grid key={i} size={{ xs: 6, md: 3 }}><CardSkeleton rows={1} /></Grid>) : (
          [
            { label: 'To decide', value: k.awaiting, to: '/jobs?status=new,ranked', icon: <HowToVoteOutlined fontSize="inherit" />, color: 'primary.main' },
            { label: 'Referral', value: k.referral, to: '/applications?tab=referral', icon: <HandshakeOutlined fontSize="inherit" />, color: 'secondary.main' },
            { label: 'Applied', value: k.applied, to: '/applications?tab=applied', icon: <TaskAltOutlined fontSize="inherit" />, color: 'success.main' },
            { label: 'Interview', value: k.interviews, to: '/applications?tab=interview', icon: <RecordVoiceOverOutlined fontSize="inherit" />, color: 'success.main' },
          ].map((x) => <Grid key={x.label} size={{ xs: 6, md: 3 }}><Kpi {...x} /></Grid>)
        )}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={2}>
            <Card>
              <CardHeader title="Waiting for a referral" titleTypographyProps={{ variant: 'subtitle1', component: 'h2' }}
                subheader="Roles in the Referral phase: copy the LinkedIn message or find R&D emails there." />
              <CardContent sx={{ pt: 0 }}>
                {!jobs ? <CardSkeleton /> : referral.length === 0 ? (
                  <EmptyState title="No roles waiting for a referral">On the Jobs page, "Apply with referral" (R) puts a role here.</EmptyState>
                ) : (
                  <List dense disablePadding>
                    {referral.slice(0, 8).map((j) => {
                      const f = fitInfo(j);
                      return (
                        <ListItem key={j.id} disableGutters>
                          <ListItemText primary={<Link component={RouterLink} to={`/applications?tab=referral&job=${encodeURIComponent(j.id)}`}>{j.title}</Link>}
                            secondary={`${shortCompany(j.company)}${f.value != null ? ` · ${f.ranked ? 'fit' : 'score'} ${f.value}` : ''}`} />
                        </ListItem>
                      );
                    })}
                    {referral.length > 8 && <Button component={RouterLink} to="/applications?tab=referral" size="small">All {referral.length}</Button>}
                  </List>
                )}
              </CardContent>
            </Card>

            <Typography variant="caption" color="text.secondary" component="p" sx={{ px: 0.5 }} data-testid="home-week-usage">
              Claude this week: {week.runs} run{week.runs === 1 ? '' : 's'}{week.runs ? ` · ${fmtTokens(week.tokens)} tokens · ${fmtUsd(week.usd)} API-equivalent (billed to your plan)` : ''}.
            </Typography>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={2}>
          <SelfCheckCard />
          <Card>
            <CardHeader avatar={<MonitorHeartOutlined color={health?.errors.length || staleRun ? 'warning' : 'success'} />} title="Watcher health"
              titleTypographyProps={{ variant: 'subtitle1', component: 'h2' }}
              subheader={health?.lastRunAt ? `Last run ${relTime(health.lastRunAt)} (${new Date(health.lastRunAt).toLocaleString()})` : 'No watcher run found yet'} />
            <CardContent sx={{ pt: 0 }}>
              <Stack spacing={1.5}>
                {health && health.matches != null && <Typography variant="body2">{health.matches} new match{health.matches === 1 ? '' : 'es'} in the last run.</Typography>}
                {staleRun && <Alert severity="warning">No run in over a day. Check GitHub → Actions → Job watcher.</Alert>}
                {health && health.errors.length > 0 ? (
                  <Alert severity="warning" action={claude.isActive('fix-watcher-errors')
                    ? <RunButton task="fix-watcher-errors" color="inherit" size="small" sx={{ whiteSpace: 'nowrap' }}>Fix with Claude</RunButton> : undefined}>
                    {health.errors.length} source error{health.errors.length === 1 ? '' : 's'}:
                    <Box component="ul" sx={{ m: 0, pl: 2.5 }}>{health.errors.slice(0, 6).map((e) => <li key={e}>{e}</li>)}</Box>
                  </Alert>
                ) : health?.lastRunAt ? <Typography variant="body2" color="text.secondary">No source errors.</Typography> : null}
                {meta?.lastSync && (
                  <Typography variant="body2" color="text.secondary">
                    Last sync {relTime(meta.lastSync.at)}{meta.lastSync.warning ? ' (with a warning)' : ''}.
                  </Typography>
                )}
                {meta?.lastSync?.warning && <Alert severity="info">{meta.lastSync.warning}</Alert>}
                {k && (k.new > 0) && <Chip size="small" variant="outlined" label={`${k.new} new, not ranked yet`} component={RouterLink} to="/jobs?status=new" clickable sx={{ alignSelf: 'flex-start' }} />}
              </Stack>
            </CardContent>
          </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
