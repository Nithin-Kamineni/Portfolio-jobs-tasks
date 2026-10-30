// The About photo story. Each photo starts as blank paper, is sketched in ink in about a second,
// the real photo washes in from the face (under 2 s in all), holds with a slow push-in, and then
// dissolves back to paper for the next one.
//
// The strokes are traced in the browser (sketch.worker.ts). Like the hero, draw() renders one frame
// from a time, so pausing and the dots are just choosing a t.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// The page is server-rendered; layout effects only exist in the browser (silences React's SSR warning).
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
import { PHOTOS } from '../content';

/** Processing size of the square sketch. */
const N = 640;

// Timeline of one slide, in seconds.
const DRAW_END = 1.2; // ink strokes drawn from 0
const WASH = 0.8; // the photo starts to wash in from the face
const WASH_END = 1.8; // the photo is complete
const INK_OUT: [number, number] = [1.3, 2.0]; // the ink lines fade as the photo arrives
const OUT = 7.4; // the photo starts to dissolve back to paper
const SLIDE = 8.0;
/** A still of the finished photo: no ink, no push-in yet (paused dots, reduced motion). */
const STILL = INK_OUT[1];

const PAPER = '#f4efe4';
const INK = '#2b2219';
const MASK = 40;

interface Art {
  pts: Float32Array;
  offs: Uint32Array;
  lens: Float32Array;
  total: number;
  /** The complete drawing, built once. */
  full: { major: Path2D; minor: Path2D };
  wash: Float32Array;
  erase: Float32Array;
}

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const span = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

/** A soft blotch field (0..1): low values reveal first; distW biases it to grow out from (cx, cy). */
function noiseField(seed: number, cx: number, cy: number, distW: number): Float32Array {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const G = 7;
  const grid = Array.from({ length: G * G }, rnd);
  const out = new Float32Array(MASK * MASK);
  let lo = Infinity, hi = -Infinity;
  for (let y = 0; y < MASK; y++) for (let x = 0; x < MASK; x++) {
    const gx = (x / (MASK - 1)) * (G - 1), gy = (y / (MASK - 1)) * (G - 1);
    const x0 = Math.floor(gx), y0 = Math.floor(gy), x1 = Math.min(G - 1, x0 + 1), y1 = Math.min(G - 1, y0 + 1);
    const fx = gx - x0, fy = gy - y0;
    const sm = (f: number) => f * f * (3 - 2 * f);
    const a = grid[y0 * G + x0] + (grid[y0 * G + x1] - grid[y0 * G + x0]) * sm(fx);
    const b = grid[y1 * G + x0] + (grid[y1 * G + x1] - grid[y1 * G + x0]) * sm(fx);
    const v = a + (b - a) * sm(fy);
    const d = Math.hypot(x / MASK - cx, y / MASK - cy) / 0.75;
    const val = (1 - distW) * (v + 0.25 * rnd()) + distW * d;
    out[y * MASK + x] = val;
    lo = Math.min(lo, val); hi = Math.max(hi, val);
  }
  for (let i = 0; i < out.length; i++) out[i] = (out[i] - lo) / (hi - lo || 1);
  return out;
}

function strokeLens(pts: Float32Array, offs: Uint32Array) {
  const lens = new Float32Array(offs.length - 1);
  let total = 0;
  for (let c = 0; c < lens.length; c++) {
    let l = 0;
    for (let i = offs[c] + 1; i < offs[c + 1]; i++) l += Math.hypot(pts[2 * i] - pts[2 * i - 2], pts[2 * i + 1] - pts[2 * i - 1]);
    lens[c] = l;
    total += lens[c]; // sum the stored (Float32) lengths, so a full draw uses exactly `total`
  }
  return { lens, total };
}

/** Adds a stroke to a path, up to `upto` of its length, smoothed through the midpoints. */
function addStroke(p: Path2D, pts: Float32Array, a: number, b: number, upto: number) {
  const xs: number[] = [], ys: number[] = [];
  let acc = 0;
  for (let i = a; i < b; i++) {
    const x = pts[2 * i], y = pts[2 * i + 1];
    if (i > a) {
      const px = pts[2 * i - 2], py = pts[2 * i - 1];
      const seg = Math.hypot(x - px, y - py);
      if (acc + seg > upto) {
        const f = (upto - acc) / (seg || 1);
        xs.push(px + (x - px) * f); ys.push(py + (y - py) * f);
        break;
      }
      acc += seg;
    }
    xs.push(x); ys.push(y);
  }
  if (xs.length < 2) return null;
  p.moveTo(xs[0], ys[0]);
  for (let i = 1; i < xs.length - 1; i++) p.quadraticCurveTo(xs[i], ys[i], (xs[i] + xs[i + 1]) / 2, (ys[i] + ys[i + 1]) / 2);
  p.lineTo(xs[xs.length - 1], ys[ys.length - 1]);
  return { x: xs[xs.length - 1], y: ys[ys.length - 1] };
}

