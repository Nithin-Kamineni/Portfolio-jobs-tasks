// Inline status for work queued for the PC (no dialogs): the line under a button, the header's "PC" chip, the watcher that
// refreshes the page when a request finishes, and the Runs page's list of website requests.
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Box, Chip, CircularProgress, Link, List, ListItem, ListItemText, Stack, Tooltip, Typography } from '@mui/material';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import ComputerOutlined from '@mui/icons-material/ComputerOutlined';
import { isActiveRequest, pcName, pcOnline, queueApi, queueKey, requestStatus, usePcQueue, type RunRequest } from '../api/pcQueue';
import { runKeys } from '../api/runs';
import { useInvalidateAll } from '../api/hooks';
import { useRunsOptional } from './Runs';
import { relTime } from '../lib/time';

function useTick(ms: number, on: boolean) {
  const [, set] = useState(0);
  useEffect(() => { if (!on) return; const t = setInterval(() => set((n) => n + 1), ms); return () => clearInterval(t); }, [ms, on]);
}

/** One status line for a queued request, shown where its button is. */
export function PcStatusLine({ request, sx }: { request: RunRequest | null | undefined; sx?: object }) {
  const { data } = usePcQueue();
  const runs = useRunsOptional();
  const qc = useQueryClient();
  const [cancelling, setCancelling] = useState(false);
  useTick(15_000, Boolean(request && isActiveRequest(request)));
  if (!request) return null;
  const r = data?.requests.find((x) => x.id === request.id) || request;
  const run = r.local_run_id != null ? runs?.runs.find((x) => x.id === r.local_run_id) : null;
  const s = requestStatus(r, { heartbeats: data?.heartbeats, run });
  const icon = s.active
    ? (r.status === 'queued' ? <ScheduleOutlined fontSize="inherit" color={s.severity === 'warning' ? 'warning' : 'action'} /> : <CircularProgress size={12} aria-hidden />)
    : s.severity === 'success' ? <CheckCircleOutline fontSize="inherit" color="success" /> : s.severity === 'error' ? <ErrorOutline fontSize="inherit" color="error" /> : null;
  const canCancel = r.status === 'queued' || (r.status === 'started' && r.kind === 'run' && r.local_run_id != null);
  const cancel = async () => {
    setCancelling(true);
    try { await queueApi.cancel(r.id); } catch { /* the line shows the state either way */ } finally { setCancelling(false); void qc.invalidateQueries({ queryKey: queueKey }); }
  };
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" role="status" aria-live="polite" data-testid="pc-status" data-status={r.status}
      sx={{ mt: 0.5, fontSize: 13, color: s.severity === 'error' ? 'error.main' : s.severity === 'success' ? 'success.main' : s.severity === 'warning' ? 'warning.main' : 'text.secondary', minWidth: 0, ...sx }}>
      {icon}
      <Typography component="span" variant="caption" sx={{ color: 'inherit', overflowWrap: 'anywhere' }}>{s.text}</Typography>
      {canCancel && (
        <Link component="button" variant="caption" onClick={cancel} disabled={cancelling} sx={{ whiteSpace: 'nowrap' }}>
          {r.status === 'queued' ? 'Cancel' : 'Stop'}
        </Link>
      )}
    </Stack>
  );
}

/** Header chips, one per PC (home, work): is its dashboard on (it checks the queue every ~20 s)? */
export function PcIndicator() {
  const { data } = usePcQueue();
  useTick(30_000, true);
  if (!data) return null;
  if (!data.heartbeats.length) {
    return (
      <Tooltip title="No PC dashboard has checked in yet. Buttons that need a PC still queue; they run when one is on.">
        <Chip size="small" variant="outlined" icon={<ComputerOutlined />} label="PC not connected" data-testid="pc-indicator" data-online="0" />
      </Tooltip>
    );
  }
  return (
    <Stack direction="row" spacing={0.5} data-testid="pc-indicator" data-online={data.online ? '1' : '0'}>
      {data.heartbeats.map((hb) => {
        const on = pcOnline(hb);
        const label = !on ? `${hb.name} offline · ${relTime(hb.at)}` : hb.busy ? `${hb.name} busy${hb.current_run ? ` · run #${hb.current_run}` : ''}` : `${hb.name} online`;
        const tip = on ? `${hb.name}'s dashboard checked in ${relTime(hb.at)}. Claude runs, Sync and fetching run on whichever PC is on.`
          : `${hb.name}: last check-in ${new Date(hb.at).toLocaleString()}. Requests still queue; an online PC runs them.`;
        return (
          <Tooltip key={hb.machine} title={tip}>
            <Chip size="small" variant="outlined" icon={<ComputerOutlined />} label={label} color={on ? 'success' : 'default'} data-machine={hb.machine} data-online={on ? '1' : '0'} />
          </Tooltip>
        );
      })}
    </Stack>
  );
}

/** Refreshes the page's data when a request finishes (ranked jobs, a fetched description, paper e-mails). */
export function useQueueWatcher() {
  const { data } = usePcQueue();
  const qc = useQueryClient();
  const invalidateAll = useInvalidateAll();
  const prev = useRef(new Map<number, string>());
  useEffect(() => {
    if (!data) return;
    let finished = false; let started = false;
    for (const r of data.requests) {
      const before = prev.current.get(r.id);
      if (before && before !== r.status) {
        if (!isActiveRequest(r)) finished = true;
        if (r.status === 'started') started = true;
      }
      prev.current.set(r.id, r.status);
    }
    if (started || finished) void qc.invalidateQueries({ queryKey: runKeys.list });
    if (finished) {
      void invalidateAll();
      void qc.invalidateQueries({ queryKey: ['paper-emails'] });
    }
  }, [data, qc, invalidateAll]);
}

const KIND_LABEL: Record<RunRequest['kind'], string> = {
  run: 'Claude run', sync: 'Sync', 'fetch-description': 'Fetch description', 'paper-emails': 'Find R&D emails', 'cancel-run': 'Stop run',
};

/** The Runs page: what the website asked the PC to do. */
export function RequestList() {
  const { data } = usePcQueue();
  const list = (data?.requests || []).slice(0, 12);
  return (
    <Box data-testid="request-list">
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
        <Typography variant="overline" color="text.secondary" sx={{ flex: 1 }}>Asked from the website</Typography>
        <PcIndicator />
      </Stack>
      {!list.length ? (
        <Typography variant="body2" color="text.secondary">Nothing yet. Buttons like Process new jobs, Sync and Fetch description queue here; your PC runs them.</Typography>
      ) : (
        <List dense disablePadding>
          {list.map((r) => (
            <ListItem key={r.id} disableGutters divider sx={{ display: 'block' }}>
              <ListItemText primary={`${KIND_LABEL[r.kind]}${r.task ? `: ${r.task}` : ''}${r.params.company ? ` (${String(r.params.company)})` : ''}`}
                secondary={`#${r.id} · asked ${relTime(r.requested_at)}${r.claimed_by ? ` · ${pcName(data?.heartbeats, r.claimed_by)}` : ''}`} slotProps={{ primary: { variant: 'body2', fontWeight: 600 } }} />
              <PcStatusLine request={r} sx={{ mt: 0 }} />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
