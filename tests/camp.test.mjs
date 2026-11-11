// Camp: building with the subtraction question, decorations, garden harvest, shop, effects on expeditions.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { serve, open, startWith, oneProfile, text, readDB } from "./helpers.mjs";

let srv; before(async () => { srv = await serve(); }); after(() => srv.close());

async function buy(p, k, right) {
  await p.click(`.item.build[data-k="${k}"]`); await p.waitForSelector("#ask:not([hidden])");
  const [have, price] = (await text(p, "#ask .sum")).match(/\d+/g).map(Number);
  const opts = await p.$$eval("#ask [data-v]", (b) => b.map((x) => +x.dataset.v));
  assert.ok(opts.includes(have - price), "the right answer is not among the options");
  await p.click(`#ask [data-v="${right ? have - price : opts.find((v) => v !== have - price)}"]`);
  await p.waitForSelector("#ask", { state: "hidden" });
  return { have, price, coins: +(await text(p, "#coinN")) };
}
// taps a camp tile; the canvas has a 4px border and 8 × 5 tiles
async function tap(p, c, r) {
  const b = await p.$eval("#sc canvas", (e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  await p.mouse.click(b.x + 4 + (c + 0.5) * (b.w - 8) / 8, b.y + 4 + (r + 0.5) * (b.h - 8) / 5);
}

test("building: right answer gives 1 coin off, a wrong one still buys; effects reach the expedition", { timeout: 90000 }, async () => {
  const o = await open({ viewport: { width: 700, height: 1200 } }); const p = o.p;
  try {
    await startWith(p, srv.url, oneProfile({ coins: 300 }));
    await p.click("#buildBtn");
    assert.deepEqual(await p.$$eval(".item.build", (b) => b.map((x) => x.dataset.k)), ["house", "well", "garden", "library", "pen"]);
    let r = await buy(p, "house", true); assert.equal(r.coins, r.have - r.price + 1);
    r = await buy(p, "house", false); assert.equal(r.coins, r.have - r.price);
    for (const k of ["well", "well", "garden", "garden", "library", "pen"]) await buy(p, k, true);
    const c = (await readDB(p)).profiles.p1.camp;
    assert.deepEqual(c.b, { house: 2, well: 2, garden: 2, library: 1, pen: 1 });
    assert.equal(c.beds.length, 2);

    await p.evaluate(() => { const db = JSON.parse(localStorage.getItem("lesna-wyprawa-v2")); db.profiles.p1.coins = 2; localStorage.setItem("lesna-wyprawa-v2", JSON.stringify(db)); });
    await p.reload(); await p.click("#buildBtn"); await p.click('.item.build[data-k="library"]');
    assert.equal(await p.$eval("#ask", (e) => e.hidden), true, "a purchase without enough coins was offered");
    assert.match(await text(p, "#txt"), /Brakuje/);

    await p.click("#backBtn"); await p.click("#tripBtn"); await p.waitForSelector(".hearts");
    assert.equal(await p.$$eval(".hearts img", (x) => x.length), 5, "well level 2 should give 3 + 2 hearts");
    assert.deepEqual(o.errs, []);
  } finally { await o.close(); }
});

test("decorations: placed on free tiles only, picked back up into the bag", { timeout: 60000 }, async () => {
  const o = await open(); const p = o.p;
  try {
    await startWith(p, srv.url, oneProfile({ coins: 0, camp: { inv: { lantern: 1, flowers: 1 } } }));
    await p.click("#editBtn"); await p.click('.decor-chip[data-k="lantern"]');
    await tap(p, 2, 1);
    await p.click('.decor-chip[data-k="flowers"]'); await tap(p, 3, 3); // campfire: refused
    let c = (await readDB(p)).profiles.p1.camp;
    assert.deepEqual(c.decor, [{ k: "lantern", c: 2, r: 1 }]); assert.equal(c.inv.flowers, 1);
    await tap(p, 5, 2);
    await tap(p, 2, 1); // pick the lantern up again
    c = (await readDB(p)).profiles.p1.camp;
    assert.deepEqual(c.decor, [{ k: "flowers", c: 5, r: 2 }]); assert.equal(c.inv.lantern, 1);
    assert.deepEqual(o.errs, []);
  } finally { await o.close(); }
});

test("garden: a ripe bed pays 3 coins and is planted again", { timeout: 60000 }, async () => {
  const o = await open(); const p = o.p;
  try {
    await startWith(p, srv.url, oneProfile({ coins: 5, camp: { b: { garden: 2 }, beds: [{ p: "carrot", s: 3 }, { p: "pumpkin", s: 1 }] } }));
    await tap(p, 5, 4);
    assert.equal(await text(p, "#coinN"), "8");
    await tap(p, 6, 4);
    assert.match(await text(p, "#txt"), /jeszcze rośnie/);
    const c = (await readDB(p)).profiles.p1.camp;
    assert.equal(c.beds[0].s, 0); assert.equal(c.beds[1].s, 1); assert.equal((await readDB(p)).profiles.p1.coins, 8);
    assert.deepEqual(o.errs, []);
  } finally { await o.close(); }
});

test("shop: buy a hat, unlock and take a pet", { timeout: 60000 }, async () => {
  const o = await open(); const p = o.p;
  try {
    await startWith(p, srv.url, oneProfile({ coins: 200 }));
    await p.click("#shopBtn"); await p.click('.item[data-k="flower"]');
    await p.click("#tabPets"); await p.click('.item[data-k="owl"]');
    const pr = (await readDB(p)).profiles.p1;
    assert.ok(pr.owned.includes("flower")); assert.equal(pr.hero.hat, "flower");
    assert.ok(pr.pets.includes("owl")); assert.equal(pr.hero.pet, "owl"); assert.ok(pr.coins < 200);
    assert.deepEqual(o.errs, []);
  } finally { await o.close(); }
});
