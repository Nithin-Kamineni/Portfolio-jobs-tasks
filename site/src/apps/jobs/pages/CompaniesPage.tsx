import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Chip, FormControl, FormControlLabel, InputLabel, Link, MenuItem, Select, Stack, Switch, Tooltip, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import OpenInNew from '@mui/icons-material/OpenInNew';
import NotificationsActiveOutlined from '@mui/icons-material/NotificationsActiveOutlined';
import { useCompanies, useMark, useSettings, useUpdateSettings } from '../api/hooks';
import { RunButton } from '../components/Runs';
import { useNotify } from '../components/Notify';
import { EmptyState, PageHeader, TableSkeleton } from '../components/common';
import { useClaudeSteps } from '../components/ClaudeSteps';
import { priorityColor } from '../lib/format';
import { relTime } from '../lib/time';
import { readStore, writeStore } from '../lib/storage';
import type { Company } from '../../../../../dashboard/shared/types';

const FEED_LABEL: Record<string, string> = {
  workday: 'Workday', greenhouse: 'Greenhouse', lever: 'Lever', ashby: 'Ashby', smartrecruiters: 'SmartRecruiters', eightfold: 'Eightfold',
  pcsx: 'Eightfold (PCSX)', jibe: 'Jibe', oracle: 'Oracle HCM', rippling: 'Rippling', radancy: 'Radancy', ibm: 'IBM search', google: 'Google careers',
  apple: 'Apple jobs', amazon: 'amazon.jobs', nlx: 'NLX sitemap', manual: 'Manual',
};

