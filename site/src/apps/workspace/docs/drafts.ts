// Unsaved document changes kept on this device (localStorage) until the server has them, so a dropped
// connection, a sign-out (expired Cloudflare Access session) or a closed tab never loses text. The
// editor writes a draft on every change and deletes it once a save succeeds; opening the document
// again puts a left-over draft back.
export interface DraftChanges { title?: string; content?: string; text?: string; pinned?: number }
export interface Draft extends DraftChanges { base: number; at: string }
export const changesOf = ({ base: _base, at: _at, ...changes }: Draft): DraftChanges => changes;

const key = (id: number) => `ws.docdraft.${id}`;

export function readDraft(id: number): Draft | null {
  try { const s = localStorage.getItem(key(id)); return s ? (JSON.parse(s) as Draft) : null; } catch { return null; }
}
/** Merges the changes into this document's draft; false if the browser refused (storage full/blocked). */
export function writeDraft(id: number, changes: DraftChanges, base: number): boolean {
  try {
    const prev = readDraft(id);
    localStorage.setItem(key(id), JSON.stringify({ ...prev, ...changes, base: prev?.base ?? base, at: new Date().toISOString() }));
    return true;
  } catch { return false; }
}
export function clearDraft(id: number) {
  try { localStorage.removeItem(key(id)); } catch { /* blocked storage */ }
}
/** Replaces the draft with exactly these not-yet-saved changes on top of version `base`. */
export function replaceDraft(id: number, changes: DraftChanges, base: number) {
  if (!Object.keys(changes).length) return clearDraft(id);
  try { localStorage.setItem(key(id), JSON.stringify({ ...changes, base, at: new Date().toISOString() })); } catch { /* blocked storage */ }
}
