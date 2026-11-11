import { GS } from "./state.js";
import { land } from "./lands.js";
import { mulberry, reduced } from "./util.js";

/* ================== Scene renderer ================== */
export const S = 4; // internal scale
GS.scene = null;
export function mountCanvas(cols, rows) {
  const c = document.createElement("canvas"); c.className = "pixel-canvas"; c.width = cols * 16 * S; c.height = rows * 16 * S;
  c.setAttribute("role", "img");
  const x = c.getContext("2d"); x.imageSmoothingEnabled = false; x.setTransform(S, 0, 0, S, 0, 0);
  return { c, x, cols, rows };
}
export function draw(ctx, spr, lx, ly, scale = 1, noShadow) {
  const k = scale / (spr._res || 1), ox = Math.round((lx - k) * 2) / 2, oy = Math.round((ly - k) * 2) / 2;
  if (spr._sh && !noShadow) {
    const f = spr._sh, cx = ox + ((f.left + f.right + 1) / 2) * k, cy = oy + (f.bottom + 0.5) * k, rx = ((f.right - f.left + 1) / 2) * k * 0.85;
    ctx.fillStyle = "rgba(25,45,15,.26)"; ctx.beginPath(); ctx.ellipse(cx, cy, rx, Math.max(1.5, rx * 0.28), 0, 0, 7); ctx.fill();
  }
  ctx.drawImage(spr, ox, oy, spr.width * k, spr.height * k);
}
// warm light from the top-left and a soft vignette, baked into backgrounds
export function light(ctx, w, h) {
  const g = ctx.createRadialGradient(w * 0.25, -h * 0.2, 4, w * 0.4, h * 0.3, Math.max(w, h));
  g.addColorStop(0, "rgba(255,240,190,.22)"); g.addColorStop(0.55, "rgba(255,240,190,0)"); g.addColorStop(1, "rgba(10,30,20,.22)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}
let lastFrame = 0;
export function loop(t) {
  if (t - lastFrame >= 31 && GS.scene && GS.scene.cv.c.isConnected) { lastFrame = t; GS.scene.draw(t); }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
export function bob(t, ph = 0) { return reduced() ? 0 : Math.round((Math.sin(t / 260 + ph) + 1) / 2); }

// generic clearing: tree line on top, grass, optional dirt band
export function clearing(cv, seed, band, T = land()) {
  const { x, cols, rows } = cv, rnd = mulberry(seed);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) x.drawImage(band && r === band ? T.lane[(r + c) % 2] : T.ground[Math.floor(rnd() * 3)], c * 16, r * 16, 16, 16);
  for (let i = 0; i < 6; i++) { const fx_ = Math.floor(rnd() * cols * 16), fy = 24 + Math.floor(rnd() * (rows * 16 - 34)); draw(x, rnd() < 0.5 ? T.flowers[0] : T.flowers[1], fx_ - 8, fy - 12); }
  for (let c = -1; c < cols + 1; c++) draw(x, T.tree, c * 16 + (Math.abs(c) % 2 ? 8 : 0), Math.abs(c) % 2 ? -5 : -3);
  light(x, cols * 16, rows * 16);
}
export function bakeClearing(cols, rows, seed, band, T) {
  const cv = { c: document.createElement("canvas"), cols, rows };
  cv.c.width = cols * 32; cv.c.height = rows * 32; cv.x = cv.c.getContext("2d"); cv.x.imageSmoothingEnabled = false; cv.x.scale(2, 2);
  clearing(cv, seed, band, T); return cv.c;
}
