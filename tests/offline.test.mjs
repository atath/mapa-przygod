// Offline play: the service worker serves the game without network, and the file opens straight from disk.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { serve, open, DIST, text } from "./helpers.mjs";

let srv; before(async () => { srv = await serve(); }); after(() => srv.close());

test("after one visit the game opens with no network", { timeout: 60000 }, async () => {
  const o = await open({ hooks: false }); const p = o.p;
  try {
    await p.goto(srv.url);
    await p.waitForFunction(async () => { const r = await navigator.serviceWorker.getRegistration(); return !!(r && r.active); }, null, { timeout: 15000 });
    await p.reload(); await p.waitForSelector("h1");
    await o.ctx.setOffline(true);
    await p.reload(); await p.waitForSelector("h1");
    assert.equal(await text(p, "h1"), "Mapa Przygód");
    assert.deepEqual(o.errs, []);
  } finally { await o.close(); }
});

test("dist/index.html works opened as a file, with fonts built in", { timeout: 60000 }, async () => {
  const o = await open({ hooks: false }); const p = o.p;
  try {
    await p.goto(pathToFileURL(DIST + "index.html").href); await p.waitForSelector("#pin1");
    await p.fill("#pin1", "4321"); await p.fill("#pin2", "4321"); await p.click("#pinSet button[type=submit]");
    await p.waitForSelector("#nameIn"); await p.fill("#nameIn", "Ola"); await p.click("#goBtn"); await p.waitForSelector("#tripBtn");
    assert.equal(await text(p, "h1"), "Obóz");
    assert.ok(await p.evaluate(() => document.fonts.check('700 20px "Pixelify Sans"') && document.fonts.check("900 20px Nunito")), "fonts are missing");
    assert.deepEqual(o.errs, []);
  } finally { await o.close(); }
});

test("no requests leave the page: everything is inside the one file", { timeout: 60000 }, async () => {
  const o = await open({ hooks: false }); const p = o.p;
  try {
    const outside = [];
    p.on("request", (r) => { const u = r.url(); if (!u.startsWith(srv.url) && !u.startsWith("data:") && !u.startsWith("blob:")) outside.push(u); });
    await p.goto(srv.url); await p.waitForSelector("h1"); await p.waitForTimeout(500);
    assert.deepEqual(outside, []);
  } finally { await o.close(); }
});
