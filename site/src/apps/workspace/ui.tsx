// Small UI kit shared by the workspace pages: icons, buttons with an icon and a background, an in-app
// confirmation dialog (never window.confirm) and toasts with an Undo action.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { api } from './api';

const PATHS = {
  pencil: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  plus: 'M12 5v14M5 12h14',
  undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3',
  history: 'M3 12a9 9 0 109-9 9.7 9.7 0 00-6.7 2.8L3 8M3 3v5h5M12 7v5l3 3',
  check: 'M5 12l5 5L20 7',
  close: 'M6 6l12 12M18 6L6 18',
  target: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 16a4 4 0 100-8 4 4 0 000 8zM12 12h.01',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  edit: 'M4 6h16M4 12h10M4 18h7M17 14l3 3-4 4h-3v-3z',
} as const;
export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg className="ws-ico" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

/** A real button: icon + label on a tinted background. tone="danger" for deletes. */
export function Btn({ icon, tone, size, children, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: IconName; tone?: 'danger' | 'accent'; size?: 'sm' }) {
  return (
    <button type="button" {...rest} className={`ws-btn${tone ? ` ${tone}` : ''}${size ? ` ${size}` : ''} ${className}`}>
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}{children}
    </button>
  );
}

// ---- confirmation dialog ----------------------------------------------------------------------------
interface ConfirmOpts { title: string; body?: ReactNode; confirm?: string; tone?: 'danger' | 'accent' }
type Ask = (o: ConfirmOpts) => Promise<boolean>;
const ConfirmCtx = createContext<Ask>(async () => false);
export const useConfirm = () => useContext(ConfirmCtx);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const ask = useCallback<Ask>((o) => new Promise((resolve) => setOpen({ ...o, resolve })), []);
  const close = (v: boolean) => { open?.resolve(v); setOpen(null); };
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (open) cancelRef.current?.focus(); }, [open]);
  return (
    <ConfirmCtx.Provider value={ask}>
      {children}
      {open && (
        <div className="ws-overlay ws-confirm-wrap" onClick={(e) => { if (e.target === e.currentTarget) close(false); }} onKeyDown={(e) => { if (e.key === 'Escape') close(false); }}>
          <div className="ws-confirm ws-card" role="alertdialog" aria-modal="true" aria-labelledby="ws-confirm-title" aria-describedby="ws-confirm-body">
            <div className={`ws-confirm-icon ${open.tone ?? 'danger'}`}><Icon name={open.tone === 'accent' ? 'check' : 'trash'} size={22} /></div>
            <h2 id="ws-confirm-title">{open.title}</h2>
            {open.body && <div id="ws-confirm-body" className="ws-confirm-body">{open.body}</div>}
            <p className="ws-muted ws-confirm-note"><Icon name="history" size={13} /> You can undo this later from the <b>History</b> tab.</p>
            <footer>
              <button ref={cancelRef} type="button" className="ws-ghost" onClick={() => close(false)}>Cancel</button>
              <Btn tone={open.tone ?? 'danger'} icon={open.tone === 'accent' ? 'check' : 'trash'} onClick={() => close(true)}>{open.confirm ?? 'Delete'}</Btn>
            </footer>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}

// ---- toasts ----------------------------------------------------------------------------------------
interface Toast { id: number; text: string; undo?: () => Promise<void> }
const ToastCtx = createContext<(t: Omit<Toast, 'id'>) => void>(() => undefined);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const show = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random();
    setList((l) => [...l.slice(-2), { ...t, id }]);
    setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 9000);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="ws-toastbox" role="status" aria-live="polite">
        {list.map((t) => (
          <div key={t.id} className="ws-tbox-item">
            <span>{t.text}</span>
            {t.undo && <Btn size="sm" icon="undo" onClick={async () => { setList((l) => l.filter((x) => x.id !== t.id)); await t.undo!(); }}>Undo</Btn>}
            <button className="ws-tbox-x" aria-label="Dismiss" onClick={() => setList((l) => l.filter((x) => x.id !== t.id))}><Icon name="close" size={14} /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/** Undo the newest change in the history (the one just made); returns the area it touched. */
export async function undoLatest(): Promise<string> {
  const [h] = await api<{ id: number; undone_at: string | null }[]>('history?limit=1');
  if (!h || h.undone_at) throw new Error('Nothing to undo');
  return (await api<{ area: string }>(`history/${h.id}/undo`, 'POST')).area;
}

/** Confirm, run a delete, then offer Undo in a toast. Returns false if cancelled. */
export function useSafeDelete() {
  const confirm = useConfirm(), toast = useToast();
  return useCallback(async (o: ConfirmOpts & { run: () => Promise<void>; done: string; reload: () => void | Promise<void> }) => {
    if (!(await confirm(o))) return false;
    await o.run();
    toast({ text: o.done, undo: async () => { await undoLatest(); await o.reload(); } });
    return true;
  }, [confirm, toast]);
}
