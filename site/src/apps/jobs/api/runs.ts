import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { Preflight, Run } from '../../../../../dashboard/shared/types';
import type { Queued } from './pcQueue';

export interface RunWithChildren extends Run { children: Run[] }
export interface RunList { runs: Run[]; paused: { until: string; reason: string } | null }

export const runKeys = {
  list: ['runs'] as const,
  one: (id: number) => ['run', id] as const,
  preflight: ['runs-preflight'] as const,
};

export const runsApi = {
  list: (limit = 50) => api.get<RunList>(`/runs?limit=${limit}`),
  get: (id: number) => api.get<RunWithChildren>(`/runs/${id}`),
  /** Queues the run for the PC (202). */
  start: (task: string, params: Record<string, unknown> = {}) => api.post<Queued>('/runs', { task, params }),
  /** Queues a stop for the PC. */
  cancel: (id: number) => api.post<Queued>(`/runs/${id}/cancel`),
  preflight: (fresh = false) => api.get<Preflight>(`/runs/preflight${fresh ? '?fresh=1' : ''}`),
  resumeQueue: () => api.post<{ paused: null }>('/runs/resume-queue'),
};

export const useRunList = (limit = 50) => useQuery({ queryKey: [...runKeys.list, limit], queryFn: () => runsApi.list(limit) });
export const useRunDetail = (id: number | null) =>
  useQuery({ queryKey: runKeys.one(id ?? 0), queryFn: () => runsApi.get(id!), enabled: id != null });
export const usePreflight = () => useQuery({ queryKey: runKeys.preflight, queryFn: () => runsApi.preflight(), staleTime: 60_000 });
