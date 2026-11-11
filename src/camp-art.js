import { P, sprite } from "./sprites.js";

/* ================== Camp art (32px pixel brush, same style as the characters) ================== */
const paint = (w, h, pal, fn) => { const g = P(w, h); fn(g); return sprite(g.rows(), pal); };
const WOOD = { T: "#b07440", t: "#7a4b2a", w: "#d9a873" };

export const HOUSE = [
  // 0: tent
  paint(32, 32, { R: "#e8533c", r: "#b03826", W: "#fff1d6", K: "#3a2414", T: "#7a4b2a", M: "#6fbf4c" }, (g) => {
    g.poly([[16, 4], [30, 29], [2, 29]], "R");
    for (const x of [9, 16, 23]) g.line(16, 5, x, 29, "W");
    g.poly([[16, 12], [21, 29], [11, 29]], "K"); g.poly([[16, 12], [18.5, 29], [16, 29]], "r");
    g.line(16, 4, 16, 1, "T"); g.poly([[16, 1], [21, 2.5], [16, 4]], "M");
    g.ell(16, 30, 15, 1.4, "r");
  }),
  // 1: lean-to of branches and leaves
  paint(32, 32, { T: "#8a5a34", t: "#5c371e", L: "#4fb34a", l: "#8fdc6e", D: "#2f7d3a", K: "#3a2414" }, (g) => {
    g.line(4, 30, 16, 6, "T", 2); g.line(28, 30, 16, 6, "T", 2); g.line(16, 6, 16, 30, "t");
    g.poly([[16, 5], [29, 28], [3, 28]], "D");
    for (const [x, y] of [[16, 9], [12, 15], [20, 15], [8, 22], [16, 21], [24, 22], [12, 27], [20, 27]]) g.ell(x, y, 3.6, 2.6, "L", "D");
    for (const [x, y] of [[15, 8], [11, 14], [19, 20], [7, 21], [23, 26]]) g.ell(x, y, 1.4, 0.9, "l");
    g.poly([[16, 17], [20.5, 29], [11.5, 29]], "K");
    g.line(2, 30, 30, 30, "t");
  }),
  // 2: log cabin
  paint(32, 32, { T: "#b07440", t: "#7a4b2a", R: "#d9533c", r: "#a23a28", Y: "#ffe58a", K: "#3a2414", S: "#9aa3ad", W: "#fff6d0" }, (g) => {
    g.rect(22, 3, 4, 8, "S"); g.rect(22, 3, 4, 1, "K");
    g.rect(4, 15, 24, 15, "T"); for (const y of [17, 20, 23, 26, 29]) g.line(4, y, 27, y, "t");
    g.poly([[16, 3], [31, 16], [1, 16]], "R"); for (const y of [7, 10, 13]) g.line(16 - (y - 3) * 1.1, y, 16 + (y - 3) * 1.1, y, "r");
    g.rect(13, 21, 6, 9, "K"); g.rect(14, 22, 4, 8, "t"); g.px(17, 26, "Y");
    g.rect(6, 19, 5, 5, "K"); g.rect(7, 20, 3, 3, "Y"); g.rect(21, 19, 5, 5, "K"); g.rect(22, 20, 3, 3, "Y"); g.px(7, 20, "W"); g.px(22, 20, "W");
  }),
  // 3: tree house (taller: 32 × 44)
  paint(32, 44, { L: "#4fb34a", l: "#8fdc6e", D: "#2f7d3a", T: "#8a5a34", t: "#5c371e", B: "#b07440", R: "#d9533c", r: "#a23a28", Y: "#ffe58a", K: "#3a2414" }, (g) => {
    g.ell(16, 12, 15, 11, "D"); g.ell(8, 14, 7, 6, "L"); g.ell(24, 14, 7, 6, "L"); g.ell(16, 7, 9, 6, "L");
    for (const [x, y] of [[11, 5], [21, 8], [5, 12], [26, 12]]) g.ell(x, y, 2.4, 1.4, "l");
    g.rect(13, 22, 6, 21, "T"); g.line(15, 23, 15, 42, "t"); g.ell(16, 43, 7, 1.2, "T");
    g.rect(5, 20, 22, 2, "B"); g.rect(5, 22, 22, 1, "t");
    g.rect(8, 12, 16, 8, "B"); g.poly([[16, 6], [26, 13], [6, 13]], "R"); g.line(8, 11, 24, 11, "r");
    g.rect(10, 14, 4, 4, "K"); g.rect(11, 15, 2, 2, "Y"); g.rect(18, 14, 4, 6, "K"); g.rect(19, 15, 2, 5, "t");
    for (let y = 24; y < 42; y += 3) g.line(21, y, 24, y, "B"); g.line(21, 22, 21, 42, "t"); g.line(24, 22, 24, 42, "t");
    g.line(3, 18, 5, 20, "t"); g.line(29, 18, 27, 20, "t");
  })
];

