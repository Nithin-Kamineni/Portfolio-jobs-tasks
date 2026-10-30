import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Alert, Box, Button, Chip, FormControl, InputAdornment, InputLabel, MenuItem, Select, Stack, TextField, Tooltip, Typography, useMediaQuery,
} from '@mui/material';
import {
  DataGrid, gridFilteredSortedRowIdsSelector, useGridApiRef,
  type GridColDef, type GridColumnVisibilityModel, type GridPaginationModel, type GridRowSelectionModel, type GridSortModel,
} from '@mui/x-data-grid';
import Search from '@mui/icons-material/Search';
import { useBulkStatus, useJobs, useUndo } from '../api/hooks';
import { useNotify } from '../components/Notify';
import { JobDrawer, DRAWER_WIDTH } from '../components/JobDrawer';
import { EmptyState, PageHeader, TableSkeleton } from '../components/common';
import { useClaudeSteps } from '../components/ClaudeSteps';
import { useSyncWithNotice } from '../components/Layout';
import { ClaudeTouchedChip, RunButton } from '../components/Runs';
import { FLAG_HELP, FLAG_SHORT, fitColor, fitInfo, priorityColor, STAGE_INFO, statusColor, statusLabel } from '../lib/format';
import { shortDate } from '../lib/time';
import { readStore, writeStore } from '../lib/storage';
import type { JobStatus } from '../../../shared/statuses';
import type { Job } from '../../../shared/types';
import { ALL_TAGS } from '../../../../watcher/lib/tags.js';

const DEFAULT_STATUS = 'new,ranked';
const FILTER_KEYS = ['status', 'prio', 'tag', 'q'] as const;

const QUICK: { key: string; label: string; statuses: JobStatus[] | null }[] = [
  { key: 'new,ranked', label: 'To decide', statuses: ['new', 'ranked'] },
  { key: 'new', label: 'New', statuses: ['new'] },
  { key: 'ranked', label: 'Ranked', statuses: ['ranked'] },
  { key: 'apply_referral', label: 'Referral', statuses: ['apply_referral'] },
  { key: 'applied,interview', label: 'Applied', statuses: ['applied', 'interview'] },
  { key: 'later', label: 'Later', statuses: ['later'] },
  { key: 'skip', label: 'Skipped', statuses: ['skip'] },
  { key: 'all', label: 'All', statuses: null },
];

