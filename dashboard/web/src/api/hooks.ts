import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, enc } from './client';
import type { AppMeta, ClaudeFacts, Company, CompanyNote, Contact, Job, Outreach, PaperEmailSearch, Settings, Stats, SyncResult } from '../../../shared/types';
import type { JobStatus } from '../../../shared/statuses';

/** contacts/outreach stay in the API (CLI and data are kept); the dashboard no longer shows outreach. */
export interface JobDetail { job: Job; contacts: Contact[]; outreach: Outreach[] }
export interface StatusResult { job: Job; eventId: number }

export const keys = {
  jobs: ['jobs'] as const,
  job: (id: string) => ['job', id] as const,
  stats: ['stats'] as const,
  meta: ['meta'] as const,
  facts: ['facts'] as const,
  companies: ['companies'] as const,
  companyNotes: ['company-notes'] as const,
};

export const useJobs = () => useQuery({ queryKey: keys.jobs, queryFn: () => api.get<Job[]>('/jobs?sort=fit') });
export const useJob = (id: string | null) =>
  useQuery({ queryKey: keys.job(id || ''), queryFn: () => api.get<JobDetail>(`/jobs/${enc(id!)}`), enabled: Boolean(id) });
export const useStats = () => useQuery({ queryKey: keys.stats, queryFn: () => api.get<Stats>('/stats') });
export const useMeta = () => useQuery({ queryKey: keys.meta, queryFn: () => api.get<AppMeta>('/meta'), staleTime: 60_000 });
export const useFacts = () => useQuery({ queryKey: keys.facts, queryFn: () => api.get<ClaudeFacts>('/claude-facts') });
export const useCompanies = () => useQuery({ queryKey: keys.companies, queryFn: () => api.get<Company[]>('/companies') });

/** Everything that can change after a write. Cheap: all local. */
export function useInvalidateAll() {
  const qc = useQueryClient();
  return () => Promise.all(Object.values(keys).filter((k) => typeof k !== 'function').map((k) => qc.invalidateQueries({ queryKey: k as readonly string[] })))
    .then(() => qc.invalidateQueries({ queryKey: ['job'] }));
}

export function useSetStatus() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: JobStatus; note?: string }) => api.post<StatusResult>(`/jobs/${enc(id)}/status`, { status, note }),
    onSuccess: () => invalidate(),
  });
}

export function useBulkStatus() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: JobStatus }) =>
      api.post<{ updated: Job[]; eventIds: number[]; errors: { id: string; error: string }[] }>('/jobs/bulk-status', { ids, status }),
    onSuccess: () => invalidate(),
  });
}

export function useUndo() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (eventIds: number[]) => Promise.all([...eventIds].reverse().map((id) => api.post<Job>(`/events/${id}/undo`))),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string; notes?: string | null; application_dir?: string | null; applied_date?: string | null }) =>
      api.patch<Job>(`/jobs/${enc(id)}`, patch),
    onSuccess: (job) => {
      qc.setQueryData<Job[]>(keys.jobs, (old) => old?.map((j) => (j.id === job.id ? { ...j, ...job } : j)));
      qc.setQueryData<JobDetail>(keys.job(job.id), (old) => (old ? { ...old, job: { ...old.job, ...job, description: old.job.description } } : old));
    },
  });
}

export function useFetchDescription() {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: (id: string) => api.post<Job>(`/jobs/${enc(id)}/fetch-description`), onSuccess: () => invalidate() });
}

export function useSync() {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: () => api.post<SyncResult>('/sync'), onSuccess: () => invalidate() });
}

export function useMark() {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: (kind: string) => api.post<{ kind: string; at: string }>('/marks', { kind }), onSuccess: () => invalidate() });
}

export const useSettings = () => useQuery({ queryKey: ['settings'], queryFn: () => api.get<Settings>('/settings') });
export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Settings>) => api.patch<Settings>('/settings', patch),
    onSuccess: (s) => qc.setQueryData(['settings'], s),
  });
}

// ---------- company notes (one per company: Referral and Interview phases) ----------
export const useCompanyNotes = () => useQuery({ queryKey: keys.companyNotes, queryFn: () => api.get<CompanyNote[]>('/company-notes') });

export function useSetCompanyNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ company, note }: { company: string; note: string }) => api.post<CompanyNote>('/company-notes', { company, note }),
    onSuccess: (n) => qc.setQueryData<CompanyNote[]>(keys.companyNotes, (old) => [...(old || []).filter((x) => x.company_key !== n.company_key), n]),
  });
}

// ---------- "Check these yourself" (Home): an "I checked" click is an event; Undo reverts it ----------
export interface SelfCheckResult { company: string; event_id: number; at: string }
export function useSelfCheck() {
  const qc = useQueryClient();
  const patch = (company: string, at: string | null) => qc.setQueryData<Company[]>(keys.companies, (old) => old?.map((c) => (c.name === company ? { ...c, self_checked_at: at } : c)));
  const check = useMutation({
    mutationFn: (company: string) => api.post<SelfCheckResult>('/companies/self-check', { company }),
    onSuccess: (r) => patch(r.company, r.at),
  });
  const undo = useMutation({
    mutationFn: (eventId: number) => api.post<{ company: string }>(`/companies/self-check/${eventId}/undo`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.companies }),
  });
  return { check, undo };
}

// ---------- "Find R&D emails from papers" (runs in code on the PC, no Claude) ----------
export const paperEmailsKey = (company: string) => ['paper-emails', company] as const;

/** The cached search for a company; polls every 1.5 s while it runs. */
export const usePaperEmails = (company: string, enabled = true) => useQuery({
  queryKey: paperEmailsKey(company),
  queryFn: () => api.get<PaperEmailSearch | null>(`/research/paper-emails?company=${enc(company)}`),
  enabled,
  refetchInterval: (q) => (q.state.data?.status === 'running' ? 1500 : false),
});

export function useStartPaperEmails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (company: string) => api.post<PaperEmailSearch>('/research/paper-emails', { company }),
    onSuccess: (r, company) => qc.setQueryData(paperEmailsKey(company), r),
  });
}
