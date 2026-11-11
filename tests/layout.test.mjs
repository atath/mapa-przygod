// Every kind of room fits the screen: no scrolling, the scene keeps a usable size, the main button is visible.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { serve, open, startWith, oneProfile, go, playRoom, label } from "./helpers.mjs";

let srv; before(async () => { srv = await serve(); }); after(() => srv.close());

// smallest scene height we accept on each screen (the path board is the one that matters)
const SCREENS = [["small phone", 360, 640, 140], ["phone", 390, 844, 250], ["tablet upright", 768, 1024, 400], ["tablet lying", 1024, 768, 400]];
const ROOMS = ["monster", "clock", "time", "logic", "door", "sign", "path", null, "chest"];

for (const [name, w, h, minPath] of SCREENS) {
  test(`${name} ${w}×${h}: every room fits on one screen`, { timeout: 240000 }, async () => {
    const o = await open({ viewport: { width: w, height: h } }); const p = o.p;
    try {
      await p.addInitScript((r) => { window.__LW_TEST.rooms = r; }, ROOMS);
      await startWith(p, srv.url, oneProfile({ level: 3 }));
      await go(p, "mountains");
      const seen = [];
      for (let i = 0; i < 12; i++) {
        const k = await label(p); await p.waitForTimeout(500);
        const m = await p.evaluate(() => {
          const sc = document.querySelector("#sc canvas").getBoundingClientRect();
          const main = document.querySelector("#goBtn, #cast, #ctl .opt, #feelBtn, #clockOk, .tile");
          return { over: document.documentElement.scrollHeight - innerHeight, scene: Math.round(sc.height), sceneBottom: sc.bottom, btn: main ? main.getBoundingClientRect().bottom : 0, dlg: document.querySelector(".dialog").getBoundingClientRect().height, H: innerHeight };
        });
        seen.push(k);
        assert.ok(m.over <= 1, `${k}: the page scrolls by ${m.over}px`);
        assert.ok(m.btn <= m.H && m.sceneBottom <= m.H, `${k}: the scene or the main button is off screen`);
        assert.ok(m.dlg >= 50, `${k}: the dialog is squashed (${m.dlg}px)`);
        if (/ścieżka|szlak/.test(k)) assert.ok(m.scene >= minPath, `${k}: the board is only ${m.scene}px tall`);
        const r = await playRoom(p); assert.ok(r.ok, `${k}: ${r.why || ""}`);
        if (r.kind === "chest") break;
      }
      assert.equal(seen.length, 9, `visited: ${seen}`);
      assert.deepEqual(o.errs, []);
    } finally { await o.close(); }
  });
}
