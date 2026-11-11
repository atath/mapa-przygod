// Whole expeditions on every level, the level-3 try limit, and leaving a trip halfway.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { serve, open, startWith, oneProfile, playRoom, setLevel, text, readDB, label, go, PATH_LABELS } from "./helpers.mjs";

let srv; before(async () => { srv = await serve(); }); after(() => srv.close());

for (const land of ["forest", "mountains"]) for (const level of [1, 2, 3]) {
  test(`${land}, level ${level}: a full expedition, all coins collectable within the limit`, { timeout: 300000 }, async () => {
    const o = await open();
    try {
      // forest: a new player one trip short of the mountains; mountains: a player who has them
      const locked = land === "forest";
      await startWith(o.p, srv.url, oneProfile({ level, coins: 10, trips: locked ? 7 : 20, lands: locked ? ["forest"] : ["forest", "mountains"] }));
      if (locked) {
        await o.p.click("#tripBtn");
        assert.ok(await o.p.$('.land.locked[data-land="mountains"]'), "the mountains should still be locked");
        await o.p.click('[data-land="mountains"]', { force: true }); assert.ok(await o.p.$(".lands"), "a locked land must not start a trip");
        await o.p.click('[data-land="forest"]'); await o.p.waitForSelector("#sc canvas");
      } else await go(o.p, land);
      const rooms = [];
      for (let i = 0; i < 12; i++) {
        await o.p.waitForSelector("#sc canvas");
        const r = await playRoom(o.p); rooms.push(r);
        assert.ok(r.ok, `room ${i} (${r.kind}) failed: ${r.why || ""}`);
        if (r.kind === "path") {
          assert.ok(r.found, "no way to collect every coin and reach an exit");
          assert.equal(r.coins, r.expected, `path paid ${r.coins} coins, ${r.expected} were collected`);
          const max = +r.limit.match(/\/ (\d+)/)[1];
          assert.ok(r.blocks <= max, `all-coins plan needs ${r.blocks} blocks, limit is ${max}`);
        }
        if (r.kind === "chest") break;
      }
      assert.equal(rooms.at(-1).kind, "chest", "the expedition never reached the chest");
      assert.equal(rooms.filter((r) => r.kind === "path").length, 3);
      assert.equal(rooms.at(-2).kind, "logic", "the chest guardian's riddles come right before the chest");
      const tasks = rooms.filter((r, i) => i % 2 === 1 && i < 6).map((r) => r.kind);
      if (land === "forest") assert.ok(tasks.every((k) => ["monster", "door", "sign"].includes(k)), String(tasks));
      else assert.ok(tasks.every((k) => ["monster", "door", "sign", "clock", "time"].includes(k)), String(tasks));
      const db = await readDB(o.p);
      assert.equal(db.profiles.p1.trips, locked ? 8 : 21);
      if (locked) {
        assert.deepEqual(db.profiles.p1.lands, ["forest", "mountains"], "8 trips should open the mountains");
        await o.p.waitForFunction(() => /Odkryliśmy nową krainę: Góry Zegarowe/.test(document.getElementById("txt").textContent), null, { timeout: 5000 });
      }
      assert.ok(db.profiles.p1.coins > 10, "coins were not added to the save");
      // measurements for stage 3: every room left an answer, the trip and the play time were counted
      const st = db.profiles.p1.stats, kinds = new Set(st.answers.map((a) => a.k)), seen = new Set(rooms.map((r) => r.kind));
      const expect = ["code.path", "polish.password", "logic.who"].concat(seen.has("clock") ? ["time.read", "time.set", "time.elapsed"] : [], seen.has("time") ? ["time.howlong", "time.longer", "time.feel"] : [],seen.has("monster") ? ["math.cards", "logic.spell"] : [], seen.has("door") ? ["polish.word"] : [], seen.has("sign") ? ["polish.read"] : []);
      for (const k of expect) assert.ok(kinds.has(k), `no answer recorded for ${k}`);
      assert.equal(st.answers.filter((a) => a.k === "code.path").length, 3, "one path answer per path room");
      assert.ok(st.answers.every((a) => a.ms >= 0 && a.t > 0));
      assert.equal(st.trips.length, 1); assert.equal(st.trips[0].done, true); assert.equal(st.trips[0].lv, level);
      assert.ok(st.trips[0].ms >= 5000, `trip active time ${st.trips[0].ms} ms looks wrong`);
      assert.ok(Object.values(st.days).reduce((a, b) => a + b, 0) >= 5, "play time was not counted");
      assert.deepEqual(o.errs, []);
    } finally { await o.close(); }
  });
}

