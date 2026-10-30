import { useMemo } from 'react';
import { Alert, Box, Card, CardContent, Chip, FormControlLabel, Stack, Switch, Tooltip, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { PageHeader } from '../components/common';
import { fmtDuration, fmtTokens, fmtUsd, RunButton, runDurationMs, RUN_STATUS_LABEL, runStatusColor, totalTokens, useRuns } from '../components/Runs';
import { RequestList } from '../components/PcQueue';
import { useFacts, useSettings, useUpdateSettings } from '../api/hooks';
import { progressText } from '../runs/taskInfo';
import { weekStart } from '../claudeSteps';
import type { Run } from '../../../../../dashboard/shared/types';

/** Runs since Monday: count, tokens and the API-equivalent estimate (plan §3.7 rule 7). */
export function weekTotals(runs: Run[], now = new Date()) {
  const since = weekStart(now).getTime();
  const week = runs.filter((r) => new Date(r.created_at).getTime() >= since);
  return {
    runs: week.length,
    tokens: week.reduce((a, r) => a + totalTokens(r), 0),
    usd: week.reduce((a, r) => a + (r.usage_usd || 0), 0),
  };
}

export default function RunsPage() {
  const { runs, openPanel, paused, resumeQueue } = useRuns();
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const minFit = useFacts().data?.finalMinFit ?? 30;
  const totals = useMemo(() => weekTotals(runs), [runs]);

  const cols: GridColDef<Run>[] = [
    { field: 'label', headerName: 'Task', flex: 0.9, minWidth: 170, valueGetter: (_v, r) => `${r.label}${r.params.company ? `: ${String(r.params.company)}` : ''}` },
    { field: 'started_at', headerName: 'Started', width: 170, valueFormatter: (v: string | null) => (v ? new Date(v).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'waiting') },
    { field: 'duration', headerName: 'Duration', width: 110, valueGetter: (_v, r) => runDurationMs(r) ?? -1, valueFormatter: (v: number) => (v >= 0 ? fmtDuration(v) : '') },
    {
      field: 'status', headerName: 'Status', width: 120, display: 'flex',
      renderCell: ({ row }) => <Chip size="small" label={RUN_STATUS_LABEL[row.status]} color={runStatusColor(row.status)} />,
    },
    {
      field: 'summary', headerName: 'Summary', flex: 1.6, minWidth: 240, sortable: false,
      valueGetter: (_v, r) => (r.error && r.status !== 'succeeded' ? r.error
        : (r.summary || '').split(/\r?\n/).map((l) => l.trim()).find((l) => l && !l.startsWith('#') && !l.startsWith('|'))?.replace(/\*\*/g, '') || progressText(r)),
    },
    { field: 'turns', headerName: 'Turns', width: 80, type: 'number', valueGetter: (_v, r) => r.num_turns },
    {
      field: 'usage', headerName: 'Usage', width: 150, valueGetter: (_v, r) => r.usage_usd ?? 0,
      renderCell: ({ row }) => (row.usage_usd != null || totalTokens(row) ? <span title="API-equivalent estimate; billed to your plan">{[fmtUsd(row.usage_usd), totalTokens(row) ? `${fmtTokens(totalTokens(row))} tok` : ''].filter(Boolean).join(' · ')}</span> : ''),
    },
  ];

  return (
    <Box>
      <PageHeader title="Claude runs" subtitle="Claude runs on your PC (started here or in the PC's dashboard), newest first; they show here as they progress. Click a row for its steps and summary."
        actions={<Tooltip title={`Opus re-reads ranked jobs with fit ≥ ${minFit} that were never checked (e.g. ranked before v2) and confirms or corrects the score`}>
          <span><RunButton task="process-new-jobs" params={{ recheck: true }} variant="outlined">Re-check the best jobs</RunButton></span>
        </Tooltip>} />
      {paused && <Alert severity="warning" sx={{ mb: 2 }}>{paused.reason}: the queue resumes by itself at {new Date(paused.until).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}. <Box component="button" onClick={resumeQueue} sx={{ ml: 1, font: 'inherit', color: 'inherit', textDecoration: 'underline', background: 'none', border: 0, cursor: 'pointer', p: 0 }}>Resume now</Box></Alert>}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Card sx={{ flex: 1 }}><CardContent>
          <Typography variant="overline" color="text.secondary">This week</Typography>
          <Typography variant="h6" component="p" data-testid="week-totals">{totals.runs} run{totals.runs === 1 ? '' : 's'} · {fmtTokens(totals.tokens)} tokens · {fmtUsd(totals.usd) || '$0.00'}</Typography>
          <Typography variant="caption" color="text.secondary">The $ is the API-equivalent estimate; runs are billed to your Claude plan, so it shows how much of the plan they used.</Typography>
        </CardContent></Card>
        <Card sx={{ flex: 1 }}><CardContent>
          <RequestList />
          <Stack>
            <FormControlLabel control={<Switch size="small" checked={settings?.autoCommit ?? true} disabled={!settings || updateSettings.isPending}
              onChange={(e) => updateSettings.mutate({ autoCommit: e.target.checked })} />}
              label="Commit and push automatically (tracker.csv, applications/ after runs and Sync)" slotProps={{ typography: { variant: 'body2' } }} />
          </Stack>
        </CardContent></Card>
      </Stack>
      <Box sx={{ height: 'calc(100vh - 360px)', minHeight: 360 }}>
        <DataGrid rows={runs} columns={cols} rowHeight={48} disableRowSelectionOnClick disableColumnFilter onRowClick={(p) => openPanel(Number(p.id))}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} pageSizeOptions={[25, 50]} localeText={{ noRowsLabel: 'No Claude runs yet' }} aria-label="Claude runs" />
      </Box>
    </Box>
  );
}
