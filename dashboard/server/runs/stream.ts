// Parses Claude Code's stream-json output (one JSON object per line) into a small progress model:
// init (model, MCP status), one human line per tool call, counters for CLI writes, Claude's latest text, and the result.
import type { RunCounters, RunProgress, RunStep, RunUsage } from '../../shared/types';

export const MAX_STEPS = 60;
const MAX_TEXT = 800;

export const emptyCounters = (): RunCounters => ({ ranked: 0, statuses: 0, outreach: 0, contacts: 0, jobsAdded: 0, fetched: 0, notes: 0, toolCalls: 0, denied: 0 });
export const emptyProgress = (target?: number): RunProgress => ({ steps: [], counters: emptyCounters(), malformed: 0, ...(target ? { target } : {}) });

export interface StreamResult {
  subtype: string; isError: boolean; text: string; numTurns: number | null; durationMs: number | null; costUsd: number | null;
  sessionId: string | null; denials: number;
}

type Json = Record<string, unknown>;
const s = (v: unknown) => (typeof v === 'string' ? v : '');
const short = (t: string, n = 70) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);
const host = (u: string) => { try { return new URL(u).host.replace(/^www\./, ''); } catch { return short(u, 40); } };
const base = (p: string) => p.split(/[\\/]/).filter(Boolean).pop() || p;
const unquote = (v: string) => v.replace(/^["']|["']$/g, '');
const argAfter = (cmd: string, re: RegExp) => { const m = cmd.match(re); return m ? unquote(m[1]) : ''; };

/** A CLI write counted once its tool call succeeds. */
type CounterKey = keyof RunCounters;

/** One human line for a tool call, plus the counter it bumps when it succeeds. */
export function describeTool(name: string, input: Json): { text: string; counter?: CounterKey } {
  if (name === 'Bash') {
    const cmd = s(input.command).trim();
    const cli = cmd.match(/node\s+(?:\S*[\\/])?dashboard[\\/]cli(?:[\\/]index\.js)?\s+(\S+)\s*(.*)$/s);
    if (cli) {
      const [, sub, rest] = cli;
      const first = unquote((rest.match(/^("[^"]*"|'[^']*'|\S+)/) || [''])[0]);
      switch (sub) {
        case 'rank': { const fit = argAfter(rest, /--fit[=\s]+(\d+)/); return { text: `Ranking ${first}${fit ? `: fit ${fit}` : ''}`, counter: 'ranked' }; }
        case 'status': { const to = unquote((rest.match(/^\S+\s+(\S+)/) || ['', ''])[1]); return { text: `Setting ${first} to ${to}`, counter: 'statuses' }; }
        case 'outreach':
          if (first === 'add') return { text: `Drafting a ${argAfter(rest, /--type[=\s]+(\S+)/).replace('_', ' ') || 'message'}`, counter: 'outreach' };
          return { text: first === 'list' ? 'Reading the outreach list' : 'Updating a message' };
        case 'contact':
          if (first === 'add') return { text: `Adding contact ${argAfter(rest, /--name[=\s]+("[^"]*"|'[^']*'|\S+)/)}`.trim(), counter: 'contacts' };
          return { text: first === 'list' ? 'Reading contacts' : 'Updating a contact' };
        case 'job':
          if (first === 'add') return { text: `Adding job: ${short(argAfter(rest, /--title[=\s]+("[^"]*"|'[^']*'|\S+)/), 60)}`, counter: 'jobsAdded' };
          return { text: `Reading job ${first}` };
        case 'jobs': return { text: /--for-ranking/.test(rest) ? 'Reading the job cards' : 'Listing jobs' };
        case 'fetch': return { text: 'Fetching descriptions', counter: 'fetched' };
        case 'note': return { text: `Adding a note to ${first}`, counter: 'notes' };
        case 'sync': return { text: 'Syncing (git pull + import)' };
        case 'research': return { text: first === 'pdf-emails' ? 'Reading a paper PDF for e-mails' : 'Searching papers (OpenAlex)' };
        case 'manual-checked': return { text: `Recording the check of ${first}` };
        case 'mark': return { text: `Marking ${first} done` };
        default: return { text: `Running cli ${sub}` };
      }
    }
    return { text: `Running: ${short(cmd.split(/\r?\n/)[0], 60)}` };
  }
  if (name === 'Read') return { text: `Reading ${base(s(input.file_path))}` };
  if (name === 'Write' || name === 'Edit') return { text: `Writing ${base(s(input.file_path))}` };
  if (name === 'Glob' || name === 'Grep') return { text: 'Searching files' };
  if (name === 'WebSearch') return { text: `Searching the web: "${short(s(input.query), 60)}"` };
  if (name === 'WebFetch') return { text: `Opening ${host(s(input.url))}` };
  const chrome = name.match(/^mcp__claude-in-chrome__(.+)$/);
  if (chrome) {
    switch (chrome[1]) {
      case 'navigate': return { text: `Opening ${host(s(input.url))}` };
      case 'tabs_create_mcp': return { text: 'Opening a new tab' };
      case 'tabs_close_mcp': return { text: 'Closing the tab' };
      case 'tabs_context_mcp': return { text: 'Looking at the open tabs' };
      case 'get_page_text': return { text: 'Reading the page' };
      case 'read_page': return { text: 'Reading the page structure' };
      case 'find': return { text: `Looking for "${short(s(input.query), 50)}"` };
      case 'javascript_tool': return { text: 'Collecting the job links' };
      case 'form_input': return { text: 'Filling a form field' };
      case 'file_upload': return { text: 'Uploading a file' };
      case 'computer': return { text: `Browser: ${s(input.action) || 'action'}` };
      default: return { text: `Browser: ${chrome[1]}` };
    }
  }
  return { text: name.replace(/^mcp__/, '').replace(/__/g, ': ') };
}

const USAGE_LIMIT_RE = /usage limit|hit your (?:usage )?limit|limit reached|limit will reset|rate[_ ]limit(?:ed)?|out of (?:extra )?usage/i;

export const isUsageLimit = (text: string) => USAGE_LIMIT_RE.test(text);

/**
 * When the plan's usage limit resets, from texts like "Claude AI usage limit reached|1759262400",
 * "You've hit your limit · resets 3pm (America/New_York)" or "resets at 3:30 PM". Null if unknown.
 */
export function parseResetTime(text: string, now: Date = new Date()): string | null {
  const epoch = text.match(/\|(\d{10,13})\b/);
  if (epoch) { const n = Number(epoch[1]); return new Date(n < 1e12 ? n * 1000 : n).toISOString(); }
  const m = text.match(/resets?\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?/i);
  if (!m) return null;
  let h = Number(m[1]) % 12; if (m[3].toLowerCase() === 'p') h += 12;
  const d = new Date(now); d.setHours(h, Number(m[2] || 0), 0, 0);
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
  return d.toISOString();
}

function resultText(r: Json): string {
  if (typeof r.result === 'string') return r.result;
  if (Array.isArray(r.errors)) return r.errors.map(String).join('\n');
  return '';
}

/** Stateful parser for one run's stream (keeps the pending tool calls between lines). */
export class StreamParser {
  progress: RunProgress;
  sessionId: string | null = null;
  result: StreamResult | null = null;
  private pending = new Map<string, CounterKey>();

  constructor(progress: RunProgress = emptyProgress(), private clock: () => Date = () => new Date()) {
    this.progress = progress;
  }



  private step(text: string, kind: RunStep['kind']) {
    this.progress.steps.push({ at: this.clock().toISOString(), text, kind });
    if (this.progress.steps.length > MAX_STEPS) this.progress.steps.splice(0, this.progress.steps.length - MAX_STEPS);
  }

  /** Feeds one line. Returns the parsed event's type (or null for blank/malformed lines). */
  push(line: string): string | null {
    const t = line.trim();
    if (!t) return null;
    let ev: Json;
    try { ev = JSON.parse(t); } catch { this.progress.malformed++; return null; }
    if (!ev || typeof ev !== 'object') { this.progress.malformed++; return null; }
    const type = s(ev.type);
    if (type === 'system' && ev.subtype === 'init') {
      this.sessionId = s(ev.session_id) || this.sessionId;
      this.progress.model = s(ev.model) || undefined;
      const servers = Array.isArray(ev.mcp_servers) ? ev.mcp_servers as Json[] : [];
      this.progress.mcp = servers.map((m) => ({ name: s(m.name), status: s(m.status) }));
      this.progress.toolsLoaded = Array.isArray(ev.tools) ? ev.tools.length : undefined;
      this.step(`Started (${this.progress.model || 'model?'})`, 'info');
    } else if (type === 'assistant') {
      const content = ((ev.message as Json)?.content ?? ev.content) as Json[] | undefined;
      for (const block of Array.isArray(content) ? content : []) {
        if (block.type === 'text' && s(block.text).trim()) {
          this.progress.lastText = s(block.text).trim().slice(0, MAX_TEXT);
          if (isUsageLimit(s(block.text))) this.flagUsageLimit(s(block.text));
        } else if (block.type === 'tool_use') {
          const d = describeTool(s(block.name), (block.input as Json) || {});
          this.progress.counters.toolCalls++;
          if (d.counter) this.pending.set(s(block.id), d.counter);
          this.step(d.text, 'tool');
        }
      }
    } else if (type === 'user') {
      const content = ((ev.message as Json)?.content ?? ev.content) as Json[] | undefined;
      for (const block of Array.isArray(content) ? content : []) {
        if (block.type !== 'tool_result') continue;
        const id = s(block.tool_use_id);
        const text = typeof block.content === 'string' ? block.content
          : Array.isArray(block.content) ? (block.content as Json[]).map((c) => s(c.text)).join('\n') : '';
        const failed = Boolean(block.is_error) || /^\s*\{\s*"error"\s*:/.test(text);
        if (failed && /permission|denied|not allowed|requires approval/i.test(text)) {
          this.progress.counters.denied++;
          this.step(`Not allowed: ${short(text.replace(/\s+/g, ' '), 90)}`, 'error');
        }
        const counter = this.pending.get(id);
        if (counter) {
          this.pending.delete(id);
          if (!failed) this.progress.counters[counter]++;
        }
      }
    } else if (type === 'result') {
      const text = resultText(ev);
      const usage = (ev.usage || {}) as Json;
      const u: RunUsage = {
        input_tokens: Number(usage.input_tokens || 0), output_tokens: Number(usage.output_tokens || 0),
        cache_read_input_tokens: Number(usage.cache_read_input_tokens || 0), cache_creation_input_tokens: Number(usage.cache_creation_input_tokens || 0),
      };
      this.progress.usage = u;
      this.sessionId = s(ev.session_id) || this.sessionId;
      const denials = Array.isArray(ev.permission_denials) ? ev.permission_denials.length : 0;
      this.result = {
        subtype: s(ev.subtype) || 'unknown', isError: Boolean(ev.is_error), text,
        numTurns: ev.num_turns == null ? null : Number(ev.num_turns), durationMs: ev.duration_ms == null ? null : Number(ev.duration_ms),
        costUsd: ev.total_cost_usd == null ? null : Number(ev.total_cost_usd), sessionId: this.sessionId, denials,
      };
      if (text && isUsageLimit(text) && (this.result.isError || this.result.subtype !== 'success')) this.flagUsageLimit(text);
      this.step(this.result.subtype === 'success' && !this.result.isError ? 'Finished' : `Stopped: ${this.result.subtype}`, this.result.isError ? 'error' : 'info');
    }
    return type || null;
  }

  flagUsageLimit(text: string) {
    this.progress.usageLimit = { resetsAt: parseResetTime(text, this.clock()), text: short(text, 200) };
  }

  /** The Chrome MCP server's status from init ("connected", "failed", …), or null when absent. */
  chromeStatus(): string | null {
    const m = this.progress.mcp?.find((x) => x.name === 'claude-in-chrome');
    return m ? m.status : null;
  }
}
