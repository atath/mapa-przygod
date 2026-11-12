import { pick, shuffle } from "../util.js";

/* ================== "Kto gdzie mieszka?" — connect facts by arranging (no DOM) ==================
   Houses in a row, animals to put in them, picture clues read aloud.
   Exactly one arrangement fits all clues and no clue can be left out. */

export const HOUSE_ANIMALS = [
  { k: "kot", e: "🐱", nom: "Kot", gen: "kota" }, { k: "pies", e: "🐶", nom: "Pies", gen: "psa" },
  { k: "sowa", e: "🦉", nom: "Sowa", gen: "sowy" }, { k: "mysz", e: "🐭", nom: "Mysz", gen: "myszy" },
  { k: "krolik", e: "🐰", nom: "Królik", gen: "królika" }, { k: "zaba", e: "🐸", nom: "Żaba", gen: "żaby" },
  { k: "lis", e: "🦊", nom: "Lis", gen: "lisa" }, { k: "kura", e: "🐔", nom: "Kura", gen: "kury" }
];
const ORD = ["pierwszym", "drugim", "trzecim", "czwartym"];

// clue kinds: at (a in house p), next (a beside b), notAt (a not on an edge), notNext, left (a somewhere left of b)
export function holds(c, pos) { // pos: animal key → house index
  const a = pos[c.a], b = pos[c.b], n = c.n;
  if (c.t === "at") return a === c.p;
  if (c.t === "next") return Math.abs(a - b) === 1;
  if (c.t === "notNext") return Math.abs(a - b) !== 1;
  if (c.t === "notAt") return a !== 0 && a !== n - 1;
  return a < b; // left
}
const posOf = (arr) => Object.fromEntries(arr.map((k, i) => [k, i]));

export function perms(a) {
  if (a.length <= 1) return [a.slice()];
  return a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));
}

function text(c, A) {
  const a = A[c.a], b = A[c.b];
  if (c.t === "at") {
    const where = c.p === c.n - 1 ? "ostatnim" : c.n === 3 && c.p === 1 ? "środkowym" : ORD[c.p];
    return { say: `${a.nom} mieszka w ${where} domku.`, pic: `${a.e} → 🏠${c.p + 1}` };
  }
  if (c.t === "next") return { say: `${a.nom} mieszka obok ${b.gen}.`, pic: `${a.e} ↔ ${b.e}` };
  if (c.t === "notNext") return { say: `${a.nom} nie mieszka obok ${b.gen}.`, pic: `${a.e} ✗ ${b.e}` };
  if (c.t === "notAt") return { say: `${a.nom} nie mieszka na brzegu.`, pic: `${a.e} ✗ 🏠1 🏠${c.n}` };
  return { say: `${a.nom} mieszka gdzieś na lewo od ${b.gen}.`, pic: `${a.e} ⬅ ${b.e}` };
}

export function genHouses(lvl) {
  const n = lvl === 1 ? 3 : 4;
  for (let tries = 0; tries < 400; tries++) {
    const animals = shuffle(HOUSE_ANIMALS).slice(0, n), sol = animals.map((x) => x.k), pos = posOf(sol), A = Object.fromEntries(animals.map((x) => [x.k, x]));
    const all = [];
    for (const k of sol) {
      for (const p of [0, n - 1, ...(n === 3 ? [1] : [])]) if (pos[k] === p) all.push({ t: "at", a: k, p, n });
      if (lvl > 1 && pos[k] !== 0 && pos[k] !== n - 1) all.push({ t: "notAt", a: k, n });
      for (const j of sol) if (j !== k) {
        if (Math.abs(pos[k] - pos[j]) === 1 && k < j) all.push({ t: "next", a: k, b: j, n });
        if (lvl > 1 && Math.abs(pos[k] - pos[j]) > 1 && k < j) all.push({ t: "notNext", a: k, b: j, n });
        if (lvl === 3 && pos[k] < pos[j]) all.push({ t: "left", a: k, b: j, n });
      }
    }
    const need = lvl === 1 ? 2 : lvl === 2 ? 3 : pick([3, 4]), every = perms(sol).map(posOf);
    for (let k = 0; k < 60; k++) {
      const cs = shuffle(all).slice(0, need);
      if (cs.filter((c) => c.t === "at").length > 1) continue;
      if (lvl === 3 && !cs.some((c) => c.t === "left" || c.t === "notNext")) continue;
      const fit = (set) => every.filter((p) => set.every((c) => holds(c, p))).length;
      if (fit(cs) !== 1) continue;
      if (cs.some((_, i) => fit(cs.filter((__, j) => j !== i)) < 2)) continue;
      const clues = cs.map((c) => ({ ...c, ...text(c, A) }));
      return { kind: "houses", n, animals, ans: sol, clues };
    }
  }
  throw new Error("genHouses: no puzzle");
}

// which clues an arrangement (array of keys, nulls allowed) breaks
export function brokenClues(q, arr) {
  const pos = posOf(arr);
  return q.clues.map((c, i) => (holds(c, pos) ? -1 : i)).filter((i) => i >= 0);
}
