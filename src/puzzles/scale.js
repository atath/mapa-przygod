import { pick, ri } from "../util.js";

/* ================== Balance scale and signs: pictures of equations (no DOM) ==================
   scale: same things on one pan, a weight on the other. How much does one weigh? (A + A + A = 12)
          Level 3: two scales, A + A = 10 and A + B = 12, how much is B?
   signs: put + or − between the numbers so the sum is right; exactly one way works. */

export const ITEMS = [
  { e: "🍎", one: "jabłko", few: "jabłka", two: "dwa" },
  { e: "🍐", one: "gruszka", few: "gruszki", two: "dwie" },
  { e: "🎃", one: "dynia", few: "dynie", two: "dwie" },
  { e: "🍋", one: "cytryna", few: "cytryny", two: "dwie" }
];
const NUM = { 3: "trzy", 4: "cztery" };
export const howMany = (it, n) => `${n === 2 ? it.two : NUM[n]} ${it.few}`;

export function genScale(lvl) {
  if (lvl === 3) {
    const [a, b] = [pick(ITEMS), pick(ITEMS)];
    if (a === b) return genScale(lvl);
    const A = ri(2, 6), B = ri(2, 9);
    if (A === B) return genScale(lvl);
    return { kind: "scale", two: true, a, b, A, B, S1: 2 * A, S2: A + B, ans: B };
  }
  const it = pick(ITEMS);
  if (lvl === 1 && pick([true, false])) { const A = ri(2, 8), k = ri(1, 6); if (A + k > 12) return genScale(lvl); return { kind: "scale", it, n: 1, k, A, S: A + k, ans: A }; }
  const n = lvl === 1 ? 2 : pick([3, 4]), A = ri(2, lvl === 1 ? 6 : 5);
  if (n * A > 20) return genScale(lvl);
  return { kind: "scale", it, n, k: 0, A, S: n * A, ans: A };
}
// what the pans hold if one thing weighed x: [left, right]
export const weigh = (q, x) => (q.two ? [q.A + x, q.S2] : [q.n * x + q.k, q.S]);

export function genSigns(lvl) {
  const k = lvl === 3 ? 3 : 2, max = lvl === 1 ? 10 : 20;
  for (;;) {
    const nums = Array.from({ length: k + 1 }, () => ri(1, max)), signs = Array.from({ length: k }, () => pick(["+", "−"]));
    let v = nums[0], ok = true;
    for (let i = 0; i < k; i++) { v = signs[i] === "+" ? v + nums[i + 1] : v - nums[i + 1]; if (v < 0 || v > max) ok = false; }
    if (!ok) continue;
    const res = v, fits = [];
    for (let m = 0; m < 1 << k; m++) { const s = Array.from({ length: k }, (_, i) => (m & (1 << i) ? "−" : "+")); if (calc(nums, s) === res) fits.push(s); }
    if (fits.length !== 1) continue;
    return { kind: "signs", nums, res, ans: signs };
  }
}
export function calc(nums, signs) { let v = nums[0]; signs.forEach((s, i) => { v = s === "+" ? v + nums[i + 1] : v - nums[i + 1]; }); return v; }
