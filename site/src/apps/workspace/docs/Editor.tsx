// A Google-Docs-style rich text editor (TipTap/ProseMirror) with a formatting toolbar.
// Colours (text and highlight) are stored as theme tokens (var(--dc-…), var(--hl-…)), so the same
// document reads well in the dark, dim and light themes (ws.css defines each token per theme).
import { EditorContent, useEditor, useEditorState, type Editor as TEditor, type JSONContent } from '@tiptap/react';
import { Extension, InputRule } from '@tiptap/core';
import { canJoin, findWrapping } from '@tiptap/pm/transform';
import type { NodeType } from '@tiptap/pm/model';
import type { EditorView } from '@tiptap/pm/view';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { TableKit } from '@tiptap/extension-table';
import { TextStyleKit } from '@tiptap/extension-text-style';
import { CharacterCount, Placeholder } from '@tiptap/extensions';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Image from '@tiptap/extension-image';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '../ui';

// ---- fonts, sizes, colours ---------------------------------------------------------------------
// Web fonts beyond the site's own three come from Google Fonts, loaded only while a document is open.
const FONTS: { label: string; value: string; google?: string }[] = [
  { label: 'Inter', value: '' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Roboto', value: "'Roboto', sans-serif", google: 'Roboto:ital,wght@0,400;0,700;1,400;1,700' },
  { label: 'Open Sans', value: "'Open Sans', sans-serif", google: 'Open+Sans:ital,wght@0,400;0,700;1,400;1,700' },
  { label: 'Lato', value: "'Lato', sans-serif", google: 'Lato:ital,wght@0,400;0,700;1,400;1,700' },
  { label: 'Montserrat', value: "'Montserrat', sans-serif", google: 'Montserrat:ital,wght@0,400;0,700;1,400;1,700' },
  { label: 'Space Grotesk', value: "'Space Grotesk', sans-serif" },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
  { label: 'Merriweather', value: "'Merriweather', serif", google: 'Merriweather:ital,wght@0,400;0,700;1,400;1,700' },
  { label: 'Lora', value: "'Lora', serif", google: 'Lora:ital,wght@0,400;0,700;1,400;1,700' },
  { label: 'Playfair Display', value: "'Playfair Display', serif", google: 'Playfair+Display:ital,wght@0,400;0,700;1,400;1,700' },
  { label: 'Source Serif', value: "'Source Serif 4', serif", google: 'Source+Serif+4:ital,wght@0,400;0,700;1,400;1,700' },
  { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
  { label: 'Courier New', value: "'Courier New', Courier, monospace" },
  { label: 'Fira Code', value: "'Fira Code', monospace", google: 'Fira+Code:wght@400;700' },
  { label: 'Caveat (handwriting)', value: "'Caveat', cursive", google: 'Caveat:wght@400;700' },
];
function useDocFonts() {
  useEffect(() => {
    if (document.getElementById('doc-fonts')) return;
    const link = document.createElement('link');
    link.id = 'doc-fonts'; link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${FONTS.filter((f) => f.google).map((f) => `family=${f.google}`).join('&')}&display=swap`;
    document.head.appendChild(link);
  }, []);
}

const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 60, 72, 96];
const BASE_SIZE = 16;
const LINE_HEIGHTS = [['', 'Default'], ['1', 'Single'], ['1.15', '1.15'], ['1.5', '1.5'], ['2', 'Double']] as const;

const TEXT_COLORS = [
  ['', 'Default'], ['var(--dc-gray)', 'Grey'], ['var(--dc-red)', 'Red'], ['var(--dc-orange)', 'Orange'], ['var(--dc-yellow)', 'Yellow'],
  ['var(--dc-green)', 'Green'], ['var(--dc-teal)', 'Teal'], ['var(--dc-blue)', 'Blue'], ['var(--dc-purple)', 'Purple'], ['var(--dc-pink)', 'Pink'],
] as const;
const HIGHLIGHTS = [
  ['var(--hl-yellow)', 'Yellow'], ['var(--hl-green)', 'Green'], ['var(--hl-blue)', 'Blue'], ['var(--hl-pink)', 'Pink'],
  ['var(--hl-purple)', 'Purple'], ['var(--hl-orange)', 'Orange'], ['var(--hl-red)', 'Red'], ['var(--hl-gray)', 'Grey'],
] as const;

// ---- block attributes: indent (Tab / Shift+Tab) and line spacing ---------------------------------
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blockStyle: {
      indent: (delta: 1 | -1) => ReturnType;
      setLineSpacing: (value: string) => ReturnType;
    };
  }
}
const BLOCKS = ['paragraph', 'heading'];
const BlockStyle = Extension.create({
  name: 'blockStyle',
  priority: 1000,
  addGlobalAttributes() {
    return [{
      types: BLOCKS,
      attributes: {
        indent: {
          default: 0,
          parseHTML: (el) => Math.min(8, Number(el.getAttribute('data-indent')) || 0),
          renderHTML: (a) => (a.indent ? { 'data-indent': a.indent, style: `margin-left: ${a.indent * 2}em` } : {}),
        },
        lineSpacing: {
          default: null,
          parseHTML: (el) => el.getAttribute('data-spacing'),
          renderHTML: (a) => (a.lineSpacing ? { 'data-spacing': a.lineSpacing, style: `line-height: ${a.lineSpacing}` } : {}),
        },
      },
    }];
  },
  addCommands() {
    const each = (fn: (attrs: Record<string, unknown>) => Record<string, unknown> | null) => (): import('@tiptap/core').Command => ({ tr, state, dispatch }) => {
      let changed = false;
      state.doc.nodesBetween(state.selection.from, state.selection.to, (node, pos) => {
        if (!BLOCKS.includes(node.type.name)) return true;
        const next = fn(node.attrs);
        if (next) { tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...next }); changed = true; }
        return false;
      });
      if (changed && dispatch) dispatch(tr);
      return changed;
    };
    return {
      indent: (delta) => each((a) => {
        const n = Math.max(0, Math.min(8, Number(a.indent || 0) + delta));
        return n === a.indent ? null : { indent: n };
      })(),
      setLineSpacing: (value) => each(() => ({ lineSpacing: value || null }))(),
    };
  },
  addKeyboardShortcuts() {
    const inList = () => (this.editor.isActive('taskItem') ? 'taskItem' : this.editor.isActive('listItem') ? 'listItem' : null);
    return {
      // Like Google Docs: Tab indents (a list item nests), and never moves the focus out of the page.
      Tab: () => {
        if (this.editor.isActive('table')) return false;
        if (this.editor.isActive('codeBlock')) return this.editor.commands.insertContent('  ');
        const item = inList();
        if (item) { this.editor.commands.sinkListItem(item); return true; }
        this.editor.commands.indent(1);
        return true;
      },
      'Shift-Tab': () => {
        if (this.editor.isActive('table')) return false;
        const item = inList();
        if (item) { this.editor.commands.liftListItem(item); return true; }
        this.editor.commands.indent(-1);
        return true;
      },
      // Backspace right after a list was started by typing ("1. ") puts the typed text back (one
      // undo step: SmartLists keeps the conversion in its own history event); at the start of an
      // indented line it takes one indent away.
      Backspace: () => {
        const lists = (this.editor.storage as unknown as Record<string, { armed: boolean } | undefined>).smartLists;
        if (lists?.armed) { lists.armed = false; if (this.editor.commands.undo()) return true; }
        const { selection } = this.editor.state;
        const { $from, empty } = selection;
        if (!empty || $from.parentOffset !== 0 || !BLOCKS.includes($from.parent.type.name) || !$from.parent.attrs.indent) return false;
        return this.editor.commands.indent(-1);
      },
      'Mod-Shift-.': () => stepSize(this.editor, 1),
      'Mod-Shift-,': () => stepSize(this.editor, -1),
      'Mod-]': () => this.editor.commands.indent(1),
      'Mod-[': () => this.editor.commands.indent(-1),
    };
  },
});

// ---- lists as you type, like Google Docs ----------------------------------------------------------
// "1. ", "1) ", "a. ", "A) ", "i. ", "- ", "* " at the start of a line (also after Shift+Enter) start a
// list. Backspace right after it puts the typed text back (TipTap's undoInputRule).
const ROMAN = /^(?:i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii)$/;
function fromRoman(s: string) {
  const v: Record<string, number> = { i: 1, v: 5, x: 10 };
  let n = 0;
  for (let k = 0; k < s.length; k++) { const a = v[s[k]], b = v[s[k + 1]] ?? 0; n += a < b ? -a : a; }
  return n;
}
function markerAttrs(marker: string): { type: string | null; start: number } {
  if (/^\d+$/.test(marker)) return { type: null, start: Number(marker) };
  const low = marker.toLowerCase();
  if (ROMAN.test(low) && (marker.length > 1 || low === 'i')) return { type: marker === low ? 'i' : 'I', start: fromRoman(low) };
  return { type: marker === low ? 'a' : 'A', start: low.charCodeAt(0) - 96 };
}
const SmartLists = Extension.create({
  name: 'smartLists',
  priority: 1000,
  // "armed" right after a conversion, until anything else happens. (TipTap's own undoInputRule
  // can't be used: the trailing-node plugin's follow-up transaction clears its state.)
  addStorage() { return { armed: false }; },
  onTransaction({ transaction }) {
    if (transaction.getMeta('smartList')) this.storage.armed = true;
    else if (transaction.docChanged || transaction.selectionSet) this.storage.armed = false;
  },
  addInputRules() {
    const wrap = (listName: 'orderedList' | 'bulletList', getAttrs: (m: RegExpMatchArray) => Record<string, unknown>) => ({ state, range, match }: { state: import('@tiptap/pm/state').EditorState; range: { from: number; to: number }; match: RegExpMatchArray }) => {
      const tr = state.tr;
      const type: NodeType = state.schema.nodes[listName];
      const $start = state.doc.resolve(range.from);
      if (!$start.parent.isTextblock || $start.parent.type.spec.code) return null;
      const afterBreak = $start.nodeBefore?.type.name === 'hardBreak';
      tr.delete(range.from, range.to);
      let pos = range.from;
      if (afterBreak) { tr.delete(pos - 1, pos); tr.split(pos - 1); pos += 1; }
      const $pos = tr.doc.resolve(pos);
      if (BLOCKS.includes($pos.parent.type.name) && $pos.parent.attrs.indent) tr.setNodeMarkup($pos.before(), undefined, { ...$pos.parent.attrs, indent: 0 });
      const blockRange = tr.doc.resolve(pos).blockRange();
      const attrs = getAttrs(match);
      const wrapping = blockRange && findWrapping(blockRange, type, attrs);
      if (!blockRange || !wrapping) return null;
      tr.wrap(blockRange, wrapping);
      // Continue the list just above (e.g. "3. " right after a list that ends at 2).
      const before = tr.doc.resolve(blockRange.start).nodeBefore;
      if (before && before.type === type && canJoin(tr.doc, blockRange.start)
        && (listName === 'bulletList' || ((before.attrs.type ?? null) === attrs.type && before.childCount + before.attrs.start === attrs.start)))
        tr.join(blockRange.start);
      tr.setMeta('smartList', true);
      return undefined;
    };
    return [
      new InputRule({
        find: /(?<=^|\n)[ \t\u00a0]*(\d{1,3}|[a-zA-Z]|[ivxIVX]{2,4})([.)])\s$/,
        handler: wrap('orderedList', (m) => markerAttrs(m[1])),
      }),
      new InputRule({ find: /(?<=^|\n)[ \t\u00a0]*([-*+•])\s$/, handler: wrap('bulletList', () => ({})) }),
    ];
  },
});

// ---- tasks: checklist items with an optional due date ---------------------------------------------
// The date is stored on the item (YYYY-MM-DD) and shown as a chip after it; the Today page lists every
// open item of every document, with its date.
export const dueLabel = (due: string, today = localDay()): { label: string; state: 'late' | 'today' | 'soon' | 'later' } => {
  const days = Math.round((Date.parse(due + 'T12:00:00Z') - Date.parse(today + 'T12:00:00Z')) / 864e5);
  if (days < 0) return { label: days === -1 ? 'Due yesterday' : `${-days} days late`, state: 'late' };
  if (days === 0) return { label: 'Due today', state: 'today' };
  if (days === 1) return { label: 'Due tomorrow', state: 'soon' };
  const d = new Date(due + 'T12:00:00Z');
  const label = d.toLocaleDateString(undefined, { weekday: days < 7 ? 'short' : undefined, month: 'short', day: 'numeric', timeZone: 'UTC' });
  return { label: `Due ${label}`, state: days < 7 ? 'soon' : 'later' };
};
export const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const DocTaskItem = TaskItem.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      due: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-due'),
        renderHTML: (a) => {
          if (!a.due) return {};
          const { label, state } = dueLabel(a.due as string);
          return { 'data-due': a.due, 'data-due-label': label, 'data-due-state': state };
        },
      },
    };
  },
}).configure({ nested: true });

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    docTasks: {
      /** The selected lines (paragraphs or list points) become checklist items; again turns them back. */
      makeChecklist: () => ReturnType;
      setTaskDue: (due: string | null) => ReturnType;
    };
  }
}
const DocTasks = Extension.create({
  name: 'docTasks',
  addCommands() {
    return {
      // Only the selected points of a bulleted/numbered list change (the rest stays a list).
      makeChecklist: () => ({ editor, chain }) => {
        if (editor.isActive('taskList')) return chain().toggleTaskList().run();
        if (editor.isActive('bulletList') || editor.isActive('orderedList')) {
          let ok = chain().liftListItem('listItem').run();
          while (ok && (editor.isActive('bulletList') || editor.isActive('orderedList'))) ok = chain().liftListItem('listItem').run();
        }
        return chain().toggleTaskList().run();
      },
      setTaskDue: (due) => ({ tr, state, dispatch }) => {
        let changed = false;
        const { from, to } = state.selection;
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (node.type.name !== 'taskItem') return true;
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, due });
          changed = true;
          return true;
        });
        // A cursor inside an item (no range): the nearest task item around it.
        if (!changed) {
          const $f = state.selection.$from;
          for (let d = $f.depth; d > 0; d--) if ($f.node(d).type.name === 'taskItem') { tr.setNodeMarkup($f.before(d), undefined, { ...$f.node(d).attrs, due }); changed = true; break; }
        }
        if (changed && dispatch) dispatch(tr);
        return changed;
      },
    };
  },
});

// Images can be aligned like a paragraph (left / centre / right).
const DocImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: { default: null, parseHTML: (el) => el.getAttribute('data-align'), renderHTML: (a) => (a.align ? { 'data-align': a.align } : {}) },
    };
  },
}).configure({ resize: { enabled: true, directions: ['top-left', 'top-right', 'bottom-left', 'bottom-right'], minWidth: 48, minHeight: 32, alwaysPreserveAspectRatio: true } });

const baseExtensions = () => [
  StarterKit.configure({ link: { openOnClick: false, autolink: true, defaultProtocol: 'https' }, heading: { levels: [1, 2, 3, 4, 5, 6] } }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Highlight.configure({ multicolor: true }),
  TaskList, DocTaskItem, DocTasks,
  TableKit.configure({ table: { resizable: true } }),
  TextStyleKit,
  Subscript, Superscript,
  DocImage,
  BlockStyle,
  SmartLists,
  CharacterCount,
];
export const docExtensions = baseExtensions;

/** A read-only rendering of a saved document (version previews). */
export function ReadOnlyDoc({ content }: { content: JSONContent | null }) {
  useDocFonts();
  const editor = useEditor({ extensions: docExtensions(), content: content ?? '', editable: false, editorProps: { attributes: { class: 'doc-prose' } } }, [content]);
  return <EditorContent editor={editor} />;
}

// ---- images: shrink in the browser, store in D1 ---------------------------------------------------
const MAX_SIDE = 2000, MAX_BYTES = 1_700_000;
async function shrink(file: File): Promise<Blob> {
  if (file.type === 'image/gif' && file.size <= MAX_BYTES) return file; // keep animations
  const bmp = await createImageBitmap(file);
  let scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  if (scale === 1 && file.size <= 900_000 && ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { bmp.close(); return file; }
  for (let quality = 0.86; ; quality -= 0.12, scale *= 0.8) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(bmp.width * scale)); c.height = Math.max(1, Math.round(bmp.height * scale));
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, 'image/webp', quality));
    if (blob && (blob.size <= MAX_BYTES || quality < 0.4)) { bmp.close(); return blob; }
  }
}
export async function uploadImage(file: File, docId: number): Promise<string> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') throw new Error('Use a PNG, JPEG, WebP or GIF image');
  const blob = await shrink(file);
  const res = await fetch(`/api/ws/doc-images?doc=${docId}`, { method: 'POST', headers: { 'Content-Type': blob.type }, body: blob });
  const data = (await res.json().catch(() => ({}))) as { src?: string; error?: string };
  if (!res.ok || !data.src) throw new Error(data.error || `Upload failed (${res.status})`);
  return data.src;
}
const imageFiles = (list: FileList | null | undefined) => [...(list ?? [])].filter((f) => f.type.startsWith('image/'));

export function useDocEditor(content: JSONContent | null, docId: number, onChange: (json: JSONContent, text: string) => void) {
  useDocFonts();
  const toast = useToast();
  // Pasted or dropped image files are uploaded, then inserted where they were pasted/dropped.
  const insertFiles = (view: EditorView, files: File[], at?: number) => {
    toast({ text: files.length > 1 ? `Uploading ${files.length} images…` : 'Uploading the image…' });
    void (async () => {
      for (const f of files) {
        try {
          const src = await uploadImage(f, docId);
          const node = view.state.schema.nodes.image.create({ src, alt: f.name.replace(/\.[^.]+$/, '') });
          const pos = at !== undefined ? Math.min(at, view.state.doc.content.size) : view.state.selection.from;
          view.dispatch(view.state.tr.insert(pos, node));
          if (at !== undefined) at = pos + node.nodeSize;
        } catch (e) { toast({ text: (e as Error).message }); }
      }
    })();
  };
  return useEditor({
    extensions: [
      ...baseExtensions(),
      Placeholder.configure({ placeholder: 'Start writing… Type # for a heading, 1. or - for a list, [] for a checklist.' }),
    ],
    content: content ?? '',
    editorProps: {
      attributes: { class: 'doc-prose', spellcheck: 'true' },
      handlePaste: (view, event) => {
        const files = imageFiles(event.clipboardData?.files);
        if (!files.length) return false;
        event.preventDefault();
        insertFiles(view, files);
        return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        const files = moved ? [] : imageFiles(event.dataTransfer?.files);
        if (!files.length) return false;
        event.preventDefault();
        insertFiles(view, files, view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos);
        return true;
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON(), editor.getText()),
  }, []);
}

// ---- toolbar --------------------------------------------------------------------------------------
const sizeOf = (e: TEditor) => parseFloat((e.getAttributes('textStyle').fontSize as string) || '') || 0;
function stepSize(e: TEditor, dir: 1 | -1) {
  const cur = sizeOf(e) || BASE_SIZE;
  const next = dir > 0 ? SIZES.find((s) => s > cur) : [...SIZES].reverse().find((s) => s < cur);
  return next ? e.chain().focus().setFontSize(`${next}px`).run() : false;
}

function Btn({ on, title, onClick, children, disabled }: { on?: boolean; title: string; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return <button type="button" className={`doc-btn${on ? ' on' : ''}`} title={title} aria-label={title} aria-pressed={on} disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={onClick}>{children}</button>;
}
const Sep = () => <span className="doc-sep" aria-hidden="true" />;

type Menu = '' | 'color' | 'mark' | 'size' | 'link' | 'image' | 'spacing' | 'due';

export function Toolbar({ editor, docId }: { editor: TEditor; docId: number }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      block: e.isActive('heading', { level: 1 }) ? 'h1' : e.isActive('heading', { level: 6 }) ? 'h6' : e.isActive('heading', { level: 2 }) ? 'h2' : e.isActive('heading', { level: 3 }) ? 'h3' : e.isActive('heading', { level: 4 }) ? 'h4' : e.isActive('heading', { level: 5 }) ? 'h5' : 'p',
      bold: e.isActive('bold'), italic: e.isActive('italic'), underline: e.isActive('underline'), strike: e.isActive('strike'), code: e.isActive('code'),
      sub: e.isActive('subscript'), sup: e.isActive('superscript'), link: e.isActive('link'), image: e.isActive('image'),
      left: e.isActive({ textAlign: 'left' }) || e.isActive('image', { align: 'left' }), center: e.isActive({ textAlign: 'center' }) || e.isActive('image', { align: 'center' }),
      right: e.isActive({ textAlign: 'right' }) || e.isActive('image', { align: 'right' }), justify: e.isActive({ textAlign: 'justify' }),
      bullet: e.isActive('bulletList'), ordered: e.isActive('orderedList'), task: e.isActive('taskList'), due: (e.getAttributes('taskItem').due as string) || '', quote: e.isActive('blockquote'), codeBlock: e.isActive('codeBlock'), table: e.isActive('table'),
      font: (e.getAttributes('textStyle').fontFamily as string) || '', size: sizeOf(e),
      color: (e.getAttributes('textStyle').color as string) || '', mark: (e.getAttributes('highlight').color as string) || '',
      spacing: (e.getAttributes('paragraph').lineSpacing as string) || (e.getAttributes('heading').lineSpacing as string) || '',
      canUndo: e.can().undo(), canRedo: e.can().redo(),
    }),
  });
  const [menu, setMenu] = useState<Menu>('');
  const [sizeText, setSizeText] = useState('');
  const [href, setHref] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const c = () => editor.chain().focus();
  useEffect(() => { setSizeText(s.size ? String(s.size) : ''); }, [s.size]);
  // A click outside closes an open menu; Escape too.
  useEffect(() => {
    if (!menu) return;
    const down = (e: PointerEvent) => { if (!barRef.current?.contains(e.target as Node)) setMenu(''); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMenu(''); editor.commands.focus(); } };
    window.addEventListener('pointerdown', down); window.addEventListener('keydown', key);
    return () => { window.removeEventListener('pointerdown', down); window.removeEventListener('keydown', key); };
  }, [menu, editor]);
  const toggle = (m: Menu) => setMenu((x) => (x === m ? '' : m));
  const openLink = () => { setHref((editor.getAttributes('link').href as string) ?? ''); setMenu('link'); };
  // Ctrl+K opens the link box, like Google Docs.
  useEffect(() => {
    const dom = editor.view.dom;
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openLink(); } };
    dom.addEventListener('keydown', onKey);
    return () => dom.removeEventListener('keydown', onKey);
  }, [editor]); // eslint-disable-line react-hooks/exhaustive-deps

  const setBlock = (v: string) => (v === 'p' ? c().setParagraph().run() : c().setHeading({ level: Number(v[1]) as 1 | 2 | 3 | 4 | 5 | 6 }).run());
  const applySize = (v: string) => {
    const n = Math.round(Number(v));
    if (!v) c().unsetFontSize().run();
    else if (n >= 6 && n <= 200) c().setFontSize(`${n}px`).run();
    setMenu('');
  };
  const applyLink = () => {
    const v = href.trim();
    if (!v) c().extendMarkRange('link').unsetLink().run();
    else c().extendMarkRange('link').setLink({ href: /^[a-z]+:/i.test(v) ? v : `https://${v}` }).run();
    setMenu('');
  };
  const align = (a: 'left' | 'center' | 'right' | 'justify') => (s.image ? c().updateAttributes('image', { align: a === 'justify' ? null : a }).run() : c().setTextAlign(a).run());
  const pickFiles = async (files: File[]) => {
    setMenu('');
    if (!files.length) return;
    setBusy(true);
    try { for (const f of files) c().setImage({ src: await uploadImage(f, docId), alt: f.name.replace(/\.[^.]+$/, '') }).run(); }
    catch (e) { toast({ text: (e as Error).message }); }
    finally { setBusy(false); }
  };
  const addImageUrl = () => {
    const v = imgUrl.trim();
    if (!/^https?:\/\//i.test(v)) { toast({ text: 'Use an image address that starts with https://' }); return; }
    c().setImage({ src: v }).run(); setImgUrl(''); setMenu('');
  };
  const swatch = (col: string, label: string, on: boolean, run: () => void, kind: 'fg' | 'bg') => (
    <button key={label} type="button" className={`doc-sw${on ? ' on' : ''}`} title={label} aria-label={label} aria-pressed={on} onMouseDown={(e) => e.preventDefault()}
      onClick={() => { run(); setMenu(''); }}>
      <span style={kind === 'fg' ? { color: col || 'var(--text)' } : { background: col }}>{kind === 'fg' ? 'A' : col ? 'ab' : '⨯'}</span>
    </button>
  );

  return (
    <div className="doc-toolbar" role="toolbar" aria-label="Formatting" ref={barRef}>
      <Btn title="Undo (Ctrl+Z)" onClick={() => c().undo().run()} disabled={!s.canUndo}>↶</Btn>
      <Btn title="Redo (Ctrl+Y)" onClick={() => c().redo().run()} disabled={!s.canRedo}>↷</Btn>
      <Sep />
      <select className="doc-select doc-style" value={s.block} onChange={(e) => setBlock(e.target.value)} aria-label="Text style">
        <option value="p">Normal text</option><option value="h1">Title</option><option value="h6">Subtitle</option>
        <option value="h2">Heading 1</option><option value="h3">Heading 2</option><option value="h4">Heading 3</option><option value="h5">Heading 4</option>
      </select>
      <select className="doc-select doc-font" value={FONTS.some((f) => f.value === s.font) ? s.font : ''} onChange={(e) => (e.target.value ? c().setFontFamily(e.target.value).run() : c().unsetFontFamily().run())} aria-label="Font"
        style={{ fontFamily: s.font || undefined }}>
        {FONTS.map((f) => <option key={f.label} value={f.value} style={{ fontFamily: f.value || 'var(--sans)' }}>{f.label}</option>)}
      </select>
      <Sep />
      <span className="doc-size-box">
        <Btn title="Smaller (Ctrl+Shift+,)" onClick={() => stepSize(editor, -1)}>−</Btn>
        <span className="doc-pop">
          <input className="doc-size-in" value={sizeText} placeholder={String(BASE_SIZE)} inputMode="numeric" aria-label="Font size" title="Font size"
            onFocus={() => setMenu('size')} onChange={(e) => setSizeText(e.target.value.replace(/[^\d]/g, '').slice(0, 3))}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applySize(sizeText); } }} />
          {menu === 'size' && (
            <span className="doc-menu doc-size-menu" role="listbox" aria-label="Font sizes">
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applySize('')} className={!s.size ? 'on' : ''}>Default ({BASE_SIZE})</button>
              {SIZES.map((z) => <button key={z} type="button" role="option" aria-selected={s.size === z} className={s.size === z ? 'on' : ''} onMouseDown={(e) => e.preventDefault()} onClick={() => applySize(String(z))}>{z}</button>)}
            </span>
          )}
        </span>
        <Btn title="Bigger (Ctrl+Shift+.)" onClick={() => stepSize(editor, 1)}>+</Btn>
      </span>
      <Sep />
      <Btn title="Bold (Ctrl+B)" on={s.bold} onClick={() => c().toggleBold().run()}><b>B</b></Btn>
      <Btn title="Italic (Ctrl+I)" on={s.italic} onClick={() => c().toggleItalic().run()}><i>I</i></Btn>
      <Btn title="Underline (Ctrl+U)" on={s.underline} onClick={() => c().toggleUnderline().run()}><u>U</u></Btn>
      <Btn title="Strikethrough" on={s.strike} onClick={() => c().toggleStrike().run()}><s>S</s></Btn>
      <span className="doc-pop">
        <Btn title="Text colour" on={menu === 'color'} onClick={() => toggle('color')}><span className="doc-a" style={{ borderColor: s.color || 'var(--text)' }}>A</span></Btn>
        {menu === 'color' && (
          <span className="doc-menu doc-colors">
            <span className="ws-label">Text colour</span>
            <span className="doc-swatches">{TEXT_COLORS.map(([col, label]) => swatch(col, label, s.color === col, () => (col ? c().setColor(col) : c().unsetColor()).run(), 'fg'))}</span>
            <label className="doc-custom">Custom <input type="color" value={/^#[0-9a-f]{6}$/i.test(s.color) ? s.color : '#888888'} onChange={(e) => c().setColor(e.target.value).run()} /></label>
            <small className="ws-muted">Named colours adjust to the light and dark themes.</small>
          </span>
        )}
      </span>
      <span className="doc-pop">
        <Btn title="Highlight" on={menu === 'mark'} onClick={() => toggle('mark')}><span className="doc-hl" style={{ background: s.mark || 'var(--hl-yellow)' }}>H</span></Btn>
        {menu === 'mark' && (
          <span className="doc-menu doc-colors">
            <span className="ws-label">Highlight</span>
            <span className="doc-swatches">
              {swatch('', 'No highlight', !s.mark, () => c().unsetHighlight().run(), 'bg')}
              {HIGHLIGHTS.map(([col, label]) => swatch(col, label, s.mark === col, () => c().setHighlight({ color: col }).run(), 'bg'))}
            </span>
            <small className="ws-muted">Each colour has its own shade for the dark, dim and light themes, so the text stays readable.</small>
          </span>
        )}
      </span>
      <Sep />
      <span className="doc-pop">
        <Btn title="Link (Ctrl+K)" on={s.link || menu === 'link'} onClick={() => (menu === 'link' ? setMenu('') : openLink())}>🔗</Btn>
        {menu === 'link' && (
          <form className="doc-menu doc-form" onSubmit={(e) => { e.preventDefault(); applyLink(); }}>
            <input autoFocus value={href} onChange={(e) => setHref(e.target.value)} placeholder="Paste or type a link" aria-label="Link address" />
            <button className="ws-primary" type="submit">Apply</button>
            {s.link && <button className="ws-ghost" type="button" onClick={() => { c().extendMarkRange('link').unsetLink().run(); setMenu(''); }}>Remove</button>}
          </form>
        )}
      </span>
      <span className="doc-pop">
        <Btn title="Insert image" on={menu === 'image'} disabled={busy} onClick={() => toggle('image')}>{busy ? '…' : '🖼'}</Btn>
        {menu === 'image' && (
          <span className="doc-menu doc-form doc-img-menu">
            <button type="button" className="ws-primary" onClick={() => fileRef.current?.click()}>Upload from computer…</button>
            <form onSubmit={(e) => { e.preventDefault(); addImageUrl(); }}>
              <input value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} placeholder="…or an image address (https://)" aria-label="Image address" />
              <button className="ws-ghost" type="submit">Insert</button>
            </form>
            <small className="ws-muted">You can also paste an image (Ctrl+V) or drop one on the page. Drag an image's corner to resize it.</small>
          </span>
        )}
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" multiple hidden onChange={(e) => { void pickFiles(imageFiles(e.target.files)); e.target.value = ''; }} />
      </span>
      <Sep />
      <Btn title={s.image ? 'Image left' : 'Align left'} on={s.left} onClick={() => align('left')}>⯇</Btn>
      <Btn title={s.image ? 'Image centre' : 'Align centre'} on={s.center} onClick={() => align('center')}>≡</Btn>
      <Btn title={s.image ? 'Image right' : 'Align right'} on={s.right} onClick={() => align('right')}>⯈</Btn>
      <Btn title="Justify" on={s.justify} onClick={() => align('justify')}>☰</Btn>
      <span className="doc-pop">
        <Btn title="Line spacing" on={menu === 'spacing'} onClick={() => toggle('spacing')}>↕</Btn>
        {menu === 'spacing' && (
          <span className="doc-menu doc-list-menu" role="menu">
            {LINE_HEIGHTS.map(([v, label]) => <button key={label} type="button" role="menuitemradio" aria-checked={s.spacing === v} className={s.spacing === v ? 'on' : ''} onMouseDown={(e) => e.preventDefault()} onClick={() => { c().setLineSpacing(v).run(); setMenu(''); }}>{label}</button>)}
          </span>
        )}
      </span>
      <Sep />
      <Btn title="Bulleted list (type - )" on={s.bullet} onClick={() => c().toggleBulletList().run()}>•≡</Btn>
      <Btn title="Numbered list (type 1. )" on={s.ordered} onClick={() => c().toggleOrderedList().run()}>1≡</Btn>
      <button type="button" className={`doc-btn doc-check-btn${s.task ? ' on' : ''}`} title="Checklist: select some lines or list points, then click to give them tick boxes (click again to undo). Typing [] also starts one."
        aria-pressed={s.task} onMouseDown={(e) => e.preventDefault()} onClick={() => c().makeChecklist().run()}>☑ Checklist</button>
      {s.task && (
        <span className="doc-pop">
          <Btn title="Due date for the selected checklist items" on={menu === 'due' || !!s.due} onClick={() => toggle('due')}>📅{s.due ? <small className="doc-due-mini">{dueLabel(s.due).label.replace('Due ', '')}</small> : null}</Btn>
          {menu === 'due' && (
            <span className="doc-menu doc-due-menu">
              <span className="ws-label">Due date</span>
              <input type="date" value={s.due} onChange={(e) => { c().setTaskDue(e.target.value || null).run(); }} aria-label="Due date" />
              <span className="doc-due-quick">
                {([['Today', 0], ['Tomorrow', 1], ['In 3 days', 3], ['Next week', 7]] as const).map(([label, n]) => (
                  <button key={label} type="button" className="ws-ghost" onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { const d = new Date(); d.setDate(d.getDate() + n); c().setTaskDue(localDay(d)).run(); setMenu(''); }}>{label}</button>
                ))}
              </span>
              {s.due && <button type="button" className="ws-link" onMouseDown={(e) => e.preventDefault()} onClick={() => { c().setTaskDue(null).run(); setMenu(''); }}>Remove the date</button>}
              <small className="ws-muted">Items with a date show on the Today page with a countdown; items without one are listed there too.</small>
            </span>
          )}
        </span>
      )}
      <Btn title="Decrease indent (Shift+Tab)" onClick={() => (s.bullet || s.ordered || s.task ? c().liftListItem(s.task ? 'taskItem' : 'listItem').run() : c().indent(-1).run())}>⇤</Btn>
      <Btn title="Increase indent (Tab)" onClick={() => (s.bullet || s.ordered || s.task ? c().sinkListItem(s.task ? 'taskItem' : 'listItem').run() : c().indent(1).run())}>⇥</Btn>
      <Sep />
      <Btn title="Quote" on={s.quote} onClick={() => c().toggleBlockquote().run()}>❝</Btn>
      <Btn title="Code block" on={s.codeBlock} onClick={() => c().toggleCodeBlock().run()}>{'{ }'}</Btn>
      <Btn title="Inline code" on={s.code} onClick={() => c().toggleCode().run()}>{'</>'}</Btn>
      <Btn title="Subscript" on={s.sub} onClick={() => c().toggleSubscript().run()}>x₂</Btn>
      <Btn title="Superscript" on={s.sup} onClick={() => c().toggleSuperscript().run()}>x²</Btn>
      <Btn title="Horizontal line" onClick={() => c().setHorizontalRule().run()}>―</Btn>
      <Btn title="Insert table" onClick={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>⊞</Btn>
      <Btn title="Clear formatting" onClick={() => c().unsetAllMarks().clearNodes().setLineSpacing('').run()}>T̸</Btn>
      {s.table && (
        <span className="doc-table-tools">
          <Sep />
          <Btn title="Row above" onClick={() => c().addRowBefore().run()}>+↑</Btn>
          <Btn title="Row below" onClick={() => c().addRowAfter().run()}>+↓</Btn>
          <Btn title="Column left" onClick={() => c().addColumnBefore().run()}>+←</Btn>
          <Btn title="Column right" onClick={() => c().addColumnAfter().run()}>+→</Btn>
          <Btn title="Delete row" onClick={() => c().deleteRow().run()}>−row</Btn>
          <Btn title="Delete column" onClick={() => c().deleteColumn().run()}>−col</Btn>
          <Btn title="Delete table" onClick={() => c().deleteTable().run()}>✕⊞</Btn>
        </span>
      )}
    </div>
  );
}

export function Page({ editor }: { editor: TEditor }) {
  return <div className="doc-page"><EditorContent editor={editor} /></div>;
}
