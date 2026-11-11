import { MON_DEFS, MON_FRAMES } from "./monsters.js";
import { P, sprite, url } from "./sprites.js";
import { mulberry } from "./util.js";

/* ---------- World props, drawn in the same chunky 32px style ---------- */
export const PAINT = (w, h, pal, fn, outline = true) => { const g = P(w, h); fn(g); return sprite(g.rows(), pal, outline); };
export function fire(f) {
  return PAINT(32, 32, { T: "#8a5a34", t: "#5c371e", S: "#9aa3ad", s: "#6f7882", R: "#e8442c", O: "#ff8a2f", Y: "#ffd84a", W: "#fff6d0" }, (g) => {
    g.ell(5.5, 28, 3, 2, "S"); g.ell(26.5, 28, 3, 2, "S"); g.ell(10, 30, 3, 1.8, "s"); g.ell(22, 30, 3, 1.8, "s"); g.ell(16, 30.4, 3, 1.6, "S");
    g.line(7, 29, 25, 24, "T", 3); g.line(7, 24, 25, 29, "t", 3); g.ell(7, 24, 1.4, 1.4, "R"); g.ell(25, 24, 1.4, 1.4, "R");
    g.poly(f ? [[9, 26], [10, 15], [13, 19], [15.5, 7], [18.5, 17], [21.5, 12], [23, 26]] : [[9, 26], [11, 13], [13.5, 18], [16.5, 6], [18.5, 16], [22, 14], [23, 26]], "R");
    g.poly(f ? [[11, 26], [12.5, 18], [15, 21], [16.5, 12], [19, 20], [21, 26]] : [[11, 26], [13, 17], [15, 21], [17, 13], [19.5, 19], [21, 26]], "O");
    g.poly([[13.5, 26], [15, 20 + f], [16.5, 23], [18, 19 - f], [19, 26]], "Y");
    g.px(8 + f * 2, 9 - f, "Y"); g.px(24 - f, 6 + f, "O"); g.px(19, 3 + f, "W");
  });
}
export const SPR = {
  tree: PAINT(32, 32, { L: "#4fb34a", l: "#8fdc6e", D: "#2f7d3a", T: "#8a5a34", t: "#5c371e", R: "#e8442c" }, (g) => {
    g.rect(13, 20, 6, 10, "T"); g.ell(16, 30, 5.4, 1.6, "T"); g.line(15, 21, 15, 29, "t"); g.px(12, 30, "t"); g.px(20, 30, "t");
    g.ell(16, 13, 13.4, 10.4, "D");
    g.ell(9, 15.4, 6.2, 5.4, "L"); g.ell(23, 15.4, 6.2, 5.4, "L"); g.ell(16, 9, 8.4, 6.6, "L"); g.ell(16, 16.6, 8.6, 4.6, "L");
    g.ell(16, 21.2, 8.4, 1.6, "D", "L");
    g.ell(12, 7.4, 3.2, 1.8, "l"); g.ell(21.5, 10.4, 2.6, 1.5, "l"); g.ell(6.6, 13, 2, 1.3, "l"); g.ell(25.6, 13.6, 1.8, 1.2, "l");
    g.ell(10.5, 17.5, 1.2, 1.2, "R"); g.ell(22, 19, 1.2, 1.2, "R"); g.ell(18, 8.5, 1.2, 1.2, "R");
  }),
  rock: PAINT(32, 32, { R: "#a7b0ba", r: "#6f7882", A: "#d6dde5", M: "#6fbf4c" }, (g) => {
    g.ell(17, 24.6, 10.4, 6.2, "R"); g.ell(12.4, 22, 6.4, 4.8, "R");
    g.ell(11.4, 19.6, 3, 1.4, "A"); g.px(20, 20, "A"); g.px(21, 20, "A");
    g.line(19, 23, 21, 27, "r"); g.line(24, 22, 25, 25, "r");
    g.ell(13, 17.8, 3.6, 1.2, "M", "RA"); g.px(10, 19, "M");
  }),
  coin: PAINT(32, 32, { Y: "#ffcf3a", y: "#d99a16", W: "#fff6c9" }, (g) => {
    g.ell(16, 16, 7.4, 7.4, "y"); g.ell(16, 16, 6, 6, "Y");
    g.rect(15, 12, 2, 8, "y"); g.rect(13, 13, 1, 1, "W"); g.rect(12, 14, 1, 2, "W"); g.px(19, 19, "y", "Y");
  }),
  star: PAINT(32, 32, { Y: "#ffd93c", y: "#e8a816", W: "#fff6c9" }, (g) => {
    const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 5.2 : 12.4; pts.push([16 + Math.cos(a) * r, 17 + Math.sin(a) * r]); }
    g.poly(pts, "Y"); g.ell(16, 21, 4, 2, "y", "Y"); g.px(14, 13, "W"); g.px(15, 12, "W");
  }),
  heart: PAINT(32, 32, { R: "#ff4d6d", r: "#c42a4a", W: "#ffe0e8" }, (g) => {
    g.ell(11.6, 13, 5.2, 4.8, "R"); g.ell(20.4, 13, 5.2, 4.8, "R"); g.poly([[6.6, 14.6], [25.4, 14.6], [16, 25.6]], "R");
    g.ell(19, 19, 4, 2.4, "r", "R"); g.ell(10.4, 11.4, 1.8, 1.3, "W");
  }),
  chest: PAINT(32, 32, { T: "#b07440", t: "#7a4b2a", Y: "#ffcf3a", y: "#c98f16", K: "#3a2414" }, (g) => {
    g.ell(16, 14.6, 10.6, 6, "T", false, 0, 14); g.rect(5, 14, 22, 13, "T"); g.ell(16, 27, 11, 1.4, "t");
    g.line(6, 11, 26, 11, "t"); g.line(5, 20, 27, 20, "t"); g.line(5, 24, 27, 24, "t");
    g.rect(5, 14, 22, 2, "Y"); g.rect(8, 9, 2, 18, "Y"); g.rect(22, 9, 2, 18, "Y"); g.rect(5, 15, 22, 1, "y");
    g.rect(14, 14, 4, 6, "Y"); g.rect(15, 16, 2, 2, "K"); g.px(15, 18, "K");
  }),
  door: PAINT(32, 32, { S: "#9aa3ad", s: "#6f7882", A: "#c9d1db", T: "#b07440", t: "#7a4b2a", a: "#4a4f58", Y: "#ffcf3a", M: "#6fbf4c", V: "#a98cff" }, (g) => {
    g.ell(16, 13, 14, 12.4, "S", false, 0, 13); g.rect(2, 13, 28, 19, "S");
    for (const [x, y] of [[4, 14], [4, 21], [26, 17], [26, 25], [9, 3], [21, 4], [15, 1]]) g.line(x, y, x + 2, y, "s");
    g.line(5, 8, 8, 5, "A"); g.ell(25, 6, 2.6, 1.2, "M", "SA"); g.ell(4, 29, 2, 1.2, "M");
    g.ell(16, 14, 9.6, 8.8, "T", false, 0, 14); g.rect(6.5, 14, 19, 18, "T");
    g.line(11, 7, 11, 31, "t"); g.line(16, 5, 16, 31, "t"); g.line(21, 7, 21, 31, "t");
    g.rect(7, 17, 18, 1, "a"); g.rect(7, 26, 18, 1, "a");
    g.ell(21, 22, 1.3, 1.3, "Y");
    g.px(13, 11, "V"); g.px(14, 12, "V"); g.px(18, 11, "V"); g.px(18, 12, "V"); g.px(14, 21, "V"); g.px(13, 22, "V");
  }),
  sign: PAINT(32, 32, { T: "#b07440", t: "#7a4b2a", w: "#e0b07a", M: "#6fbf4c" }, (g) => {
    g.rect(14, 12, 4, 19, "T"); g.line(15, 13, 15, 30, "t"); g.ell(16, 30.6, 4, 1.2, "M");
    g.rect(4, 4, 22, 10, "T"); g.poly([[25.5, 4], [30.5, 9], [25.5, 14]], "T");
    g.rect(5, 5, 20, 8, "w"); g.poly([[25, 5], [29, 9], [25, 13]], "w");
    g.line(7, 7, 20, 7, "t"); g.line(7, 10, 17, 10, "t");
    g.px(5, 5, "t"); g.px(24, 12, "t");
  }),
  fireA: fire(0),
  fireB: fire(1),
  flower1: PAINT(32, 32, { P: "#ff8fc8", p: "#e05fa0", Y: "#ffe14d", g: "#3f9b4a" }, (g) => {
    g.line(16, 25, 16, 30, "g"); g.ell(18, 28, 1.6, 0.8, "g");
    for (const [x, y] of [[16, 19.5], [13.4, 21.6], [18.6, 21.6], [14.4, 24.4], [17.6, 24.4]]) g.ell(x, y, 1.8, 1.8, "P");
    g.ell(16, 22.4, 1.3, 1.3, "Y");
  }, false),
  flower2: PAINT(32, 32, { W: "#ffffff", w: "#dfe6ea", Y: "#ffd23f", g: "#3f9b4a" }, (g) => {
    g.line(8, 26, 8, 30, "g");
    for (const [x, y] of [[8, 22], [5.6, 24], [10.4, 24], [8, 26.2]]) g.ell(x, y, 1.6, 1.6, "W");
    g.ell(8, 24, 1.1, 1.1, "Y");
  }, false)
};
export const ELEM = {
  fire: { name: "Ogień", adj: "ognisty", beats: "earth", why: "Ogień wypala korzenie", main: "#ff7a2f", dark: "#c2410c", names: ["Ognik", "Żarzący Grzybek", "Iskrzak"], attack: "rzuca kulą ognia",
    icon: sprite(["................", "................", ".......R........", "......RR........", "......RRR...R...", ".....RRRR..RR...", "....RRRORR.RR...", "....RROORRRRR...",
      "...RROOOORRRR...", "...RROOYOOORR...", "...RROYYYOORR...", "...RROYYYYORR...", "....RROYYORR....", ".....RRRRRR.....", "................", "................"], { R: "#e8442c", O: "#ff9a2f", Y: "#ffe14d" }) },
  water: { name: "Woda", adj: "wodny", beats: "fire", why: "Woda gasi ogień", main: "#4aa8ff", dark: "#1f6fc4", names: ["Kropelek", "Wodny Grzybek", "Pluskacz"], attack: "chlapie falą",
    icon: sprite(["................", "................", ".......B........", ".......BB.......", "......BBBB......", "......BBBB......", ".....BBBBBB.....", "....BBWBBBBB....",
      "....BWBBBBBB....", "...BBWBBBBBBB...", "...BBBBBBBBbB...", "...BBBBBBBbbB...", "....BBBBBbbB....", ".....BBBBBB.....", "................", "................"], { B: "#3d9bff", b: "#1f6fc4", W: "#dff0ff" }) },
  earth: { name: "Ziemia", adj: "ziemny", beats: "water", why: "Ziemia wypija wodę", main: "#8bb84a", dark: "#5d7f2e", names: ["Mchuś", "Korzeniak", "Kamyczak"], attack: "sypie kamykami",
    icon: sprite(["................", "................", "...........GG...", ".........GGGG...", ".......GGGGGG...", ".....GGGGGgGG...", "....GGGGGgGGG...", "...GGGGGgGGGG...",
      "...GGGGgGGGGG...", "...GGGgGGGGG....", "...GGgGGGGG.....", "....gGGGGG......", "...T.GGG........", "..T.............", ".T..............", "................"], { G: "#4fb34a", g: "#2f7d3a", T: "#7a4b2a" }) }
};
export const counterOf = (el) => Object.keys(ELEM).find((k) => ELEM[k].beats === el);
export const EICON = {}; for (const k in ELEM) EICON[k] = url(ELEM[k].icon);
export function monsterOf(el, bi) {
  const d = MON_DEFS[el][bi], frames = MON_FRAMES[el][bi];
  return { name: d.name, attack: d.attack, el, spr: frames[0], frames };
}


