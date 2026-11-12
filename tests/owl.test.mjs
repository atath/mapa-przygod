// The owl's puzzles and the picture explanation in fights: every kind can be solved, fits every screen,
// wrong checks only explain at first and cost a heart on the last one.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { serve, open, startWith, oneProfile, go, playRoom, label, readDB, passGuess } from "./helpers.mjs";

let srv; before(async () => { srv = await serve(); }); after(() => srv.close());

export const OWL_KINDS = ["houses", "patterns", "tiles", "pyramid"];
const SCREENS = [["small phone", 360, 640], ["phone", 390, 844], ["tablet upright", 768, 1024], ["tablet lying", 1024, 768]];

async function owlOnly(p, kind, level, extra = {}) {
  await p.addInitScript(({ k }) => { window.__LW_TEST.rooms = ["logic", "chest"]; window.__LW_TEST.logic = k; }, { k: kind });
  await startWith(p, srv.url, oneProfile({ level, lands: ["forest", "mountains"], ...extra }));
  await go(p, "forest");
}

for (const [name, w, h] of SCREENS) {
  test(`${name}: every owl puzzle on every level fits the screen and can be solved`, { timeout: 300000 }, async () => {
    const o = await open({ viewport: { width: w, height: h } });
    try {
      for (const kind of OWL_KINDS) for (const level of [1, 2, 3]) {
        const p = await o.page();
        await owlOnly(p, kind, level);
        await p.waitForFunction(() => window.__LW_TEST.q && (document.querySelector("#checkBtn") || document.querySelector("#ctl .opt") || document.querySelector(".cr")), null, { timeout: 15000 });
        await p.waitForTimeout(300);
        const m = await p.evaluate(() => {
          const btn = document.querySelector("#checkBtn, #weighBtn, #ctl .opt, .bridge");
          return { over: document.documentElement.scrollHeight - innerHeight, btn: btn ? btn.getBoundingClientRect().bottom : 0, H: innerHeight,
            scene: document.querySelector("#sc canvas").getBoundingClientRect().height, dlg: document.querySelector(".dialog").getBoundingClientRect().height };
        });
        const at = `${kind}, level ${level}`;
        assert.ok(m.over <= 1, `${at}: the page scrolls by ${m.over}px`);
        assert.ok(m.btn > 0 && m.btn <= m.H, `${at}: the main button is off screen (${m.btn} > ${m.H})`);
        assert.ok(m.dlg >= 50, `${at}: the dialog is squashed`);
        assert.ok(m.scene >= 60, `${at}: the scene is only ${m.scene}px`);
        const r = await playRoom(p); assert.ok(r.ok, `${at}: ${r.why || ""}`);
        assert.equal(await label(p), "Skrzynia ze skarbem", `${at}: did not reach the chest`);
        await p.close();
      }
      assert.deepEqual(o.errs, []);
    } finally { await o.close(); }
  });
}

test("the owl: two failed checks only explain, the third costs a heart and shows the answer", { timeout: 120000 }, async () => {
  const o = await open(); const p = o.p;
  try {
    await owlOnly(p, "tiles", 1);
    await p.waitForSelector("#checkBtn");
    const ans = await p.evaluate(() => window.__LW_TEST.q.ans);
    const wrong = String(ans === 9 ? 8 : ans + 1);
    const hearts = () => p.$$eval(".hearts img:not(.empty)", (x) => x.length);
    const h0 = await hearts();
    for (let i = 0; i < 2; i++) {
      for (const d of wrong) await p.click(`[data-d="${d}"]`);
      await p.click("#checkBtn"); await p.waitForTimeout(300);
      assert.equal(await hearts(), h0, "a failed check before the last must not cost a heart");
      assert.match(await p.textContent("#txt"), /Za (mało|dużo)/);
      for (let k = 0; k < wrong.length; k++) await p.click('[data-d="del"]');
    }
    for (const d of wrong) await p.click(`[data-d="${d}"]`);
    await p.click("#checkBtn"); await p.waitForTimeout(900);
    assert.equal(await hearts(), h0 - 1, "the third failed check costs a heart");
    await p.waitForFunction(() => document.querySelector("#sc canvas")?.getAttribute("aria-label") === "Skrzynia ze skarbem", null, { timeout: 15000 });
    const db = await readDB(p), a = db.profiles.p1.stats.answers.find((x) => x.k === "logic.tiles");
    assert.equal(a.ok, false); assert.match(a.d, /próby: 3/);
    assert.deepEqual(db.profiles.p1.logicSeen, [], "a kind forced by a test is not remembered");
    assert.deepEqual(o.errs, []);
  } finally { await o.close(); }
});

test("the owl gives a different kind than last time and remembers it in the save", { timeout: 120000 }, async () => {
  const o = await open(); const p = o.p;
  try {
    await p.addInitScript(() => { window.__LW_TEST.rooms = ["logic", "chest"]; });
    await startWith(p, srv.url, oneProfile({ level: 2, logicSeen: ["houses", "bogus", 7] }));
    await go(p, "forest"); await p.waitForFunction(() => window.__LW_TEST.q);
    const kind = (await readDB(p)).profiles.p1.logicSeen;
    assert.ok(!kind.includes("bogus") && !kind.includes(7), "unknown kinds are dropped");
    assert.notEqual(kind.at(-1), "houses", "the same kind twice in a row");
    assert.ok(kind.includes("houses"), "the last kind is still remembered");
    const r = await playRoom(p); assert.ok(r.ok, r.why);
    assert.deepEqual(o.errs, []);
  } finally { await o.close(); }
});

