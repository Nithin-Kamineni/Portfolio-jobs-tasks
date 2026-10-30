import { lazy, Suspense, type ReactNode } from 'react';
import {
  EDUCATION, EXPERIENCE, LINKS, ME, PROJECTS, PUBS, PUBS_INTERDISCIPLINARY, RECOGNITION, SECTIONS, SKILLS, STATS, type Pub,
} from './content';
import { OWNER } from '../../owner.config';
// Below the fold: loaded as separate chunks so the first download is just the hero and the text.
const PhotoStory = lazy(() => import('./photos/PhotoStory'));
const Resume = lazy(() => import('./Resume'));

function Section({ id, n, title, children }: { id: string; n: number; title: string; children: ReactNode }) {
  return (
    <section id={id} className="sec" aria-labelledby={`${id}-h`}>
      <div className="sec-head">
        <span className="sec-no">{String(n).padStart(2, '0')}</span>
        <h2 id={`${id}-h`}>{title}</h2>
        <span className="sec-trace" aria-hidden="true" />
      </div>
      {children}
    </section>
  );
}

const title = (id: string) => SECTIONS.find((s) => s.id === id)!.label;

function Authors({ text }: { text: string }) {
  const [before, after] = text.split(ME);
  if (after === undefined) return <>{text}</>;
  return <>{before}<b>{ME}</b>{after}</>;
}

function ext(href: string) {
  return href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {};
}

function Tags({ list }: { list?: string[] }) {
  if (!list?.length) return null;
  return <ul className="tags" aria-label="Methods and tools">{list.map((t) => <li key={t}>{t}</li>)}</ul>;
}

function About() {
  return (
    <Section id="about" n={1} title={title('about')}>
      <div className="about">
        <div className="about-text">
          {OWNER.about.map((p) => <p key={p}>{p}</p>)}
          <div className="seeking">
            <span className="seeking-k"><span className="dot" />Open to</span>
            <p>{OWNER.seeking}</p>
            <div className="seeking-cta">
              <a className="btn primary" href={`mailto:${LINKS.email}`}>Email me</a>
              <a className="btn" href="#cv">See my résumé</a>
            </div>
          </div>
        </div>
        <Suspense fallback={<div className="story"><div className="story-frame" /></div>}><PhotoStory /></Suspense>
      </div>

      <ul className="stats" aria-label="At a glance">
        {STATS.map((s) => (
          <li key={s.value} className="stat"><b>{s.value}</b><span>{s.label}</span></li>
        ))}
      </ul>

      <div className="about-facts">
        <div className="panel">
          <h3>Education</h3>
          <ul className="edu">
            {EDUCATION.map((e) => (
              <li key={e.degree}>
                <b>{e.degree}</b>
                <span>{e.school} · {e.when}</span>
                <span className="muted">{e.note}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <h3>Recognition &amp; service</h3>
          <ul className="ticks">
            {RECOGNITION.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </div>
      </div>

      <dl className="skills">
        {SKILLS.map((s) => (
          <div key={s.group}><dt>{s.group}</dt><dd>{s.items}</dd></div>
        ))}
      </dl>
    </Section>
  );
}

function Research() {
  return (
    <Section id="research" n={2} title={title('research')}>
      <div className="cards">
        {PROJECTS.map((p) => (
          <article key={p.name} className="panel card">
            <header className="card-head">
              <h3>{p.name}</h3>
              <span className={`tagline ${p.review ? 'review' : ''}`}>
                <b>{p.venue}</b>{p.review ? 'under review' : p.role}
              </span>
            </header>
            <div className="metric"><b>{p.metric}</b><span>{p.metricLabel}</span></div>
            <p>{p.what}</p>
            <p className="why"><span className="why-k">why it matters</span>{p.why}</p>
            {p.extra && <p className="muted small">{p.extra}</p>}
            <Tags list={p.tags} />
            {p.links.length > 0 && (
              <p className="card-links">
                {p.links.map((l) => <a key={l.href} href={l.href} {...ext(l.href)}>{l.label} ↗</a>)}
              </p>
            )}
          </article>
        ))}
      </div>
    </Section>
  );
}

function Experience() {
  return (
    <Section id="experience" n={3} title={title('experience')}>
      <ol className="timeline">
        {EXPERIENCE.map((j) => (
          <li key={j.title} className="job">
            <div className="job-when">{j.when}</div>
            <div className="job-body">
              <h3>{j.title}</h3>
              <div className="muted">{j.org}</div>
              {j.points.length > 0 && <ul>{j.points.map((p) => <li key={p}>{p}</li>)}</ul>}
              <Tags list={j.tags} />
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function PubList({ pubs }: { pubs: Pub[] }) {
  return (
    <ol className="pubs">
      {pubs.map((p) => (
        <li key={p.title} className="pub">
          <div className={`pub-venue ${p.review ? 'review' : ''}`}>
            <b>{p.venue}</b><span>{p.when}</span>
          </div>
          <div className="pub-body">
            <div className="pub-title">
              {p.title}
              {p.href && <> <a href={p.href} {...ext(p.href)}>{p.linkLabel ?? 'link'} ↗</a></>}
            </div>
            <div className="pub-authors"><Authors text={p.authors} /></div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Publications() {
  return (
    <Section id="publications" n={4} title={title('publications')}>
      <div className="panel pubs-panel">
        <h3>Publications</h3>
        <PubList pubs={PUBS} />
        {PUBS_INTERDISCIPLINARY.length > 0 && <><h3>Other publications</h3><PubList pubs={PUBS_INTERDISCIPLINARY} /></>}
        <p className="muted small">
          Full list on <a href={LINKS.scholar} {...ext(LINKS.scholar)}>Google Scholar ↗</a>
        </p>
      </div>
    </Section>
  );
}

function Cv() {
  return (
    <Section id="cv" n={5} title={title('cv')}>
      <Suspense fallback={<div className="resume-wrap" style={{ minHeight: 1200 }} />}><Resume /></Suspense>
    </Section>
  );
}

export default function Sections() {
  return (
    <div className="site">
      <About />
      <Research />
      <Experience />
      <Publications />
      <Cv />
      <footer className="site-foot">
        <span>© {new Date().getFullYear()} {OWNER.name}</span>
        <span>
          <a href={`mailto:${LINKS.email}`}>{LINKS.email}</a>
          {' · '}<a href={LINKS.scholar} {...ext(LINKS.scholar)}>Scholar</a>
          {' · '}<a href={LINKS.linkedin} {...ext(LINKS.linkedin)}>LinkedIn</a>
          {' · '}<a href={LINKS.github} {...ext(LINKS.github)}>GitHub</a>
        </span>
      </footer>
    </div>
  );
}