// grass & path tiles (seeded speckles)
export function tile(base, dots, seed, tufts) {
  const c = document.createElement("canvas"); c.width = 32; c.height = 32; const x = c.getContext("2d"), rnd = mulberry(seed);
  x.fillStyle = base; x.fillRect(0, 0, 32, 32);
  dots.forEach(([col, n]) => { x.fillStyle = col; for (let i = 0; i < n * 3; i++) x.fillRect(Math.floor(rnd() * 32), Math.floor(rnd() * 32), 1 + (rnd() < 0.3 ? 1 : 0), 1 + (rnd() < 0.4 ? 1 : 0)); });
  if (tufts) for (let i = 0; i < tufts * 3; i++) {
    const tx = 1 + Math.floor(rnd() * 28), ty = 4 + Math.floor(rnd() * 24);
    x.fillStyle = "#4e9a35"; x.fillRect(tx, ty + 2, 1, 3); x.fillRect(tx + 3, ty + 2, 1, 3);
    x.fillStyle = "#6fbf4c"; x.fillRect(tx + 1, ty + 1, 1, 4); x.fillStyle = "#b6ea8a"; x.fillRect(tx + 2, ty, 1, 4);
  }
  return c;
}
export const GRASS = [1, 2, 3].map((s) => tile("#74c24f", [["#66b445", 18], ["#86cf5c", 12], ["#5a9f3c", 5], ["#9edb72", 4]], s * 97, s === 2 ? 3 : 2));
export const DIRT = [1, 2].map((s) => tile("#d6ae68", [["#c79c55", 16], ["#e6c88a", 10], ["#a8814a", 4], ["#f0dcae", 3]], s * 31, 0));
export const ICON = { heart: url(SPR.heart), coin: url(SPR.coin), star: url(SPR.star), chest: url(SPR.chest), door: url(SPR.door), sign: url(SPR.sign), tree: url(SPR.tree) };
