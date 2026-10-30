// "Check these yourself" (Home): career sites even the Claude-in-Chrome check cannot read (targets/companies.csv
// you_check=yes, or a manual company whose last check was blocked/error). Logo, reason, "Open careers" and "I checked".
import { useEffect, useState } from 'react';
import { Avatar, Box, Button, Card, CardContent, CardHeader, Link, Stack, Typography } from '@mui/material';
import TravelExploreOutlined from '@mui/icons-material/TravelExploreOutlined';
import { useCompanies, useSelfCheck } from '../api/hooks';
import { useNotify } from './Notify';
import { CardSkeleton } from './common';
import { checkedAgo, SELF_CHECK_ALERT_DAYS, SELF_CHECK_WARN_DAYS, selfCheckColor, selfCheckCompanies } from '../../../shared/selfCheck';

export default function SelfCheckCard() {
  const { data: companies } = useCompanies();
  const { check, undo } = useSelfCheck();
  const notify = useNotify();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(t); }, []);
  const list = companies ? selfCheckCompanies(companies) : null;
  if (list && list.length === 0) return null;

  const onChecked = (company: string) => check.mutate(company, {
    onSuccess: (r) => notify({ message: `Marked ${company} as checked`, action: { label: 'Undo', onClick: () => undo.mutate(r.event_id) } }),
    onError: (e) => notify({ message: `Couldn't record it: ${(e as Error).message}`, severity: 'error' }),
  });

  return (
    <Card data-testid="self-check-card">
      <CardHeader avatar={<TravelExploreOutlined color="primary" />} title="Check these yourself" titleTypographyProps={{ variant: 'subtitle1', component: 'h2' }}
        subheader={`Career sites Claude can't read, even in Chrome. Amber after ${SELF_CHECK_WARN_DAYS} days, red after ${SELF_CHECK_ALERT_DAYS}.`} />
      <CardContent sx={{ pt: 0 }}>
        {!list ? <CardSkeleton rows={2} /> : (
          <Stack spacing={1}>
            {list.map((c) => {
              const color = selfCheckColor(c.checked_at, now);
              return (
                <Stack key={c.name} direction="row" spacing={1.5} alignItems="center" data-testid={`self-check-${c.slug}`}
                  sx={{ p: 1, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                  <Avatar src={`/logos/${c.slug}.png`} alt="" variant="rounded" imgProps={{ loading: 'lazy' }}
                    sx={{ width: 40, height: 40, bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700, '& img': { objectFit: 'contain', bgcolor: '#fff' } }}>
                    {c.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.name}</Typography>
                    <Typography variant="caption" color="text.secondary" component="p">{c.reason}</Typography>
                    <Typography variant="caption" component="p" sx={{ color: `${color}.main`, fontWeight: 600 }} data-testid="self-check-age" data-color={color}
                      title={c.checked_at ? new Date(c.checked_at).toLocaleString() : undefined}>
                      {checkedAgo(c.checked_at, now)}
                    </Typography>
                  </Box>
                  <Stack spacing={0.5} alignItems="flex-end">
                    {c.careers_url && (
                      <Link href={c.careers_url} target="_blank" rel="noopener noreferrer" variant="body2" sx={{ whiteSpace: 'nowrap' }}>Open careers ↗</Link>
                    )}
                    <Button size="small" variant="outlined" onClick={() => onChecked(c.name)} disabled={check.isPending && check.variables === c.name}
                      sx={{ whiteSpace: 'nowrap' }}>I checked</Button>
                  </Stack>
                </Stack>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
