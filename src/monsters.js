import { L } from "./content.js";
import { light } from "./scene.js";
import { P, sprite } from "./sprites.js";

/* ---------- Monster bodies (32 × 32), recoloured per element ---------- */
/* ---------- Monsters: cute-but-cheeky, 2 animation frames each ---------- */
// a proper slime: jelly dome, flat base, glossy highlight, squash & stretch; the top shows its element
export function slimeDef(name, attack, main, dark, light, top) {
  return { name, attack, pal: { M: main, m: dark, l: light, W: "#ffffff", K: "#1e1a2e", P: "#ffb0c8", L: "#2f9a45", g: "#5cc468", Y: "#ffd84a", R: "#e8442c", c: "#d6f0ff" }, draw(g, f) {
    const rx = f ? 12.6 : 11.2, ry = f ? 9.4 : 11, base = 29.5, cy = base - ry * 0.92;
    g.ell(16, cy, rx, ry, "M", false, 0, 29); g.ell(16, 28.4, rx - 0.6, 2, "M");
    g.ell(16 - rx + 1.6, 28.8, 1.8, 1.1, "M"); g.ell(16 + rx - 1.6, 28.8, 1.8, 1.1, "M");
    g.ell(18, cy + ry * 0.35, rx * 0.55, ry * 0.42, "l", "M");
    g.ell(21, cy + ry * 0.5, 1.1, 1.1, "M", "l"); g.ell(14, cy + ry * 0.62, 0.8, 0.8, "l", "M");
    g.ell(16, base - 0.6, rx - 1.5, 1, "m", "Ml");
    g.ell(16 - rx * 0.48, cy - ry * 0.5, 2.3, 1.3, "W"); g.px(Math.round(16 - rx * 0.48) + 3, Math.round(cy - ry * 0.62), "W");
    const ey = Math.round(cy + 1);
    g.rect(12, ey, 2, 3, "K"); g.rect(19, ey, 2, 3, "K"); g.px(12, ey, "W"); g.px(19, ey, "W");
    g.px(15, ey + 3, "K"); g.px(16, ey + 4, "K"); g.px(17, ey + 3, "K");
    g.rect(9, ey + 3, 2, 1, "P"); g.rect(22, ey + 3, 2, 1, "P");
    const ty = Math.round(cy - ry) + 1;
    if (top === "leaf") { g.line(16, ty, 16, ty - 3, "L"); g.ell(13.6, ty - 3.4 + f * 0.5, 2.6, 1.3, "g"); g.ell(18.6, ty - 4, 2.6, 1.3, "g"); g.px(13, ty - 4, "L"); g.px(19, ty - 5, "L"); }
    if (top === "drop") { g.ell(16, ty - 2.2 - f, 1.8, 2.2, "c"); g.poly([[14.6, ty - 3 - f], [16, ty - 6.5 - f], [17.4, ty - 3 - f]], "c"); g.px(15, ty - 3 - f, "W"); }
    if (top === "flame") { g.poly([[13, ty + 1], [14.5, ty - 4 + f], [16, ty - 1], [17.5, ty - 6 + f], [19, ty + 1]], "R"); g.poly([[14.5, ty + 1], [16, ty - 2], [17.5, ty - 3.5 + f], [18, ty + 1]], "Y"); }
  } };
}
export const MON_DEFS = {
  fire: [
    { name: "Płomyk", attack: "ciska ognistą kulką", pal: { R: "#e8442c", r: "#a8261a", O: "#ff8a2f", Y: "#ffd84a", K: "#3a1a10", W: "#ffffff", P: "#ffb0b0" }, draw(g, f) {
      g.poly(f ? [[6, 20], [8.5, 9], [12, 14], [15.5, 3], [19, 12], [22.5, 7], [26, 20]] : [[6, 20], [9.5, 7], [12.5, 13], [16.5, 4], [19, 11], [23.5, 9], [26, 20]], "R");
      g.ell(16, 21.5, 10.4, 8.8, "R");
      g.poly(f ? [[8, 20], [10, 11], [13, 15], [15.5, 7], [18.5, 14], [21.5, 10], [24, 20]] : [[8, 20], [11, 10], [13.5, 15], [16.5, 8], [19, 13], [22, 11], [24, 20]], "O");
      g.ell(16, 22, 8.6, 7.4, "O"); g.ell(16, 24.6, 5.4, 4.2, "Y");
      g.rect(11, 18, 2, 3, "K"); g.rect(19, 18, 2, 3, "K"); g.px(11, 18, "W"); g.px(19, 18, "W");
      g.line(10, 16, 12, 17, "r"); g.line(22, 16, 20, 17, "r");
      g.px(14, 23, "K"); g.px(15, 24, "K"); g.px(16, 24, "K"); g.px(17, 23, "K");
      g.px(9, 21, "P"); g.px(23, 21, "P");
      g.ell(12, 30, 2.3, 1.4, "R"); g.ell(20, 30, 2.3, 1.4, "R");
      g.px(4 + f, 10, "Y"); g.px(27 - f, 13, "Y");
    } },
    slimeDef("Ognisty Glutek", "pluje gorącym glutem", "#ff8a3d", "#c24a1a", "#ffc070", "flame"),
    { name: "Węgielek", attack: "sypie iskrami", pal: { C: "#3a3236", c: "#5a4b50", E: "#ff7a2a", e: "#ffd257", R: "#e8442c", W: "#ffffff", K: "#141012" }, draw(g, f) {
      const a = f ? "e" : "E", b = f ? "E" : "e";
      g.ell(11, 29.5, 2.4, 1.3, "C"); g.ell(21, 29.5, 2.4, 1.3, "C");
      g.poly([[11.5, 12.5], [13, 8 - f], [14.5, 12.5]], "E");
      g.poly([[17, 11.5], [18.6, 5 + f], [20.4, 11.5]], "R"); g.poly([[17.9, 11.5], [18.6, 7.5 + f], [19.4, 11.5]], "e");
      g.ell(16, 21, 10, 8.4, "C"); g.ell(11, 15.4, 4.6, 3.6, "C"); g.ell(20, 14.4, 5, 4, "C");
      g.ell(12, 14.4, 2.6, 1.5, "c", "C"); g.ell(21, 12.8, 2.6, 1.4, "c", "C"); g.ell(8.6, 21, 1.8, 2.6, "c", "C");
      g.line(23, 18, 25, 22, a); g.line(8, 25, 11, 27, b); g.line(19, 27.5, 22, 25, a); g.ell(16, 28.6, 6, 0.9, "E", "C");
      g.rect(11, 18, 3, 3, "W"); g.rect(18, 18, 3, 3, "W"); g.rect(12, 19, 2, 2, "K"); g.rect(19, 19, 2, 2, "K");
      g.line(10, 16, 13, 17, "E"); g.line(18, 16, 21, 15, "E");
      g.px(14, 23, "e"); g.px(15, 24, "e"); g.px(16, 24, "e"); g.px(17, 24, "e"); g.px(18, 23, "e");
      g.px(5 + f, 12, "e"); g.px(26, 8 + f, "E"); g.px(27 - f, 18, "e");
    } }
  ],
  water: [
    slimeDef("Wodny Glutek", "chlapie glutem", "#4aa8ff", "#1f6fc4", "#9fd4ff", "drop"),
    { name: "Rechotek", attack: "strzela językiem", pal: { F: "#4cc3b0", f: "#2a8a80", y: "#c8f5ec", W: "#ffffff", K: "#1a2a2e", P: "#ff6f8f", p: "#ffb0c8", c: "#d6f0ff" }, draw(g, f) {
      const L = f ? 1 : 0;
      g.ell(6.6, 27.4, 4, 2.6, "F"); g.ell(25.4, 27.4, 4, 2.6, "F");
      g.ell(16, 22 - L, 10, 7.6, "F"); g.ell(16, 25.2 - L, 6, 3.4, "y", "F");
      g.ell(10, 13 - L, 4.4, 4.2, "F"); g.ell(22, 13 - L, 4.4, 4.2, "F");
      g.ell(10, 13 - L, 2.8, 2.8, "W"); g.rect(10, 13 - L, 2, 2, "K"); g.px(10, 13 - L, "W");
      if (f) { g.ell(22, 13 - L, 2.8, 2.8, "F"); g.line(20, 13 - L, 21, 12 - L, "K"); g.line(22, 12 - L, 23, 13 - L, "K"); }
      else { g.ell(22, 13, 2.8, 2.8, "W"); g.rect(22, 13, 2, 2, "K"); g.px(22, 13, "W"); }
      g.ell(16, 9.4 - L, 1.3, 1.5, "c"); g.poly([[15, 9 - L], [16, 6.4 - L], [17, 9 - L]], "c"); g.px(15, 9 - L, "W");
      g.line(11, 19 - L, 21, 19 - L, "K"); g.px(10, 18 - L, "K"); g.px(22, 18 - L, "K");
      g.poly([[18, 19.5 - L], [21, 19.5 - L], f ? [21, 24.5 - L] : [20.6, 22.5], f ? [18.6, 24 - L] : [18.6, 22]], "P"); g.px(19, 20 - L, "p");
      g.rect(6, 18 - L, 2, 1, "p"); g.rect(24, 18 - L, 2, 1, "p");
      g.ell(23, 23 - L, 1, 0.8, "f"); g.ell(9.5, 23.6 - L, 0.9, 0.8, "f");
      g.ell(11, 29.6, 2.6, 1.3, "F"); g.ell(21, 29.6, 2.6, 1.3, "F"); for (const x of [9, 11, 13, 19, 21, 23]) g.px(x, 30, "f");
    } }
  ],
  earth: [
    { name: "Pieniek", attack: "smaga gałązką", pal: { T: "#9a6a40", t: "#6e4626", R: "#e8c896", r: "#c49a62", L: "#5cc468", l: "#2f7d3a", Y: "#ffe14d", K: "#2a1a10" }, draw(g, f) {
      g.line(9, 18, 5.5, 14 - f, "t"); g.ell(5, 13 - f, 1.6, 1.1, "L"); g.line(23, 18, 26.5, 14 + f, "t"); g.ell(27, 13 + f, 1.6, 1.1, "L");
      g.poly([[9.5, 24.5], [4.5, 29.5], [10, 29]], "T"); g.poly([[22.5, 24.5], [27.5, 29.5], [22, 29]], "T");
      g.rect(9, 12, 14, 15, "T"); g.ell(16, 27, 8, 2.6, "T");
      g.ell(16, 12, 7.2, 2.7, "R"); g.ell(16, 12, 4, 1.4, "r", "R");
      g.line(11, 15, 11, 26, "t"); g.line(21, 15, 21, 26, "t");
      g.line(16, 11, 16, 6, "l"); g.ell(13.8, 6 + f * 0.6, 2.1, 1.2, "L"); g.ell(18.4, 5, 2.1, 1.2, "L");
      g.rect(12, 17, 3, 3, "K"); g.rect(17, 17, 3, 3, "K"); g.px(13, 18, "Y"); g.px(18, 18, "Y"); if (f) { g.px(14, 18, "Y"); g.px(19, 18, "Y"); }
      g.rect(15, 22, 2, 1, "K");
    } },
    { name: "Kamulec", attack: "turla kamyk", pal: { S: "#a7b0ba", s: "#707a85", A: "#d6dde5", M: "#6fbf4c", m: "#3f8f3a", K: "#22262e", W: "#ffffff" }, draw(g, f) {
      g.ell(4.6, 22 - f, 2.7, 3, "S"); g.ell(27.4, 22 - f, 2.7, 3, "S");
      g.ell(11, 29.4, 3, 1.6, "s"); g.ell(21, 29.4, 3, 1.6, "s");
      g.ell(16, 20, 11, 9, "S"); g.rect(6, 22, 20, 6, "S");
      g.ell(16, 12.4, 8.6, 3.4, "M", "S"); g.px(10, 15, "M"); g.px(14, 15, "M"); g.px(20, 15, "M"); g.px(12, 12, "m"); g.px(18, 11, "m");
      g.line(22, 20, 24, 24, "s"); g.line(9, 23, 11, 26, "s"); g.line(8, 17, 10, 15, "A");
      g.rect(11, 18, 2, 3, "K"); g.rect(19, 18, 2, 3, "K"); g.px(11, 18, "W"); g.px(19, 18, "W");
      g.line(10, 16, 13, 17, "s"); g.line(22, 16, 19, 17, "s");
      g.rect(15, 23, 3, 1, "K");
    } },
    { name: "Muchomorek", attack: "sypie zarodnikami", pal: { R: "#e2445c", r: "#a52a3c", W: "#ffffff", S: "#f6dcb8", s: "#d8b48a", K: "#2a1d2e", P: "#ff9aa8" }, draw(g, f) {
      g.rect(12, 26, 3, 4 + f, "S"); g.rect(17, 26, 3, 5 - f, "S"); g.ell(13, 30.6 + f * 0.4, 2.2, 1.1, "s"); g.ell(19, 31 - f * 0.4, 2.2, 1.1, "s");
      g.ell(9.4, 21.5 - f, 1.7, 2.3, "S"); g.ell(22.6, 21.5 + f, 1.7, 2.3, "S");
      g.ell(16, 21.5, 6.4, 6.4, "S");
      g.ell(16, 11.8 + f * 0.4, 12.8, 8.4, "R", false, 0, 15); g.ell(16, 15.6, 9.6, 1.7, "r");
      g.ell(10, 8.6, 2.1, 1.8, "W"); g.ell(19.5, 6.6, 2.5, 2, "W"); g.ell(24.5, 11.4, 1.7, 1.5, "W"); g.ell(6.4, 12.4, 1.3, 1.3, "W"); g.ell(15, 12, 1.4, 1.2, "W");
      g.rect(13, 19, 2, 3, "K"); g.rect(18, 19, 2, 3, "K"); g.px(13, 19, "W"); g.px(18, 19, "W");
      g.line(12, 17, 14, 18, "s"); g.line(20, 17, 18, 18, "s");
      g.px(15, 23, "K"); g.px(16, 23, "K"); g.rect(11, 22, 2, 1, "P"); g.rect(20, 22, 2, 1, "P");
    } },
    slimeDef("Zielony Glutek", "klei zielonym glutem", "#6fd05a", "#3a9a3e", "#b8f0a0", "leaf")
  ]
};
export const MON_FRAMES = {};
for (const el in MON_DEFS) MON_FRAMES[el] = MON_DEFS[el].map((m) => [0, 1].map((f) => { const g = P(32, 32); m.draw(g, f); return sprite(g.rows(), m.pal); }));