export default function CompaniesPage() {
  const { data: companies, isLoading, error } = useCompanies();
  const claude = useClaudeSteps();
  const mark = useMark();
  const notify = useNotify();
  const [hideManual, setHideManual] = useState(() => readStore('jw.hideManualCompanies', false));
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  const cols: GridColDef<Company>[] = useMemo(() => [
    {
      field: 'priority', headerName: 'Pri.', width: 80, align: 'center', headerAlign: 'center', display: 'flex',
      sortComparator: (a: string, b: string) => (a || 'Z').localeCompare(b || 'Z'),
      renderCell: ({ value }) => value ? <Chip size="small" label={value} color={priorityColor(String(value))} sx={{ minWidth: 28 }} /> : null,
    },
    {
      field: 'name', headerName: 'Company', flex: 1, minWidth: 170, display: 'flex',
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ overflow: 'hidden' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, opacity: row.enabled === 'no' ? 0.5 : 1 }} noWrap>{row.name}</Typography>
          {row.enabled === 'no' && <Chip size="small" variant="outlined" label="disabled" />}
        </Stack>
      ),
    },
    {
      field: 'ats', headerName: 'Feed', width: 170, display: 'flex',
      renderCell: ({ row }) => row.manual
        ? <Tooltip title="No public feed: set an email job alert on their career site (todo Part 4)"><Chip size="small" color="warning" icon={<NotificationsActiveOutlined />} label="Manual: set a job alert" /></Tooltip>
        : <Chip size="small" variant="outlined" label={FEED_LABEL[row.ats] || row.ats || '—'} />,
    },
    {
      field: 'last_check', headerName: 'Last checked', width: 225, display: 'flex', sortable: false,
      renderCell: ({ row }) => {
        if (!row.manual || row.enabled === 'no') return null;
        const c = row.last_check;
        return (
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ overflow: 'hidden' }} data-testid={`last-check-${row.name}`}>
            <Typography variant="body2" color={c ? 'text.primary' : 'text.secondary'} noWrap>{c?.checked_at ? relTime(c.checked_at) : 'never'}</Typography>
            {c?.result && (
              <Tooltip title={c.result === 'ok' ? `${c.found ?? 0} intern postings seen, ${c.added ?? 0} new added` : c.result === 'blocked' ? 'Login wall, CAPTCHA or bot check: Claude stopped (never gets around it). Rely on the email job alert.' : 'The check failed; see Claude runs'}>
                <Chip size="small" variant="outlined" color={c.result === 'ok' ? 'success' : c.result === 'blocked' ? 'warning' : 'error'} label={c.result === 'ok' ? `${c.added ?? 0} added` : c.result} />
              </Tooltip>
            )}
            <RunButton task="check-manual-companies" params={{ company: row.name }} size="small" startIcon={null} sx={{ minWidth: 0 }} aria-label={`Check ${row.name} now`}>Check</RunButton>
          </Stack>
        );
      },
    },
    {
      field: 'open_jobs', headerName: 'Open jobs', width: 100, type: 'number', display: 'flex',
      renderCell: ({ row }) => row.open_jobs
        ? <Link component={RouterLink} to={`/jobs?status=all&q=${encodeURIComponent(row.name.split(/[\s(/]/)[0])}`}>{row.open_jobs}</Link> : <span>0</span>,
    },
    {
      field: 'contacts', headerName: 'Contacts', width: 96, type: 'number', display: 'flex',
      renderCell: ({ row }) => <span>{row.contacts}</span>,
    },
    { field: 'fit_notes', headerName: 'Fit notes', flex: 2, minWidth: 220, renderCell: ({ value }) => <span title={String(value)}>{value}</span> },
    {
      field: 'careers_url', headerName: 'Careers', width: 96, sortable: false, display: 'flex',
      renderCell: ({ value }) => value ? <Button size="small" href={String(value)} target="_blank" rel="noopener noreferrer" endIcon={<OpenInNew fontSize="small" />}>Open</Button> : null,
    },
  ], []);

  const manual = (companies || []).filter((c) => c.manual && c.enabled !== 'no');
  const lastCheck = claude.facts?.lastManualCheck;
  return (
    <Box>
      <PageHeader title="Companies" subtitle={<>Mirrors <code>targets/companies.csv</code> (read-only here; edit the CSV in git). Counts are open jobs and saved contacts.</>} />
      {manual.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }} icon={<NotificationsActiveOutlined />}>
          <strong>{manual.length} companies have no public feed</strong> ({manual.map((c) => c.name).join(', ')}). "Process new jobs" checks the due ones with Claude in Chrome (one company per run) and adds matching postings to Jobs; keep the email job alerts as a backup.
          {' '}Last checked {lastCheck ? relTime(lastCheck) : 'never'}.
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1, flexWrap: 'wrap', rowGap: 1 }}>
            {!hideManual && <RunButton task="check-manual-companies" variant="outlined" color="inherit" size="small">Check all now</RunButton>}
            {!hideManual && <Button color="inherit" size="small" onClick={() => claude.openStep('check-manual-companies')}>Show me</Button>}
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel id="manual-every-label">Check each company</InputLabel>
              <Select labelId="manual-every-label" label="Check each company" value={settings ? String(settings.manualCheckEveryHours) : ''} disabled={!settings || updateSettings.isPending}
                onChange={(e) => updateSettings.mutate({ manualCheckEveryHours: Number(e.target.value) }, { onSuccess: () => notify({ message: 'Saved' }) })}>
                {[['0', 'on every press'], ['24', 'every 24 h'], ['72', 'every 3 days'], ['168', 'weekly']].map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
                {settings && !['0', '24', '72', '168'].includes(String(settings.manualCheckEveryHours)) && <MenuItem value={String(settings.manualCheckEveryHours)}>every {settings.manualCheckEveryHours} h</MenuItem>}
              </Select>
            </FormControl>
            <Button variant="outlined" color="inherit" size="small" disabled={mark.isPending}
              onClick={() => mark.mutate('manual_companies_checked', { onSuccess: () => notify({ message: 'Noted: manual companies checked' }) })}>I checked them</Button>
            <FormControlLabel sx={{ ml: 1 }} control={<Switch size="small" checked={hideManual} onChange={(e) => {
              setHideManual(e.target.checked); writeStore('jw.hideManualCompanies', e.target.checked); window.dispatchEvent(new Event('jw-settings'));
            }} />} label="I rely on the email job alerts (hide the check buttons)" slotProps={{ typography: { variant: 'body2' } }} />
          </Stack>
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>Couldn't load companies: {(error as Error).message}</Alert>}
      {isLoading ? <TableSkeleton /> : !companies?.length ? (
        <EmptyState title="No companies">Add rows to targets/companies.csv, then click Sync.</EmptyState>
      ) : (
        <Box sx={{ height: 'calc(100vh - 300px)', minHeight: 400 }}>
          <DataGrid rows={companies} columns={cols} getRowId={(r) => r.name} rowHeight={48} disableRowSelectionOnClick disableColumnFilter
            initialState={{ sorting: { sortModel: [{ field: 'priority', sort: 'asc' }] }, pagination: { paginationModel: { pageSize: 50 } } }}
            pageSizeOptions={[25, 50, 100]} aria-label="Companies" />
        </Box>
      )}
    </Box>
  );
}
