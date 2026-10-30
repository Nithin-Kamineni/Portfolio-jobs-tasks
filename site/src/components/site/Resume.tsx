// The résumé as a React page: as plain as the PDF, but the reader can recolour it, switch the
// type, print it or save it as a PDF. Each look is a set of CSS variables on the sheet.

import { Fragment, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import { CV_PDF, LINKS, ME, PUBS, PUBS_INTERDISCIPLINARY, RESUME } from './content';

interface Look { id: string; name: string; swatch: [string, string]; vars: Record<string, string> }

const LOOKS: Look[] = [
  {
    id: 'fern', name: 'Fern', swatch: ['#2f9e44', '#6b7280'],
    vars: { '--r-paper': '#ffffff', '--r-ink': '#1f2328', '--r-muted': '#57606a', '--r-accent': '#237a35', '--r-rule': '#c9cdd2', '--r-head': '#ffffff', '--r-name': '#111418', '--r-title-bg': 'transparent', '--r-title': '#237a35' },
  },
  {
    id: 'bumblebee', name: 'Bumblebee', swatch: ['#ffd60a', '#111111'],
    vars: { '--r-paper': '#fffdf3', '--r-ink': '#161616', '--r-muted': '#4d4a3f', '--r-accent': '#111111', '--r-rule': '#e6dca5', '--r-head': '#111111', '--r-name': '#ffd60a', '--r-title-bg': '#ffd60a', '--r-title': '#111111' },
  },
  {
    id: 'ocean', name: 'Ocean', swatch: ['#0b2545', '#0f9b8e'],
    vars: { '--r-paper': '#f8fbfd', '--r-ink': '#13233a', '--r-muted': '#4a5b70', '--r-accent': '#0b6e66', '--r-rule': '#c8d8e4', '--r-head': '#0b2545', '--r-name': '#ffffff', '--r-title-bg': 'transparent', '--r-title': '#0b2545' },
  },
  {
    id: 'terracotta', name: 'Terracotta', swatch: ['#c2410c', '#f5e6d3'],
    vars: { '--r-paper': '#fffaf3', '--r-ink': '#2b2118', '--r-muted': '#6b5a4a', '--r-accent': '#c2410c', '--r-rule': '#ead8c3', '--r-head': '#fffaf3', '--r-name': '#9a3412', '--r-title-bg': 'transparent', '--r-title': '#c2410c' },
  },
  {
    id: 'graphite', name: 'Graphite', swatch: ['#111111', '#d4d4d4'],
    vars: { '--r-paper': '#ffffff', '--r-ink': '#111111', '--r-muted': '#555555', '--r-accent': '#111111', '--r-rule': '#d4d4d4', '--r-head': '#ffffff', '--r-name': '#111111', '--r-title-bg': 'transparent', '--r-title': '#111111' },
  },
  {
    id: 'midnight', name: 'Midnight', swatch: ['#0f141b', '#22d3ee'],
    vars: { '--r-paper': '#0f141b', '--r-ink': '#e6edf3', '--r-muted': '#9aa7b6', '--r-accent': '#22d3ee', '--r-rule': '#263142', '--r-head': '#0f141b', '--r-name': '#ffffff', '--r-title-bg': 'transparent', '--r-title': '#22d3ee' },
  },
];

const FONTS = [
  { id: 'sans', name: 'Sans' },
  { id: 'serif', name: 'Serif' },
  { id: 'mono', name: 'Mono' },
];

const listeners = new Set<() => void>();
const store = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) {
    try { localStorage.setItem(k, v); } catch { /* private mode */ }
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
};

/** A remembered choice. The prerendered HTML shows the default; the stored one applies on hydration. */
function useStored(key: string, fallback: string): [string, (v: string) => void] {
  const v = useSyncExternalStore(store.subscribe, () => store.get(key) ?? fallback, () => fallback);
  return [v, (nv) => store.set(key, nv)];
}

/** `**bold**` spans and my name in bold. */
function rich(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith('**') ? <b key={i}>{part.slice(2, -2)}</b> : <Fragment key={i}>{me(part)}</Fragment>,
  );
}
function me(text: string): ReactNode {
  const [a, b] = text.split(ME);
  return b === undefined ? text : <>{a}<b>{ME}</b>{b}</>;
}

const year = (when: string) => { const y = when.match(/\d{4}/); return y ? ` ${y[0]}` : ''; };

