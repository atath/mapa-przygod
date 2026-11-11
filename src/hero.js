import { P, lighten, sprite } from "./sprites.js";
import { darken } from "./util.js";

/* ---------- Heroine (32 × 36) ---------- */
export function fringe(g, part) {
  g.ell(16, 9, 9.6, 4.8, "H");
  for (const x of part ? [10, 13, 19, 22] : [10, 14, 18, 22]) { g.px(x, 13, "S", "H"); g.px(x + 1, 13, "S", "H"); }
  if (part) { g.rect(15, 6, 2, 8, "S", "H"); g.px(15, 5, "d"); g.px(16, 5, "d"); }
  g.line(10, 6, 14, 4, "h"); g.px(19, 5, "h"); g.px(20, 5, "h");
}
export const HAIR = {
  long: { name: "Długie",
    back(g) { g.ell(16, 13, 11.2, 10, "H"); g.rect(5, 13, 22, 12, "H"); g.ell(16, 25, 11, 2.5, "H"); g.line(7, 16, 6, 25, "d"); g.line(25, 16, 26, 25, "d"); },
    front(g) { fringe(g); g.rect(7, 11, 2, 11, "H"); g.rect(23, 11, 2, 11, "H"); g.px(7, 21, "d"); g.px(24, 21, "d"); } },
  tails: { name: "Kucyki",
    back(g) { g.ell(16, 12.5, 10.6, 9.6, "H"); g.ell(4.2, 19, 3.2, 6.2, "H"); g.ell(27.8, 19, 3.2, 6.2, "H"); g.line(3, 15, 4, 23, "h"); g.line(28, 15, 29, 23, "h"); },
    front(g) { fringe(g); g.rect(7, 11, 2, 6, "H"); g.rect(23, 11, 2, 6, "H"); g.rect(5, 12, 3, 2, "R"); g.rect(24, 12, 3, 2, "R"); } },
  short: { name: "Krótkie",
    back(g) { g.ell(16, 13, 11.2, 10, "H"); g.rect(5, 13, 22, 8, "H"); g.ell(16, 21, 11, 2, "H"); },
    front(g) { g.poly([[6.5, 12], [9, 5], [16, 3.5], [25, 6], [25.5, 14], [21, 9], [14, 11], [9, 13]], "H"); g.rect(7, 12, 2, 9, "H"); g.rect(23, 12, 2, 9, "H"); g.line(11, 6, 16, 5, "h"); g.line(18, 9, 22, 8, "d"); } },
  bun: { name: "Kok",
    back(g) { g.ell(16, 12.5, 10.2, 9.6, "H"); g.ell(16, 3.6, 4.6, 3.6, "H"); g.px(14, 2, "h"); g.px(15, 1, "h"); g.rect(12, 6, 8, 1, "R"); },
    front(g) { fringe(g, true); g.rect(7, 11, 2, 5, "H"); g.rect(23, 11, 2, 5, "H"); } }
};
Object.assign(HAIR, {
  bshort: { name: "Krótkie", gender: "boy",
    back(g) { g.ell(16, 12, 10.4, 8.8, "H"); },
    front(g) { g.ell(16, 8.6, 9.6, 4.8, "H"); for (const x of [11, 15, 19]) g.px(x, 13, "S", "H"); g.rect(7, 11, 2, 4, "H"); g.rect(23, 11, 2, 4, "H"); g.line(11, 6, 15, 4, "h"); } },
  spiky: { name: "Jeżyk", gender: "boy",
    back(g) { g.ell(16, 12, 10.2, 8.6, "H"); for (const p of [[[6.5, 10], [7, 3], [11, 7]], [[9.5, 7], [12, 0.5], [15, 5.5]], [[13.5, 5.5], [16.5, 0], [19, 5.5]], [[17.5, 5.5], [21, 0.5], [23, 7]], [[21.5, 7], [25.5, 3], [25.5, 10.5]]]) g.poly(p, "H"); g.line(12, 3, 13, 1, "h"); g.line(16, 3, 16, 1, "h"); g.line(20, 3, 21, 1, "h"); },
    front(g) { g.ell(16, 8.4, 9.4, 3.8, "H"); g.poly([[9, 9], [11, 13.5], [13, 9]], "H"); g.poly([[13.5, 9], [15.5, 13.5], [17.5, 9]], "H"); g.poly([[18, 9], [20.5, 13.5], [22.5, 9]], "H"); g.rect(7, 11, 2, 3, "H"); g.rect(23, 11, 2, 3, "H"); } },
  side: { name: "Zaczesane", gender: "boy",
    back(g) { g.ell(16, 12, 10.4, 8.8, "H"); },
    front(g) { g.poly([[7, 12.5], [8, 6], [14, 3.5], [24, 5], [25, 11], [20, 9.5], [14, 11], [10, 13]], "H"); g.rect(7, 11, 2, 4, "H"); g.rect(23, 10, 2, 5, "H"); g.line(10, 6, 16, 4, "h"); g.line(18, 8, 22, 7, "d"); } },
  curly: { name: "Kręcone", gender: "boy",
    back(g) { g.ell(16, 12, 10.8, 9.2, "H"); for (const [x, y] of [[7, 8], [10, 4.5], [14, 3], [18, 3], [22, 4.5], [25, 8], [6, 12], [26, 12]]) g.ell(x, y, 2.8, 2.8, "H"); },
    front(g) { for (const [x, y] of [[9.5, 9.5], [13, 8.6], [16.5, 8.4], [20, 8.6], [23, 9.6]]) g.ell(x, y, 2.4, 2.6, "H"); for (const [x, y] of [[9, 8], [16, 7], [22, 8], [12, 4], [19, 3], [8, 11]]) g.px(x, y, "h"); g.rect(7, 11, 2, 3, "H"); g.rect(23, 11, 2, 3, "H"); } }
});
export const HATS = {
  none: { name: "Bez czapki", price: 0, draw() {} },
  flower: { name: "Kwiatek", price: 10, draw(g) { for (const [x, y] of [[23, 8], [27, 8], [25, 6], [25, 10]]) g.ell(x, y, 1.7, 1.7, "P"); g.ell(25, 8, 1.2, 1.2, "Y"); g.px(26, 7, "W"); } },
  band: { name: "Opaska z gwiazdką", price: 12, draw(g) { g.rect(6, 8, 20, 2, "G"); g.rect(6, 8, 20, 1, "g", "G"); for (const [x, y] of [[16, 6], [15, 7], [16, 7], [17, 7], [14, 8], [15, 8], [16, 8], [17, 8], [18, 8], [15, 9], [17, 9]]) g.px(x, y, "Y"); } },
  ears: { name: "Kocie uszka", price: 20, draw(g) {
    g.poly([[6.5, 10], [8.5, 0], [14, 5.5]], "H"); g.poly([[25.5, 10], [23.5, 0], [18, 5.5]], "H");
    g.poly([[8.3, 7.5], [9.2, 2.6], [12, 5.6]], "P"); g.poly([[23.7, 7.5], [22.8, 2.6], [20, 5.6]], "P"); } },
  beanie: { name: "Czapka zimowa", price: 25, draw(g) {
    g.ell(16, 9.5, 10.8, 8.5, "Q", false, 0, 8); g.rect(6, 4, 20, 1, "q", "Q"); g.rect(6, 6, 20, 1, "q", "Q");
    g.rect(5, 8, 22, 3, "W"); g.rect(5, 10, 22, 1, "w", "W"); g.ell(16, 1.6, 2.6, 2, "W"); } },
  crown: { name: "Korona", price: 30, draw(g) {
    g.rect(9, 4, 14, 3, "Y"); g.poly([[9, 4.5], [9, 0], [12.5, 4.5]], "Y"); g.poly([[13.5, 4.5], [16, 0], [18.5, 4.5]], "Y"); g.poly([[23, 4.5], [23, 0], [19.5, 4.5]], "Y");
    g.rect(9, 6, 14, 1, "y"); g.px(12, 5, "R"); g.px(16, 5, "Q"); g.px(19, 5, "R"); g.px(16, 1, "W"); } },
  knight: { name: "Hełm rycerki", nameM: "Hełm rycerza", price: 35, draw(g) {
    g.ell(16, 11, 11.3, 9.5, "A", false, 0, 11); g.rect(5, 10, 3, 9, "A"); g.rect(24, 10, 3, 9, "A");
    g.rect(15, 2, 2, 9, "a"); for (const [x, y] of [[6, 12], [6, 16], [25, 12], [25, 16], [10, 9], [21, 9]]) g.px(x, y, "a");
    g.ell(16, 1.4, 3.4, 2.1, "R"); g.px(14, 0, "r"); g.line(9, 5, 12, 3, "W"); } },
  wizard: { name: "Kapelusz czarodziejki", nameM: "Kapelusz czarodzieja", price: 40, draw(g) {
    g.poly([[17, -4], [24.5, 9], [7.5, 9]], "M"); g.ell(16, 9.5, 12.8, 2.2, "M"); g.rect(9, 7, 14, 1, "Y", "M");
    for (const [x, y] of [[15, 2], [14, 3], [15, 3], [16, 3], [15, 4]]) g.px(x, y, "Y"); g.px(19, 5, "W"); g.line(10, 10, 22, 10, "n", 1, "M"); } }
};
export const SKINS = ["#f5d0b5", "#e8b48f", "#c68a5e", "#8d5a3b"];
export const HAIRC = ["#3b2a20", "#8a5a2b", "#e8c14f", "#d9622b", "#1c1c24", "#e86fb0"];
export const OUTFITS = ["#e2445c", "#3d7be0", "#8a4fd8", "#2fa36b", "#f0a33a", "#ff8fc8"];
const HERO_CACHE = new Map();
const LOOK = ["gender", "hair", "hairColor", "skin", "outfit", "hat"];
export function heroSprite(h) {
  const key = LOOK.map((k) => h[k]).join("|");
  let c = HERO_CACHE.get(key);
  if (!c) { if (HERO_CACHE.size > 80) HERO_CACHE.clear(); c = buildHero(h); HERO_CACHE.set(key, c); }
  return c;
}
function buildHero(h) {
  const g = P(32, 36);
  if (!HAIR[h.hair]) h = Object.assign({}, h, { hair: h.gender === "boy" ? "bshort" : "tails" });
  HAIR[h.hair].back(g);
  g.ell(7.6, 15.5, 1.3, 1.9, "S"); g.ell(24.4, 15.5, 1.3, 1.9, "S");
  g.ell(16, 14.5, 8.6, 7.6, "S");
  g.rect(14, 21, 4, 2, "s");
  const boy = h.gender === "boy";
  if (boy) {
    g.poly([[11, 22], [21, 22], [22.6, 28.5], [9.4, 28.5]], "O"); g.poly([[19, 23], [21, 22], [22.6, 28.5], [20.5, 28.5]], "o");
    g.poly([[13.5, 22], [16, 24.6], [18.5, 22]], "q"); g.px(16, 26, "q");
    g.rect(10, 27, 12, 4, "J"); g.rect(10, 27, 12, 1, "j"); g.rect(16, 28, 1, 3, "j");
    g.ell(9.4, 24.6, 2.5, 2.8, "O"); g.ell(22.6, 24.6, 2.5, 2.8, "o"); g.ell(9, 28.2, 1.7, 2, "S"); g.ell(23, 28.2, 1.7, 2, "S");
  } else {
    g.poly([[11.5, 22], [20.5, 22], [24.2, 31], [7.8, 31]], "O");
    g.poly([[19, 23], [20.5, 22], [24.2, 31], [21, 31]], "o");
    g.rect(8, 30, 16, 1, "q", "Oo");
    g.poly([[12, 22], [16, 25.5], [20, 22]], "q");
    g.px(16, 27, "q"); g.px(16, 29, "q");
    g.ell(9.4, 25, 2.5, 3.6, "O"); g.ell(22.6, 25, 2.5, 3.6, "o");
    g.ell(9, 29.3, 1.8, 1.8, "S"); g.ell(23, 29.3, 1.8, 1.8, "S");
  }
  g.rect(12, 31, 3, 3, "S"); g.rect(17, 31, 3, 3, "S");
  g.ell(13, 34.2, 3, 1.9, "B"); g.ell(19, 34.2, 3, 1.9, "B"); g.px(12, 33, "b"); g.px(18, 33, "b");
  HAIR[h.hair].front(g);
  g.rect(11, 15, 3, 4, "K"); g.rect(18, 15, 3, 4, "K");
  g.rect(11, 17, 3, 2, "E"); g.rect(18, 17, 3, 2, "E");
  g.px(11, 15, "W"); g.px(18, 15, "W"); g.px(13, 18, "W"); g.px(20, 18, "W");
  if (!boy) { g.px(10, 15, "K"); g.px(21, 15, "K"); }
  g.rect(8, 19, 2, 1, "P"); g.rect(22, 19, 2, 1, "P");
  g.px(14, 19, "m"); g.px(17, 19, "m"); g.px(15, 20, "m"); g.px(16, 20, "m");
  if (h.hat && HATS[h.hat]) HATS[h.hat].draw(g);
  return sprite(g.rows(), {
    S: h.skin, s: darken(h.skin, 0.86), K: "#2a1d2e", W: "#ffffff", E: "#6b4a2b", P: "#ff9aa8", m: "#b04050",
    O: h.outfit, o: darken(h.outfit, 0.8), q: "#fff4e0", J: "#3d5a8c", j: "#2a3f66", B: "#5a3a2a", b: "#8a5a3e",
    H: h.hairColor, h: lighten(h.hairColor, 0.3), d: darken(h.hairColor, 0.7),
    Y: "#ffd93c", y: "#d99a16", R: "#e2445c", r: "#a52a3c", M: "#8a4fd8", n: "#5e3a94", G: "#3dbd6a", g: "#2f9a55",
    Q: "#2bb3a8", A: "#c3cbd6", a: "#7d8794", w: "#dde6ee"
  });
}
