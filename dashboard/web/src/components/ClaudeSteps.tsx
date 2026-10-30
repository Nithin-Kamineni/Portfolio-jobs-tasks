import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton,
  Stack, Typography,
} from '@mui/material';
import TerminalRounded from '@mui/icons-material/TerminalRounded';
import ExtensionOutlined from '@mui/icons-material/ExtensionOutlined';
import ChatBubbleOutline from '@mui/icons-material/ChatBubbleOutline';
import TouchAppOutlined from '@mui/icons-material/TouchAppOutlined';
import ContentCopy from '@mui/icons-material/ContentCopy';
import Close from '@mui/icons-material/Close';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import { useQueryClient } from '@tanstack/react-query';
import {
  APP_INFO, stepById,
  type ClaudeApp, type ClaudeStep, type StepContext, type StepId,
} from '../claudeSteps';
import { keys, useFacts, useMeta, useSync } from '../api/hooks';
import { useNotify } from './Notify';
import { copyText } from '../lib/clipboard';
import { readStore } from '../lib/storage';
import type { ClaudeFacts } from '../../../shared/types';
import { useRunsOptional } from './Runs';


const APP_ICON: Record<ClaudeApp, ReactNode> = {
  'claude-code': <TerminalRounded fontSize="inherit" />,
  'claude-chrome': <ExtensionOutlined fontSize="inherit" />,
  'claude-desktop': <ChatBubbleOutline fontSize="inherit" />,
  manual: <TouchAppOutlined fontSize="inherit" />,
};

/** The body of a hand-off: where, which folder/page, what to type (with Copy), why and what happens next. */
export function StepBody({ step, facts, ctx, onCopy }: { step: ClaudeStep; facts: ClaudeFacts; ctx: StepContext; onCopy?: (text: string) => void }) {
  const command = step.command(facts, ctx);
  const info = APP_INFO[step.app];
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ fontSize: 40, lineHeight: 1, color: step.app === 'manual' ? 'text.secondary' : 'primary.main', display: 'flex' }} aria-hidden>{APP_ICON[step.app]}</Box>
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4 }}>Where</Typography>
          <Box><Chip label={info.label} color={step.app === 'manual' ? 'default' : 'primary'} data-testid="step-app" /></Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{info.where}</Typography>
        </Box>
      </Stack>
      <Box>
        <Typography variant="overline" color="text.secondary">{step.app === 'manual' ? 'First' : 'Which folder / page'}</Typography>
        <Typography variant="body2" data-testid="step-place" sx={{ overflowWrap: 'anywhere' }}>{step.place(facts, ctx)}</Typography>
      </Box>
      {command && (
        <Box>
          <Typography variant="overline" color="text.secondary">What to type</Typography>
          <Stack direction="row" spacing={1} alignItems="center"
            sx={{ p: 1.25, pl: 2, borderRadius: 2, bgcolor: 'action.hover', border: 1, borderColor: 'divider' }}>
            <Typography component="code" data-testid="step-command" sx={{ fontFamily: 'Consolas, "Cascadia Mono", ui-monospace, monospace', fontSize: 16, flex: 1, overflowWrap: 'anywhere' }}>
              {command}
            </Typography>
            <Button size="small" variant="outlined" startIcon={<ContentCopy fontSize="small" />} onClick={() => onCopy?.(command)} aria-label={`Copy "${command}"`}>Copy</Button>
          </Stack>
        </Box>
      )}
      <Box>
        <Typography variant="overline" color="text.secondary">Why, and what happens next</Typography>
        <Typography variant="body2" data-testid="step-why">{step.why(facts, ctx)}</Typography>
      </Box>
    </Stack>
  );
}

export interface ClaudeStepDialogProps {
  step: ClaudeStep | null;
  facts: ClaudeFacts | undefined;
  ctx: StepContext;
  waiting: boolean;
  syncing: boolean;
  onClose: () => void;
  onCopyClose: (text: string) => void;
  onCopy: (text: string) => void;
  onDone: () => void;
  /** v2: start the step's task as a dashboard run (shown as "Run it now" when the step has a task). */
  onRun?: () => void;
  /** The step's task is already running. */
  running?: boolean;
}

