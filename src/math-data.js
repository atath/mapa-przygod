import { pick, ri, shuffle } from "./util.js";

/* ================== Shield sums in a fight (no DOM: unit-tested in Node) ==================
   genShield: the monster's attack the child blocks with a sum.
   shieldOptions: the right answer plus wrong ones taken from the mistakes children really make,
   each wrong one tagged, so the parent's report says what kind of mistake it was.
   explain: the steps of a picture explanation shown after a wrong answer (ten frames, number line). */

export function genShield(lvl) {
  const kind = lvl === 1 ? pick(["add", "sub"]) : lvl === 2 ? pick(["add", "sub", "miss"]) : pick(["three", "miss", "sub", "three"]);
  const max = lvl === 1 ? 15 : 20;
  let q;
  if (kind === "add") { const a = ri(3, max - 2), b = ri(2, max - a); q = { a, b, ans: a + b, show: `${a} + ${b}`, say: `${a} dodać ${b}` }; }
  else if (kind === "sub") { const a = ri(8, max), b = ri(2, a - 1); q = { a, b, ans: a - b, show: `${a} − ${b}`, say: `${a} odjąć ${b}` }; }
  else if (kind === "miss") { const s = ri(8, max), a = ri(2, s - 2); q = { a, s, ans: s - a, show: `${a} + ? = ${s}`, say: `${a} dodać ile daje ${s}` }; }
  else { const a = ri(4, 12), b = ri(2, 8), c = ri(1, Math.min(9, a + b - 1)); q = { a, b, c, ans: a + b - c, show: `${a} + ${b} − ${c}`, say: `${a} dodać ${b} odjąć ${c}` }; }
  q.kind = kind; q.q = kind === "miss" ? q.show : q.show + " = ?";
  q.opts = shieldOptions(q, lvl === 1 ? 3 : 4);
  return q;
}

export function shieldOptions(q, n) {
  const { a, b, c, s, ans } = q, cand = [];
  if (q.kind === "add") cand.push([ans - 1, "o 1"], [ans + 1, "o 1"], [a > b ? a - b : -1, "inne działanie"]);
  else if (q.kind === "sub") {
    cand.push([ans - 1, "o 1"], [ans + 1, "o 1"]);
    if (a >= 10 && a % 10 < b % 10) cand.push([10 * Math.floor(a / 10) + (b % 10 - a % 10), "bez pożyczki"]);
    cand.push([a + b, "inne działanie"]);
  } else if (q.kind === "miss") cand.push([s + a, "inne działanie"], [s, "przepisana"], [ans - 1, "o 1"], [ans + 1, "o 1"]);
  else cand.push([a + b, "pół zadania"], [ans - 1, "o 1"], [ans + 1, "o 1"], [a + b + c, "inne działanie"]);
  const out = [{ v: ans, tag: null }];
  const add = (v, tag) => { if (out.length < n && v >= 0 && !out.some((o) => o.v === v)) out.push({ v, tag }); };
  // the two "off by one" answers are interchangeable: keep one of them, so the other kinds of mistake fit
  const ones = shuffle(cand.filter(([, t]) => t === "o 1")), first = cand.find(([, t]) => t !== "o 1");
  if (first) add(...first);
  if (ones.length) add(...ones[0]);
  for (const [v, t] of cand) add(v, t);
  for (const d of [2, -2, 3, -3, 4, -4, 5]) add(ans + d, "inny");
  return shuffle(out);
}

/* Steps of the picture shown after a wrong answer. Two shapes:
   { pic: "frames", a, b, gone, color }: dots in two ten frames — `a` dots, `b` more join, `gone` vanish from the end
   { pic: "line", from, to, jumps: [{ from, to }] }: jumps on a number line 0–20
   plus `lines` (captions shown one after another) and `speak` (what the pet says). */
export function explain(q) {
  const { a, b, c, s, ans } = q;
  if (q.kind === "add") {
    const cross = a < 10 && a + b > 10;
    return { pic: "frames", a, b, gone: 0, lines: cross ? [`${a} + ${10 - a} = 10`, `10 + ${a + b - 10} = ${a + b}`] : [`${a} + ${b} = ${a + b}`],
      speak: cross ? `${a} i ${10 - a} to 10, i jeszcze ${a + b - 10}. Razem ${a + b}.` : `${a} i jeszcze ${b} to razem ${a + b}.` };
  }
  if (q.kind === "sub") {
    const cross = a > 10 && a - b < 10;
    return { pic: "frames", a, b: 0, gone: b, lines: cross ? [`${a} − ${a - 10} = 10`, `10 − ${b - (a - 10)} = ${ans}`] : [`${a} − ${b} = ${ans}`],
      speak: cross ? `${a} bez ${a - 10} to 10, i jeszcze ${b - (a - 10)} mniej. Zostaje ${ans}.` : `${a} bez ${b} to ${ans}.` };
  }
  if (q.kind === "miss") {
    const cross = a < 10 && s > 10;
    return { pic: "line", from: a, to: s, jumps: cross ? [{ from: a, to: 10 }, { from: 10, to: s }] : [{ from: a, to: s }],
      lines: cross ? [`${a} + ${10 - a} = 10`, `10 + ${s - 10} = ${s}`, `${10 - a} + ${s - 10} = ${ans}`] : [`${a} + ${ans} = ${s}`],
      speak: cross ? `Od ${a} do 10 brakuje ${10 - a}, od 10 do ${s} jeszcze ${s - 10}. Razem ${ans}.` : `Od ${a} do ${s} brakuje ${ans}.` };
  }
  return { pic: "frames", a, b, gone: c, lines: [`${a} + ${b} = ${a + b}`, `${a + b} − ${c} = ${ans}`],
    speak: `${a} i ${b} to ${a + b}. Bez ${c} zostaje ${ans}.` };
}

// how a card's value looks as dots: rows of up to five, like a ten frame
export const dotRows = (v) => [Math.min(5, v), Math.max(0, Math.min(5, v - 5))].filter(Boolean);
