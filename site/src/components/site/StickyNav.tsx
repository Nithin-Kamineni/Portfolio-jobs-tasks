// The sticky section nav. It slides in once the hero's wired nav scrolls off screen (the hero nav
// stays where it is, so its board wires never move). Each link is a chevron "tag", drawn as one
// stage of a RISC-V 5-stage pipeline (decorative only): the active section's tag is shaded, and a
// click sends an instruction token from IF to the target stage in step with the smooth scroll.
//
// It also owns in-page navigation for every #section link on the page (hero nav and chips too).

import { useEffect, useRef, useState } from 'react';
import { LINKS, SECTIONS } from './content';
import { OWNER } from '../../owner.config';
import ThemeToggle from './ThemeToggle';
import { secretTap } from './secretEntry';

/** Gap between the sticky bar and a section's top after a jump (CSS scroll-margin-top matches). */
const OFFSET = 72;
const IDS = SECTIONS.map((s) => s.id);

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function StickyNav() {
  const barRef = useRef<HTMLElement>(null);
  const pipeRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(false);
  const [active, setActive] = useState(-1);
  const [instr, setInstr] = useState('');
  const run = useRef<{ raf: number; to: number } | null>(null);

  // Slide in once the hero nav is off screen.
  useEffect(() => {
    const heroNav = document.querySelector('.page > .nav');
    if (!heroNav) { setShown(true); return; }
    const io = new IntersectionObserver(([e]) => setShown(!e.isIntersecting), { threshold: 0 });
    io.observe(heroNav);
    return () => io.disconnect();
  }, []);

  // The hidden bar must not take focus or be read twice.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    if (shown) bar.removeAttribute('inert'); else bar.setAttribute('inert', '');
  }, [shown]);

  // Scroll spy: the last section whose top has passed ~35% of the viewport.
  useEffect(() => {
    let raf = 0;
    const spy = () => {
      raf = 0;
      if (run.current) return;
      const line = OFFSET + window.innerHeight * 0.3;
      let idx = -1;
      IDS.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) idx = i;
      });
      const doc = document.documentElement;
      if (idx >= 0 && window.scrollY + window.innerHeight >= doc.scrollHeight - 2) idx = IDS.length - 1;
      setActive(idx);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(spy); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    spy();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Keep the active tag in view when the tags scroll sideways (phones).
  useEffect(() => {
    const pipe = pipeRef.current;
    if (!pipe || active < 0 || pipe.scrollWidth <= pipe.clientWidth) return;
    const tag = pipe.querySelectorAll<HTMLElement>('.tag')[active];
    if (!tag) return;
    pipe.scrollTo({ left: tag.offsetLeft - (pipe.clientWidth - tag.offsetWidth) / 2, behavior: 'smooth' });
  }, [active]);

  // In-page navigation for every #section link, plus "#" (top).
  useEffect(() => {
    const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tags = () => [...(pipeRef.current?.querySelectorAll<HTMLElement>('.tag') ?? [])];

    function finish(to: number) {
      run.current = null;
      tags().forEach((t) => t.removeAttribute('data-pass'));
      const token = tokenRef.current;
      if (token) token.removeAttribute('data-on');
      barRef.current?.removeAttribute('data-run');
      if (to >= 0) {
        setActive(to);
        const tag = tags()[to];
        if (tag && !reduced()) tag.animate([{ filter: 'brightness(1.7)' }, { filter: 'brightness(1)' }], { duration: 380, easing: 'ease-out' });
      }
      // Hand back to the scroll spy (it corrects a target that can't reach the top line).
      window.dispatchEvent(new Event('scroll'));
    }

    function cancel() {
      const r = run.current;
      if (!r) return;
      cancelAnimationFrame(r.raf);
      finish(-1);
    }

    function go(id: string) {
      cancel();
      const to = IDS.indexOf(id);
      const el = id ? document.getElementById(id) : null;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const dest = Math.max(0, Math.min(max, el ? el.getBoundingClientRect().top + window.scrollY - OFFSET : 0));
      history.replaceState(null, '', id ? `#${id}` : window.location.pathname + window.location.search);
      const from = window.scrollY;
      const dist = dest - from;
      if (reduced() || Math.abs(dist) < 2) {
        window.scrollTo(0, dest);
        if (to >= 0) setActive(to);
        return;
      }
      const dur = Math.min(700, 320 + Math.abs(dist) * 0.12);

      // The token runs IF → target stage (only for section links, not "back to top").
      const list = tags();
      const pipe = pipeRef.current;
      const token = tokenRef.current;
      let x0 = 0, x1 = 0;
      if (to >= 0 && pipe && token && list[to]) {
        x0 = list[0].offsetLeft + 6;
        x1 = list[to].offsetLeft + list[to].offsetWidth / 2;
        setInstr(`jal x0, ${id}`);
        token.setAttribute('data-on', '');
        barRef.current?.setAttribute('data-run', '');
      }
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        const e = ease(p);
        window.scrollTo(0, from + dist * e);
        if (to >= 0 && token) {
          const x = x0 + (x1 - x0) * e;
          token.style.transform = `translateX(${x}px)`;
          list.forEach((t, i) => {
            const inside = i <= to && x >= t.offsetLeft - 2;
            if (inside) t.setAttribute('data-pass', ''); else t.removeAttribute('data-pass');
          });
        }
        if (p < 1) run.current = { raf: requestAnimationFrame(step), to };
        else finish(to);
      };
      run.current = { raf: requestAnimationFrame(step), to };
    }

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href^="#"]');
      if (!a) return;
      const id = (a.getAttribute('href') ?? '').slice(1);
      if (id && !IDS.includes(id)) return;
      e.preventDefault();
      go(id);
      if (a instanceof HTMLElement && id) {
        // Move focus to the section for keyboard and screen-reader users, without a second jump.
        const sec = document.getElementById(id);
        if (sec) { sec.setAttribute('tabindex', '-1'); sec.focus({ preventScroll: true }); }
      }
    };
    const onUser = () => cancel();
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) cancel();
    };
    document.addEventListener('click', onClick);
    window.addEventListener('wheel', onUser, { passive: true });
    window.addEventListener('touchstart', onUser, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      cancel();
      document.removeEventListener('click', onClick);
      window.removeEventListener('wheel', onUser);
      window.removeEventListener('touchstart', onUser);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <header ref={barRef} className="snav" data-shown={shown || undefined} aria-hidden={!shown}>
      <div className="snav-inner">
        <a className="snav-logo" href="#">
          <span className="logo-chip" onClick={secretTap}>{OWNER.initials}</span>
          <span className="snav-name">{OWNER.name}</span>
          <span className="sr-only">, back to top</span>
        </a>
        <nav className="pipe" ref={pipeRef} aria-label="Sections">
          {SECTIONS.map((s, i) => (
            <a key={s.id} className="tag" href={`#${s.id}`} aria-current={i === active ? 'location' : undefined}>
              <span className="st" aria-hidden="true">{s.stage}</span>{s.label}
            </a>
          ))}
          <span ref={tokenRef} className="token" aria-hidden="true"><i />{instr && <em>{instr}</em>}</span>
        </nav>
        <div className="snav-icons">
          <a className="nav-icon mail" href={`mailto:${LINKS.email}`} aria-label={`Email ${LINKS.email}`} title={LINKS.email}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2.4V17h16V7.4l-8 5.2-8-5.2zM5.6 7l6.4 4.2L18.4 7H5.6z" /></svg>
          </a>
          <a className="nav-icon scholar" href={LINKS.scholar} target="_blank" rel="noopener noreferrer" aria-label="Google Scholar" title="Google Scholar">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 1 9l11 6 9-4.9V17h2V9L12 3z" /><path d="M5 13.2v3.3C5 18.4 8.1 20 12 20s7-1.6 7-3.5v-3.3l-7 3.8-7-3.8z" /></svg>
          </a>
          <a className="nav-icon linkedin" href={LINKS.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.2c0-1.2 0-2.8-1.8-2.8s-2 1.3-2 2.7V21h-4z" /></svg>
          </a>
          <a className="nav-icon github" href={LINKS.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 2.9.8.1-.7.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7c-.1-.3-.5-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .6 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z" /></svg>
          </a>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