export const WELL = [null,
  paint(32, 32, { S: "#9aa3ad", s: "#6f7882", A: "#d6dde5", B: "#3d9bff", b: "#1f6fc4" }, (g) => {
    g.ell(16, 22, 11, 7, "S"); g.ell(16, 20, 8, 3.6, "b"); g.ell(16, 20.4, 6.6, 2.6, "B");
    for (const x of [7, 12, 17, 22]) g.line(x, 24, x + 2, 28, "s"); g.line(8, 18, 12, 16, "A");
  }),
  paint(32, 32, { S: "#9aa3ad", s: "#6f7882", A: "#d6dde5", B: "#3d9bff", b: "#1f6fc4", T: "#8a5a34", R: "#d9533c", r: "#a23a28" }, (g) => {
    g.rect(6, 6, 2, 17, "T"); g.rect(24, 6, 2, 17, "T");
    g.poly([[16, 0], [31, 8], [1, 8]], "R"); g.line(4, 7, 28, 7, "r");
    g.ell(16, 24, 11, 6.4, "S"); g.ell(16, 22, 8, 3.2, "b"); g.ell(16, 22.4, 6.6, 2.4, "B");
    for (const x of [7, 12, 17, 22]) g.line(x, 26, x + 2, 29, "s"); g.line(8, 13, 24, 13, "T");
  }),
  paint(32, 32, { S: "#9aa3ad", s: "#6f7882", B: "#3d9bff", b: "#1f6fc4", T: "#8a5a34", R: "#d9533c", r: "#a23a28", Y: "#ffcf3a", P: "#ff8fc8", G: "#3f9b4a", K: "#4a4f58" }, (g) => {
    g.rect(6, 6, 2, 17, "T"); g.rect(24, 6, 2, 17, "T");
    g.poly([[16, 0], [31, 8], [1, 8]], "R"); g.line(4, 7, 28, 7, "r");
    g.line(8, 13, 24, 13, "T"); g.line(16, 13, 16, 16, "K"); g.rect(14, 16, 5, 4, "T"); g.rect(14, 16, 5, 1, "K");
    g.ell(16, 24, 11, 6.4, "S"); g.ell(16, 22.6, 8, 3, "b"); g.ell(16, 23, 6.6, 2.2, "B");
    for (const x of [7, 12, 17, 22]) g.line(x, 26, x + 2, 29, "s");
    for (const [x, c] of [[3, "P"], [29, "Y"], [27, "P"]]) { g.line(x, 31, x, 27, "G"); g.ell(x, 26.5, 1.4, 1.4, c); }
  })
];