test("level 3: three failed tries cost a heart, then the companion leads the way without coins", { timeout: 120000 }, async () => {
  const o = await open(); const p = o.p;
  try {
    await startWith(p, srv.url, oneProfile({ level: 3 }));
    await go(p); await p.waitForSelector("#goBtn");
    const coins0 = await text(p, "#coinN");
    for (let i = 0; i < 3; i++) {
      await p.click('[data-d="right"]'); await p.click("#goBtn"); // one step never reaches an exit on the far edge
      if (i < 2) {
        await p.waitForFunction((n) => new RegExp("Został[ay] " + n).test(document.getElementById("limit").textContent), 2 - i, { timeout: 15000 });
        await p.waitForTimeout(200); await p.click("#clearBtn");
      }
    }
    await p.waitForFunction(() => /Skończyły|Ojej/.test(document.getElementById("txt").textContent), null, { timeout: 15000 });
    assert.equal(await p.$$eval(".hearts img:not(.empty)", (x) => x.length), 2);
    await p.waitForFunction(() => document.querySelector("#sc canvas")?.getAttribute("aria-label") !== "Leśna ścieżka", null, { timeout: 30000 });
    assert.equal(await text(p, "#coinN"), coins0, "the guided way must not pay coins");
    assert.deepEqual(o.errs, []);
  } finally { await o.close(); }
});

test("going back to camp mid-animation does not move the next expedition", { timeout: 120000 }, async () => {
  const o = await open(); const p = o.p;
  try {
    await startWith(p, srv.url, oneProfile({ level: 1 }));
    await go(p); await p.waitForSelector("#goBtn");
    const plan = await p.evaluate(() => { // shortest way to any exit, ignoring coins
      const M = window.__LW_TEST.M, D = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }, ex = new Set(M.exits.map((e) => e.cell + ""));
      const prev = new Map([[M.start + "", null]]), q = [M.start];
      while (q.length) {
        const [r, c] = q.shift();
        if (ex.has(r + "," + c)) { const out = []; for (let k = r + "," + c; prev.get(k); k = prev.get(k)[0]) out.unshift(prev.get(k)[1]); return out; }
        for (const [d, [dr, dc]] of Object.entries(D)) { const nr = r + dr, nc = c + dc, k = nr + "," + nc; if (nr < 0 || nc < 0 || nr >= M.ROWS || nc >= M.COLS || M.blocks.has(k) || prev.has(k)) continue; prev.set(k, [r + "," + c, d]); q.push([nr, nc]); }
      }
    });
    for (const d of plan) await p.click(`[data-d="${d}"]`);
    await p.click("#goBtn");
    await p.waitForFunction(() => /Udało się/.test(document.getElementById("txt").textContent), null, { timeout: 30000 });
    await p.click("#quitBtn"); await p.click("#quitBtn"); await go(p);
    await p.waitForTimeout(4500); // longer than the old room's pending wait
    assert.equal(await label(p), "Leśna ścieżka");
    assert.equal(await p.$eval(".trail span.now", (e) => [...e.parentNode.querySelectorAll("span")].indexOf(e)), 0);
    const trips = (await readDB(p)).profiles.p1.stats.trips;
    assert.equal(trips.length, 1, "the abandoned trip was not recorded"); assert.equal(trips[0].done, false);
    assert.deepEqual(o.errs, []);
  } finally { await o.close(); }
});

test("the same seed gives the same expedition (so failures can be replayed)", { timeout: 60000 }, async () => {
  const run = async (seed) => {
    const o = await open({ seed });
    try {
      await startWith(o.p, srv.url, oneProfile({ level: 2 }));
      await go(o.p); await o.p.waitForSelector("#goBtn");
      return await o.p.evaluate(() => { const M = window.__LW_TEST.M; return JSON.stringify({ start: M.start, exits: M.exits, blocks: [...M.blocks], coins: [...M.coins] }); });
    } finally { await o.close(); }
  };
  const a = await run(12345), b = await run(12345), c = await run(54321);
  assert.equal(a, b, "the same seed gave a different map");
  assert.notEqual(a, c, "a different seed gave the same map: the seed is ignored");
});

test("phone width: camp and path room fit without sideways scrolling", { timeout: 60000 }, async () => {
  const o = await open({ viewport: { width: 360, height: 780 } }); const p = o.p;
  try {
    await startWith(p, srv.url, oneProfile({ level: 3 }));
    const wide = () => p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(await wide(), false, "camp is wider than the phone");
    await go(p); await p.waitForSelector("#goBtn");
    for (let i = 0; i < 8; i++) await p.click('[data-d="up"]');
    assert.equal(await wide(), false, "path room is wider than the phone");
    assert.deepEqual(o.errs, []);
  } finally { await o.close(); }
});

test("level setting is per player and survives a reload", { timeout: 60000 }, async () => {
  const o = await open(); const p = o.p;
  try {
    await startWith(p, srv.url, oneProfile());
    await setLevel(p, 2); await p.reload(); await p.waitForSelector("h1");
    assert.equal((await readDB(p)).profiles.p1.level, 2);
  } finally { await o.close(); }
});
