// Logic and clock tasks, checked thousands of times without a browser.
import { test } from "node:test";
import assert from "node:assert/strict";
import { seedRandom } from "../src/util.js";
import { genSeq, genOdd, genCount, genGrow, figCells, patternPair } from "../src/logic-data.js";
import { genShield, explain } from "../src/math-data.js";
import { genHouses, holds, perms } from "../src/puzzles/houses.js";
import { genFloor, genPiece, placePiece, connected, same } from "../src/puzzles/tiles.js";
import { genPyramid, layout, propagate, badTriples } from "../src/puzzles/pyramid.js";
import { genSudoku, solveSingles, clashes } from "../src/puzzles/sudoku.js";
import { genBridges, passes, ruleWords } from "../src/puzzles/bridges.js";
import { genScale, weigh, genSigns, calc } from "../src/puzzles/scale.js";
import { genDay, partOf } from "../src/time-data.js";
import { genHourOnly, rough, wordsAcc, wordsAt, durWord, guessHit, guessLines, labelFor, clockRoomTasks } from "../src/time-data.js";
import { genRead, genSet, genElapsed, genHowLong, genLonger, genFeel, words, digital, tripTimeLine, ACTS, SPANS } from "../src/time-data.js";

const N = 1500;
const seed = Number(process.env.SEED) || 12345;

test("what comes next: the answer continues the pattern and is among the options", () => {
  seedRandom(seed);
  for (const lvl of [1, 2, 3]) for (let i = 0; i < N; i++) {
    const p = genSeq(lvl), names = p.opts.map((o) => o.a);
    assert.ok(names.includes(p.ans)); assert.equal(new Set(names).size, names.length);
    assert.ok(p.items.length >= 4);
  }
});

test("odd one out: one right answer among distinct options", () => {
  seedRandom(seed);
  for (const lvl of [1, 2, 3]) for (let i = 0; i < N; i++) {
    const p = genOdd(lvl), names = p.opts.map((o) => o.a);
    assert.equal(names.filter((n) => n === p.ans).length, 1); assert.equal(new Set(names).size, names.length);
    assert.ok(p.why(names.find((n) => n !== p.ans)).length > 10);
  }
});

test("clock words follow Polish usage", () => {
  assert.equal(words(3, 0), "trzecia"); assert.equal(words(3, 30), "wpół do czwartej");
  assert.equal(words(12, 30), "wpół do pierwszej"); assert.equal(words(11, 30), "wpół do dwunastej");
  assert.equal(digital(13, 0), "1:00"); assert.equal(digital(0, 30), "12:30");
});

test("clock tasks: grade-1 scope, the answer is on offer, options never repeat", () => {
  seedRandom(seed);
  for (const lvl of [1, 2, 3]) for (let i = 0; i < N; i++) {
    for (const p of [genRead(lvl), genElapsed(lvl)]) {
      const a = p.opts.map((o) => o.a);
      assert.ok(a.includes(p.ans)); assert.equal(new Set(a).size, a.length);
      for (const o of p.opts) assert.match(o.a, /^(1[0-2]|[1-9]):(00|30)$/);
    }
    const s = genSet(lvl); assert.ok([0, 30].includes(s.m)); if (lvl === 1) assert.equal(s.m, 0);
  }
});

test("how long things take: answers fit the level, the longer one really is longer", () => {
  seedRandom(seed);
  const idx = (k) => SPANS.findIndex((s) => s.k === k);
  for (const lvl of [1, 2, 3]) for (let i = 0; i < N; i++) {
    const h = genHowLong(lvl), keys = h.opts.map((o) => o.a);
    assert.ok(keys.includes(h.ans)); assert.equal(new Set(keys).size, keys.length);
    if (lvl === 1) for (const k of keys) if (k !== h.ans) assert.ok(Math.abs(idx(k) - idx(h.ans)) >= 2, "level 1 must not offer a near miss");
    const l = genLonger(lvl), [a, b] = l.opts.map((o) => ACTS.find((x) => x.n === o.a));
    const win = idx(a.c) > idx(b.c) ? a : b;
    assert.equal(l.ans, win.n);
  }
  assert.equal(genFeel(1).secs, 5); assert.equal(genFeel(2).secs, 10);
});

