import { reduced } from "./util.js";

/* ================== Fight effects, drawn in the pixel scene ==================
   Everything here paints whole scene pixels (the scene is 128×64, scaled up), so the effects look
   like part of the pixel art. Effects keep their own Math.random: they never shift the game's seeded sequence.

   fightFx()            the list of running effects of one fight (+ screen shake)
   fireBreath, wave, roots   a spell travelling from one point to another; it arrives at ARRIVE of its time
   charge               sparks gathering before a spell is let go
   tornado              the whirlwind that carries a beaten monster away
   aura                 a few embers, drops or leaves around a monster, so its element shows
   makeShield           the sphere around the hero: forms, ripples when hit, or flickers and shatters */

const rand = (a, b) => a + Math.random() * (b - a);
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOut = (p) => 1 - (1 - p) * (1 - p);
const easeBack = (p) => { const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
export const ARRIVE = 0.55; // the moment a spell reaches its target, as a part of its whole time
// the grass slopes a little: the hero stands higher than the monster
export const groundY = (x) => 45 + clamp01((x - 34) / 66) * 7;

export const FX_PAL = {
  fire: { hot: "#fff6c9", a: "#ffd84a", b: "#ff8a2f", c: "#e8442c", d: "#8a2a1a" },
  water: { hot: "#ffffff", a: "#c8ecff", b: "#4aa8ff", c: "#1f6fc4", d: "#174f8f" },
  earth: { hot: "#e2f0a8", a: "#8bb84a", b: "#5d7f2e", c: "#a8693a", d: "#6e4223" }
};

const dot = (ctx, x, y, w = 1, h = 1) => ctx.fillRect(Math.round(x), Math.round(y), w, h);
function disc(ctx, cx, cy, r) {
  cx = Math.round(cx); cy = Math.round(cy);
  for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y)); ctx.fillRect(cx - w, cy + y, 2 * w + 1, 1); }
}
function ring(ctx, cx, cy, rx, ry = rx) {
  const n = Math.max(8, Math.ceil(Math.max(rx, ry) * 6));
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; dot(ctx, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry); }
}

// loose pixels: sparks, drops, clods. Speeds are in scene pixels per millisecond.
function particles() {
  let list = [];
  return {
    add(o) { list.push(Object.assign({ vx: 0, vy: 0, g: 0, s: 1, life: 400 }, o, { max: o.life || 400 })); },
    step(ctx, dt) {
      for (const p of list) {
        p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
        if (p.life <= 0) continue;
        ctx.globalAlpha = Math.min(1, (p.life / p.max) * 2); ctx.fillStyle = p.c; dot(ctx, p.x, p.y, p.s, p.s);
      }
      ctx.globalAlpha = 1; list = list.filter((p) => p.life > 0);
    },
    get n() { return list.length; }
  };
}
const burstOf = (P, at, colors, n, { up = 0.06, spread = 0.07, g = 0.00035, life = 480, back = 0 } = {}) => {
  for (let i = 0; i < n; i++) P.add({ x: at.x + rand(-2, 2), y: at.y + rand(-2, 2), vx: rand(-spread, spread) + back, vy: -rand(up * 0.3, up * 1.6), g, s: Math.random() < 0.3 ? 2 : 1, c: colors[i % colors.length], life: rand(life * 0.6, life) });
};

