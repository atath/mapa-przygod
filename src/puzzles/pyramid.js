import { ri, rnd, shuffle } from "../util.js";

/* ================== Number pyramid (no DOM) ==================
   Every brick is the sum of the two bricks under it. Some bricks are given, the child fills the rest.
   Cells are numbered row by row from the bottom: rows[k][i] = rows[k-1][i] + rows[k-1][i+1].
   A puzzle is accepted only when it can be solved step by step: at every step some brick and the two
   under it miss exactly one number (so it is never guesswork). */

export function layout(nRows) {
  const cells = []; for (let k = 0; k < nRows; k++) for (let i = 0; i < nRows - k; i++) cells.push({ k, i });
  const id = (k, i) => cells.findIndex((c) => c.k === k && c.i === i);
  const triples = cells.filter((c) => c.k > 0).map((c) => ({ top: id(c.k, c.i), l: id(c.k - 1, c.i), r: id(c.k - 1, c.i + 1) }));
  return { cells, triples, id };
}

// fills the unknowns step by step; returns null when it gets stuck, otherwise the values and how many steps were subtractions
export function propagate(L, known) {
  const v = known.slice(); let subs = 0, moved = true;
  while (moved) {
    moved = false;
    for (const t of L.triples) {
      const miss = [t.top, t.l, t.r].filter((x) => v[x] == null);
      if (miss.length !== 1) continue;
      if (v[t.top] == null) v[t.top] = v[t.l] + v[t.r];
      else { const other = v[t.l] == null ? t.r : t.l; v[miss[0]] = v[t.top] - v[other]; subs++; if (v[miss[0]] < 1) return null; }
      moved = true;
    }
  }
  return v.every((x) => x != null) ? { v, subs } : null;
}

export function genPyramid(lvl) {
  const nRows = lvl === 3 ? 4 : 3, L = layout(nRows), nGiven = lvl === 3 ? 4 : 3, top = lvl === 3 ? 30 : 20;
  const onlyAdd = lvl === 1 && rnd() < 0.5;
  for (;;) {
    const bottom = Array.from({ length: nRows }, () => ri(1, lvl === 3 ? 5 : 7)), v = Array(L.cells.length).fill(null);
    bottom.forEach((x, i) => (v[L.id(0, i)] = x));
    for (const t of L.triples) v[t.top] = v[t.l] + v[t.r];
    if (v[v.length - 1] > top) continue;
    const given = onlyAdd ? bottom.map((_, i) => L.id(0, i)) : shuffle(L.cells.map((_, j) => j)).slice(0, nGiven);
    const known = v.map((x, j) => (given.includes(j) ? x : null)), r = propagate(L, known);
    if (!r) continue;
    if (lvl === 1 && !onlyAdd && r.subs !== 1) continue;
    if (lvl === 2 && (r.subs < 1 || r.subs > 2)) continue;
    if (lvl === 3 && r.subs < 1) continue;
    return { kind: "pyramid", nRows, cells: L.cells, triples: L.triples, values: v, given: given.slice().sort((a, b) => a - b), subs: r.subs };
  }
}

// triples whose numbers do not add up (only where all three are filled in)
export function badTriples(q, vals) {
  return q.triples.filter((t) => [t.top, t.l, t.r].every((x) => vals[x] != null) && vals[t.l] + vals[t.r] !== vals[t.top]);
}