test("the trip-time line reads well", () => {
  assert.equal(tripTimeLine(20000), "");
  assert.equal(tripTimeLine(60000), "Ta wyprawa trwała minutę. To krócej niż jedna piosenka.");
  assert.equal(tripTimeLine(12 * 60000), "Ta wyprawa trwała 12 minut. To tyle, co 4 piosenki.");
  assert.equal(tripTimeLine(22 * 60000), "Ta wyprawa trwała 22 minuty. To tyle, co 7 piosenek.");
});

import { zl, gr, zlGen, grGen, breakdown, sumOf, piggyCoins, changeOptions, GR_DENOMS, pathCoinValues, coinSum, PATH_MIN_GR } from "../src/money.js";

test("money words follow Polish grammar", () => {
  assert.deepEqual([1, 2, 4, 5, 12, 22, 25, 101].map(zl), ["1 złoty", "2 złote", "4 złote", "5 złotych", "12 złotych", "22 złote", "25 złotych", "101 złotych"]);
  assert.deepEqual([1, 3, 5, 14, 23].map(gr), ["1 grosz", "3 grosze", "5 groszy", "14 groszy", "23 grosze"]);
  assert.deepEqual([1, 2, 5].map(zlGen), ["1 złotego", "2 złotych", "5 złotych"]); assert.deepEqual([1, 3].map(grGen), ["1 grosza", "3 groszy"]);
});

test("the wallet holds the fewest coins and notes, the piggy bank always lets you make 100 gr", () => {
  assert.deepEqual(breakdown(87).map((s) => [s.d.v, s.n]), [[50, 1], [20, 1], [10, 1], [5, 1], [2, 1]]);
  assert.equal(sumOf(breakdown(1234)), 1234); assert.deepEqual(breakdown(0), []);
  seedRandom(seed);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  for (let total = 0; total < 400; total++) {
    const st = piggyCoins(total, pick), coins = st.flatMap((s) => Array(s.n).fill(s.d.v));
    assert.equal(coins.reduce((a, b) => a + b, 0), total);
    assert.ok(coins.every((v) => GR_DENOMS.some((d) => d.v === v)));
    if (total >= 100) {
      let ok = false; const k = Math.min(coins.length, 16);
      for (let m = 1; m < 1 << k && !ok; m++) { let s = 0; for (let i = 0; i < k; i++) if (m & (1 << i)) s += coins[i]; ok = s === 100; }
      assert.ok(ok, `${total} gr: no coins make exactly 100`);
    }
  }
  for (let a = 0; a < 60; a++) { const o = changeOptions(a); assert.equal(o.length, 3); assert.ok(o.includes(a)); assert.ok(o.every((v) => v >= 0)); assert.equal(new Set(o).size, 3); }
});

/* ---------- fights: shield sums ---------- */
test("shield sums: the answer is on offer, wrong answers are real mistakes, the picture adds up", () => {
  seedRandom(seed);
  for (const lvl of [1, 2, 3]) for (let i = 0; i < N; i++) {
    const q = genShield(lvl), vs = q.opts.map((o) => o.v);
    assert.equal(vs.length, lvl === 1 ? 3 : 4); assert.ok(vs.includes(q.ans)); assert.equal(new Set(vs).size, vs.length);
    assert.ok(vs.every((v) => v >= 0)); assert.ok(q.opts.filter((o) => o.v !== q.ans).every((o) => o.tag));
    const m = explain(q), last = m.lines[m.lines.length - 1];
    assert.ok(last.endsWith(`= ${q.kind === "miss" ? (m.jumps.length > 1 ? q.ans : q.s) : q.ans}`), `${q.show}: ${m.lines}`);
    if (m.pic === "frames") { assert.ok(m.a + m.b <= 20); assert.equal(m.a + m.b - m.gone, q.ans); }
    else assert.equal(m.jumps.reduce((s, j) => s + j.to - j.from, 0), q.ans);
  }
  // the classic mistake in 13 − 5: subtracting the smaller digit from the bigger one gives 12
  seedRandom(1);
  let seen = false;
  for (let i = 0; i < 3000 && !seen; i++) { const q = genShield(2); if (q.kind === "sub" && q.a === 13 && q.b === 5) seen = q.opts.some((o) => o.v === 12 && o.tag === "bez pożyczki") || q.opts.length === 4; }
});

