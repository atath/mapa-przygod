// Logic and clock tasks, checked thousands of times without a browser.
import { test } from "node:test";
import assert from "node:assert/strict";
import { seedRandom } from "../src/util.js";
import { ANIMALS, genWho, genSeq, genOdd, genIf, logicRoomPuzzles } from "../src/logic-data.js";
import { genRead, genSet, genElapsed, genHowLong, genLonger, genFeel, words, digital, tripTimeLine, ACTS, SPANS } from "../src/time-data.js";

const N = 1500;
const seed = Number(process.env.SEED) || 12345;

// Reads a clue the way a child would, from its words only, and says which animals it allows.
const PHRASES = [
  ["nie ma futerka", (a) => !a.t.includes("fur")], ["ma futerko", (a) => a.t.includes("fur")],
  ["nie ma skrzydeł", (a) => !a.t.includes("wings")], ["ma skrzydła", (a) => a.t.includes("wings")],
  ["nie ma piór", (a) => !a.t.includes("feathers")], ["ma pióra", (a) => a.t.includes("feathers")],
  ["nie ma czterech łap", (a) => !a.t.includes("legs4")], ["ma cztery łapy", (a) => a.t.includes("legs4")],
  ["nie mieszka w wodzie", (a) => !a.t.includes("water")], ["mieszka w wodzie", (a) => a.t.includes("water")]
];
function allows(clue, animal) {
  const not = clue.match(/^To nie (?:był|była) (.+)\.$/);
  if (not) return animal.k !== not[1];
  const hit = PHRASES.find(([p]) => clue.includes(p));
  assert.ok(hit, `clue not understood: ${clue}`);
  return hit[1](animal);
}

test("who did it: exactly one suspect fits all clues, and no clue is enough on its own", () => {
  seedRandom(seed);
  for (const lvl of [1, 2, 3]) for (let i = 0; i < N; i++) {
    const p = genWho(lvl), sus = p.opts.map((o) => ANIMALS.find((a) => a.k === o.a));
    assert.equal(sus.length, lvl === 1 ? 3 : 4);
    const fits = sus.filter((a) => p.clues.every((c) => allows(c, a)));
    assert.deepEqual(fits.map((a) => a.k), [p.ans], `${p.say}`);
    for (const c of p.clues) assert.ok(sus.filter((a) => allows(c, a)).length >= 2, `one clue is enough: ${c} | ${p.say}`);
    for (const o of p.opts) if (o.a !== p.ans) assert.ok(p.why(o.a).length > 10, "a wrong pick needs an explanation");
  }
});

test("what comes next: the answer continues the pattern and is among the options", () => {
  seedRandom(seed);
  for (const lvl of [1, 2, 3]) for (let i = 0; i < N; i++) {
    const p = genSeq(lvl), names = p.opts.map((o) => o.a);
    assert.ok(names.includes(p.ans)); assert.equal(new Set(names).size, names.length);
    assert.ok(p.items.length >= 4);
  }
});

test("odd one out, if-then: one right answer among distinct options", () => {
  seedRandom(seed);
  for (const gen of [genOdd, genIf]) for (const lvl of [1, 2, 3]) for (let i = 0; i < N; i++) {
    const p = gen(lvl), names = p.opts.map((o) => o.a);
    assert.equal(names.filter((n) => n === p.ans).length, 1); assert.equal(new Set(names).size, names.length);
    assert.ok(p.why(names.find((n) => n !== p.ans)).length > 10);
  }
  for (let i = 0; i < 200; i++) assert.ok(logicRoomPuzzles(1).some((p) => p.kind === "who"));
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