const MAJOR = 28;

/** A scratch canvas; null only while prerendering on the server, where nothing is drawn. */
const scratch = () => (typeof document === 'undefined' ? (null as unknown as HTMLCanvasElement) : document.createElement('canvas'));

/** The drawing up to `upto` of its total length; the pen tip only while it is still drawing. */
function inkPaths(art: Pick<Art, 'pts' | 'offs' | 'lens' | 'total'>, upto: number) {
  const major = new Path2D(), minor = new Path2D();
  let left = upto, tip: { x: number; y: number } | null = null;
  for (let c = 0; c < art.lens.length && left > 0; c++) {
    tip = addStroke(art.lens[c] >= MAJOR ? major : minor, art.pts, art.offs[c], art.offs[c + 1], Math.min(left, art.lens[c])) ?? tip;
    left -= art.lens[c];
  }
  return { major, minor, tip: upto < art.total ? tip : null };
}

export default function PhotoStory() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [slide, setSlide] = useState(0);
  const [playing, setPlaying] = useState(true);
  // Starts false (the server can't know); the mount effect reads the real media query.
  const [reduced, setReduced] = useState(false);

  const st = useRef({
    slide: 0, t: 0, playing: true, reduced,
    /** The frame is on screen, and the tab is shown: the loop runs only when both are true. */
    inView: false, tabVisible: true,
    /** Whether this slide plays the sketch (decided once per slide, so it never switches mid-way). */
    useArt: false,
    imgs: [] as (HTMLImageElement | null)[],
    art: [] as (Art | null)[],
    W: 0,
    /** CSS width of the frame. */
    css: 0,
    grain: null as HTMLCanvasElement | null,
    tmp: scratch(),
    mask: scratch(),
    raf: 0, last: 0,
    /** Starts tracing the next queued photo (set up in the effect). */
    pump: () => {},
    /** Starts downloading the photos (set up in the effect; runs once, when the story nears the screen). */
    load: () => {},
  });

  const startSlide = (i: number, t: number) => {
    const s = st.current;
    s.slide = i;
    s.t = t;
    s.useArt = !!s.art[i] && !s.reduced;
  };

  // ---- drawing ---------------------------------------------------------------------
  const drawRef = useRef<() => void>(() => {});
  drawRef.current = () => {
    const s = st.current;
    const cv = canvasRef.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx || !s.W) return;
    const W = s.W, k = W / N;
    const img = s.imgs[s.slide];
    const art = s.useArt ? s.art[s.slide] : null;
    // Reduced motion: one still of the photo. No strokes for this slide: the photo straight away.
    const t = s.reduced ? STILL : !art ? Math.max(s.t, WASH_END) : s.t;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, W);
    const zoom = s.reduced ? 1 : 1 + 0.03 * ease(span(t, WASH_END, SLIDE));

    const photoAt = (scale: number, alpha = 1) => {
      if (!img) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(W / 2, W / 2); ctx.scale(scale, scale); ctx.translate(-W / 2, -W / 2);
      ctx.drawImage(img, 0, 0, W, W);
      ctx.restore();
    };
    const masked = (src: CanvasImageSource, field: Float32Array, T: number, invert: boolean, scale: number) => {
      const m = s.mask, mc = m.getContext('2d')!;
      const id = mc.createImageData(MASK, MASK);
      for (let i = 0; i < field.length; i++) {
        const a = clamp((T - field[i]) / 0.2);
        id.data[4 * i + 3] = (invert ? 1 - a : a) * 255;
      }
      mc.putImageData(id, 0, 0);
      const tc = s.tmp.getContext('2d')!;
      tc.setTransform(1, 0, 0, 1, 0, 0);
      tc.globalCompositeOperation = 'source-over';
      tc.clearRect(0, 0, W, W);
      tc.translate(W / 2, W / 2); tc.scale(scale, scale); tc.translate(-W / 2, -W / 2);
      tc.drawImage(src, 0, 0, W, W);
      tc.setTransform(1, 0, 0, 1, 0, 0);
      tc.globalCompositeOperation = 'destination-in';
      tc.imageSmoothingQuality = 'high';
      tc.drawImage(m, 0, 0, W, W);
      ctx.drawImage(s.tmp, 0, 0);
    };

    if (t < WASH_END && art) {
      if (s.grain) { ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = ctx.createPattern(s.grain, 'repeat')!; ctx.fillRect(0, 0, W, W); ctx.restore(); }
      if (img && t > WASH) masked(img, art.wash, ease(span(t, WASH, WASH_END)) * 1.2, false, 1);
    } else if (img) {
      if (t < OUT || s.reduced) photoAt(zoom);
      else if (art) masked(img, art.erase, ease(span(t, OUT, SLIDE)) * 1.2, true, zoom);
      else photoAt(zoom, 1 - ease(span(t, OUT, SLIDE)));
    }

    // ink, drawn over the paper and fading out as the photo arrives
    const inkA = 1 - ease(span(t, INK_OUT[0], INK_OUT[1]));
    if (art && inkA > 0) {
      const d = ease(span(t, 0, DRAW_END));
      const paths = d < 1 ? inkPaths(art, art.total * d) : { ...art.full, tip: null };
      ctx.save();
      ctx.translate(W / 2, W / 2); ctx.scale(k, k); ctx.translate(-N / 2, -N / 2);
      ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      // Widths in CSS px, whatever the frame size and pixel ratio.
      const px = N / Math.max(1, s.css);
      ctx.globalAlpha = 0.92 * inkA;
      ctx.lineWidth = 1.7 * px;
      ctx.stroke(paths.major);
      ctx.globalAlpha = 0.7 * inkA;
      ctx.lineWidth = 1.1 * px;
      ctx.stroke(paths.minor);
      if (paths.tip) {
        ctx.fillStyle = INK;
        ctx.globalAlpha = inkA;
        ctx.beginPath(); ctx.arc(paths.tip.x, paths.tip.y, 2.6 * px, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.18 * inkA;
        ctx.beginPath(); ctx.arc(paths.tip.x, paths.tip.y, 7 * px, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    // dot progress
    fillRefs.current.forEach((el, i) => {
      if (el) el.style.transform = `scaleX(${i === s.slide && !s.reduced ? Math.min(1, t / SLIDE) : 0})`;
    });
  };

  // ---- clock ------------------------------------------------------------------------
  const running = () => { const s = st.current; return s.playing && s.inView && s.tabVisible && !s.reduced; };
  const loop = (now: number) => {
    const s = st.current;
    s.raf = 0;
    const dt = Math.min(0.1, (now - (s.last || now)) / 1000);
    s.last = now;
    // No strokes for this slide: show the photo straight away rather than an empty page.
    if (!s.useArt && s.t < WASH_END) s.t = WASH_END;
    s.t += dt;
    if (s.t >= SLIDE) {
      startSlide((s.slide + 1) % PHOTOS.length, s.t - SLIDE);
      setSlide(s.slide);
    }
    drawRef.current();
    if (running()) s.raf = requestAnimationFrame(loop);
  };
  const kick = () => {
    const s = st.current;
    if (!s.raf && running()) { s.last = 0; s.raf = requestAnimationFrame(loop); }
  };

  // ---- setup: worker, lazy photo loading -------------------------------------------------
  useEffect(() => {
    const s = st.current;
    let alive = true;
    const worker = new Worker(new URL('./sketch.worker.ts', import.meta.url), { type: 'module' });
    const queue: number[] = [];
    let busy = false;
    const byDistance = (a: number, b: number) =>
      ((a - s.slide + PHOTOS.length) % PHOTOS.length) - ((b - s.slide + PHOTOS.length) % PHOTOS.length);
    s.pump = () => {
      if (busy || !queue.length || s.reduced) return;
      queue.sort(byDistance);
      const i = queue.shift()!;
      const img = s.imgs[i];
      if (!img) return;
      const c = document.createElement('canvas');
      c.width = c.height = N;
      const cc = c.getContext('2d', { willReadFrequently: true })!;
      cc.drawImage(img, 0, 0, N, N);
      const rgba = cc.getImageData(0, 0, N, N).data;
      busy = true;
      worker.postMessage({ id: i, n: N, rgba }, [rgba.buffer]);
    };
    worker.onmessage = (e: MessageEvent<{ id: number; pts: Float32Array; offs: Uint32Array }>) => {
      busy = false;
      if (!alive) return;
      const { id, pts, offs } = e.data;
      const { lens, total } = strokeLens(pts, offs);
      const base = { pts, offs, lens, total };
      const { major, minor } = inkPaths(base, total);
      const fx = PHOTOS[id].face ?? [0.5, 0.42];
      s.art[id] = {
        ...base,
        full: { major, minor },
        wash: noiseField(id * 7 + 3, fx[0], fx[1], 0.45),
        erase: noiseField(id * 13 + 5, 0.5, 0.5, 0.15),
      };
      s.pump();
    };

    let started = false;
    s.load = () => {
      if (started) return;
      started = true;
      // The first photo, then the next, then the rest; each is traced as it arrives.
      PHOTOS.forEach((p, i) => {
        const im = new Image();
        im.decoding = 'async';
        im.src = p.src;
        im.decode().then(() => {
          if (!alive) return;
          s.imgs[i] = im;
          queue.push(i);
          s.pump();
          if (i === s.slide) drawRef.current();
        }).catch(() => {});
      });
    };

    // paper grain
    const g = document.createElement('canvas');
    g.width = g.height = 128;
    const gc = g.getContext('2d')!;
    const gd = gc.createImageData(128, 128);
    for (let i = 0; i < 128 * 128; i++) {
      const v = Math.random() * 255;
      gd.data[4 * i] = gd.data[4 * i + 1] = gd.data[4 * i + 2] = v;
      gd.data[4 * i + 3] = 10;
    }
    gc.putImageData(gd, 0, 0);
    s.grain = g;
    s.mask.width = s.mask.height = MASK;

    return () => { alive = false; worker.terminate(); if (s.raf) cancelAnimationFrame(s.raf); s.raf = 0; };
  }, []);

  // ---- size, visibility, reduced motion ------------------------------------------------
  useIsoLayoutEffect(() => {
    const s = st.current;
    const wrap = wrapRef.current, cv = canvasRef.current;
    if (!wrap || !cv) return;
    const ro = new ResizeObserver(() => {
      const css = wrap.clientWidth;
      const W = Math.round(css * Math.min(2, window.devicePixelRatio || 1));
      if (W === s.W || !W) return;
      s.W = W;
      s.css = css;
      cv.width = cv.height = W;
      s.tmp.width = s.tmp.height = W;
      drawRef.current();
    });
    ro.observe(wrap);
    // Download the photos only when the story is within about a screen of view.
    const near = new IntersectionObserver(([e]) => { if (e.isIntersecting) { s.load(); near.disconnect(); } }, { rootMargin: '800px 0px' });
    near.observe(wrap);
    const io = new IntersectionObserver(([e]) => {
      s.inView = e.isIntersecting;
      if (s.inView) kick();
    }, { threshold: 0.15 });
    io.observe(wrap);
    const onVis = () => { s.tabVisible = document.visibilityState === 'visible'; kick(); };
    s.tabVisible = document.visibilityState === 'visible';
    document.addEventListener('visibilitychange', onVis);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMq = () => {
      s.reduced = mq.matches;
      setReduced(mq.matches);
      if (!s.reduced) s.pump();
      startSlide(s.slide, s.reduced ? STILL : 0);
      drawRef.current();
      kick();
    };
    mq.addEventListener('change', onMq);
    if (mq.matches) onMq();
    return () => {
      ro.disconnect(); near.disconnect(); io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      mq.removeEventListener('change', onMq);
    };
  }, []);

  // Dev-only hooks: __story.seek(slide, t) draws one frame (and pauses); __story.ready() lists sketches done.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as { __story: object }).__story = {
      seek: (i: number, t: number) => {
        const s = st.current;
        s.playing = false; setPlaying(false);
        s.load();
        startSlide(i, t); s.useArt = !!s.art[i];
        setSlide(i); drawRef.current();
      },
      ready: () => st.current.art.map((a) => (a ? `${a.lens.length} strokes, ${Math.round(a.total)} px` : null)),
      play: () => { st.current.playing = true; setPlaying(true); kick(); },
    };
  });

  const go = (i: number) => {
    const s = st.current;
    // Playing: draw the chosen photo from blank paper. Paused: show it finished.
    startSlide(i, s.playing ? 0 : STILL);
    setSlide(i);
    drawRef.current();
    kick();
  };
  const toggle = () => {
    const s = st.current;
    s.playing = !s.playing;
    setPlaying(s.playing);
    if (s.playing) kick(); else drawRef.current();
  };

  return (
    <figure className="story" aria-roledescription="carousel" aria-label="Photos">
      <div className="story-frame" ref={wrapRef}>
        <canvas ref={canvasRef} role="img" aria-label={PHOTOS[slide].alt} />
      </div>
      <div className="story-controls">
        <div className="story-dots">
          {PHOTOS.map((p, i) => (
            <button
              key={p.src}
              type="button"
              className="story-dot"
              aria-label={`Photo ${i + 1} of ${PHOTOS.length}`}
              aria-current={i === slide || undefined}
              onClick={() => go(i)}
            >
              <span ref={(el) => { fillRefs.current[i] = el; }} />
            </button>
          ))}
        </div>
        {!reduced && (
          <button type="button" className="story-play" onClick={toggle} aria-label={playing ? 'Pause the photos' : 'Play the photos'}>
            {playing ? (
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
        )}
      </div>
    </figure>
  );
}
