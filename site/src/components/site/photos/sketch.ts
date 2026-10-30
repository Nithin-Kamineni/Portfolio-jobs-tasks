// Turns a photo into ink strokes that can be drawn one after another. Pure functions (no DOM), run
// in a worker.
//
//   lines: one bilateral pass (smooths skin and backgrounds but keeps edges), difference of
//          Gaussians on its luminance, thresholded per image (so every photo gets a similar line
//          density), cleaned, thinned to 1 px and traced into chains, ordered like an artist would
//          draw: long contours first, each starting near where the last one ended.

export interface Sketch {
  /** Stroke points (x, y pairs, in pixels of the n × n image). */
  pts: Float32Array;
  /** Point index where each stroke starts, plus a final end index. */
  offs: Uint32Array;
}

export function sketch(rgba: Uint8ClampedArray, n: number): Sketch {
  const N = n * n;
  const R = new Float32Array(N), G = new Float32Array(N), B = new Float32Array(N);
  for (let i = 0; i < N; i++) { R[i] = rgba[4 * i] / 255; G[i] = rgba[4 * i + 1] / 255; B[i] = rgba[4 * i + 2] / 255; }
  const [Rs, Gs, Bs] = bilateral(R, G, B, n, 4, 3, 0.12);

  const L = new Float32Array(N);
  for (let i = 0; i < N; i++) L[i] = 0.299 * Rs[i] + 0.587 * Gs[i] + 0.114 * Bs[i];
  const g1 = blur(L, n, 0.9), g2 = blur(L, n, 1.6);
  const D = new Float32Array(N);
  for (let i = 0; i < N; i++) D[i] = g1[i] - g2[i];
  const thr = Math.min(-0.005, percentile(D, 0.06));
  const mask = new Uint8Array(N);
  for (let y = 2; y < n - 2; y++) for (let x = 2; x < n - 2; x++) { const i = y * n + x; if (D[i] < thr) mask[i] = 1; }
  dropSmall(mask, n, 24);
  thin(mask, n);
  const chains = trace(mask, n).filter((c) => c.length >= 12).map((c) => simplify(c, 0.6));
  const ordered = order(chains, n);

  let total = 0;
  for (const c of ordered) total += c.length;
  const pts = new Float32Array(total);
  const offs = new Uint32Array(ordered.length + 1);
  let k = 0;
  ordered.forEach((c, i) => { offs[i] = k / 2; pts.set(c, k); k += c.length; });
  offs[ordered.length] = k / 2;
  return { pts, offs };
}

/** Bilateral filter: averages nearby pixels of similar colour, so edges and features survive. */
function bilateral(R: Float32Array, G: Float32Array, B: Float32Array, n: number, r: number, ss: number, sr: number): [Float32Array, Float32Array, Float32Array] {
  const side = 2 * r + 1;
  const space = new Float32Array(side * side);
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) space[(dy + r) * side + dx + r] = Math.exp(-(dx * dx + dy * dy) / (2 * ss * ss));
  const LUT = 1024, maxD = 3;
  const range = new Float32Array(LUT + 1);
  for (let i = 0; i <= LUT; i++) range[i] = Math.exp(-((i / LUT) * maxD) / (2 * sr * sr));
  const oR = new Float32Array(n * n), oG = new Float32Array(n * n), oB = new Float32Array(n * n);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const i = y * n + x, r0 = R[i], g0 = G[i], b0 = B[i];
      let wr = 0, ar = 0, ag = 0, ab = 0;
      for (let dy = -r; dy <= r; dy++) {
        const Y = y + dy;
        if (Y < 0 || Y >= n) continue;
        for (let dx = -r; dx <= r; dx++) {
          const X = x + dx;
          if (X < 0 || X >= n) continue;
          const j = Y * n + X;
          const dr = R[j] - r0, dg = G[j] - g0, db = B[j] - b0;
          const w = space[(dy + r) * side + dx + r] * range[Math.min(LUT, (((dr * dr + dg * dg + db * db) / maxD) * LUT) | 0)];
          wr += w; ar += w * R[j]; ag += w * G[j]; ab += w * B[j];
        }
      }
      oR[i] = ar / wr; oG[i] = ag / wr; oB[i] = ab / wr;
    }
  }
  return [oR, oG, oB];
}

function blur(src: Float32Array, n: number, sigma: number): Float32Array {
  const rad = Math.ceil(sigma * 3);
  const k = new Float32Array(2 * rad + 1);
  let sum = 0;
  for (let i = -rad; i <= rad; i++) { k[i + rad] = Math.exp(-(i * i) / (2 * sigma * sigma)); sum += k[i + rad]; }
  for (let i = 0; i < k.length; i++) k[i] /= sum;
  const tmp = new Float32Array(n * n), out = new Float32Array(n * n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let a = 0;
    for (let i = -rad; i <= rad; i++) a += k[i + rad] * src[y * n + Math.min(n - 1, Math.max(0, x + i))];
    tmp[y * n + x] = a;
  }
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let a = 0;
    for (let i = -rad; i <= rad; i++) a += k[i + rad] * tmp[Math.min(n - 1, Math.max(0, y + i)) * n + x];
    out[y * n + x] = a;
  }
  return out;
}

function percentile(a: Float32Array, p: number): number {
  let lo = Infinity, hi = -Infinity;
  for (const v of a) { if (v < lo) lo = v; if (v > hi) hi = v; }
  const bins = 2048, h = new Uint32Array(bins), span = hi - lo || 1;
  for (const v of a) h[Math.min(bins - 1, Math.floor(((v - lo) / span) * bins))]++;
  let need = a.length * p;
  for (let b = 0; b < bins; b++) { need -= h[b]; if (need <= 0) return lo + (b / bins) * span; }
  return hi;
}

