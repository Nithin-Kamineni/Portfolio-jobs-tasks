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
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import RadarOutlined from '@mui/icons-material/RadarOutlined';
import AutoAwesomeMotionOutlined from '@mui/icons-material/AutoAwesomeMotionOutlined';
import { RunPill } from './Runs';
import { useColorMode } from './ColorMode';
import { useNotify } from './Notify';
import { useMeta, useStats, useSync } from '../api/hooks';
import { relTime } from '../lib/time';
import { readStore, writeStore } from '../lib/storage';
import type { AppMeta } from '../../../shared/types';

const WIDE = 228;
const NARROW = 64;

export function useSyncWithNotice() {
  const sync = useSync();
  const notify = useNotify();
  const run = () => sync.mutateAsync().then((r) => {
    if (r.warning) notify({ severity: 'warning', message: r.warning, duration: 12000 });
    else notify({ message: `${r.importedJobs ? `Imported ${r.importedJobs} new job${r.importedJobs === 1 ? '' : 's'}` : 'Up to date: no new jobs'}${r.pushed ? ' · pushed to GitHub' : ''}` });
    if (r.exportWarning) setTimeout(() => notify({ severity: 'warning', message: r.exportWarning!, duration: 10000 }), 400);
    return r;
  }).catch((e: Error) => { notify({ severity: 'error', message: `Sync failed: ${e.message}` }); throw e; });
  return { run, pending: sync.isPending };
}

type CloudSyncInfo = NonNullable<AppMeta['cloudSync']>;

/** "Cloud synced 1 min ago" next to "Watcher ran …": the two-way sync with the website (server/cloudSync.ts). */
function CloudStatus({ cloud }: { cloud: CloudSyncInfo }) {
  const failed = cloud.lastOk === false;
  const text = cloud.running ? 'Cloud syncing…'
    : failed ? 'Cloud sync failed'
    : cloud.lastSuccessAt ? `Cloud synced ${relTime(cloud.lastSuccessAt)}` : 'Cloud not synced yet';
  const changes = cloud.lastChanges != null && !failed ? ` (${cloud.lastChanges} change${cloud.lastChanges === 1 ? '' : 's'})` : '';
  const tip = [
    failed && cloud.lastAt ? `Last try ${new Date(cloud.lastAt).toLocaleString()}: ${cloud.lastError}` : null,
    cloud.lastSuccessAt ? `Last successful sync with the website: ${new Date(cloud.lastSuccessAt).toLocaleString()}${changes}` : null,
    cloud.enabled ? 'Syncs every few minutes and ~20 s after a change; a failure retries on the next tick.'
      : 'The automatic sync is off (dashboard/config.json → cloudSync.enabled). By hand: node dashboard/cli cloud-sync',
  ].filter(Boolean).join(' · ');
  return (
    <Tooltip title={tip}>
      <Typography variant="body2" color={failed ? 'error' : 'text.secondary'} sx={{ display: { xs: 'none', md: 'block' } }} data-testid="cloud-sync">
        {text}
      </Typography>
    </Tooltip>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const small = useMediaQuery('(max-width:1359.95px)'); // narrow laptops: icon-only menu, more room for tables
  const [open, setOpen] = useState(() => readStore('jw.drawerOpen', true));
  const expanded = open && !small;
  const width = expanded ? WIDE : NARROW;
  const { mode, toggle } = useColorMode();
  const { data: meta } = useMeta();
  const live = useAutoReload();
  const cloud = live?.cloudSync ?? meta?.cloudSync;
  const { data: stats } = useStats();
  const sync = useSyncWithNotice();
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
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" elevation={0} sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
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
          <Typography variant="h6" component="div" sx={{ fontWeight: 700, letterSpacing: -0.3 }}>JobWatcher</Typography>
          <Box sx={{ flex: 1 }} />
          <RunPill />
          <Tooltip title={lastRun ? `Last watcher run: ${new Date(lastRun).toLocaleString()}` : 'No watcher run found yet'}>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }} data-testid="last-run">
              Watcher ran {relTime(lastRun)}
            </Typography>
          </Tooltip>
          {cloud && (cloud.enabled || cloud.lastAt) ? <CloudStatus cloud={cloud} /> : null}
          <Button variant="outlined" size="small" onClick={() => { sync.run().catch(() => undefined); }} disabled={sync.pending}
            startIcon={sync.pending ? <CircularProgress size={16} /> : <Sync />} aria-label="Sync">
            {sync.pending ? 'Syncing…' : 'Sync'}
          </Button>
          <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
            <IconButton onClick={toggle} aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} data-testid="toggle-mode">
              {mode === 'dark' ? <LightModeOutlined /> : <DarkModeOutlined />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" sx={{
        width, flexShrink: 0, transition: 'width 150ms',
        '& .MuiDrawer-paper': { width, boxSizing: 'border-box', overflowX: 'hidden', transition: 'width 150ms', borderRight: `1px solid ${theme.palette.divider}` },
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
            Local only · 127.0.0.1<br />Nothing is sent from here.
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