test("a wrong shield answer shows how to count it and records the kind of mistake", { timeout: 120000 }, async () => {
  const o = await open({ viewport: { width: 360, height: 640 } }); const p = o.p;
  try {
    await p.addInitScript(() => { window.__LW_TEST.rooms = ["monster", "chest"]; });
    await startWith(p, srv.url, oneProfile({ level: 1 }));
    await go(p, "forest"); await p.waitForSelector(".card");
    assert.ok(await p.$(".card .dots i"), "level-1 cards show dots");
    assert.ok((await p.$$eval(".card", (cs) => cs.map((c) => c.textContent))).every((t) => /^\d+$/.test(t)), "dots add no text to a card");
    const { T, el } = await p.evaluate(() => window.__LW_TEST);
    const vals = await p.$$eval(".card", (cs) => cs.map((c) => +c.textContent));
    await p.click(`.spell[data-s="${{ fire: "water", water: "earth", earth: "fire" }[el]}"]`);
    for (let m = 1; m < 1 << vals.length; m++) { let s = 0; vals.forEach((v, i) => { if (m & (1 << i)) s += v; }); if (s === T) { for (let i = 0; i < vals.length; i++) if (m & (1 << i)) await p.click(`.card[data-i="${i}"]`); break; } }
    await p.click("#cast");
    await p.waitForSelector(".btn.num", { timeout: 10000 });
    const q = (await p.textContent(".sum")).replace(/−/g, "-").replace("= ?", "").trim(), ans = Function("return " + q)();
    const wrong = await p.$$eval(".btn.num", (b, a) => b.map((x) => +x.dataset.v).find((v) => v !== a), ans);
    await p.click(`.btn.num[data-v="${wrong}"]`);
    await p.waitForSelector(".explain", { timeout: 8000 });
    await p.waitForSelector("#explainOk:not([disabled])");
    const m = await p.evaluate(() => ({ over: document.documentElement.scrollHeight - innerHeight, btn: document.querySelector("#explainOk").getBoundingClientRect().bottom, H: innerHeight }));
    assert.ok(m.over <= 1 && m.btn <= m.H, "the explanation does not fit a small phone");
    await p.click("#explainOk"); await p.waitForSelector(".card");
    const a = (await readDB(p)).profiles.p1.stats.answers.find((x) => x.k.startsWith("math.") && x.k !== "math.cards");
    assert.equal(a.ok, false); assert.match(a.d, /\(\d+\) (o 1|inne działanie|bez pożyczki|przepisana|pół zadania|inny)$/);
    assert.deepEqual(o.errs, []);
  } finally { await o.close(); }
});

test("before a trip the child guesses how long it takes; the chest compares, the streak is saved", { timeout: 120000 }, async () => {
  const o = await open(); const p = o.p;
  try {
    await p.addInitScript(() => { window.__LW_TEST.rooms = ["chest"]; });
    await startWith(p, srv.url, oneProfile({ level: 1, trips: 3 }));
    await p.click("#tripBtn"); await p.click('[data-land="forest"]'); await p.waitForSelector("[data-g]");
    assert.deepEqual(await p.$$eval("[data-g]", (b) => b.map((x) => +x.dataset.g)), [2, 10, 60]);
    assert.ok(await passGuess(p, 2));
    const r = await playRoom(p); assert.ok(r.ok);
    const card = await p.textContent(".timecard");
    assert.match(card, /Dobrze myślałaś|Myślałaś, że potrwa 2 minuty/);
    const db = await readDB(p); assert.equal(db.profiles.p1.guessStreak, 1, "a short trip makes 2 minutes the right guess");
    assert.ok(db.profiles.p1.stats.answers.some((a) => a.k === "time.guess" && a.ok));
    // three hits in a row: the question comes back only every fifth trip
    await startWith(p, srv.url, oneProfile({ level: 1, trips: 6, guessStreak: 3 }));
    await p.click("#tripBtn"); await p.click('[data-land="forest"]'); await p.waitForSelector("#sc canvas");
    assert.equal(await label(p), "Skrzynia ze skarbem", "no question after three good guesses");
    assert.deepEqual(o.errs, []);
  } finally { await o.close(); }
});

test("clock tower on level 1: the short hand alone, answers in words, both hands turn together", { timeout: 120000 }, async () => {
  const o = await open({ viewport: { width: 360, height: 640 } }); const p = o.p;
  try {
    await p.addInitScript(() => { window.__LW_TEST.rooms = ["clock", "chest"]; });
    await startWith(p, srv.url, oneProfile({ level: 1, lands: ["forest", "mountains"] }));
    await go(p, "mountains");
    await p.waitForFunction(() => window.__LW_TEST.q && window.__LW_TEST.q.kind === "hour");
    const labels = await p.$$eval("#ctl .opt .lb", (b) => b.map((x) => x.textContent));
    assert.ok(labels.every((t) => !/\d/.test(t)), `level 1 answers are words: ${labels}`);
    const r = await playRoom(p); assert.ok(r.ok, r.why);
    assert.deepEqual(r.asked.slice(0, 2), ["hour", "set"]);
    assert.deepEqual(o.errs, []);
  } finally { await o.close(); }
});