function columns(): GridColDef<Job>[] {
  return [
    {
      field: 'company_priority', headerName: 'Pri.', display: 'flex', width: 64, align: 'center', headerAlign: 'center',
      renderCell: ({ value }) => value ? <Chip size="small" label={value} color={priorityColor(String(value))} sx={{ minWidth: 28 }} /> : null,
    },
    { field: 'company', headerName: 'Company', flex: 0.9, minWidth: 120, valueGetter: (v: string) => v.replace(/\s*\(.*$/, '') || v },
    {
      field: 'title', headerName: 'Role', display: 'flex', flex: 1.7, minWidth: 220,
      renderCell: ({ value, row }) => (
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ overflow: 'hidden', minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 550, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={String(value)}>{value}</Typography>
          {row.previous_posting_id && <Tooltip title="Re-posted: an earlier posting of this role exists (see the details)"><Chip size="small" variant="outlined" label="re-post" data-testid="repost-chip" sx={{ height: 20, fontSize: 11 }} /></Tooltip>}
          <ClaudeTouchedChip at={row.claude_at} />
        </Stack>
      ),
    },
    {
      field: 'fit', headerName: 'Fit', display: 'flex', width: 92, type: 'number', align: 'center', headerAlign: 'center',
      valueGetter: (_v, row) => fitInfo(row).sortKey,
      renderCell: ({ row }) => {
        const f = fitInfo(row);
        return (
          <Tooltip title={f.ranked ? `${row.fit_reason || 'Claude fit score'}${row.rank_stage ? ` (${STAGE_INFO[row.rank_stage]?.help})` : ''}` : 'Watcher keyword score (not ranked by Claude yet)'}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Chip size="small" label={f.value ?? '–'} color={fitColor(f.value, f.ranked)} variant={f.ranked ? 'filled' : 'outlined'} sx={{ minWidth: 38, opacity: f.ranked ? 1 : 0.8 }} />
              {f.ranked && row.rank_stage && <Typography component="span" variant="caption" color="text.secondary" data-testid="rank-stage" aria-label={STAGE_INFO[row.rank_stage]?.help}>{STAGE_INFO[row.rank_stage]?.mark}</Typography>}
            </Stack>
          </Tooltip>
        );
      },
    },
    {
      field: 'tags', headerName: 'Tags', display: 'flex', flex: 1.1, minWidth: 150, sortComparator: (a: string[], b: string[]) => a.length - b.length,
      renderCell: ({ value }) => {
        const tags = (value as string[]) || [];
        return (
          <Stack direction="row" spacing={0.5} sx={{ overflow: 'hidden', height: '100%', alignItems: 'center' }} title={tags.join(', ')}>
            {tags.slice(0, 3).map((t) => <Chip key={t} size="small" variant="outlined" label={t} />)}
            {tags.length > 3 && <Chip size="small" label={`+${tags.length - 3}`} />}
          </Stack>
        );
      },
    },
    {
      field: 'flags', headerName: 'Flags', display: 'flex', width: 96, sortComparator: (a: string[], b: string[]) => a.length - b.length,
      renderCell: ({ value }) => {
        const flags = (value as string[]) || [];
        if (!flags.length) return null;
        return (
          <Tooltip title={flags.map((f) => `${f}: ${FLAG_HELP[f] || ''}`).join('\n')}>
            <Chip size="small" color="warning" label={flags.length === 1 ? FLAG_SHORT[flags[0]] || flags[0] : `${flags.length} flags`} aria-label={flags.join(', ')} />
          </Tooltip>
        );
      },
    },
    { field: 'location', headerName: 'Location', flex: 0.8, minWidth: 110 },
    { field: 'posted_date', headerName: 'Posted', width: 96, valueFormatter: (v: string) => shortDate(v) },
    { field: 'first_seen', headerName: 'First seen', width: 100, valueFormatter: (v: string) => shortDate(v) },
    { field: 'source', headerName: 'Source', width: 110 },
    {
      field: 'status', headerName: 'Status', display: 'flex', width: 132,
      renderCell: ({ value }) => <Chip size="small" label={statusLabel(String(value))} color={statusColor(String(value))} variant={value === 'new' ? 'outlined' : 'filled'} />,
    },
  ];
}

export default function JobsPage() {
  const [params, setParams] = useSearchParams();
  const { data: jobs, isLoading, error } = useJobs();
  const bulk = useBulkStatus();
  const undo = useUndo();
  const notify = useNotify();
  const sync = useSyncWithNotice();
  const claude = useClaudeSteps();
  const apiRef = useGridApiRef();
  const wide = useMediaQuery('(min-width:1600px)');

  // First visit without filters in the URL: restore the last filters (or the default).
  useEffect(() => {
    if (FILTER_KEYS.some((k) => params.has(k))) return;
    const saved = readStore<Record<string, string>>('jw.jobs.filters', { status: DEFAULT_STATUS });
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(saved)) if (v) next.set(k, v);
    if (!next.has('status')) next.set('status', DEFAULT_STATUS);
    setParams(next, { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const status = params.get('status') || DEFAULT_STATUS;
  const prio = params.get('prio') || '';
  const tag = params.get('tag') || '';
  const q = params.get('q') || '';
  const selected = params.get('job');

  useEffect(() => { writeStore('jw.jobs.filters', { status, prio, tag, q }); }, [status, prio, tag, q]);

  const update = useCallback((changes: Record<string, string | null>, replace = false) => {
    // Start from the live URL: React Router's functional form sees the params of the render that created this closure,
    // so a debounced search could restore a filter that was cleared in between.
    setParams(() => {
      const next = new URLSearchParams(window.location.search);
      for (const [k, v] of Object.entries(changes)) { if (v) next.set(k, v); else next.delete(k); }
      return next;
    }, { replace });
  }, [setParams]);

  const [search, setSearch] = useState(q);
  useEffect(() => { setSearch(q); }, [q]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const quick = QUICK.find((x) => x.key === status);
  const statusSet = useMemo(() => (status === 'all' ? null : new Set(status.split(','))), [status]);
  const rows = useMemo(() => (jobs || []).filter((j) => {
    if (statusSet && !statusSet.has(j.status)) return false;
    if (prio && j.company_priority !== prio) return false;
    if (tag && !j.tags.includes(tag)) return false;
    if (q) {
      const s = q.toLowerCase();
      if (![j.title, j.company, j.location, j.notes || ''].some((x) => x.toLowerCase().includes(s))) return false;
    }
    return true;
  }), [jobs, statusSet, prio, tag, q]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const j of jobs || []) c[j.status] = (c[j.status] || 0) + 1;
    return c;
  }, [jobs]);
  const countFor = (statuses: JobStatus[] | null) => (statuses ? statuses.reduce((a, s) => a + (counts[s] || 0), 0) : (jobs || []).length);

  const cols = useMemo(() => columns(), []);
  const [visibility, setVisibility] = useState<GridColumnVisibilityModel>(() => readStore('jw.jobs.columns', { source: false, first_seen: false }));
  const [sortModel, setSortModel] = useState<GridSortModel>(() => readStore('jw.jobs.sort', [{ field: 'fit', sort: 'desc' }]));
  const [pagination, setPagination] = useState<GridPaginationModel>({ page: 0, pageSize: 50 });
  const [selection, setSelection] = useState<GridRowSelectionModel>([]);

  // Visible order (after the grid's sort) for J/K and auto-advance.
  const [order, setOrder] = useState<string[]>([]);
  const refreshOrder = useCallback(() => {
    if (!apiRef.current?.state) { setOrder(rows.map((r) => r.id)); return; }
    try { setOrder(gridFilteredSortedRowIdsSelector(apiRef).map(String)); } catch { setOrder(rows.map((r) => r.id)); }
  }, [apiRef, rows]);
  useEffect(() => { const t = setTimeout(refreshOrder, 0); return () => clearTimeout(t); }, [rows, sortModel, refreshOrder]);

  // The drawer may be showing a job that is no longer in the filtered list (just decided); keep its place.
  const lastIndex = useRef(0);
  const idx = selected ? order.indexOf(selected) : -1;
  if (idx >= 0) lastIndex.current = idx;
  const prevId = idx >= 0 ? order[idx - 1] : order[Math.min(lastIndex.current, order.length) - 1];
  const nextId = idx >= 0 ? order[idx + 1] : order[Math.min(lastIndex.current, order.length - 1)];

  // Keep the selected row on the visible page and scrolled into view.
  useEffect(() => {
    if (idx < 0) return;
    const page = Math.floor(idx / pagination.pageSize);
    if (page !== pagination.page) setPagination((p) => ({ ...p, page }));
    const t = setTimeout(() => { try { apiRef.current?.scrollToIndexes({ rowIndex: idx % pagination.pageSize }); } catch { /* not mounted */ } }, 30);
    return () => clearTimeout(t);
  }, [idx, pagination.pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  const select = useCallback((id: string | null) => update({ job: id }), [update]);

  const doBulk = (to: 'skip' | 'later') => {
    const ids = selection.map(String);
    bulk.mutate({ ids, status: to }, {
      onSuccess: (r) => {
        setSelection([]);
        notify({
          message: `${statusLabel(to)}: ${r.updated.length} job${r.updated.length === 1 ? '' : 's'}${r.errors.length ? ` (${r.errors.length} not possible)` : ''}`,
          action: r.eventIds.length ? { label: 'Undo', onClick: () => undo.mutate(r.eventIds) } : undefined,
        });
      },
      onError: (e) => notify({ severity: 'error', message: (e as Error).message }),
    });
  };

  const filtered = Boolean(prio || tag || q);
  return (
    <Box sx={{ mr: selected && wide ? `calc(${DRAWER_WIDTH} - 24px)` : 0, transition: 'margin 150ms' }}>
      <PageHeader
        title="Jobs"
        subtitle="Decide each new job: Apply with referral (R), Apply direct (D: marks it Applied), Later (L) or Skip (S). Click a row for details."
        actions={<>
          <RunButton task="process-new-jobs" variant="outlined" disabledReason={claude.facts && claude.facts.newCount === 0 && !(claude.facts.manualDue ?? []).length ? 'No new jobs to rank' : undefined}>Process new jobs</RunButton>
        </>}
      />

      <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap', rowGap: 1 }} role="group" aria-label="Status filter">
        {QUICK.map((x) => {
          const active = x.key === status;
          return (
            <Chip key={x.key} label={`${x.label} ${countFor(x.statuses)}`} color={active ? 'primary' : 'default'} variant={active ? 'filled' : 'outlined'}
              onClick={() => update({ status: x.key, job: null })} aria-pressed={active} />
          );
        })}
        {!quick && <Chip label={`Status: ${status.split(',').map(statusLabel).join(', ')}`} color="primary" onDelete={() => update({ status: DEFAULT_STATUS })} />}
      </Stack>

      <Stack direction="row" spacing={1.5} sx={{ mb: 1.5, flexWrap: 'wrap', rowGap: 1.5 }} alignItems="center">
        <TextField size="small" placeholder="Search role, company, location, notes" value={search} sx={{ minWidth: 300, flex: '0 1 380px' }}
          onChange={(e) => {
            const v = e.target.value; setSearch(v);
            if (searchTimer.current) clearTimeout(searchTimer.current);
            searchTimer.current = setTimeout(() => update({ q: v || null }, true), 250);
          }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }, htmlInput: { 'aria-label': 'Search jobs' } }} />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="prio-label">Priority</InputLabel>
          <Select labelId="prio-label" label="Priority" value={prio} onChange={(e) => update({ prio: e.target.value || null })}>
            <MenuItem value="">All</MenuItem>
            {['A', 'B', 'C'].map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="tag-label">Tag</InputLabel>
          <Select labelId="tag-label" label="Tag" value={tag} onChange={(e) => update({ tag: e.target.value || null })}>
            <MenuItem value="">All</MenuItem>
            {ALL_TAGS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </Select>
        </FormControl>
        {filtered && <Button size="small" onClick={() => update({ prio: null, tag: null, q: null })}>Clear filters</Button>}
        <Box sx={{ flex: 1 }} />
        {selection.length > 0 && (
          <Stack direction="row" spacing={1} alignItems="center" role="group" aria-label="Bulk actions">
            <Typography variant="body2" color="text.secondary">{selection.length} selected</Typography>
            <Button size="small" variant="outlined" onClick={() => doBulk('later')} disabled={bulk.isPending}>Later</Button>
            <Button size="small" variant="outlined" color="error" onClick={() => doBulk('skip')} disabled={bulk.isPending}>Skip</Button>
            <Button size="small" onClick={() => setSelection([])}>Clear</Button>
          </Stack>
        )}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Couldn't load jobs: {(error as Error).message}</Alert>}
      {isLoading ? <TableSkeleton /> : !error && (
        rows.length === 0 ? (
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
            {filtered || status !== DEFAULT_STATUS
              ? <EmptyState title="No jobs match these filters" action={<Button onClick={() => update({ status: 'all', prio: null, tag: null, q: null })}>Show all jobs</Button>} />
              : <EmptyState title="Nothing to decide: you're all caught up" action={<Button variant="outlined" onClick={() => { sync.run().catch(() => undefined); }}>Sync now</Button>}>
                  New jobs arrive twice a day from the watcher. Click Sync to check.
                </EmptyState>}
          </Box>
        ) : (
          <Box sx={{ height: 'calc(100vh - 300px)', minHeight: 420 }}>
            <DataGrid
              apiRef={apiRef}
              rows={rows}
              columns={cols}
              getRowId={(r) => r.id}
              rowHeight={48}
              checkboxSelection
              disableRowSelectionOnClick
              rowSelectionModel={selection}
              onRowSelectionModelChange={setSelection}
              onRowClick={(p) => select(String(p.id))}
              getRowClassName={(p) => (p.id === selected ? 'jw-active' : '')}
              sortModel={sortModel}
              onSortModelChange={(m) => { setSortModel(m); writeStore('jw.jobs.sort', m); }}
              columnVisibilityModel={visibility}
              onColumnVisibilityModelChange={(m) => { setVisibility(m); writeStore('jw.jobs.columns', m); }}
              paginationModel={pagination}
              onPaginationModelChange={setPagination}
              pageSizeOptions={[25, 50, 100]}
              disableColumnFilter
              sx={{ '& .jw-active': { bgcolor: 'action.selected' } }}
              localeText={{ noRowsLabel: 'No jobs' }}
              aria-label="Jobs"
            />
          </Box>
        )
      )}

      <JobDrawer
        jobId={selected}
        onClose={() => select(null)}
        onSelect={select}
        prevId={prevId}
        nextId={nextId}
      />
    </Box>
  );
}

