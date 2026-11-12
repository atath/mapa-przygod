import { pick, ri, rnd, shuffle } from "../util.js";

/* ================== Spatial puzzles: patch the floor, find the piece (no DOM) ==================
   floor: a floor of tiles with a hole drawn as one patch without grid lines; how many tiles are missing
          (level 3: a chessboard floor, how many dark tiles are missing). The hole never touches the edge,
          so every row and column of it can be read from the tiles around it.
   piece: a board cut in two; which of the pieces fills the gap (level 3: the pieces are turned). */

const key = (r, c) => r * 100 + c;
export const cellsOfRect = (r0, c0, h, w) => Array.from({ length: h * w }, (_, i) => [r0 + Math.floor(i / w), c0 + (i % w)]);
export function connected(cells) {
  if (!cells.length) return false;
  const set = new Set(cells.map(([r, c]) => key(r, c))), seen = new Set([key(...cells[0])]), st = [cells[0]];
  while (st.length) { const [r, c] = st.pop(); for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = key(r + dr, c + dc); if (set.has(k) && !seen.has(k)) { seen.add(k); st.push([r + dr, c + dc]); } } }
  return seen.size === set.size;
}
const uniq = (cells) => [...new Map(cells.map((x) => [key(...x), x])).values()];

export function genFloor(lvl) {
  const W = lvl === 1 ? 6 : 7, H = lvl === 1 ? 5 : 6, dark = lvl === 3;
  for (;;) {
    let hole;
    if (lvl === 1) { const h = ri(2, 3), w = ri(2, 4); hole = cellsOfRect(ri(1, H - 1 - h), ri(1, W - 1 - w), h, w); }
    else {
      const a = [ri(1, 3), ri(1, 3)], b = [ri(1, 3), ri(1, 3)];
      const r1 = ri(1, H - 1 - a[0]), c1 = ri(1, W - 1 - a[1]), r2 = ri(1, H - 1 - b[0]), c2 = ri(1, W - 1 - b[1]);
      hole = uniq([...cellsOfRect(r1, c1, ...a), ...cellsOfRect(r2, c2, ...b)]);
      const rs = hole.map((x) => x[0]), cs = hole.map((x) => x[1]);
      const box = (Math.max(...rs) - Math.min(...rs) + 1) * (Math.max(...cs) - Math.min(...cs) + 1);
      if (!connected(hole) || (!dark && box === hole.length)) continue; // an L or a T, not a plain rectangle
    }
    if (hole.length < (lvl === 1 ? 4 : 6) || hole.length > (lvl === 1 ? 9 : 12)) continue;
    const isDark = (r, c) => (r + c) % 2 === 0, darkN = hole.filter(([r, c]) => isDark(r, c)).length;
    if (dark && darkN < 2) continue;
    return { kind: "tiles", v: "floor", W, H, hole, dark, ans: dark ? darkN : hole.length };
  }
}

/* ---------- pieces ---------- */
const norm = (cells) => { const r0 = Math.min(...cells.map((x) => x[0])), c0 = Math.min(...cells.map((x) => x[1])); return cells.map(([r, c]) => [r - r0, c - c0]).sort((p, q) => p[0] - q[0] || p[1] - q[1]); };
const sig = (cells) => JSON.stringify(norm(cells));
export const rot = (cells) => norm(cells.map(([r, c]) => [c, -r]));
const mirror = (cells) => norm(cells.map(([r, c]) => [r, -c]));
const rots = (cells) => { const out = [norm(cells)]; for (let i = 0; i < 3; i++) out.push(rot(out[out.length - 1])); return out; };
// shapes are the same piece: level 2 only shifted, level 3 also turned
export const same = (a, b, turn) => (turn ? rots(a).some((x) => sig(x) === sig(b)) : sig(a) === sig(b));

function growRegion(W, H, n) {
  let cells = [[ri(0, H - 1), ri(0, W - 1)]];
  while (cells.length < n) {
    const [r, c] = pick(cells), [dr, dc] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), nr = r + dr, nc = c + dc;
    if (nr < 0 || nc < 0 || nr >= H || nc >= W || cells.some((x) => x[0] === nr && x[1] === nc)) continue;
    cells.push([nr, nc]);
  }
  return cells;
}
function neighbours(cells) {
  const set = new Set(cells.map((x) => key(...x))), out = [];
  for (const [r, c] of cells) for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!set.has(key(r + dr, c + dc)) && !out.some((x) => x[0] === r + dr && x[1] === c + dc)) out.push([r + dr, c + dc]);
  return out;
}

export function genPiece(lvl) {
  const W = 4, H = lvl === 2 ? 3 : 4, turn = lvl === 3, nOpts = lvl === 2 ? 3 : 4;
  for (;;) {
    const hole = growRegion(W, H, ri(lvl === 2 ? 3 : 4, lvl === 2 ? 5 : 6)), set = new Set(hole.map((x) => key(...x)));
    const rest = []; for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (!set.has(key(r, c))) rest.push([r, c]);
    if (!connected(rest)) continue;
    const wrong = [];
    const tryAdd = (cells) => { if (connected(cells) && !same(cells, hole, turn) && !wrong.some((w) => same(w, cells, turn))) wrong.push(norm(cells)); };
    for (let k = 0; k < 40 && wrong.length < nOpts + 2; k++) {
      const t = ri(0, 3);
      if (t === 0) tryAdd(mirror(hole));
      else if (t === 1 && hole.length > 3) { const i = ri(0, hole.length - 1); tryAdd(hole.filter((_, j) => j !== i)); }
      else if (t === 2) tryAdd([...hole, pick(neighbours(hole))]);
      else { const i = ri(0, hole.length - 1), less = hole.filter((_, j) => j !== i); tryAdd([...less, pick(neighbours(less))]); }
    }
    if (wrong.length < nOpts - 1) continue;
    // the pieces as shown: turned at level 3 (the right one never in its own position), as cut at level 2
    const show = (cells, right) => { if (!turn) return norm(cells); const k = right ? ri(1, 3) : ri(0, 3); let x = norm(cells); for (let i = 0; i < k; i++) x = rot(x); return x; };
    const opts = shuffle([{ cells: show(hole, true), right: true }, ...shuffle(wrong).slice(0, nOpts - 1).map((w) => ({ cells: show(w, false), right: false }))]).map((o, i) => ({ ...o, id: i }));
    return { kind: "tiles", v: "piece", W, H, hole, turn, opts, ans: opts.find((o) => o.right).id };
  }
}

// Where a chosen piece lands: the turn and shift that covers most of the gap.
// Returns { fit, cover: cells of the gap it covers, over: piece cells outside the gap }
export function placePiece(q, cells) {
  const holeSet = new Set(q.hole.map((x) => key(...x))), forms = q.turn ? rots(cells) : [norm(cells)];
  let best = null;
  for (const f of forms) for (let dr = -4; dr <= q.H; dr++) for (let dc = -4; dc <= q.W; dc++) {
    const moved = f.map(([r, c]) => [r + dr, c + dc]), cover = moved.filter((x) => holeSet.has(key(...x)));
    if (!best || cover.length > best.cover.length) best = { cover, over: moved.filter((x) => !holeSet.has(key(...x))) };
  }
  return { ...best, fit: best.cover.length === q.hole.length && best.over.length === 0 };
}

export const genTiles = (lvl) => (lvl === 1 || rnd() < 0.5 ? genFloor(lvl) : genPiece(lvl));
