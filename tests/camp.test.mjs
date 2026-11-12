// Camp: building with the subtraction question, decorations, garden harvest, shop, effects on expeditions.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { serve, open, startWith, oneProfile, text, readDB, go, payWith } from "./helpers.mjs";

let srv; before(async () => { srv = await serve(); }); after(() => srv.close());

async function buy(p, k, opts) {
  const before = +(await text(p, "#coinN"));
  await p.click(`.item.build[data-k="${k}"]`);
  const r = await payWith(p, opts);
  return { ...r, before, coins: +(await text(p, "#coinN")) };
}
// taps a camp tile; the canvas has a 4px border and 8 × 5 tiles
async function tap(p, c, r) {
  const b = await p.$eval("#sc canvas", (e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  await p.mouse.click(b.x + 4 + (c + 0.5) * (b.w - 8) / 8, b.y + 4 + (r + 0.5) * (b.h - 8) / 5);
}

test("building: pay with coins and notes; exact money or the change question (right answer: 1 zł off)", { timeout: 120000 }, async () => {
  const o = await open({ viewport: { width: 700, height: 1200 } }); const p = o.p;
  try {
    await startWith(p, srv.url, oneProfile({ coins: 300 }));
    await p.click("#buildBtn");
    assert.deepEqual(await p.$$eval(".item.build", (b) => b.map((x) => x.dataset.k)), ["house", "well", "garden", "library", "pen"]);
    // 300 zł = six 50 zł notes: the 20 zł tent upgrade needs change
    let r = await buy(p, "house");
    assert.deepEqual([r.price, r.given, r.change], [20, 50, 30]); assert.equal(r.coins, 300 - 20 + 1, "a right change answer gives 1 zł off");
    r = await buy(p, "house", { wrongChange: true, overpay: true });
    assert.ok(r.change > 0, "this one should need change"); assert.equal(r.coins, r.before - r.price, "a wrong answer still buys, without the discount");
    for (const k of ["well", "well", "garden", "garden", "library", "pen"]) await buy(p, k);
    const c = (await readDB(p)).profiles.p1.camp;
    assert.deepEqual(c.b, { house: 2, well: 2, garden: 2, library: 1, pen: 1 });
    assert.equal(c.beds.length, 2);
    const st = (await readDB(p)).profiles.p1.stats.answers;
    assert.equal(st.filter((a) => a.k === "money.pay").length, 8);
    assert.ok(st.some((a) => a.k === "money.change" && !a.ok), "the wrong change answer was recorded");

    // cancelling keeps the money
    const before = +(await text(p, "#coinN"));
    await p.click('.item.build[data-k="library"]'); await p.waitForSelector("#payCancel"); await p.click("#payCancel");
    assert.equal(+(await text(p, "#coinN")), before); assert.equal((await readDB(p)).profiles.p1.camp.b.library, 1);

    await p.evaluate(() => { const db = JSON.parse(localStorage.getItem("lesna-wyprawa-v2")); db.profiles.p1.coins = 2; localStorage.setItem("lesna-wyprawa-v2", JSON.stringify(db)); });
    await p.reload(); await p.click("#buildBtn"); await p.click('.item.build[data-k="library"]');
    assert.equal(await p.$(".payov"), null, "a purchase without enough money was offered");
    assert.match(await text(p, "#txt"), /Brakuje/);

    await p.click("#backBtn"); await go(p); await p.waitForSelector(".hearts");
    assert.equal(await p.$$eval(".hearts img", (x) => x.length), 5, "well level 2 should give 3 + 2 hearts");
    assert.deepEqual(o.errs, []);
  } finally { await o.close(); }
});

test("piggy bank: pick coins worth exactly 100 gr to get 1 zł; below 100 gr, how much is missing", { timeout: 60000 }, async () => {
  const o = await open(); const p = o.p;
  try {
    await startWith(p, srv.url, oneProfile({ coins: 4, gr: 165 }));
    assert.match(await text(p, "#piggyBtn"), /165 gr/);
    await p.click("#piggyBtn"); await p.waitForSelector("#swapBtn");
    const coins = await p.evaluate(() => window.__LW_TEST.piggy.coins);
    assert.equal(coins.reduce((a, b) => a + b, 0), 165);
    // find coins that make exactly 100
    let pick = null; for (let m = 1; m < 1 << coins.length && !pick; m++) { let s = 0; coins.forEach((v, i) => { if (m & (1 << i)) s += v; }); if (s === 100) pick = coins.filter((_, i) => m & (1 << i)); }
    assert.ok(pick, `no coins make 100 gr: ${coins}`);
    assert.ok(await p.$eval("#swapBtn", (b) => b.disabled));
    for (const v of pick) await p.click(`#pig [data-w="${v}"]`);
    await p.click("#swapBtn");
    assert.equal(await text(p, "#coinN"), "5"); assert.equal(await text(p, "#grN"), "65");
    // 65 gr left: the question about what is missing
    await p.waitForFunction(() => window.__LW_TEST.piggy && window.__LW_TEST.piggy.missing === 35, null, { timeout: 5000 });
    await p.click('#pig [data-v="35"]');
    const db = await readDB(p), st = db.profiles.p1.stats.answers.map((a) => a.k);
    assert.deepEqual([db.profiles.p1.coins, db.profiles.p1.gr], [5, 65]);
    assert.ok(st.includes("money.exchange") && st.includes("money.missing"));
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
    await p.click("#shopBtn"); await p.click('.item[data-k="flower"]'); await payWith(p);
    await p.click("#tabPets"); await p.click('.item[data-k="owl"]'); await payWith(p, { overpay: true });
    const pr = (await readDB(p)).profiles.p1;
    assert.ok(pr.owned.includes("flower")); assert.equal(pr.hero.hat, "flower");
    assert.ok(pr.pets.includes("owl")); assert.equal(pr.hero.pet, "owl"); assert.ok(pr.coins < 200);
    assert.deepEqual(o.errs, []);
  } finally { await o.close(); }
});