/* ---------- the list of running effects ---------- */
export function fightFx() {
  let live = [], last = 0, shakeEnd = 0, shakeAmp = 0;
  const time = (ms) => (reduced() ? ms / 3 : ms);
  return {
    time,
    // runs an effect for ms; the promise resolves when its time is over (also if the scene stopped drawing)
    play(e, ms) { const dur = time(ms); live.push({ e, t0: performance.now(), dur }); return new Promise((r) => setTimeout(r, dur)); },
    // runs until stop() is called on the returned handle
    loop(e) { const h = { e, t0: performance.now(), dur: Infinity }; live.push(h); return { stop() { h.dead = true; } }; },
    draw(ctx, now) {
      const dt = Math.min(60, last ? now - last : 16); last = now;
      for (const h of live) { const p = h.dur === Infinity ? 0 : clamp01((now - h.t0) / h.dur); h.e.draw(ctx, p, dt, h.dur, now); if (p >= 1) h.dead = true; }
      live = live.filter((h) => !h.dead);
      return dt;
    },
    shake(amp, ms) { if (reduced()) return; shakeAmp = amp; shakeEnd = performance.now() + ms; },
    offset(now) { if (now >= shakeEnd) return [0, 0]; return [Math.round(rand(-shakeAmp, shakeAmp)), Math.round(rand(-shakeAmp, shakeAmp))]; }
  };
}

/* ---------- fire: a breath of flame ----------
   A stream of flame pixels widening on its way; white-hot in the middle, red at the edges.
   hit: it bursts at the target. Otherwise it dies out in smoke before it gets there. */
export function fireBreath(from, to, { hit = true, back = 0 } = {}) {
  const C = FX_PAL.fire, P = particles(), flames = [];
  const dx = to.x - from.x, dy = to.y - from.y, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
  const reach = hit ? 1 : 0.66; let boom = -1;
  return { draw(ctx, p, dt, dur, now) {
    const blowing = p < ARRIVE + 0.14;
    if (blowing) for (let i = 0; i < 8; i++) flames.push({ u: 0, off: rand(-1, 1), sp: rand(0.8, 1.3), ph: rand(0, 6.3), big: Math.random() < 0.4 });
    const du = dt / (ARRIVE * dur);
    for (const f of flames) {
      f.u += du * f.sp;
      if (f.u >= reach) {
        f.dead = true;
        if (hit && boom < 0) { boom = 0; burstOf(P, to, [C.hot, C.a, C.b, C.c], 30, { up: 0.1, spread: 0.11, back }); }
        else if (!hit && Math.random() < 0.3) P.add({ x: from.x + ux * len * f.u, y: from.y + uy * len * f.u + f.off * 6, vy: -rand(0.01, 0.03), vx: rand(-0.01, 0.01), c: Math.random() < 0.5 ? "#d0d0d0" : "#8f8f8f", s: 2, life: 560 });
        continue;
      }
      const w = 2 + f.u * 11, x = from.x + ux * len * f.u - uy * f.off * w, y = from.y + uy * len * f.u + ux * f.off * w - f.u * f.u * 4 + Math.sin(f.ph + f.u * 9);
      const edge = Math.abs(f.off), tail = f.u / reach;
      ctx.fillStyle = tail > 0.88 ? C.d : edge < 0.3 && tail < 0.6 ? C.hot : edge < 0.6 && tail < 0.8 ? C.a : edge < 0.85 ? C.b : C.c;
      const s = tail < 0.1 ? 2 : tail < 0.75 ? (f.big ? 4 : 3) : 2; dot(ctx, x - s / 2, y - s / 2, s, s);
    }
    for (let i = flames.length - 1; i >= 0; i--) if (flames[i].dead) flames.splice(i, 1);
    // the white-hot heart of the jet
    if (blowing) {
      const head = Math.min(reach, p / ARRIVE) * len * 0.8;
      for (let d = 0; d < head; d++) {
        const t = d / (len * 0.8), y = from.y + uy * d + Math.sin(d * 0.55 + now * 0.03) * (0.5 + t * 1.5) - t * t * 3;
        ctx.fillStyle = t < 0.5 ? C.hot : C.a; dot(ctx, from.x + ux * d, y - (t < 0.4 ? 1 : 0), 1, t < 0.4 ? 3 : t < 0.75 ? 2 : 1);
      }
    }
    if (boom >= 0) {
      boom += dt;
      const k = boom / (0.3 * dur);
      if (k < 1) { ctx.globalAlpha = 1 - k; ctx.fillStyle = k < 0.4 ? C.hot : C.a; disc(ctx, to.x, to.y, Math.round(5 + k * 10)); ctx.fillStyle = C.b; ring(ctx, to.x, to.y, 7 + k * 13); ctx.fillStyle = C.c; ring(ctx, to.x, to.y, 8 + k * 13); ctx.globalAlpha = 1; }
      if (Math.random() < 0.6 && k < 1.3) P.add({ x: to.x + rand(-9, 9), y: to.y + rand(-4, 8), vy: -rand(0.02, 0.05), c: Math.random() < 0.5 ? C.b : C.a, life: 440 });
    }
    P.step(ctx, dt);
  } };
}

