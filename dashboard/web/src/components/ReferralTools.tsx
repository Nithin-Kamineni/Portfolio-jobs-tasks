// The Referral phase's two helpers (2026-10-17): one generic LinkedIn message to copy, and "Find R&D emails from
// papers" (code on the PC reads the e-mail addresses printed on the company researchers' papers; nothing is guessed).
import { useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, IconButton, LinearProgress, Link, List, ListItem, ListItemText, Stack, Tooltip, Typography,
} from '@mui/material';
import ContentCopy from '@mui/icons-material/ContentCopy';
import ManageSearchOutlined from '@mui/icons-material/ManageSearchOutlined';
import { usePaperEmails, useStartPaperEmails } from '../api/hooks';
import { useNotify } from './Notify';
import { copyText } from '../lib/clipboard';
import { relTime } from '../lib/time';
import { shortCompany } from '../lib/format';
import type { Job } from '../../../shared/types';

/** Your one-line pitch for referral messages (keep it in sync with site/src/apps/jobs/components/ReferralTools.tsx). */
const OWNER_PITCH = 'Your Name, a [your role] working on [your field] ([your strongest result])';

/**
 * A short, polite, generic referral ask (under ~80 words) for LinkedIn. [Name] stays a placeholder; the role, company and
 * link come from the job. The one-line pitch (OWNER_PITCH) must use only facts from profile/master_profile.md.
 */
export function referralMessage(job: Pick<Job, 'company' | 'title' | 'url'>): string {
  return [
    `Hi [Name], I hope you're doing well! I'm ${OWNER_PITCH}.`,
    `I'm applying for the ${job.title} role at ${shortCompany(job.company)}${job.url ? `: ${job.url}` : '.'}`,
    `Would you be open to referring me? I'm happy to send my resume. Thank you either way!`,
  ].join('\n');
}

export function ReferralMessage({ job }: { job: Job }) {
  const notify = useNotify();
  const text = referralMessage(job);
  return (
    <Box sx={{ p: 1.5, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
      <Stack direction="row" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="overline" color="text.secondary" sx={{ flex: 1, lineHeight: 1.6 }}>LinkedIn message</Typography>
        <Button size="small" variant="outlined" startIcon={<ContentCopy fontSize="small" />} aria-label={`Copy the LinkedIn message for ${job.title}`}
          onClick={async () => notify((await copyText(text)) ? { message: 'Message copied: replace [Name] before sending' } : { severity: 'warning', message: 'Could not copy; select the text and press Ctrl+C' })}>
          Copy
        </Button>
      </Stack>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }} data-testid="referral-message">{text}</Typography>
    </Box>
  );
}

export function PaperEmails({ company }: { company: string }) {
  const { data: search, isLoading } = usePaperEmails(company);
  const start = useStartPaperEmails();
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  const name = shortCompany(company);
  const running = search?.status === 'running' || start.isPending;
  const run = () => start.mutate(company, { onError: (e) => notify({ severity: 'error', message: (e as Error).message }) });
  const r = search?.result;

  return (
    <Box data-testid={`paper-emails-${name}`}>
      {!search && !running ? (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          <Button size="small" variant="outlined" startIcon={<ManageSearchOutlined />} onClick={run} disabled={isLoading}>Find R&amp;D emails from papers</Button>
          <Typography variant="caption" color="text.secondary">
            Reads the addresses printed on recent papers by {name} researchers (OpenAlex). About 1–2 min; nothing is sent or guessed.
          </Typography>
        </Stack>
      ) : running ? (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Searching papers for {name}… {r && r.total ? `checked ${r.checked} of ${r.total} people` : 'finding researchers'}
          </Typography>
          <LinearProgress variant={r && r.total ? 'determinate' : 'indeterminate'} value={r && r.total ? (100 * r.checked) / r.total : undefined} aria-label={`Searching papers for ${name}`} />
        </Box>
      ) : search?.status === 'error' ? (
        <Alert severity="warning" action={<Button color="inherit" size="small" onClick={run}>Search again</Button>}>{search.error}</Alert>
      ) : r ? (
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <Typography variant="overline" color="text.secondary" sx={{ flex: 1, lineHeight: 1.6 }}>
              R&amp;D emails from papers · {r.hits.length} found
            </Typography>
            <Typography variant="caption" color="text.secondary">{relTime(search!.finished_at)}</Typography>
            <Button size="small" onClick={run} startIcon={start.isPending ? <CircularProgress size={14} /> : undefined}>Search again</Button>
          </Stack>
          {r.hits.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              None found: checked {r.checked} {r.checked === 1 ? 'person' : 'people'} and {r.papers} paper{r.papers === 1 ? '' : 's'}{r.total === 0 ? ` (no ${name} researchers with readable papers${r.institution ? '' : ' in the institution map'})` : ''}.
            </Typography>
          ) : (
            <List dense disablePadding sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
              {r.hits.map((h) => (
                <ListItem key={h.email} divider secondaryAction={
                  <Tooltip title="Copy address">
                    <IconButton size="small" aria-label={`Copy ${h.email}`} onClick={async () => notify((await copyText(h.email)) ? { message: `Copied ${h.email}` } : { severity: 'warning', message: 'Could not copy' })}>
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                }>
                  <ListItemText sx={{ pr: 4 }}
                    primary={<><b>{h.name}</b> · <Box component="span" sx={{ fontFamily: 'Consolas, ui-monospace, monospace' }}>{h.email}</Box></>}
                    secondary={<>On <Link href={h.paper.url || h.paper.pdf_url} target="_blank" rel="noopener noreferrer">{h.paper.title}</Link> ({[h.paper.venue, h.paper.year].filter(Boolean).join(' ')}, <Link href={h.paper.pdf_url} target="_blank" rel="noopener noreferrer">PDF</Link>)</>} />
                </ListItem>
              ))}
            </List>
          )}
          {r.warnings.length > 0 && (
            <Box sx={{ mt: 0.5 }}>
              <Link component="button" variant="caption" onClick={() => setOpen((o) => !o)}>{open ? 'Hide' : 'Show'} {r.warnings.length} note{r.warnings.length === 1 ? '' : 's'}</Link>
              {open && <Box component="ul" sx={{ m: 0, pl: 2.5, typography: 'caption', color: 'text.secondary' }}>{r.warnings.slice(0, 12).map((w) => <li key={w}>{w}</li>)}</Box>}
            </Box>
          )}
        </Box>
      ) : null}
    </Box>
  );
}
