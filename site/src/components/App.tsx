import StickyNav from './site/StickyNav';
import Sections from './site/Sections';
import ThemeToggle from './site/ThemeToggle';
import { LINKS, OWNER } from '../owner.config';
import { secretTap } from './site/secretEntry';

const ICONS = {
  scholar: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 1 9l11 6 9-4.9V17h2V9L12 3z" /><path d="M5 13.2v3.3C5 18.4 8.1 20 12 20s7-1.6 7-3.5v-3.3l-7 3.8-7-3.8z" /></svg>,
  linkedin: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.2c0-1.2 0-2.8-1.8-2.8s-2 1.3-2 2.7V21h-4z" /></svg>,
  github: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 2.9.8.1-.7.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7c-.1-.3-.5-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .6 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z" /></svg>,
};
const LABEL = { scholar: 'Google Scholar', linkedin: 'LinkedIn', github: 'GitHub' };

export default function App() {
  return (
    <>
      <StickyNav />
      <div className="page">
        <nav className="nav">
          <a className="logo" href="#">
            <span className="logo-chip" onClick={secretTap}>{OWNER.initials}</span>
            <span className="logo-name">{OWNER.name}</span>
          </a>
          <div className="nav-links">
            <a href="#about">about</a>
            <a href="#research">projects</a>
            <a href="#experience">experience</a>
            <a href="#publications">publications</a>
            <a href="#cv" className="nav-cv">resume/cv</a>
            <span className="nav-sep" aria-hidden="true" />
            {(['scholar', 'linkedin', 'github'] as const).filter((k) => LINKS[k]).map((k) => (
              <a key={k} className={`nav-icon ${k}`} href={LINKS[k]} target="_blank" rel="noopener noreferrer" aria-label={LABEL[k]} title={LABEL[k]}>{ICONS[k]}</a>
            ))}
            <span><ThemeToggle className="hero-theme" /></span>
          </div>
        </nav>

        <header className="intro">
          <p className="kicker">{OWNER.kicker}</p>
          <h1>{OWNER.headline}<span className="accent">.</span></h1>
          <p className="lede">{OWNER.lede}</p>
          {OWNER.available && (
            <p className="avail">
              <span className="avail-main"><span className="dot" />{OWNER.available}</span>
              <span className="avail-links">
                <a href="#cv">résumé</a>{LINKS.email && <><span className="avail-sep" aria-hidden="true">·</span><a href={`mailto:${LINKS.email}`}>email</a></>}
              </span>
            </p>
          )}
          {OWNER.highlights.length > 0 && (
            <div className="chips">
              {OWNER.highlights.map((h) => <a key={h.name} className={`chip${h.muted ? ' muted' : ''}`} href="#publications"><b>{h.label}</b> {h.name}</a>)}
            </div>
          )}
        </header>

        <main>
          {/* The hero image: replace public/hero-placeholder.png with your own picture (about 1600 × 900). */}
          <figure className="hero-image">
            <img src="/hero-placeholder.png" alt="" width={1600} height={900} />
          </figure>
        </main>
      </div>
      <Sections />
    </>
  );
}