/* ---------- water: a wave rolling over the grass ----------
   A crest with foam runs along the ground, a lower tail behind it, drops flying off the top.
   hit: it breaks into a splash. Otherwise it sinks into a puddle on the way. */
export function wave(from, to, { hit = true, back = 0 } = {}) {
  const C = FX_PAL.water, P = particles(), dir = Math.sign(to.x - from.x) || 1;
  const reach = hit ? 1 : 0.66, endX = from.x + (to.x - from.x) * reach; let splashed = false, rings = -1;
  return { draw(ctx, p, dt, dur, now) {
    const go = clamp01(p / ARRIVE), hx = from.x + (endX - from.x) * easeOut(go);
    const grow = clamp01(p / 0.1), fall = go < 1 ? 1 : 1 - clamp01((p - ARRIVE) / 0.16), amp = grow * fall;
    if (go >= 1 && !splashed) {
      splashed = true; rings = 0;
      if (hit) burstOf(P, { x: endX, y: groundY(endX) - 8 }, [C.hot, C.a, C.b, C.a, C.c], 30, { up: 0.11, spread: 0.09, g: 0.00042, life: 620, back });
      else for (let i = 0; i < 8; i++) P.add({ x: endX + rand(-8, 8), y: groundY(endX) - rand(0, 4), vy: -rand(0.008, 0.02), c: C.a, life: 500 });
    }
    if (amp > 0.02) {
      // a breaker: a hollow dark face in front, the peak a few pixels in, a round back, a low tail
      const FACE = [0.1, 0.2, 0.32, 0.46, 0.62, 0.82], PEAK = FACE.length, TOP = 18 * amp;
      let peakTop = null, peakX = 0;
      for (let i = 0; i <= 56; i++) {
        const x = Math.round(hx - dir * i); if ((x - from.x) * dir < 0) break;
        const back = i - PEAK, hump = back < 27 ? Math.sqrt(1 - (back / 27) * (back / 27)) : 0;
        const shape = i < PEAK ? FACE[i] : Math.max(hump, 0.24 * Math.exp(-back / 26));
        const H = Math.round(TOP * shape + (i > PEAK ? 0.9 * Math.sin(x * 0.7 + now * 0.012) : 0)); if (H < 1) continue;
        const gy = Math.round(groundY(x)) + 2;
        if (i === PEAK) { peakTop = gy - H; peakX = x; }
        ctx.fillStyle = C.d; dot(ctx, x, gy - H, 1, H);
        if (i >= PEAK) { // the back: lighter towards the top, a streak of foam now and then
          ctx.fillStyle = C.c; dot(ctx, x, gy - H, 1, Math.ceil(H * 0.82));
          if (H > 3) { ctx.fillStyle = C.b; dot(ctx, x, gy - H, 1, Math.ceil(H * 0.58)); }
          if (H > 6) { ctx.fillStyle = C.a; dot(ctx, x, gy - H, 1, Math.ceil(H * 0.24)); }
          if (H > 5 && (((x + Math.floor(now / 90)) % 6) + 6) % 6 === 0) { ctx.fillStyle = C.a; dot(ctx, x, gy - Math.ceil(H * 0.45), 1, 2); }
          ctx.fillStyle = C.hot; dot(ctx, x, gy - H, 1, back < 14 ? 2 : 1);
        } else { ctx.fillStyle = C.c; dot(ctx, x, gy - H, 1, Math.max(1, Math.ceil(H * 0.35))); }
      }
      // the lip: from the peak it reaches forward over the face and curls down, foam at its tip
      if (peakTop != null && amp > 0.45) {
        const r = Math.max(3, Math.round(6 * amp)), cy = peakTop + r;
        for (let a = -100; a <= 40; a += 7) {
          const ra = (a * Math.PI) / 180, lx = peakX + dir * Math.sin(((a + 100) * Math.PI / 180) * 0.9) * (r + 2), ly = cy + Math.sin(ra) * r;
          ctx.fillStyle = C.hot; dot(ctx, lx, ly, 2, 2);
          ctx.fillStyle = C.a; dot(ctx, lx - dir, ly + 1, 1, 1);
        }
        ctx.fillStyle = C.hot; dot(ctx, peakX + dir * (r + 1), cy + r - 1, 1, 2); dot(ctx, peakX + dir * (r + 3), cy + r + 2, 1, 1);
      }
    }
    if (go < 1) for (let i = 0; i < 2; i++) P.add({ x: hx + dir * rand(0, 4), y: groundY(hx) - rand(8, 14) * amp, vx: dir * rand(0.01, 0.05), vy: -rand(0.02, 0.06), g: 0.0004, c: Math.random() < 0.5 ? C.hot : C.a, life: 320 });
    if (rings >= 0) {
      rings += dt; const k = rings / (0.34 * dur);
      if (k < 1) { ctx.globalAlpha = 1 - k; ctx.fillStyle = hit ? C.hot : C.b; const gy = groundY(endX) + 2; ring(ctx, endX, gy, 5 + k * 13, 1.5 + k * 3); if (hit) ring(ctx, endX, gy, 2 + k * 8, 1 + k * 2); ctx.globalAlpha = 1; }
    }
    P.step(ctx, dt);
  } };
}