export const LIBRARY = [null,
  paint(32, 32, { T: "#b07440", t: "#7a4b2a", R: "#e8533c", B: "#3d7be0", G: "#3dbd6a", Y: "#ffcf3a", M: "#8a4fd8" }, (g) => {
    g.rect(7, 16, 18, 13, "T"); g.rect(9, 18, 14, 9, "t");
    [["R", 9], ["B", 11], ["Y", 13], ["G", 15], ["M", 17], ["R", 19], ["B", 21]].forEach(([c, x], i) => g.rect(x, 19 + (i % 2), 2, 8 - (i % 2), c));
    g.line(6, 29, 26, 29, "t");
  }),
  paint(32, 32, { T: "#b07440", t: "#7a4b2a", R: "#e8533c", r: "#a23a28", B: "#3d7be0", G: "#3dbd6a", Y: "#ffcf3a", M: "#8a4fd8" }, (g) => {
    g.rect(14, 24, 4, 7, "T");
    g.poly([[16, 3], [29, 11], [3, 11]], "R"); g.line(5, 10, 27, 10, "r");
    g.rect(6, 11, 20, 14, "T"); g.rect(8, 12, 16, 5, "t"); g.rect(8, 18, 16, 5, "t");
    [["R", 8], ["B", 10], ["Y", 12], ["G", 14], ["M", 16], ["R", 18], ["B", 20], ["Y", 22]].forEach(([c, x], i) => { g.rect(x, 13 + (i % 2), 2, 4 - (i % 2), c); g.rect(x, 19 + ((i + 1) % 2), 2, 4 - ((i + 1) % 2), c); });
  }),
  paint(32, 32, { T: "#b07440", t: "#7a4b2a", R: "#3d7be0", r: "#28539c", B: "#e8533c", G: "#3dbd6a", Y: "#ffcf3a", M: "#8a4fd8", L: "#ffe58a", K: "#4a4f58" }, (g) => {
    g.rect(14, 24, 4, 7, "T");
    g.poly([[16, 3], [29, 11], [3, 11]], "R"); g.line(5, 10, 27, 10, "r");
    g.rect(6, 11, 20, 14, "T"); g.rect(8, 12, 16, 5, "t"); g.rect(8, 18, 16, 5, "t");
    [["B", 8], ["R", 10], ["Y", 12], ["G", 14], ["M", 16], ["B", 18], ["R", 20], ["Y", 22]].forEach(([c, x], i) => { g.rect(x, 13 + (i % 2), 2, 4 - (i % 2), c); g.rect(x, 19 + ((i + 1) % 2), 2, 4 - ((i + 1) % 2), c); });
    g.line(27, 11, 29, 14, "K"); g.rect(28, 14, 3, 4, "K"); g.rect(28.5, 15, 2, 2, "L");
  })
];

// plants: [type][stage]; stage 0 seed, 1 sprout, 2 leaves, 3 ripe
const leaf = (g, s) => {
  if (s === 0) { g.ell(16, 26, 3, 1.4, "d"); g.px(16, 25, "G"); return; }
  if (s === 1) { g.line(16, 26, 16, 22, "G"); g.ell(14, 21.6, 2, 1, "G"); g.ell(18, 21, 2, 1, "G"); return; }
  g.line(16, 26, 16, 16, "G"); g.ell(12.5, 19, 3.4, 1.6, "G"); g.ell(19.5, 17, 3.4, 1.6, "G"); g.ell(14, 14, 2.6, 1.4, "g");
};
const PLANT_PAL = { G: "#3f9b4a", g: "#6fcf5a", d: "#8a5a34", O: "#ff8a2f", o: "#d9621a", Y: "#ffcf3a", R: "#e8442c", r: "#a8261a", W: "#fff6c9" };
export const PLANT_SPR = {
  carrot: [0, 1, 2, 3].map((s) => paint(32, 32, PLANT_PAL, (g) => {
    if (s < 3) return leaf(g, s);
    for (const dx of [-3, 0, 3]) g.line(16, 18, 16 + dx, 9, "G", 2);
    g.poly([[12, 18], [20, 18], [16, 30]], "O"); g.line(14, 21, 17, 21, "o"); g.line(15, 25, 17, 25, "o");
  })),
  pumpkin: [0, 1, 2, 3].map((s) => paint(32, 32, PLANT_PAL, (g) => {
    if (s < 3) return leaf(g, s);
    g.ell(10, 16, 4, 2, "G"); g.ell(16, 23, 9, 6.5, "O"); for (const x of [12, 16, 20]) g.line(x, 18, x, 28, "o");
    g.rect(15, 15, 3, 3, "d"); g.px(11, 20, "W");
  })),
  strawberry: [0, 1, 2, 3].map((s) => paint(32, 32, PLANT_PAL, (g) => {
    if (s < 3) return leaf(g, s);
    g.ell(16, 14, 6, 2.4, "G");
    g.poly([[10, 16], [22, 16], [16, 29]], "R"); g.ell(16, 18, 6, 3, "R");
    for (const [x, y] of [[13, 18], [17, 19], [15, 22], [18, 23], [16, 26], [12, 21]]) g.px(x, y, "Y");
    g.px(12, 17, "W");
  }))
};

