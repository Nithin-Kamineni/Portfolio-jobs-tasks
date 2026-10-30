// The server restarts itself into new code (server/selfUpdate.ts). The page notices the new boot id and reloads into
// the new version too; while the owner is typing in a field it waits until he leaves it, so nothing typed is lost.
// The same poll carries the cloud sync status: when a sync brought website edits down (lastPullAt moved), every list refetches.
import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { AppMeta } from '../../../shared/types';

const typing = () => Boolean(document.activeElement?.closest('input, textarea, [contenteditable="true"], [role="dialog"]'));

export function useAutoReload(): AppMeta | undefined {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['bootId'], queryFn: () => api.get<AppMeta>('/meta'), refetchInterval: 20_000, retry: false });
  const first = useRef<string | null>(null);
  useEffect(() => {
    if (!data?.bootId) return;
    if (first.current == null) { first.current = data.bootId; return; }
    if (data.bootId === first.current) return;
    const reload = () => { if (!typing()) window.location.reload(); };
    reload();
    const t = setInterval(reload, 5_000);
    return () => clearInterval(t);
  }, [data?.bootId]);

  const pulled = data?.cloudSync?.lastPullAt ?? null;
  const lastPull = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (!data) return;
    if (lastPull.current === undefined) { lastPull.current = pulled; return; }
    if (pulled === lastPull.current) return;
    lastPull.current = pulled;
    void qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'bootId' });
  }, [data, pulled, qc]);
  return data;
}