/* ---------- earth: curling vines ----------
   Several vines burst from the ground by the caster and arch through the air towards the target,
   curling into little spirals on the way. hit: they wind round the target in coils and thick roots
   with curled tips shoot up around it. hit without spikes (a shield in the way): they crumble into clods.
   Not hit: they wither and droop on the way. */
export function roots(from, to, { hit = true, spikes = true, small = false, back = 0 } = {}) {
  const C = FX_PAL.earth, P = particles(), OUT = "#4a2a14", DRY = ["#7d7867", "#8c8672", "#a59f8c"];
  const reach = hit ? 1 : 0.62, x0 = from.x, x1 = from.x + (to.x - from.x) * reach, k = small ? 0.7 : 1;
  // brown roots and green vines in turn, each on its own arch so they read as separate strands
  const TONES = [{ o: OUT, m: C.d, l: C.c, t: C.a }, { o: "#24461a", m: "#3f7d2a", l: "#8bb84a", t: "#c9e88a" }];
  const NV = small ? 3 : 5, mid = (NV - 1) / 2, vines = Array.from({ length: NV }, (_, i) => ({
    A: (2 + i * 5.5 + rand(-1, 1)) * k, dy: (i - mid) * 5 * k, sx: (i - mid) * 4, f: rand(11, 16), ph: rand(0, 6.3), w: rand(2.2, 3.4) * k,
    tone: TONES[i % 2], delay: Math.abs(i - mid) * 0.03,
    curls: (i % 2 ? [0.42, 0.74] : [0.55, 0.85]).slice(0, small ? 1 : 2).map((u, j) => ({ u: u + rand(-0.04, 0.04), side: (i + j) % 2 ? 1 : -1, spin: j % 2 ? 1 : -1 }))
  }));
  // a point of a vine at u (0 = by the caster's feet, 1 = at the target)
  const pt = (v, u) => {
    const xs = x0 + v.sx * (1 - u), x = xs + (x1 - xs) * u, ya = groundY(x0) + 1, yb = (hit ? to.y : groundY(x1) - 3) + v.dy;
    const y = ya + (yb - ya) * u - Math.sin(Math.PI * u) * v.A + Math.sin(u * v.f + v.ph) * v.w * Math.sin(Math.PI * Math.min(1, u * 1.4));
    return [x, y];
  };
  const coilsAt = small ? [-5, 1, 7] : [-9, -2, 5, 11], RX = small ? 9 : 13;
  const S = (small ? [[-10, 11], [10, 10]] : [[-16, 15], [-7, 21], [8, 19], [16, 14]]).map(([o, h]) => ({ o, h, lean: -Math.sign(o) }));
  let landed = false;
  return { draw(ctx, p, dt, dur, now) {
    const gone = hit ? clamp01((p - 0.86) / 0.14) : clamp01((p - ARRIVE - 0.05) / 0.3), live = hit || p < ARRIVE;
    const droop = hit ? 0 : clamp01((p - ARRIVE) / 0.25) * 6;
    ctx.globalAlpha = 1 - gone;
    for (const v of vines) {
      const T = live ? v.tone : { o: DRY[0], m: DRY[1], l: DRY[2], t: DRY[2] };
      const head = easeOut(clamp01((p - v.delay) / (ARRIVE - v.delay))), steps = Math.ceil(Math.abs(x1 - x0) * 2.4);
      for (let i = 0; i <= steps * head; i++) {
        const u = i / steps; let [x, y] = pt(v, u); y += droop * u * u;
        const w = u < 0.3 ? 2 : 1, tip = head - u < 0.035;
        ctx.fillStyle = T.o; dot(ctx, x, y + 1, w, 1);
        ctx.fillStyle = tip ? T.t : T.m; dot(ctx, x, y, w, 1);
        if (w > 1 && i % 4 === 0) { ctx.fillStyle = T.l; dot(ctx, x, y, 1, 1); }
      }
      // spiral tendrils unroll once the vine has grown past them
      for (const c of v.curls) {
        const grow = clamp01((head - c.u) / 0.2); if (grow <= 0) continue;
        const [bx, by0] = pt(v, c.u), by = by0 + droop * c.u * c.u, R = (small ? 3.5 : 5) * (c.u < 0.6 ? 1 : 0.8), TURN = 1.7 * Math.PI * 2;
        const cx = bx, cy = by + c.side * R, a0 = c.side > 0 ? -Math.PI / 2 : Math.PI / 2;
        for (let t = 0; t <= TURN * grow; t += 0.22) {
          const r = R * (1 - (t / TURN) * 0.8), a = a0 + c.spin * t, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
          ctx.fillStyle = T.o; dot(ctx, x, y + 1); ctx.fillStyle = t < 3 ? T.m : T.l; dot(ctx, x, y);
        }
        if (grow >= 1 && live) { ctx.fillStyle = T.t; dot(ctx, cx, cy); }
      }
      // a leaf or two on the green vines
      if (head > 0.6 && live && v.tone === TONES[1]) for (const u of [0.33, 0.58]) { const [lx, ly] = pt(v, u); ctx.fillStyle = T.l; dot(ctx, lx - 1, ly - 3, 3, 2); ctx.fillStyle = T.t; dot(ctx, lx, ly - 3, 2, 1); ctx.fillStyle = T.m; dot(ctx, lx, ly - 1); }
    }
    if (p < ARRIVE && Math.random() < 0.6) P.add({ x: x0 + rand(-3, 3), y: groundY(x0) + 1, vx: rand(-0.02, 0.02), vy: -rand(0.02, 0.05), g: 0.0004, c: Math.random() < 0.6 ? C.c : C.d, life: 320 });
    if (p >= ARRIVE && !landed) {
      landed = true;
      if (hit) burstOf(P, to, [C.c, C.d, C.a, C.c, C.b], spikes ? 18 : 28, { up: spikes ? 0.09 : 0.08, spread: 0.08, g: 0.00045, life: 560, back });
      else for (let i = 0; i < 8; i++) P.add({ x: x1 - rand(0, 30), y: groundY(x1) - rand(2, 10), vy: rand(0.005, 0.02), vx: rand(-0.01, 0.01), c: i % 2 ? C.b : DRY[2], life: 650 });
    }
    if (hit && spikes && p >= ARRIVE) {
      const g = clamp01((p - ARRIVE) / 0.16), up = easeBack(g) * (1 - gone);
      // coils winding round the target: the back half dim, the front half bright
      coilsAt.forEach((oy, j) => {
        const span = Math.PI * 2.2 * clamp01((p - ARRIVE - j * 0.02) / 0.14), cy = to.y + oy * k;
        for (let t = 0; t <= span; t += 0.12) {
          const a = t + j * 1.3, x = to.x + Math.cos(a) * RX, y = cy + Math.sin(a) * 3 * k - (t / (Math.PI * 2)) * 3, front = Math.sin(a) > 0;
          ctx.globalAlpha = (front ? 1 : 0.45) * (1 - gone);
          ctx.fillStyle = front ? OUT : C.d; dot(ctx, x, y + 1, 2, 1); ctx.fillStyle = front ? C.d : C.c; dot(ctx, x, y, 2, 1);
          if (front && Math.floor(t * 4) % 7 === 0) { ctx.fillStyle = C.a; dot(ctx, x, y - 1, 1, 1); }
        }
      });
      ctx.globalAlpha = 1 - gone;
      // thick roots round the target, their tips rolled into curls
      for (const sp of S) {
        const bx = to.x + sp.o * k, by = Math.round(groundY(bx)) + 2, H = Math.max(0, Math.round(sp.h * k * up));
        for (let q = 0; q < H; q++) {
          const t = q / (sp.h * k), x = Math.round(bx + sp.lean * Math.sin(t * 2.3) * 4), w = t < 0.35 ? 4 : t < 0.7 ? 3 : 2, l = x - (w >> 1);
          ctx.fillStyle = OUT; dot(ctx, l, by - q, w, 1); ctx.fillStyle = C.d; dot(ctx, l + 1, by - q, Math.max(1, w - 2), 1);
          if (w > 3) { ctx.fillStyle = C.c; dot(ctx, l + 1, by - q, 1, 1); }
        }
        if (H >= sp.h * k - 1) {
          const tx = Math.round(bx + sp.lean * Math.sin(2.3) * 4), ty = by - H, R = 3;
          for (let t = 0; t <= Math.PI * 3.2; t += 0.35) { const r = R * (1 - t / (Math.PI * 4)), a = Math.PI / 2 + sp.lean * t; ctx.fillStyle = t < 3 ? C.d : C.b; dot(ctx, tx + sp.lean * R + Math.cos(a) * r, ty - R + Math.sin(a) * r); }
          ctx.fillStyle = C.a; dot(ctx, tx - sp.lean, ty - 1, 2, 1);
        }
      }
    }
    ctx.globalAlpha = 1;
    P.step(ctx, dt);
  } };
}
export const SPELL_FX = { fire: fireBreath, water: wave, earth: roots };

