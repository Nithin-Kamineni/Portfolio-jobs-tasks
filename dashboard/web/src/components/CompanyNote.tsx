// One note per company (e.g. who he asked for a referral), shared by every role of that company. Saves by itself.
import { useEffect, useRef, useState } from 'react';
import { TextField } from '@mui/material';
import { useCompanyNotes, useSetCompanyNote } from '../api/hooks';
import { companyKey } from '../../../shared/statuses';
import { shortCompany } from '../lib/format';

/** The saved note for a company ('' when none). */
export function useCompanyNote(company: string): string {
  const { data } = useCompanyNotes();
  const key = companyKey(company);
  return data?.find((n) => n.company_key === key)?.note ?? '';
}

export function CompanyNoteField({ company, minRows = 2, label }: { company: string; minRows?: number; label?: string }) {
  const { data, isLoading } = useCompanyNotes();
  const save = useSetCompanyNote();
  const key = companyKey(company);
  const saved = data?.find((n) => n.company_key === key)?.note ?? '';
  const [value, setValue] = useState(saved);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const last = useRef(saved);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editing = useRef(false);

  // Take the stored note when it arrives (or changes elsewhere), unless he is typing.
  useEffect(() => {
    if (editing.current) return;
    setValue(saved); last.current = saved;
  }, [saved, key]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const commit = (v: string) => {
    if (v === last.current) { editing.current = false; return; }
    setState('saving');
    save.mutate({ company, note: v }, {
      onSuccess: () => { last.current = v; editing.current = false; setState('saved'); },
      onError: () => setState('error'),
    });
  };

  return (
    <TextField
      label={label || `Note for ${shortCompany(company)} (all roles)`} multiline minRows={minRows} maxRows={10} fullWidth size="small"
      value={value} disabled={isLoading}
      placeholder="e.g. Asked Jane (LinkedIn) for a referral on Oct 17"
      onChange={(e) => {
        const v = e.target.value; editing.current = true; setValue(v); setState('idle');
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => commit(v), 700);
      }}
      onBlur={() => { if (timer.current) clearTimeout(timer.current); commit(value); }}
      helperText={state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : state === 'error' ? 'Could not save; try again' : 'Same note on every role of this company · saves automatically'}
      slotProps={{ htmlInput: { 'data-testid': `company-note-${key}`, 'aria-label': `Note for ${shortCompany(company)}` } }}
    />
  );
}
