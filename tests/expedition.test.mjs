// Whole expeditions on every level, the level-3 try limit, and leaving a trip halfway.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { serve, open, startWith, oneProfile, playRoom, setLevel, text, readDB, label } from "./helpers.mjs";

let srv; before(async () => { srv = await serve(); }); after(() => srv.close());

for (const level of [1, 2, 3]) {
  test(`level ${level}: a full expedition, all coins collectable within the limit`, { timeout: 240000 }, async () => {
    const o = await open();
    try {
      await startWith(o.p, srv.url, oneProfile({ level, coins: 10 }));
      await o.p.click("#tripBtn");
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
      const db = await readDB(o.p);
      assert.equal(db.profiles.p1.trips, 1);
      assert.ok(db.profiles.p1.coins > 10, "coins were not added to the save");
      assert.deepEqual(o.errs, []);
    } finally { await o.close(); }
  });
}

test("level 3: three failed tries cost a heart, then the companion leads the way without coins", { timeout: 120000 }, async () => {
  const o = await open(); const p = o.p;
  try {
    await startWith(p, srv.url, oneProfile({ level: 3 }));
    await p.click("#tripBtn"); await p.waitForSelector("#goBtn");
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
    await p.click("#tripBtn"); await p.waitForSelector("#goBtn");
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
    await p.click("#quitBtn"); await p.click("#quitBtn"); await p.click("#tripBtn");
    await p.waitForTimeout(4500); // longer than the old room's pending wait
    assert.equal(await label(p), "Leśna ścieżka");
    assert.equal(await p.$eval(".trail span.now", (e) => [...e.parentNode.querySelectorAll("span")].indexOf(e)), 0);
    assert.deepEqual(o.errs, []);
  } finally { await o.close(); }
});

test("phone width: camp and path room fit without sideways scrolling", { timeout: 60000 }, async () => {
  const o = await open({ viewport: { width: 360, height: 780 } }); const p = o.p;
  try {
    await startWith(p, srv.url, oneProfile({ level: 3 }));
    const wide = () => p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(await wide(), false, "camp is wider than the phone");
    await p.click("#tripBtn"); await p.waitForSelector("#goBtn");
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