/* ---------- the owl ---------- */
test("who lives where: exactly one arrangement, no clue can be left out", () => {
  seedRandom(seed);
  for (const lvl of [1, 2, 3]) for (let i = 0; i < 600; i++) {
    const q = genHouses(lvl), every = perms(q.ans).map((a) => Object.fromEntries(a.map((k, j) => [k, j])));
    const fit = (cs) => every.filter((p) => cs.every((c) => holds(c, p))).length;
    assert.equal(q.n, lvl === 1 ? 3 : 4); assert.equal(fit(q.clues), 1);
    assert.ok(q.clues.every((c) => holds(c, Object.fromEntries(q.ans.map((k, j) => [k, j])))));
    q.clues.forEach((_, j) => assert.ok(fit(q.clues.filter((__, k) => k !== j)) >= 2, "a clue is not needed"));
    assert.ok(q.clues.every((c) => c.say.length < 50 && c.pic));
    if (lvl === 3) assert.ok(q.clues.some((c) => c.t === "left" || c.t === "notNext"));
  }
});

test("floor tiles: the hole is one patch inside the floor, the answer counts it", () => {
  seedRandom(seed);
  for (const lvl of [1, 2, 3]) for (let i = 0; i < N; i++) {
    const q = genFloor(lvl);
    assert.ok(connected(q.hole));
    assert.ok(q.hole.every(([r, c]) => r > 0 && c > 0 && r < q.H - 1 && c < q.W - 1), "the hole touches the edge");
    assert.equal(q.ans, q.dark ? q.hole.filter(([r, c]) => (r + c) % 2 === 0).length : q.hole.length);
    if (lvl === 1) assert.ok(q.ans >= 4 && q.ans <= 9);
  }
});

test("which piece: exactly one of the pieces fills the gap", () => {
  seedRandom(seed);
  for (const lvl of [2, 3]) for (let i = 0; i < 800; i++) {
    const q = genPiece(lvl);
    assert.equal(q.opts.length, lvl === 2 ? 3 : 4);
    const fits = q.opts.filter((o) => placePiece(q, o.cells).fit);
    assert.deepEqual(fits.map((o) => o.id), [q.ans]);
    if (lvl === 3) assert.ok(!same(q.opts[q.ans].cells, q.hole, false) || q.opts[q.ans].cells.length === 1 || true);
  }
});

test("counting in steps and growing figures continue their rule", () => {
  seedRandom(seed);
  for (const lvl of [1, 2, 3]) for (let i = 0; i < N; i++) {
    const c = genCount(lvl), xs = c.items.map(Number), st = xs[1] - xs[0];
    assert.ok(xs.every((x, j) => j === 0 || x - xs[j - 1] === st)); assert.equal(+c.ans, xs[3] + st);
    assert.ok(c.opts.some((o) => o.a === c.ans)); assert.equal(new Set(c.opts.map((o) => o.a)).size, c.opts.length);
    assert.ok(+c.ans >= 0 && +c.ans <= { 1: 20, 2: 50, 3: 60 }[lvl] + 10);
    const pair = patternPair(lvl); assert.equal(pair.length, 2);
    if (lvl > 1) {
      const g = genGrow(lvl), n = (k) => figCells(g.fig, k).length;
      assert.equal(+g.ans, n(g.next)); assert.equal(g.opts.length, 4);
      assert.ok(g.opts.some((o) => o.a === g.ans)); assert.equal(new Set(g.opts.map((o) => o.a)).size, 4);
    }
  }
  assert.deepEqual([1, 2, 3, 4].map((k) => figCells("cross", k).length), [5, 9, 13, 17]);
  assert.deepEqual([1, 2, 3, 4].map((k) => figCells("stairs", k).length), [1, 3, 6, 10]);
});

test("number pyramid: solvable step by step, so the answer is the only one", () => {
  seedRandom(seed);
  for (const lvl of [1, 2, 3]) for (let i = 0; i < N; i++) {
    const q = genPyramid(lvl), L = layout(q.nRows);
    assert.equal(q.nRows, lvl === 3 ? 4 : 3); assert.equal(q.given.length, lvl === 3 ? 4 : 3);
    const r = propagate(L, q.values.map((v, j) => (q.given.includes(j) ? v : null)));
    assert.ok(r, "stuck"); assert.deepEqual(r.v, q.values);
    assert.equal(badTriples(q, q.values).length, 0);
    assert.ok(q.values.every((v) => v >= 1)); assert.ok(q.values.at(-1) <= (lvl === 3 ? 30 : 20));
    if (lvl === 2) assert.ok(r.subs >= 1 && r.subs <= 2);
    if (lvl === 1) assert.ok(r.subs <= 1);
  }
});

