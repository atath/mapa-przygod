import { shuffle } from "./util.js";

/* ================== Polish money (no DOM: unit-tested in Node) ==================
   The player's wallet: `coins` are złote, `gr` are grosze. Coins and notes look like the real ones:
   1, 2, 5 gr copper; 10, 20, 50 gr and 1 zł silver; 2 zł gold centre in a silver ring;
   5 zł silver centre in a gold ring; notes 10, 20, 50 zł in their real colours. */

const many = (n, one, few, lots) => (n === 1 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? few : lots);
export const zlWord = (n) => many(n, "złoty", "złote", "złotych");
export const grWord = (n) => many(n, "grosz", "grosze", "groszy");
export const zl = (n) => `${n} ${zlWord(n)}`;           // "3 złote" — for speech and sentences
export const gr = (n) => `${n} ${grWord(n)}`;
export const zlShort = (n) => `${n} zł`;                 // "3 zł" — on price tags
// after "brakuje" Polish takes the genitive: brakuje 1 złotego / 2 złotych, 1 grosza / 2 groszy
export const zlGen = (n) => `${n} ${n === 1 ? "złotego" : "złotych"}`;
export const grGen = (n) => `${n} ${n === 1 ? "grosza" : "groszy"}`;

// value in the unit of its group; `look` picks the drawing
export const ZL_DENOMS = [
  { v: 50, note: true, look: "n50" }, { v: 20, note: true, look: "n20" }, { v: 10, note: true, look: "n10" },
  { v: 5, look: "zl5" }, { v: 2, look: "zl2" }, { v: 1, look: "zl1" }
];
export const GR_DENOMS = [
  { v: 50, look: "gr-silver" }, { v: 20, look: "gr-silver" }, { v: 10, look: "gr-silver" },
  { v: 5, look: "gr-copper" }, { v: 2, look: "gr-copper" }, { v: 1, look: "gr-copper" }
];

// fewest pieces: 37 zł → 20, 10, 5, 2 — as stacks [{d, n}]
export function breakdown(amount, denoms = ZL_DENOMS) {
  const out = []; let left = Math.max(0, amount | 0);
  for (const d of denoms) { const n = Math.floor(left / d.v); if (n) { out.push({ d, n }); left -= n * d.v; } }
  return out;
}
export const sumOf = (pieces) => pieces.reduce((a, p) => a + p.d.v * (p.n || 1), 0);

// Grosze for the piggy bank: a mix in which some coins make exactly 100 gr, so the child has to count
// (20 + 20 + 50 + 10), plus the rest as usual. Returns stacks, largest first.
const HUNDREDS = [[50, 50], [50, 20, 20, 10], [50, 20, 10, 10, 5, 5], [20, 20, 20, 20, 10, 10], [50, 10, 10, 10, 10, 5, 2, 2, 1], [20, 20, 20, 10, 10, 10, 5, 5]];
export function piggyCoins(total, pick = (a) => a[0]) {
  if (total < 100) return breakdown(total, GR_DENOMS);
  const hundred = pick(HUNDREDS), counts = new Map();
  const add = (v, n = 1) => counts.set(v, (counts.get(v) || 0) + n);
  hundred.forEach((v) => add(v));
  for (const { d, n } of breakdown(total - 100, GR_DENOMS)) add(d.v, n);
  return GR_DENOMS.filter((d) => counts.get(d.v)).map((d) => ({ d, n: counts.get(d.v) }));
}

// answers for "how much change?": the right one plus near misses, never negative
export function changeOptions(ans, n = 3) {
  const set = new Set([ans]);
  for (const d of shuffle([1, -1, 2, -2, 5, -5, 10, -10])) { if (set.size >= n) break; if (ans + d >= 0) set.add(ans + d); }
  return shuffle([...set]);
}

/* Grosze lying on the paths: real coins, so collecting them is also adding them up.
   Every path holds at least 40 gr when all its coins are picked up, so three paths make more than
   a złoty to swap in the piggy bank. Grade 1: 10 and 20 gr (counting in tens); then 5 gr, then 50 gr too. */
export const PATH_MIN_GR = 40;
const PATH_SETS = { 1: [10, 20], 2: [5, 10, 20], 3: [5, 10, 20, 50] }, PATH_MAX = { 1: 60, 2: 60, 3: 80 };
export function pathCoinValues(n, lvl, pick = (a) => a[Math.floor(Math.random() * a.length)]) {
  const set = PATH_SETS[lvl] || PATH_SETS[1];
  for (let t = 0; t < 200; t++) {
    const v = Array.from({ length: n }, () => pick(set)), sum = v.reduce((a, b) => a + b, 0);
    if (sum >= PATH_MIN_GR && sum <= PATH_MAX[lvl]) return v.sort((a, b) => b - a);
  }
  return Array.from({ length: n }, () => 20);
}
// "20 gr + 10 gr = 30 gr" on screen, "20 groszy i 10 groszy to razem 30 groszy" aloud
export function coinSum(vals) {
  const sum = vals.reduce((a, b) => a + b, 0);
  if (vals.length === 1) return { show: `${vals[0]} gr`, speak: gr(vals[0]), sum };
  const words = vals.map(gr);
  return { show: `${vals.map((v) => `${v} gr`).join(" + ")} = ${sum} gr`, speak: `${words.slice(0, -1).join(", ")} i ${words.at(-1)} to razem ${gr(sum)}`, sum };
}
