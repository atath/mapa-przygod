/* ================== Helpers ================== */
export const $ = (id) => document.getElementById(id);
export const app = $("app");
export const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export function darken(hex, f) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const h = (v) => Math.round(v * f).toString(16).padStart(2, "0");
  return "#" + h(r) + h(g) + h(b);
}
export function mulberry(seed) { return function () { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