/* ---------- sparks gathering into the hand (or the monster's mouth) before a spell ---------- */
export function charge(at, el) {
  const C = FX_PAL[el], n = 9, ph = rand(0, 6.3);
  return { draw(ctx, p) {
    for (let i = 0; i < n; i++) {
      const a = ph + (i / n) * Math.PI * 2 + p * 3.2, r = 13 * (1 - easeOut(p)) + 1;
      ctx.fillStyle = i % 3 === 0 ? C.hot : i % 3 === 1 ? C.a : C.b; dot(ctx, at.x + Math.cos(a) * r, at.y + Math.sin(a) * r * 0.8);
    }
    ctx.fillStyle = C.a; disc(ctx, at.x, at.y, Math.round(1 + p * 2)); ctx.fillStyle = C.hot; dot(ctx, at.x, at.y);
  } };
}

// a few sparks where something was hit
export function sparks(at, el, n = 14) {
  const C = FX_PAL[el], P = particles(); let done = false;
  return { draw(ctx, p, dt) { if (!done) { done = true; burstOf(P, at, [C.hot, C.a, C.b], n, { up: 0.08, spread: 0.08 }); } P.step(ctx, dt); } };
}

/* ---------- wind: a whirlwind that lifts a beaten monster off the ground ---------- */
export function tornado(cx, gy) {
  const leaves = Array.from({ length: 11 }, (_, i) => ({ a: rand(0, 6.3), k: rand(0, 1), sp: rand(0.7, 1.3), c: i % 3 ? "#8bb84a" : "#e2c15a" }));
  return { draw(ctx, p, dt, dur, now) {
    const H = Math.round(42 * easeOut(clamp01(p / 0.22))), fade = 1 - clamp01((p - 0.8) / 0.2), spin = Math.floor(now / 55);
    for (let k = 0; k < H; k++) {
      const y = Math.round(gy) - k, w = Math.round(2 + k * 0.42), sway = Math.round(Math.sin(now / 95 + k * 0.3) * (1 + k * 0.08)), x = Math.round(cx) + sway;
      // the body: bands of pale air turning round, slanted so the funnel seems to spin
      for (let i = -w; i <= w; i++) {
        const band = (((i + k + spin * 2 + (k >> 3) * 3) % 11) + 11) % 11, rim = Math.abs(i) >= w;
        ctx.globalAlpha = (rim ? 0.8 : band < 3 ? 0.7 : band < 6 ? 0.42 : 0.24) * fade;
        ctx.fillStyle = rim || band < 3 ? "#ffffff" : band < 6 ? "#dff3f7" : "#b9dbe4"; ctx.fillRect(x + i, y, 1, 1);
      }
    }
    // dust at the foot
    ctx.globalAlpha = 0.6 * fade; ctx.fillStyle = "#e9dcb8";
    for (let j = 0; j < 6; j++) { const a = now / 70 + j * 1.05; dot(ctx, cx + Math.cos(a) * (5 + (j % 3) * 2), gy + 1 + Math.sin(a) * 1.5, 2, 1); }
    for (const l of leaves) {
      l.a += dt * 0.013 * l.sp; l.k = (l.k + (dt / (0.55 * dur)) * l.sp) % 1;
      const k = l.k * H, w = 4 + k * 0.46, front = Math.sin(l.a) > 0;
      ctx.globalAlpha = (front ? 1 : 0.45) * fade; ctx.fillStyle = l.c; dot(ctx, cx + Math.cos(l.a) * w, gy - k, 2, front ? 2 : 1);
    }
    ctx.globalAlpha = 1;
  } };
}