const NB = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];

function dropSmall(m: Uint8Array, n: number, min: number) {
  const seen = new Uint8Array(n * n);
  const stack: number[] = [];
  for (let s = 0; s < n * n; s++) {
    if (!m[s] || seen[s]) continue;
    const comp: number[] = [];
    stack.push(s); seen[s] = 1;
    while (stack.length) {
      const i = stack.pop()!; comp.push(i);
      const x = i % n, y = (i / n) | 0;
      for (const [dx, dy] of NB) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= n || Y >= n) continue;
        const j = Y * n + X;
        if (m[j] && !seen[j]) { seen[j] = 1; stack.push(j); }
      }
    }
    if (comp.length < min) for (const i of comp) m[i] = 0;
  }
}

/** Zhang–Suen thinning to 1-px lines. */
function thin(m: Uint8Array, n: number) {
  const del: number[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (let pass = 0; pass < 2; pass++) {
      del.length = 0;
      for (let y = 1; y < n - 1; y++) for (let x = 1; x < n - 1; x++) {
        const i = y * n + x;
        if (!m[i]) continue;
        const p2 = m[i - n], p3 = m[i - n + 1], p4 = m[i + 1], p5 = m[i + n + 1], p6 = m[i + n], p7 = m[i + n - 1], p8 = m[i - 1], p9 = m[i - n - 1];
        const b = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
        if (b < 2 || b > 6) continue;
        const seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
        let a = 0;
        for (let t = 0; t < 8; t++) if (!seq[t] && seq[t + 1]) a++;
        if (a !== 1) continue;
        if (pass === 0 ? p2 * p4 * p6 || p4 * p6 * p8 : p2 * p4 * p8 || p2 * p6 * p8) continue;
        del.push(i);
      }
      for (const i of del) m[i] = 0;
      if (del.length) changed = true;
    }
  }
}

/** Follow the 1-px skeleton into chains: from the ends first, then whatever is left (loops). */
function trace(m: Uint8Array, n: number): number[][] {
  const seen = new Uint8Array(n * n);
  const deg = (i: number) => {
    let d = 0;
    const x = i % n, y = (i / n) | 0;
    for (const [dx, dy] of NB) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < n && Y < n && m[Y * n + X]) d++; }
    return d;
  };
  const walk = (s: number) => {
    const c: number[] = [];
    let i = s;
    seen[i] = 1;
    for (;;) {
      c.push(i % n, (i / n) | 0);
      const x = i % n, y = (i / n) | 0;
      let next = -1;
      for (const [dx, dy] of NB) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= n || Y >= n) continue;
        const j = Y * n + X;
        if (m[j] && !seen[j]) { next = j; break; }
      }
      if (next < 0) break;
      seen[next] = 1;
      i = next;
    }
    return c;
  };
  const out: number[][] = [];
  for (let i = 0; i < n * n; i++) if (m[i] && !seen[i] && deg(i) === 1) out.push(walk(i));
  for (let i = 0; i < n * n; i++) if (m[i] && !seen[i]) out.push(walk(i));
  return out;
}

/** Ramer–Douglas–Peucker on an [x, y, x, y, …] chain. */
function simplify(c: number[], eps: number): number[] {
  const n = c.length / 2;
  if (n < 3) return c;
  const keep = new Uint8Array(n);
  keep[0] = keep[n - 1] = 1;
  const stack: [number, number][] = [[0, n - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const ax = c[2 * a], ay = c[2 * a + 1], bx = c[2 * b], by = c[2 * b + 1];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
    let best = -1, bd = eps;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((c[2 * i] - ax) * dy - (c[2 * i + 1] - ay) * dx) / len;
      if (d > bd) { bd = d; best = i; }
    }
    if (best > 0) { keep[best] = 1; stack.push([a, best], [best, b]); }
  }
  const out: number[] = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(c[2 * i], c[2 * i + 1]);
  return out;
}

const chainLen = (c: number[]) => { let l = 0; for (let i = 2; i < c.length; i += 2) l += Math.hypot(c[i] - c[i - 2], c[i + 1] - c[i - 1]); return l; };

/** Long contours first, then details; each stroke starts near where the last one ended. */
function order(chains: number[][], n: number): number[][] {
  const withLen = chains.map((c) => ({ c, l: chainLen(c) }));
  const major = withLen.filter((x) => x.l >= 28), minor = withLen.filter((x) => x.l < 28);
  const out: number[][] = [];
  let px = n * 0.5, py = n * 0.38;
  for (const group of [major, minor]) {
    const left = group.slice();
    while (left.length) {
      let bi = 0, bd = Infinity, rev = false;
      for (let i = 0; i < left.length; i++) {
        const c = left[i].c;
        // Prefer longer strokes a little, so the big shapes come first within the group.
        const bonus = Math.min(60, left[i].l * 0.15);
        const d0 = Math.hypot(c[0] - px, c[1] - py) - bonus;
        const d1 = Math.hypot(c[c.length - 2] - px, c[c.length - 1] - py) - bonus;
        if (d0 < bd) { bd = d0; bi = i; rev = false; }
        if (d1 < bd) { bd = d1; bi = i; rev = true; }
      }
      let c = left.splice(bi, 1)[0].c;
      if (rev) { const r: number[] = []; for (let i = c.length - 2; i >= 0; i -= 2) r.push(c[i], c[i + 1]); c = r; }
      out.push(c);
      px = c[c.length - 2]; py = c[c.length - 1];
    }
  }
  return out;
}
