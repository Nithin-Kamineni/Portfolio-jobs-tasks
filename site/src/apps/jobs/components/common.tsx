import type { ReactNode } from 'react';
import { Box, Card, CardContent, Skeleton, Stack, Typography } from '@mui/material';
import InboxOutlined from '@mui/icons-material/InboxOutlined';

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <Stack direction="row" alignItems="flex-end" justifyContent="space-between" spacing={2} sx={{ mb: 2.5, flexWrap: 'wrap', rowGap: 1.5 }}>
      <Box>
        <Typography variant="h5" component="h1">{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
      </Box>
      {actions && <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>{actions}</Stack>}
    </Stack>
  );
}

export function EmptyState({ title, children, icon, action }: { title: string; children?: ReactNode; icon?: ReactNode; action?: ReactNode }) {
  return (
    <Box sx={{ textAlign: 'center', py: 6, px: 2, color: 'text.secondary' }} role="status">
      <Box sx={{ fontSize: 44, lineHeight: 1, mb: 1, opacity: 0.6 }}>{icon || <InboxOutlined fontSize="inherit" />}</Box>
      <Typography variant="subtitle1" color="text.primary">{title}</Typography>
      {children && <Typography variant="body2" sx={{ mt: 0.5, maxWidth: 460, mx: 'auto' }}>{children}</Typography>}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  );
}

export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card><CardContent>
      <Skeleton width="40%" height={28} />
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} height={22} />)}
    </CardContent></Card>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Card aria-busy="true" aria-label="Loading">
      <CardContent>
        {Array.from({ length: rows }, (_, i) => <Skeleton key={i} height={36} />)}
      </CardContent>
    </Card>
  );
}