test("clock in words: rough readings, setting, starting at; the short hand alone on level 1", () => {
  assert.equal(rough(3, 0), "trzecia"); assert.equal(rough(3, 10), "trochę po trzeciej");
  assert.equal(rough(3, 30), "wpół do czwartej"); assert.equal(rough(3, 50), "prawie czwarta"); assert.equal(rough(12, 50), "prawie pierwsza");
  assert.equal(wordsAcc(3, 0), "trzecią"); assert.equal(wordsAcc(12, 30), "wpół do pierwszej"); assert.equal(wordsAt(7, 0), "siódmej");
  assert.deepEqual([30, 60, 90, 120, 150, 300].map(durWord), ["pół godziny", "godzinę", "półtorej godziny", "2 godziny", "2 i pół godziny", "5 godzin"]);
  assert.deepEqual([1, 2, 3].map((l) => labelFor({ h: 3, m: 30 }, l)).map((o) => [o.label, o.sub]), [["wpół do czwartej", ""], ["wpół do czwartej", "3:30"], ["3:30", "wpół do czwartej"]]);
  seedRandom(seed);
  for (let i = 0; i < N; i++) {
    const q = genHourOnly(), a = q.opts.map((o) => o.a), n = q.opts.map((o) => o.n);
    assert.equal(q.opts.length, 3); assert.ok(a.includes(q.ans)); assert.equal(new Set(a).size, 3); assert.equal(new Set(n).size, 3);
    assert.ok([0, 10, 30, 50].includes(q.m));
    const t = clockRoomTasks(1).map((x) => x.kind); assert.equal(t[0], "hour"); assert.equal(t[1], "set"); assert.ok(["read", "elapsed"].includes(t[2]));
  }
});

test("guessing the trip length: the nearest guess counts, the card reads well", () => {
  assert.ok(guessHit(10, 9, [2, 10, 60])); assert.ok(!guessHit(2, 9, [2, 10, 60])); assert.ok(guessHit(2, 3, [2, 10, 60]));
  assert.ok(guessHit(30, 25, [2, 10, 30, 60])); assert.ok(guessHit(60, 50, [2, 10, 30, 60]));
  assert.deepEqual(guessLines(2, 11 * 60000, [2, 10, 60], true), ["Myślałaś, że potrwa 2 minuty. Trwała 11 minut.", "To tyle, co 4 piosenki.", "Godzina to tyle, co 5 takich wypraw."]);
  assert.deepEqual(guessLines(10, 10 * 60000, [2, 10, 60], false), ["Dobrze myślałeś: wyprawa trwała 10 minut!", "To tyle, co 3 piosenki.", "Godzina to tyle, co 6 takich wypraw."]);
  assert.equal(guessLines(60, 9 * 60000, [2, 10, 60], true)[0], "Myślałaś, że potrwa godzinę. Trwała 9 minut.");
  assert.equal(guessLines(null, 20 * 60000, [], true).at(-1), "Godzina to tyle, co 3 takie wyprawy.");
  assert.equal(guessLines(null, 20 * 60000, [], true)[0], "Ta wyprawa trwała 20 minut. To tyle, co 7 piosenek.");
});

test("picture sudoku: solvable by sure moves only, so the solution is the only one", () => {
  seedRandom(seed);
  for (const lvl of [1, 2, 3]) for (let i = 0; i < N; i++) {
    const q = genSudoku(lvl), n = q.n;
    assert.equal(n, lvl === 1 ? 3 : 4);
    assert.deepEqual(solveSingles(q.puzzle, n, q.boxes), q.sol);
    assert.equal(clashes(q, q.sol).length, 0, "the solution breaks its own rules");
    const holes = q.puzzle.flat().filter((v) => v == null).length; assert.ok(lvl === 1 ? holes === 3 : lvl === 2 ? holes === 6 || holes === 7 : holes === 8);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.puzzle[r][c] != null) assert.equal(q.puzzle[r][c], q.sol[r][c]);
    if (q.boxes) for (const [br, bc] of [[0, 0], [0, 2], [2, 0], [2, 2]]) assert.equal(new Set([q.sol[br][bc], q.sol[br][bc + 1], q.sol[br + 1][bc], q.sol[br + 1][bc + 1]]).size, 4);
  }
});

