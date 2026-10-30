import { useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAutoReload } from '../api/autoReload';
import {
  AppBar, Badge, Box, CircularProgress, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Tooltip, Typography, Button, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import WorkOutline from '@mui/icons-material/WorkOutline';
import AssignmentTurnedInOutlined from '@mui/icons-material/AssignmentTurnedInOutlined';
import ApartmentOutlined from '@mui/icons-material/ApartmentOutlined';
import MenuOpen from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';
import Sync from '@mui/icons-material/Sync';
import RadarOutlined from '@mui/icons-material/RadarOutlined';
import AutoAwesomeMotionOutlined from '@mui/icons-material/AutoAwesomeMotionOutlined';
import { RunPill } from './Runs';
import { PcIndicator, PcStatusLine } from './PcQueue';
import { findRequest, isActiveRequest, requestStatus, usePcQueue } from '../api/pcQueue';
import { useNotify } from './Notify';
import { useMeta, useStats, useSync } from '../api/hooks';
import { relTime } from '../lib/time';
import { readStore, writeStore } from '../lib/storage';

const WIDE = 228;
const NARROW = 64;

/** Sync runs on the PC (git pull + import + push): the click queues it; `request` is its status for an inline line. */
export function useSyncWithNotice() {
  const sync = useSync();
  const notify = useNotify();
  const { data } = usePcQueue();
  const request = findRequest(data?.requests, 'sync', null, {});
  const run = () => sync.mutateAsync().catch((e: Error) => { notify({ severity: 'error', message: `Couldn't queue Sync: ${e.message}` }); throw e; });
  return { run, pending: sync.isPending || Boolean(request && isActiveRequest(request)), request };
}

export function Layout({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const small = useMediaQuery('(max-width:1359.95px)'); // narrow laptops: icon-only menu, more room for tables
  const [open, setOpen] = useState(() => readStore('jw.drawerOpen', true));
  const expanded = open && !small;
  const width = expanded ? WIDE : NARROW;
  const { data: meta } = useMeta();
  useAutoReload();
  const { data: stats } = useStats();
  const sync = useSyncWithNotice();
  const { data: queue } = usePcQueue();
  const location = useLocation();

  const nav = [
    { to: '/', label: 'Home', icon: <DashboardOutlined />, badge: 0 },
    { to: '/jobs', label: 'Jobs', icon: <WorkOutline />, badge: stats ? stats.kpis.awaiting : 0 },
    { to: '/applications', label: 'Applications', icon: <AssignmentTurnedInOutlined />, badge: stats ? stats.kpis.referral : 0 },
    { to: '/companies', label: 'Companies', icon: <ApartmentOutlined />, badge: 0 },
    { to: '/runs', label: 'Claude runs', icon: <AutoAwesomeMotionOutlined />, badge: 0 },
  ];

  const lastRun = meta?.health.lastRunAt;
  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - var(--ws-h))' }}>
      {/* Sits under the shared workspace bar (WorkspaceBar.astro), which does the app switching. */}
      <AppBar position="fixed" elevation={0} sx={{ top: 'var(--ws-h)', zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 1.5 }}>
          <Tooltip title={expanded ? 'Collapse menu' : 'Expand menu'}>
            <span>
              <IconButton edge="start" aria-label={expanded ? 'Collapse menu' : 'Expand menu'} disabled={small}
                onClick={() => setOpen((o: boolean) => { writeStore('jw.drawerOpen', !o); return !o; })}>
                {expanded ? <MenuOpen /> : <MenuIcon />}
              </IconButton>
            </span>
          </Tooltip>
          <RadarOutlined color="primary" />
          <Typography variant="h6" component="h1" sx={{ fontSize: 18 }}>Job dashboard</Typography>
          <Box sx={{ flex: 1 }} />
          <RunPill />
          <Tooltip title={lastRun ? `Last watcher run: ${new Date(lastRun).toLocaleString()}` : 'No watcher run found yet'}>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }} data-testid="last-run">
              Watcher ran {relTime(lastRun)}
            </Typography>
          </Tooltip>
          <PcIndicator />
          {sync.request && <PcStatusLine request={sync.request} sx={{ mt: 0, maxWidth: 300, display: { xs: 'none', lg: 'flex' } }} />}
          <Tooltip title={sync.request ? requestStatus(sync.request, { heartbeats: queue?.heartbeats }).text : 'Git pull, import new jobs and push, on your PC'}>
            <span>
              <Button variant="outlined" size="small" onClick={() => { sync.run().catch(() => undefined); }} disabled={sync.pending}
                startIcon={sync.pending ? <CircularProgress size={16} /> : <Sync />} aria-label="Sync" data-testid="sync-button">
                {sync.pending ? (sync.request?.status === 'queued' ? 'Sync queued' : 'Syncing on PC…') : 'Sync'}
              </Button>
            </span>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" sx={{
        width, flexShrink: 0, transition: 'width 150ms',
        '& .MuiDrawer-paper': { width, top: 'var(--ws-h)', height: 'calc(100% - var(--ws-h))', boxSizing: 'border-box', overflowX: 'hidden', transition: 'width 150ms', borderRight: `1px solid ${theme.palette.divider}` },
      }}>
        <Toolbar />
        <List component="nav" aria-label="Main" sx={{ px: 1, py: 1.5 }}>
          {nav.map((n) => {
            const active = n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to);
            const icon = <Badge color="primary" badgeContent={expanded ? 0 : n.badge} max={99}>{n.icon}</Badge>;
            return (
              <Tooltip key={n.to} title={expanded ? '' : n.label} placement="right">
                <ListItemButton component={NavLink} to={n.to} selected={active} aria-current={active ? 'page' : undefined}
                  sx={{ borderRadius: 2, mb: 0.5, minHeight: 44, px: 1.5 }}>
                  <ListItemIcon sx={{ minWidth: 40, color: active ? 'primary.main' : undefined }}>{icon}</ListItemIcon>
                  {expanded && <ListItemText primary={n.label} slotProps={{ primary: { fontWeight: active ? 650 : 500 } }} />}
                  {expanded && n.badge > 0 && <Badge color="primary" badgeContent={n.badge} max={999} sx={{ mr: 1.5 }} />}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>
        <Divider sx={{ mx: 2 }} />
        {expanded && (
          <Typography variant="caption" color="text.secondary" sx={{ p: 2, display: 'block' }}>
            Private · behind your Google login
          </Typography>
        )}
      </Drawer>

      <Box component="main" sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Toolbar />
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, minWidth: 0 }}>{children}</Box>
      </Box>
    </Box>
  );
}