/* ---------- a monster's element shows around it: embers, drops, leaves ---------- */
export function aura(el, at) {
  const C = FX_PAL[el], P = particles(); let wait = 0;
  return { draw(ctx, p, dt) {
    wait -= dt;
    if (wait <= 0 && !reduced()) {
      wait = rand(140, 320);
      const x = at.x + rand(-15, 15);
      if (el === "fire") P.add({ x, y: at.y + rand(0, 12), vy: -rand(0.012, 0.03), vx: rand(-0.006, 0.006), c: Math.random() < 0.5 ? C.a : C.b, life: 800 });
      else if (el === "water") P.add({ x, y: at.y + rand(-14, 0), vy: rand(0.01, 0.02), g: 0.00012, c: Math.random() < 0.5 ? C.a : C.b, life: 700 });
      else P.add({ x, y: at.y + rand(-16, -4), vy: rand(0.008, 0.016), vx: rand(-0.012, 0.012), c: Math.random() < 0.5 ? C.a : C.b, s: Math.random() < 0.4 ? 2 : 1, life: 900 });
    }
    P.step(ctx, dt);
  } };
}

/* ---------- the shield: a glass sphere around the hero ----------
   show(): pops up. hit(x, y): a ripple runs over it from that point. hide(): fades.
   weak(): a flickering, too-thin sphere (wrong answer); shatter(): it bursts into shards. */
