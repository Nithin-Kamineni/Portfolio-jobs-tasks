// Markdown → sanitized HTML for answers and cards: headings, paragraphs, nested lists, fenced code,
// tables, blockquotes, bold/italic/inline code, links. Output always goes through DOMPurify.
import DOMPurify from 'dompurify';
import { useMemo } from 'react';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function inline(s: string): string {
  const codes: string[] = [];
  let t = s.replace(/`([^`]+)`/g, (_, c) => { codes.push(`<code>${esc(c)}</code>`); return `\u0000${codes.length - 1}\u0000`; });
  t = esc(t)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/(^|[\s(])_([^_\s][^_]*)_(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return t.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[Number(i)]);
}
const cells = (row: string) => row.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

export function mdToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  const stack: { type: 'ul' | 'ol'; indent: number }[] = [];
  let para: string[] = [];
  const flushPara = () => { if (para.length) { out.push(`<p>${para.map(inline).join('<br>')}</p>`); para = []; } };
  const closeLists = (indent = -1) => { while (stack.length && stack[stack.length - 1].indent > indent) out.push(`</li></${stack.pop()!.type}>`); };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = line.match(/^\s*```\s*([\w+-]*)/);
    if (fence) {
      flushPara(); closeLists();
      const body: string[] = [];
      for (i++; i < lines.length && !/^\s*```/.test(lines[i]); i++) body.push(lines[i]);
      out.push(`<pre><code class="lang-${esc(fence[1] || 'text')}">${esc(body.join('\n'))}</code></pre>`);
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      flushPara(); closeLists();
      const head = cells(line); const rows: string[][] = [];
      for (i += 2; i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i]); i++) rows.push(cells(lines[i]));
      i--;
      out.push(`<table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
      continue;
    }
    if (!line.trim()) { flushPara(); if (!/^\s*([-*]|\d+[.)])\s/.test(lines[i + 1] ?? '')) closeLists(); continue; }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) { flushPara(); closeLists(); const n = Math.min(6, h[1].length + 2); out.push(`<h${n}>${inline(h[2])}</h${n}>`); continue; }
    const quote = line.match(/^\s*>\s?(.*)$/);
    if (quote) { flushPara(); closeLists(); out.push(`<blockquote>${inline(quote[1])}</blockquote>`); continue; }
    const li = line.match(/^(\s*)([-*]|\d+[.)])\s+(.*)$/);
    if (li) {
      flushPara();
      const indent = li[1].replace(/\t/g, '  ').length, type = /\d/.test(li[2]) ? 'ol' : 'ul';
      const top = stack[stack.length - 1];
      if (!top || indent > top.indent) { stack.push({ type, indent }); out.push(`<${type}><li>`); }
      else {
        closeLists(indent);
        const cur = stack[stack.length - 1];
        if (cur && cur.indent === indent && cur.type === type) out.push('</li><li>');
        else { if (cur && cur.indent === indent) out.push(`</li></${stack.pop()!.type}>`); stack.push({ type, indent }); out.push(`<${type}><li>`); }
      }
      out.push(inline(li[3]));
      continue;
    }
    if (stack.length && /^\s{2,}\S/.test(line)) { out.push(' ' + inline(line.trim())); continue; }
    closeLists();
    para.push(line.trim());
  }
  flushPara(); closeLists();
  return DOMPurify.sanitize(out.join(''), { ADD_ATTR: ['target', 'rel'] });
}

export function Markdown({ text, className = '' }: { text: string; className?: string }) {
  const html = useMemo(() => mdToHtml(text), [text]);
  return <div className={`ws-md ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