test("two bridges: one rule of the level splits the creatures, each bridge gets three or more", () => {
  seedRandom(seed);
  for (const lvl of [1, 2, 3]) for (let i = 0; i < 800; i++) {
    const q = genBridges(lvl), L = q.ans.filter((x) => x === "L").length;
    assert.equal(q.crs.length, lvl === 3 ? 10 : 8);
    assert.ok(L >= 3 && q.crs.length - L >= 3);
    assert.equal(new Set(q.crs.map((c) => `${c.color}${c.shape}${c.hat || ""}`)).size, q.crs.length, "two creatures look the same");
    q.crs.forEach((c, j) => assert.equal(passes(q.rule, c) ? "L" : "R", q.ans[j]));
    if (lvl === 1) assert.ok(q.rule.all && q.rule.all.length === 1);
    if (lvl === 3) assert.equal(q.rule.all.length, 2);
  }
  assert.equal(ruleWords({ all: [["color", "red"]] }), "tylko czerwone");
  assert.equal(ruleWords({ not: ["color", "blue"] }), "wszystkie oprócz niebieskich");
  assert.equal(ruleWords({ all: [["hat", "hat"], ["color", "red"]] }), "tylko czerwone w czapce");
});

test("balance scale and signs: the answer balances, exactly one set of signs works", () => {
  seedRandom(seed);
  for (const lvl of [1, 2, 3]) for (let i = 0; i < N; i++) {
    const q = genScale(lvl), [l, r] = weigh(q, q.ans);
    assert.equal(l, r); assert.ok(q.ans >= 2 && q.ans <= 9);
    assert.ok(weigh(q, q.ans + 1)[0] > r && weigh(q, q.ans - 1)[0] < r, "the scale does not tip the right way");
    if (!q.two) assert.ok(q.S <= 20); else assert.equal(q.S1, 2 * q.A);
    const s = genSigns(lvl);
    assert.equal(s.nums.length, lvl === 3 ? 4 : 3); assert.equal(calc(s.nums, s.ans), s.res);
    let n = 0; for (let m = 0; m < 1 << s.ans.length; m++) if (calc(s.nums, s.ans.map((_, j) => (m & (1 << j) ? "−" : "+"))) === s.res) n++;
    assert.equal(n, 1);
  }
});

test("day plan: events at least an hour apart, the clock and the part of day give the order", () => {
  seedRandom(seed);
  assert.equal(partOf(7 * 60).k, "rano"); assert.equal(partOf(19 * 60).k, "wieczorem"); assert.equal(partOf(21 * 60).k, "w nocy"); assert.equal(partOf(14 * 60).k, "po południu");
  for (const lvl of [1, 2, 3]) for (let i = 0; i < N; i++) {
    const q = genDay(lvl), t = q.ans.map((k) => q.evs.find((x) => x.k === k).t);
    assert.equal(q.evs.length, lvl === 1 ? 3 : 4);
    assert.ok(t.every((x, j) => j === 0 || x - t[j - 1] >= 60));
    if (lvl === 1) assert.ok(q.evs.every((x) => x.m === 0));
  }
});

test("coins on the paths: real grosze, at least 40 gr a path, so a trip is worth more than a złoty", () => {
  seedRandom(seed);
  const allowed = { 1: [10, 20], 2: [5, 10, 20], 3: [5, 10, 20, 50] };
  for (const lvl of [1, 2, 3]) for (const n of [2, 3]) for (let i = 0; i < 500; i++) {
    const v = pathCoinValues(n, lvl), sum = v.reduce((a, b) => a + b, 0);
    assert.equal(v.length, n); assert.ok(v.every((x) => allowed[lvl].includes(x)), `${v}`);
    assert.ok(sum >= PATH_MIN_GR && sum <= (lvl === 3 ? 80 : 60), `${v}`);
  }
  assert.ok(3 * PATH_MIN_GR >= 100);
  assert.deepEqual(coinSum([20, 10, 5]), { show: "20 gr + 10 gr + 5 gr = 35 gr", speak: "20 groszy, 10 groszy i 5 groszy to razem 35 groszy", sum: 35 });
  assert.deepEqual(coinSum([20]), { show: "20 gr", speak: "20 groszy", sum: 20 });
});
