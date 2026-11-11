/* ================== Helpers ================== */
export const $ = (id) => document.getElementById(id);
export const app = $("app");
/* Game randomness (maps, monsters, words, passwords) goes through rnd(). Normally it is
   Math.random; tests set window.__LW_TEST.seed before the page loads, which makes every
   expedition repeatable, so a failure seen once can be replayed exactly.
   Visual effects and sounds use Math.random directly: they run on timers and would
   otherwise shift the sequence. */
let R = Math.random;
export const rnd = () => R();
export function seedRandom(seed) { R = mulberry(seed >>> 0); }
if (typeof window !== "undefined" && window.__LW_TEST && window.__LW_TEST.seed != null) seedRandom(window.__LW_TEST.seed);
export const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
export const rand = (a, b) => a + R() * (b - a);
export const pick = (a) => a[Math.floor(R() * a.length)];
export const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const RM = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
export const reduced = () => RM.matches;
export function darken(hex, f) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const h = (v) => Math.round(v * f).toString(16).padStart(2, "0");
  return "#" + h(r) + h(g) + h(b);
}
export function mulberry(seed) { return function () { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
