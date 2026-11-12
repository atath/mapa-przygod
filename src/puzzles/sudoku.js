import { pick, shuffle } from "../util.js";

/* ================== Picture sudoku (no DOM) ==================
   Level 1: 3×3, three pictures. Level 2: 4×4, every picture once in each row and column.
   Level 3: 4×4 with the 2×2 boxes too. The empty cells are chosen so that there is always a cell
   with only one picture that fits: solvable without guessing, and so the solution is the only one. */

export const SUDOKU_ICONS = [["🍎", "🍌", "🍇", "🍓"], ["🐱", "🐶", "🐭", "🐰"], ["⭐", "🌙", "☀️", "☁️"], ["🌸", "🍄", "🍁", "🌲"]];

function fullGrid(n, boxes) {
  // a known-good grid, then shuffled in ways that keep it valid
  let g = n === 3 ? [[0, 1, 2], [1, 2, 0], [2, 0, 1]] : [[0, 1, 2, 3], [2, 3, 0, 1], [1, 0, 3, 2], [3, 2, 1, 0]];
  const sym = shuffle([...Array(n).keys()]);
  g = g.map((r) => r.map((v) => sym[v]));
  if (!boxes) { g = shuffle(g); const cols = shuffle([...Array(n).keys()]); g = g.map((r) => cols.map((c) => r[c])); }
  else {
    const rows = [...shuffle([0, 1]), ...shuffle([2, 3])], band = shuffle([0, 1]);
    g = (band[0] ? [2, 3, 0, 1] : [0, 1, 2, 3]).map((i) => g[rows[i]]);
    const cols = [...shuffle([0, 1]), ...shuffle([2, 3])], stack = shuffle([0, 1]), order = stack[0] ? [2, 3, 0, 1] : [0, 1, 2, 3];
    g = g.map((r) => order.map((i) => r[cols[i]]));
    if (pick([true, false])) g = g[0].map((_, c) => g.map((r) => r[c]));
  }
  return g;
}

export function peers(n, boxes, r, c) {
  const out = [];
  for (let i = 0; i < n; i++) { if (i !== c) out.push([r, i]); if (i !== r) out.push([i, c]); }
  if (boxes) { const br = r - (r % 2), bc = c - (c % 2); for (let i = br; i < br + 2; i++) for (let j = bc; j < bc + 2; j++) if ((i !== r || j !== c) && i !== r && j !== c) out.push([i, j]); }
  return out;
}

// fills cells that have a single candidate until it is done (returns the grid) or stuck (null)
export function solveSingles(grid, n, boxes) {
  const g = grid.map((r) => r.slice());
  for (;;) {
    let empty = 0, moved = false;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (g[r][c] != null) continue; empty++;
      const used = new Set(peers(n, boxes, r, c).map(([i, j]) => g[i][j]));
      const cand = [...Array(n).keys()].filter((v) => !used.has(v));
      if (cand.length === 1) { g[r][c] = cand[0]; moved = true; }
    }
    if (!empty) return g;
    if (!moved) return null;
  }
}

export function genSudoku(lvl) {
  const n = lvl === 1 ? 3 : 4, boxes = lvl === 3, holes = lvl === 1 ? 3 : lvl === 2 ? pick([6, 7]) : 8;
  for (;;) {
    const sol = fullGrid(n, boxes), puzzle = sol.map((r) => r.slice());
    let removed = 0;
    for (const k of shuffle([...Array(n * n).keys()])) {
      if (removed === holes) break;
      const r = Math.floor(k / n), c = k % n, keep = puzzle[r][c];
      puzzle[r][c] = null;
      if (solveSingles(puzzle, n, boxes)) removed++; else puzzle[r][c] = keep;
    }
    if (removed === holes) return { kind: "sudoku", n, boxes, sol, puzzle, icons: pick(SUDOKU_ICONS).slice(0, n) };
  }
}

// cells that share a picture with another cell in their row, column or box
export function clashes(q, g) {
  const bad = new Set();
  for (let r = 0; r < q.n; r++) for (let c = 0; c < q.n; c++) {
    if (g[r][c] == null) continue;
    for (const [i, j] of peers(q.n, q.boxes, r, c)) if (g[i][j] === g[r][c]) { bad.add(r * q.n + c); bad.add(i * q.n + j); }
  }
  return [...bad];
}