export const DECOR_SPR = {
  flowers: paint(32, 32, { G: "#3f9b4a", P: "#ff8fc8", Y: "#ffcf3a", B: "#7ab8ff", W: "#ffffff" }, (g) => {
    for (const [x, h, c] of [[9, 9, "P"], [14, 13, "Y"], [19, 10, "B"], [24, 12, "P"], [12, 6, "W"]]) { g.line(x, 30, x, 30 - h, "G"); g.ell(x, 29 - h, 2.2, 2.2, c); g.px(x, 29 - h, "Y"); }
    g.ell(10, 25, 2, 1, "G"); g.ell(22, 24, 2, 1, "G");
  }),
  mushroom: paint(32, 32, { R: "#e2445c", W: "#ffffff", S: "#f6dcb8", G: "#3f9b4a" }, (g) => {
    g.rect(13, 21, 6, 9, "S"); g.ell(16, 20, 9, 6, "R", false, 0, 21); g.ell(12, 17, 1.6, 1.4, "W"); g.ell(19, 16, 2, 1.6, "W"); g.ell(22, 19, 1.2, 1.2, "W");
    g.ell(16, 30.5, 8, 1.2, "G");
  }),
  fence: paint(32, 32, { T: "#b07440", t: "#7a4b2a" }, (g) => {
    for (const x of [3, 15, 27]) { g.rect(x, 14, 3, 17, "T"); g.poly([[x, 14], [x + 1.5, 11], [x + 3, 14]], "T"); }
    g.rect(0, 18, 32, 2, "t"); g.rect(0, 25, 32, 2, "t");
  }),
  bench: paint(32, 32, { T: "#b07440", t: "#7a4b2a", K: "#4a4f58" }, (g) => {
    g.rect(3, 13, 26, 3, "T"); g.rect(3, 17, 26, 3, "T"); g.rect(2, 21, 28, 3, "T"); g.rect(2, 23, 28, 1, "t");
    g.rect(5, 24, 2, 7, "K"); g.rect(25, 24, 2, 7, "K"); g.rect(5, 12, 2, 10, "K"); g.rect(25, 12, 2, 10, "K");
  }),
  lantern: paint(32, 32, { K: "#4a4f58", k: "#2a2d33", L: "#ffe58a", l: "#ffb84a", T: "#7a4b2a" }, (g) => {
    g.rect(15, 10, 2, 21, "T"); g.line(16, 10, 22, 10, "K"); g.line(22, 10, 22, 13, "K");
    g.rect(19, 13, 7, 9, "K"); g.rect(20, 14, 5, 7, "L"); g.rect(21, 17, 3, 3, "l"); g.poly([[18.5, 13], [22.5, 10.5], [26.5, 13]], "k");
  }),
  flag: paint(32, 32, { T: "#7a4b2a", R: "#e8442c", Y: "#ffcf3a", B: "#3d7be0" }, (g) => {
    g.rect(8, 3, 2, 28, "T"); g.ell(9, 3, 1.6, 1.6, "Y");
    g.poly([[10, 5], [28, 8], [10, 13]], "R"); g.poly([[10, 13], [26, 15.5], [10, 19]], "B"); g.px(16, 9, "Y"); g.px(16, 16, "Y");
  }),
  runestone: paint(32, 32, { S: "#9aa3ad", s: "#6f7882", V: "#a98cff", v: "#e0d4ff", M: "#6fbf4c" }, (g) => {
    g.ell(16, 23, 12, 7.6, "S"); g.ell(9, 26, 4, 3.4, "S"); g.line(23, 26, 26, 28, "s");
    g.line(16, 18, 16, 27, "V"); g.line(16, 20, 19.5, 17.5, "V"); g.line(16, 23, 12.5, 20.5, "V"); g.px(16, 18, "v"); g.px(19, 18, "v");
    g.ell(10, 17, 3.4, 1.3, "M", "S"); g.ell(21, 16.4, 2.2, 1, "M", "S");
  }),
  snowman: paint(32, 32, { W: "#ffffff", w: "#dfe8f0", K: "#2a2d33", O: "#ff8a2f", R: "#e8442c", T: "#7a4b2a" }, (g) => {
    g.ell(16, 24, 8, 6.5, "W"); g.ell(16, 13, 5.6, 5, "W"); g.rect(11, 6, 10, 2, "K"); g.rect(13, 1, 6, 6, "K");
    g.px(14, 12, "K"); g.px(18, 12, "K"); g.poly([[16, 14], [21, 15], [16, 16]], "O"); g.rect(11, 17, 10, 2, "R");
    g.px(16, 22, "K"); g.px(16, 25, "K"); g.line(8, 20, 3, 15, "T"); g.line(24, 20, 29, 15, "T");
  })
};
