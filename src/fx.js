import { L } from "./content.js";
import { SPR } from "./props.js";
import { draw } from "./scene.js";
import { $, esc, pick, rand, reduced, ri, shuffle } from "./util.js";

/* ================== Effects (canvas particles) ================== */
export const fx = $("fx"), fctx = fx.getContext("2d");
export let FW = 0, FH = 0, parts = [], pq = [], frun = false;
export function fresize() { const d = window.devicePixelRatio || 1; FW = innerWidth; FH = innerHeight; fx.width = FW * d; fx.height = FH * d; fctx.setTransform(d, 0, 0, d, 0, 0); }
addEventListener("resize", fresize); fresize();
export function padd(p) { pq.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, g: 0.3, drag: 0.99, rot: 0, vr: 0, life: 0, max: 400, a: 1 }, p)); if (!frun) { frun = true; requestAnimationFrame(ftick); } }
export function ftick() {
  fctx.clearRect(0, 0, FW, FH); if (pq.length) { parts = parts.concat(pq); pq = []; }
  const alive = [];
  for (const p of parts) {
    if (p.update) p.update(p);
    p.vy += p.g; p.vx *= p.drag; p.vy *= p.drag; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life++;
    if (p.fade) p.a = Math.max(0, 1 - p.life / p.max);
    fctx.save(); fctx.globalAlpha = p.a; fctx.translate(p.x, p.y); fctx.rotate(p.rot); p.draw(p); fctx.restore();
    const dead = p.life >= p.max || p.y > FH + 100 || (p.done && p.done(p));
    if (dead) { if (p.onDead) p.onDead(p); } else alive.push(p);
  }
  parts = alive;
  if (parts.length || pq.length) requestAnimationFrame(ftick); else { frun = false; fctx.clearRect(0, 0, FW, FH); }
}
export const PAL = ["#ff5d73", "#ffc93c", "#2f7de1", "#1fbf7a", "#a66bff", "#ff9f40", "#22c7d6"];
export function px(sz, c) { return () => { fctx.fillStyle = c; fctx.fillRect(-sz / 2, -sz / 2, sz, sz); }; }
export function burst(el, n = 26, colors = ["#ffd93c", "#ffe98a", "#ff9f40", "#ffffff"]) {
  if (reduced() || !el) return;
  const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), s = rand(3, 9); padd({ x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 0.15, drag: 0.95, max: 60, fade: true, draw: px(ri(4, 8), pick(colors)) }); }
}
export const BIG = {
  confetti() { for (let i = 0; i < 160; i++) { const L = i % 2 === 0; padd({ x: L ? 0 : FW, y: FH * 0.7, vx: (L ? 1 : -1) * rand(4, 13), vy: -rand(10, 20), g: 0.35, vr: rand(-0.3, 0.3), draw: px(ri(6, 11), pick(PAL)) }); } },
  fireworks() { for (let k = 0; k < 5; k++) setTimeout(() => { const tx = rand(FW * 0.15, FW * 0.85), ty = rand(FH * 0.12, FH * 0.4), g = 0.25, col = pick(PAL);
    padd({ x: tx, y: FH, vy: -Math.sqrt(2 * g * (FH - ty)), g, drag: 1, done: (p) => p.vy >= 0, draw: px(5, "#fff6c9"),
      onDead(p) { for (let i = 0; i < 56; i++) { const a = (i / 56) * Math.PI * 2, s = rand(2, 6.5); padd({ x: p.x, y: p.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 0.06, drag: 0.97, max: rand(60, 100), fade: true, draw: px(5, col) }); } } }); }, k * 380); },
  coins() { const img = SPR.coin; for (let i = 0; i < 45; i++) { const s = rand(28, 44); padd({ x: rand(0, FW), y: -rand(20, FH * 0.6), vx: rand(-1, 1), vy: rand(1, 4), g: 0.3, max: 600, b: 0,
    update(p) { if (p.y > FH - 20 && p.vy > 0 && p.b < 2) { p.vy *= -0.55; p.b++; } }, draw() { fctx.imageSmoothingEnabled = false; fctx.drawImage(img, -s / 2, -s / 2, s, s); } }); } },
  hearts() { const img = SPR.heart; for (let i = 0; i < 30; i++) setTimeout(() => { const s = rand(28, 48), ph = rand(0, 6);
    padd({ x: FW / 2 + rand(-160, 160), y: FH * 0.8, vx: rand(-1.5, 1.5), vy: -rand(3, 6), g: -0.02, max: 200, fade: true, update(p) { p.x += Math.sin(p.life / 12 + ph) * 1.3; }, draw() { fctx.imageSmoothingEnabled = false; fctx.drawImage(img, -s / 2, -s / 2, s, s); } }); }, i * 40); },
  stars() { const img = SPR.star; for (let i = 0; i < 40; i++) { const s = rand(24, 44); padd({ x: rand(0, FW), y: -rand(20, FH * 0.7), vy: rand(2, 4), g: 0.04, vr: rand(-0.08, 0.08), max: 700, draw() { fctx.imageSmoothingEnabled = false; fctx.drawImage(img, -s / 2, -s / 2, s, s); } }); } }
};
export let bag = [];
export function bigEffect() { if (reduced()) return; if (!bag.length) bag = shuffle(Object.keys(BIG)); BIG[bag.pop()](); }
export function praise(text) {
  const box = $("praise"); box.innerHTML = `<div class="big">${esc(text)}</div>`;
  box.animate(reduced() ? [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }]
    : [{ transform: "scale(0)", opacity: 0 }, { transform: "scale(1.2)", opacity: 1, offset: 0.2 }, { transform: "scale(1)", offset: 0.3 }, { transform: "scale(1)", opacity: 1, offset: 0.8 }, { transform: "translateY(-40px)", opacity: 0 }],
    { duration: 1700, easing: "ease-out", fill: "forwards" });
}
export const PRAISE = ["Brawo!", "Super!", "Hurra!", "Ekstra!", "Wow!", "Bomba!", "Genialnie!"];
