// Types and helpers shared by the Interview-prep pages (overview, track, weekly plan, flashcards, quiz).
import type { useLoad } from '../api';

export interface Track { id: string; position: number; title: string; summary: string; goal: string; suggested: number; hidden: number }
export interface Module { id: string; track_id: string; position: number; title: string }
export type Status = 'todo' | 'doing' | 'done' | 'skipped';
export type Kind = 'video' | 'reading' | 'course' | 'exercise' | 'project' | 'concept';
export interface Item {
  id: string; module_id: string; position: number; title: string; kind: Kind; url: string; est: number | null; optional: number; note: string;
  custom: number; status: Status; confidence: number; my_notes: string; started_at: string | null; done_at: string | null; updated_at: string | null; hide_continue: number;
}
export interface Log { item_id: string; status: string; at: string }
export interface PrepData { tracks: Track[]; modules: Module[]; items: Item[]; log: Log[] }
export type Ctx = ReturnType<typeof useLoad<PrepData>> & { update: (i: Item, p: Partial<Item>) => Promise<void> };

export const KIND: Record<Kind, { icon: string; label: string }> = {
  video: { icon: '▶', label: 'Video' }, reading: { icon: '📖', label: 'Reading' }, course: { icon: '🎓', label: 'Course' },
  exercise: { icon: '✎', label: 'Exercise' }, project: { icon: '⚙', label: 'Project' }, concept: { icon: '◆', label: 'Concept' },
};
export const STATUS_LABEL: Record<Status, string> = { todo: 'To do', doing: 'In progress', done: 'Done', skipped: 'Skipped' };

export const counts = (items: Item[]) => {
  const core = items.filter((i) => !i.optional && i.status !== 'skipped');
  const done = core.filter((i) => i.status === 'done');
  const hours = core.reduce((s, i) => s + (i.est ?? 0), 0), hoursDone = done.reduce((s, i) => s + (i.est ?? 0), 0);
  return { total: core.length, done: done.length, doing: items.filter((i) => i.status === 'doing').length, hours, hoursDone, pct: core.length ? done.length / core.length : 0 };
};

/** Items in curriculum order, grouped by track id. */
export function itemsByTrack(data: PrepData) {
  const modTrack = new Map(data.modules.map((m) => [m.id, m.track_id]));
  const modPos = new Map(data.modules.map((m) => [m.id, m.position]));
  const byTrack = new Map<string, Item[]>();
  for (const i of data.items) { const t = modTrack.get(i.module_id)!; byTrack.set(t, [...(byTrack.get(t) ?? []), i]); }
  for (const [, list] of byTrack) list.sort((a, b) => (modPos.get(a.module_id)! - modPos.get(b.module_id)!) || a.position - b.position);
  return { modTrack, byTrack };
}
