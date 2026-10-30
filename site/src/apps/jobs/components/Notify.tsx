import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Alert, Button, Snackbar } from '@mui/material';

export interface Notice {
  message: string;
  severity?: 'success' | 'info' | 'warning' | 'error';
  action?: { label: string; onClick: () => void };
  duration?: number | null;
}

const Ctx = createContext<(n: Notice) => void>(() => undefined);

/** One app-wide snackbar. `notify({message, action: {label: 'Undo', onClick}})`. */
export function NotifyProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<(Notice & { key: number }) | null>(null);
  const notify = useCallback((n: Notice) => setNotice({ ...n, key: Date.now() + Math.random() }), []);
  const close = () => setNotice(null);
  const value = useMemo(() => notify, [notify]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <Snackbar
        key={notice?.key}
        open={Boolean(notice)}
        autoHideDuration={notice?.duration === null ? null : notice?.duration ?? (notice?.action ? 7000 : 4000)}
        onClose={(_, reason) => { if (reason !== 'clickaway') close(); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          severity={notice?.severity || 'success'}
          variant="filled"
          onClose={close}
          sx={{ minWidth: 320, alignItems: 'center' }}
          action={notice?.action ? (
            <Button color="inherit" size="small" onClick={() => { notice.action!.onClick(); close(); }}>{notice.action.label}</Button>
          ) : undefined}
        >
          {notice?.message}
        </Alert>
      </Snackbar>
    </Ctx.Provider>
  );
}

export const useNotify = () => useContext(Ctx);