export function makeShield(cx, cy, R) {
  const D = 2 * R + 7, buf = document.createElement("canvas"); buf.width = buf.height = D;
  const bx = buf.getContext("2d"), img = bx.createImageData(D, D), P = particles();
  let mode = null, tIn = 0, tHit = -1e9, hx = 0, hy = 0, tOut = 0, tBreak = -1e9;
  return {
    get on() { return !!mode; },
    show() { mode = "on"; tIn = performance.now(); tOut = 0; },
    weak() { mode = "weak"; tIn = performance.now(); tOut = 0; },
    hit(x, y) { tHit = performance.now(); hx = x - cx; hy = y - cy; },
    hide() { if (mode) tOut = performance.now(); },
    shatter() {
      mode = null; tBreak = performance.now();
      for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2 + rand(-0.1, 0.1), s = rand(0.03, 0.09); P.add({ x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.03, g: 0.0003, s: Math.random() < 0.5 ? 2 : 1, c: i % 3 ? "#bfeaff" : "#ffffff", life: rand(380, 620) }); }
    },
    draw(ctx, now, dt) {
      if (now - tBreak < 110) { ctx.globalAlpha = 0.9; ctx.fillStyle = "#ffffff"; ring(ctx, cx, cy, R + (now - tBreak) / 22); ctx.globalAlpha = 1; }
      P.step(ctx, dt);
      if (!mode) return;
      const fade = tOut ? 1 - clamp01((now - tOut) / 260) : 1;
      if (fade <= 0) { mode = null; return; }
      const r = R * (reduced() ? 1 : easeBack(clamp01((now - tIn) / 240)));
      const mul = fade * (mode === "weak" ? (Math.floor(now / 70) % 2 ? 0.55 : 0.2) : 1);
      const age = now - tHit, rip = age < 520, rr = age / 6, band = ((now / 9) % (R * 5)) - R * 2.5, d32 = img.data;
      for (let py = 0; py < D; py++) for (let px = 0; px < D; px++) {
        const dx = px - (D >> 1), dy = py - (D >> 1), d = Math.hypot(dx, dy), o = (py * D + px) * 4;
        if (d > r + 0.4) { d32[o + 3] = 0; continue; }
        let a = 0.1 + 0.3 * Math.pow(d / r, 2.5), w = 0;
        if (d >= r - 3) { a = Math.max(a, 0.45); w = 0.2; }
        if (d >= r - 1.3) { a = 0.95; w = 0.55; }
        if (Math.abs(dx * 0.8 + dy * 0.6 - band) < 1.6) { a += 0.2; w += 0.35; } // a glint sliding over the glass
        const ang = Math.atan2(dy, dx);
        if (d > r * 0.6 && d < r * 0.8 && ang > -2.75 && ang < -1.85) { a = 0.85; w = 1; } // highlight, top left
        if (Math.hypot(dx - r * 0.42, dy - r * 0.48) < 1.4) { a = 0.6; w = 1; }
        if (rip) {
          const k = 1 - age / 520;
          if (Math.abs(Math.hypot(dx - hx, dy - hy) - rr) < 1.5) { a += 0.6 * k; w = 1; }
          if (age < 130) { a += 0.2; if (d >= r - 1.3) w = 1; }
        }
        w = Math.min(1, w);
        d32[o] = 120 + 135 * w; d32[o + 1] = 205 + 50 * w; d32[o + 2] = 255; d32[o + 3] = Math.min(1, a) * mul * 255;
      }
      bx.putImageData(img, 0, 0);
      ctx.drawImage(buf, cx - (D >> 1), cy - (D >> 1));
    }
  };
}

// a one-colour copy of a sprite: the white flash when something is hit
const tints = new WeakMap();
export function silhouette(spr, color = "#ffffff") {
  let c = tints.get(spr);
  if (!c) {
    c = document.createElement("canvas"); c.width = spr.width; c.height = spr.height; c._res = spr._res;
    const x = c.getContext("2d"); x.drawImage(spr, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    tints.set(spr, c);
  }
  return c;
}