export function ClaudeStepDialog(props: ClaudeStepDialogProps) {
  if (!props.step || !props.facts) return null;
  return <StepDialogInner key={props.step.id} {...props} step={props.step} facts={props.facts} />;
}

function StepDialogInner({ step, facts, ctx, waiting, syncing, onClose, onCopyClose, onCopy, onDone, onRun, running }: ClaudeStepDialogProps & { step: ClaudeStep; facts: ClaudeFacts }) {
  const manual = step.app === 'manual';
  const runnable = Boolean(step.task && onRun);
  const [myself, setMyself] = useState(!runnable || waiting);
  const command = step.command(facts, ctx);
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="claude-step-title">
      <DialogTitle id="claude-step-title" sx={{ pr: 6 }}>
        {manual ? step.title : runnable && !myself ? <>Next step for Claude: {step.title.toLowerCase()}</> : <>Your turn in Claude: {step.title.toLowerCase()}</>}
        <IconButton aria-label="Close" onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {runnable && !myself ? (
          <Stack spacing={2}>
            <Box>
              <Typography variant="overline" color="text.secondary">What Claude will do</Typography>
              <Typography variant="body2" data-testid="step-why">{step.why(facts, ctx)}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              "Run it now" starts Claude Code in the background with your Claude plan (no API bill). Progress shows at the top right; the pages update by themselves when it's done. Nothing is sent or submitted.
            </Typography>
            {running && <Alert severity="info">Claude is already doing this.</Alert>}
            <Box><Button size="small" onClick={() => setMyself(true)}>I'll do it myself in Claude Code</Button></Box>
          </Stack>
        ) : <StepBody step={step} facts={facts} ctx={ctx} onCopy={onCopy} />}
        {waiting && (
          <Alert severity="info" icon={<CircularProgress size={18} />} sx={{ mt: 2 }} data-testid="step-waiting">
            Still waiting for Claude… This closes by itself when Claude is done (the dashboard checks every few seconds).
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        {manual ? (
          <Button variant="contained" onClick={onClose}>Got it</Button>
        ) : (
          <>
            <Button onClick={onClose}>Close</Button>
            <Box sx={{ flex: 1 }} />
            {runnable && !myself ? (
              <Button variant="contained" startIcon={running ? <CircularProgress size={16} color="inherit" aria-label="Claude is working" /> : <PlayArrowRounded />} onClick={onRun} disabled={running}>Run it now</Button>
            ) : (
              <>
                {runnable && <Button onClick={() => setMyself(false)}>Back</Button>}
                <Button onClick={onDone} disabled={syncing} startIcon={syncing ? <CircularProgress size={16} /> : undefined}>I've done it</Button>
                <Button variant="contained" startIcon={<ContentCopy />} onClick={() => onCopyClose(command)}>Copy &amp; close</Button>
              </>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

// ---------- provider ----------
interface Ctx {
  facts: ClaudeFacts | undefined;
  isActive: (id: StepId, ctx?: StepContext) => boolean;
  /** Show a step's "how to do it yourself" dialog. Only ever called from a click ("Show me"); nothing opens by itself. */
  openStep: (id: StepId, ctx?: StepContext) => void;
  stepContext: StepContext;
  /** v2: start the step's task now (closes the dialog; the app-bar pill shows the run). */
  runStep: (id: StepId, ctx?: StepContext) => void;
  canRun: (id: StepId) => boolean;
}

const StepsCtx = createContext<Ctx | null>(null);

export function useClaudeSteps(): Ctx {
  const c = useContext(StepsCtx);
  if (!c) throw new Error('useClaudeSteps outside ClaudeStepsProvider');
  return c;
}

export function ClaudeStepsProvider({ children, now }: { children: ReactNode; now?: () => Date }) {
  const { data: facts } = useFacts();
  const { data: meta } = useMeta();
  const sync = useSync();
  const qc = useQueryClient();
  const notify = useNotify();
  const runs = useRunsOptional();
  const [open, setOpen] = useState<{ id: StepId; ctx: StepContext } | null>(null);
  const [waiting, setWaiting] = useState<Set<StepId>>(new Set());
  const [hideManual, setHideManual] = useState(() => readStore('jw.hideManualCompanies', false));
  useEffect(() => {
    const h = () => setHideManual(readStore('jw.hideManualCompanies', false));
    window.addEventListener('jw-settings', h);
    return () => window.removeEventListener('jw-settings', h);
  }, []);

  const baseCtx: StepContext = useMemo(() => ({
    now: now ? now() : new Date(), hideManualCompanies: hideManual, repoFolder: meta?.config.repoRoot,
  }), [now, hideManual, meta?.config.repoRoot, facts]); // eslint-disable-line react-hooks/exhaustive-deps

  const isActive = useCallback((id: StepId, ctx: StepContext = {}) => Boolean(facts && stepById(id).active(facts, { ...baseCtx, ...ctx })), [facts, baseCtx]);

  const openStep = useCallback((id: StepId, ctx: StepContext = {}) => {
    if (!facts) return;
    setOpen({ id, ctx });
  }, [facts]);

  // While waiting for Claude, re-check every few seconds; close once the condition clears.
  useEffect(() => {
    if (!waiting.size || !facts) return;
    const cleared = [...waiting].filter((id) => !stepById(id).active(facts, { ...baseCtx, ...(open?.id === id ? open.ctx : {}) }));
    if (cleared.length) {
      setWaiting((w) => { const n = new Set(w); cleared.forEach((id) => n.delete(id)); return n; });
      if (open && cleared.includes(open.id)) { setOpen(null); notify({ message: `Done: ${stepById(open.id).title}` }); }
    }
    const t = setInterval(() => { qc.invalidateQueries({ queryKey: keys.facts }); }, 5000);
    return () => clearInterval(t);
  }, [waiting, facts, open, baseCtx, qc, notify]);

  const copy = async (text: string) => {
    const ok = await copyText(text);
    notify(ok ? { message: `Copied "${text}"` } : { severity: 'warning', message: 'Could not copy; select the text and press Ctrl+C' });
  };

  const done = () => {
    if (!open) return;
    const id = open.id;
    sync.mutate(undefined, {
      onSettled: () => {
        qc.invalidateQueries({ queryKey: keys.facts }).then(() => {
          const f = qc.getQueryData<ClaudeFacts>(keys.facts);
          if (f && !stepById(id).active(f, { ...baseCtx, ...open.ctx })) { setOpen(null); notify({ message: `Done: ${stepById(id).title}` }); }
          else setWaiting((w) => new Set(w).add(id));
        });
      },
    });
  };

  /** "Run it now": close the dialog and start the step's task (the app-bar pill shows it). */
  const runStep = (id: StepId, ctx: StepContext = {}) => {
    const s = stepById(id);
    if (!s.task || !runs || !facts) return;
    setOpen(null);
    void runs.start(s.task, s.taskParams?.(facts, { ...baseCtx, ...ctx }) || {});
  };

  const value: Ctx = { facts, isActive, openStep, stepContext: baseCtx, runStep, canRun: (id) => Boolean(runs && stepById(id).task) };
  const step = open ? stepById(open.id) : null;

  return (
    <StepsCtx.Provider value={value}>
      {children}
      <ClaudeStepDialog
        step={step} facts={facts} ctx={{ ...baseCtx, ...(open?.ctx || {}) }} waiting={Boolean(open && waiting.has(open.id))} syncing={sync.isPending}
        onClose={() => setOpen(null)} onCopy={copy} onCopyClose={(t) => { void copy(t); setOpen(null); }} onDone={done}
        onRun={step?.task && runs ? () => runStep(step.id, open?.ctx) : undefined}
        running={Boolean(step?.task && runs?.isRunning(step.task, facts && step.taskParams ? step.taskParams(facts, { ...baseCtx, ...(open?.ctx || {}) }) : {}))}
      />
    </StepsCtx.Provider>
  );
}