export default function Resume() {
  const [look, setLook] = useStored('resume-look', 'fern');
  const [font, setFont] = useStored('resume-font', 'sans');
  const [copied, setCopied] = useState(false);
  const L = LOOKS.find((l) => l.id === look) ?? LOOKS[0];

  const copy = async () => {
    try { await navigator.clipboard.writeText(LINKS.email); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* no clipboard */ }
  };

  return (
    <div className="resume-wrap">
      <div className="resume-bar" role="toolbar" aria-label="Résumé options">
        <div className="rb-group">
          <span className="rb-label" id="rb-look">Colour</span>
          <div className="swatches" role="radiogroup" aria-labelledby="rb-look">
            {LOOKS.map((l) => (
              <button
                key={l.id} type="button" role="radio" aria-checked={l.id === look} title={l.name} aria-label={l.name}
                className="swatch" onClick={() => setLook(l.id)}
                style={{ background: `linear-gradient(135deg, ${l.swatch[0]} 50%, ${l.swatch[1]} 50%)` }}
              />
            ))}
          </div>
          <span className="rb-name">{L.name}</span>
        </div>
        <div className="rb-group">
          <span className="rb-label" id="rb-font">Type</span>
          <div className="seg" role="radiogroup" aria-labelledby="rb-font">
            {FONTS.map((f) => (
              <button key={f.id} type="button" role="radio" aria-checked={f.id === font} onClick={() => setFont(f.id)}>{f.name}</button>
            ))}
          </div>
        </div>
        <div className="rb-actions">
          <button type="button" className="rb-btn" onClick={copy}>{copied ? 'Copied ✓' : 'Copy email'}</button>
          <button type="button" className="rb-btn" onClick={() => window.print()}>Print / save PDF</button>
          {CV_PDF && <a className="rb-btn primary" href={CV_PDF} download>Download PDF</a>}
        </div>
      </div>

      <article className={`resume font-${font} look-${L.id}`} style={L.vars as CSSProperties} aria-label="Résumé">
        <header className="r-head">
          <h3 className="r-name">{RESUME.name}</h3>
          <p className="r-contact">
            <a href={`mailto:${LINKS.email}`}>{LINKS.email}</a>
            <span>·</span><a href={LINKS.scholar} target="_blank" rel="noopener noreferrer">Google Scholar</a>
            <span>·</span><a href={LINKS.github} target="_blank" rel="noopener noreferrer">GitHub</a>
            <span>·</span><a href={LINKS.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </p>
        </header>

        <section className="r-sec">
          <h4>Summary</h4>
          <p>{RESUME.summary}</p>
        </section>

        <section className="r-sec">
          <h4>Education</h4>
          {RESUME.education.map((e) => (
            <div key={e.degree} className="r-item">
              <div className="r-row"><b>{e.degree}</b><i>{e.when}</i></div>
              <div className="r-sub">{e.school}</div>
              {e.lines.map((l) => <div key={l} className="r-line">{l}</div>)}
            </div>
          ))}
        </section>

        <section className="r-sec">
          <h4>Technical skills</h4>
          <dl className="r-skills">
            {RESUME.skills.map((s) => <div key={s.k}><dt>{s.k}:</dt> <dd>{s.v}</dd></div>)}
          </dl>
        </section>

        <section className="r-sec">
          <h4>Research &amp; professional experience</h4>
          {RESUME.jobs.map((j) => (
            <div key={j.title} className="r-item">
              <div className="r-row"><b>{j.org} – {j.title}</b><i>{j.when}</i></div>
              <ul>{j.points.map((p) => <li key={p}>{rich(p)}</li>)}</ul>
            </div>
          ))}
        </section>

        <section className="r-sec">
          <h4>Publications</h4>
          <ul className="r-pubs">
            {PUBS.map((p) => (
              <li key={p.title}>
                <b>[{p.venue}{year(p.when)}{p.review ? ', under review' : ''}]</b> {p.title}
                {p.href && <> (<a href={p.href} target="_blank" rel="noopener noreferrer">{p.linkLabel ?? 'link'}</a>)</>}
                <div className="r-authors">{me(p.authors)}</div>
              </li>
            ))}
          </ul>
          <div className="r-subhead">Interdisciplinary (ML for toxicology)</div>
          <ul className="r-pubs compact">
            {PUBS_INTERDISCIPLINARY.map((p) => (
              <li key={p.title}><b>[{p.venue} {p.when}]</b> {p.title}{p.href && <> (<a href={p.href} target="_blank" rel="noopener noreferrer">{p.linkLabel}</a>)</>}</li>
            ))}
          </ul>
        </section>

        <section className="r-sec">
          <h4>Awards, talks &amp; service</h4>
          <ul>{RESUME.awards.map((a) => <li key={a}>{a}</li>)}</ul>
        </section>
      </article>
    </div>
  );
}
