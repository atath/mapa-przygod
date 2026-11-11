// The save: migration from the first version, players, PIN, backup copy, undo, broken files, two tabs.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { serve, open, startWith, oneProfile, openPanel, text, readDB, PIN, PIN_HASH } from "./helpers.mjs";

let srv; before(async () => { srv = await serve(); }); after(() => srv.close());

const V1 = { hero: { gender: "girl", name: "Ola", hair: "tails", hairColor: "#8a5a2b", skin: "#f5d0b5", outfit: "#e2445c", pet: "owl", hat: "crown" },
  coins: 47, owned: ["none", "crown", "flower"], pets: ["cat", "dog", "owl"], petNames: { owl: "Pipa" }, level: 2, trips: 9, fights: 7, voice: true, sound: true };

test("a version-1 save moves over with everything, PIN 66647 included, and the old key stays as a backup", { timeout: 60000 }, async () => {
  const o = await open(); const p = o.p;
  try {
    await p.goto(srv.url);
    await p.evaluate((v1) => { localStorage.clear(); localStorage.setItem("lesna-wyprawa", JSON.stringify(v1)); }, V1);
    await p.reload(); await p.waitForSelector("h1");
    assert.equal(await text(p, "h1"), "Obóz");
    assert.equal(await text(p, "#coinN"), "47");
    assert.ok(await openPanel(p, PIN), "PIN 66647 does not open the panel");
    const db = await readDB(p), pr = db.profiles[db.order[0]];
    assert.deepEqual([pr.hero.name, pr.coins, pr.owned, pr.pets, pr.petNames, pr.level, pr.trips], ["Ola", 47, ["none", "crown", "flower"], ["cat", "dog", "owl"], { owl: "Pipa" }, 2, 9]);
    assert.ok(await p.evaluate(() => localStorage.getItem("lesna-wyprawa")), "the version-1 key was removed");
    assert.deepEqual(pr.lands, ["forest", "mountains"], "a player from before the lands gets the mountains at once");
    assert.deepEqual(o.errs, []);
  } finally { await o.close(); }
});

test("fresh install asks for a PIN first, then the character", { timeout: 60000 }, async () => {
  const o = await open(); const p = o.p;
  try {
    await startWith(p, srv.url, null);
    assert.ok(await p.$("#pin1"));
    await p.fill("#pin1", "12"); await p.fill("#pin2", "12"); await p.click("#pinSet button[type=submit]");
    assert.match(await text(p, "#pinSetMsg"), /od 4 do 8/);
    await p.fill("#pin1", "4321"); await p.fill("#pin2", "4322"); await p.click("#pinSet button[type=submit]");
    assert.match(await text(p, "#pinSetMsg"), /różnią/);
    await p.fill("#pin2", "4321"); await p.click("#pinSet button[type=submit]"); await p.waitForSelector("#nameIn");
    await p.click("#goBtn"); assert.ok(await p.$("#nameIn"), "a hero without a name was accepted");
    await p.click('#genCh [data-v="boy"]');
    assert.deepEqual(await p.$$eval("#hairCh button", (b) => b.map((x) => x.dataset.v)).then((v) => v.every((k) => ["bshort", "spiky", "side", "curly"].includes(k))), true);
    await p.fill("#nameIn", "Staś"); await p.click("#goBtn"); await p.waitForSelector("#tripBtn");
    assert.equal(await text(p, "h1"), "Obóz");
    assert.ok(await openPanel(p, "4321"));
    const fresh = await readDB(p); assert.deepEqual(fresh.profiles[fresh.active].lands, ["forest"], "a new player starts with the forest only");
    assert.deepEqual(o.errs, []);
  } finally { await o.close(); }
});

test("players: add, pick, delete with undo; change PIN", { timeout: 90000 }, async () => {
  const o = await open(); const p = o.p;
  try {
    await startWith(p, srv.url, oneProfile({ coins: 30 }));
    await p.click("#playersBtn"); await p.click("#addPlayer"); await p.waitForSelector("#cancelBtn");
    await p.fill("#nameIn", "Staś"); await p.click("#goBtn"); await p.waitForSelector("#tripBtn");
    assert.equal(await text(p, "#coinN"), "0", "a new player must start with 0 coins");
    await p.reload(); await p.waitForSelector(".player[data-id]");
    assert.equal((await p.$$(".player[data-id]")).length, 2);
    await p.click('.player[data-id="p1"]'); await p.waitForSelector("#tripBtn");
    assert.equal(await text(p, "#coinN"), "30");

    await openPanel(p); await p.click("#deleteBtn"); await p.click("#deleteBtn"); await p.waitForSelector("#tripBtn");
    assert.equal(Object.keys((await readDB(p)).profiles).length, 1);
    await openPanel(p); assert.ok(await p.$("#undoBtn"), "no undo after deleting a player");
    await p.click("#undoBtn"); await p.click("#undoBtn"); await p.waitForSelector(".player[data-id]");
    assert.equal(Object.keys((await readDB(p)).profiles).length, 2, "undo did not bring the player back");

    await p.click('.player[data-id="p1"]'); await p.waitForSelector("#tripBtn");
    await openPanel(p); await p.click("#pinChangeBtn");
    await p.fill("#newPin1", "1234"); await p.fill("#newPin2", "1235"); await p.click("#pinChange button[type=submit]");
    assert.match(await text(p, "#panelMsg"), /różnią/);
    await p.fill("#newPin2", "1234"); await p.click("#pinChange button[type=submit]"); await p.waitForTimeout(200);
    await p.click("#lockBtn");
    assert.equal(await openPanel(p, PIN), false, "the old PIN still works");
    await p.reload(); await p.click('.player[data-id="p1"]'); await p.waitForSelector("#tripBtn"); // two players: "who's playing?" first
    assert.equal(await openPanel(p, "1234"), true);
    assert.deepEqual(o.errs, []);
  } finally { await o.close(); }
});

test("backup copy: no PIN inside, import keeps this device's PIN, bad input is refused, undo restores", { timeout: 60000 }, async () => {
  const o = await open(); const p = o.p;
  try {
    await startWith(p, srv.url, oneProfile({ coins: 100 }));
    await openPanel(p); await p.click("#exportBtn");
    const exp = JSON.parse(await p.$eval("#exportTxt", (e) => e.value));
    assert.equal(exp.app, "mapa-przygod"); assert.equal(exp.data.settings.pinHash, null);

    await p.click("#importBtn"); await p.fill("#importTxt", "nonsense"); await p.click("#loadBtn"); await p.click("#loadBtn");
    assert.match(await text(p, "#panelMsg"), /nie wygląda/);

    const foreign = structuredClone(exp); foreign.data.settings.pinHash = "deadbeef"; foreign.data.profiles.p1.coins = 3; foreign.data.profiles.p1.hero.name = "Obcy";
    await p.fill("#importTxt", JSON.stringify(foreign)); await p.click("#loadBtn"); await p.click("#loadBtn"); await p.waitForTimeout(1300);
    let db = await readDB(p);
    assert.equal(db.profiles.p1.hero.name, "Obcy"); assert.equal(db.settings.pinHash, PIN_HASH);

    assert.ok(await openPanel(p)); await p.click("#undoBtn"); await p.click("#undoBtn"); await p.waitForTimeout(1300);
    db = await readDB(p);
    assert.deepEqual([db.profiles.p1.hero.name, db.profiles.p1.coins], ["Ola", 100]);

    // an old-style export (name "lesna-wyprawa", PIN hash inside) still loads
    const old = { app: "lesna-wyprawa", v: 2, data: Object.assign(structuredClone(exp.data), { settings: { pinHash: "deadbeef" } }) };
    await openPanel(p); await p.click("#importBtn"); await p.fill("#importTxt", JSON.stringify(old)); await p.click("#loadBtn"); await p.click("#loadBtn"); await p.waitForTimeout(1300);
    assert.equal((await readDB(p)).settings.pinHash, PIN_HASH);
    assert.deepEqual(o.errs, []);
  } finally { await o.close(); }
});

test("a broken or hostile save is repaired instead of breaking the game", { timeout: 60000 }, async () => {
  const o = await open(); const p = o.p;
  try {
    const bad = oneProfile({
      hero: { gender: "alien", name: '<img src=x onerror="window.__pwn=1">', hair: "mohawk", hairColor: "red;}", skin: "#f5d0b5", outfit: "#e2445c", pet: "unicornzilla", hat: "laser" },
      coins: -50, owned: ["laser", "crown"], pets: ["unicornzilla"], petNames: { cat: "<b>Kot</b>" }, level: 9,
      stats: { answers: [{ k: "math.sub", ok: true, ms: 900, t: 1, d: "<b>x</b>".repeat(20) }, { k: "evil", ok: 1, t: 2 }, "junk"], trips: [{ t: 1, ms: -5, done: 1 }], days: { "2026-11-10": 300, "bad": 9 } },
      camp: { b: { house: 7 }, decor: [{ k: "flag", c: 99, r: 99 }, { k: "flag", c: 2, r: 2 }, { k: "flag", c: 2, r: 2 }], beds: [{ p: "carrot", s: 9 }] }
    });
    await startWith(p, srv.url, bad);
    assert.equal(await text(p, "h1"), "Obóz");
    assert.equal(await p.evaluate(() => !!window.__pwn), false, "HTML in the name ran");
    const pr = (await readDB(p)).profiles.p1;
    assert.doesNotMatch(pr.hero.name, /[<>"]/); assert.ok(pr.hero.name.length <= 14);
    assert.equal(pr.hero.gender, "girl"); assert.equal(pr.hero.hair, "tails"); assert.equal(pr.hero.hairColor, "#3b2a20");
    assert.equal(pr.hero.pet, "cat"); assert.deepEqual(pr.pets, ["cat"]); assert.equal(pr.hero.hat, "none"); assert.deepEqual(pr.owned, ["none", "crown"]);
    assert.equal(pr.coins, 0); assert.equal(pr.level, 1); assert.equal(pr.camp.b.house, 3);
    assert.deepEqual(pr.camp.decor, [{ k: "flag", c: 2, r: 2 }]);
    assert.equal(pr.stats.answers.length, 1); assert.equal(pr.stats.answers[0].d.length, 40);
    assert.deepEqual(pr.stats.trips, [{ t: 1, ms: 0, done: true, lv: 0 }]); assert.equal(pr.stats.days.bad, undefined); assert.equal(pr.camp.beds.length, 0);
    await p.click("#shopBtn"); await p.click("#tabPets"); // screens that draw the pet and the hat still work
    assert.deepEqual(o.errs, []);
  } finally { await o.close(); }
});

test("two open copies: the older one stops saving and offers to reload", { timeout: 60000 }, async () => {
  const o = await open();
  try {
    const a = o.p; await startWith(a, srv.url, oneProfile());
    const b = await o.page(); await b.goto(srv.url); await b.waitForSelector("h1");
    assert.equal(await a.$("#staleBox"), null, "merely opening a second copy must not alarm the first");
    await openPanel(b); await b.click('#lvCh [data-v="3"]'); await a.waitForSelector("#staleBox");
    await a.evaluate(() => document.getElementById("voiceBtn").click()); // would save in the old copy
    assert.equal((await readDB(b)).profiles.p1.level, 3, "the stale copy overwrote the newer save");
    await a.click("#staleBtn"); await a.waitForSelector("#tripBtn");
    assert.equal(await a.$("#staleBox"), null);
    assert.deepEqual(o.errs, []);
  } finally { await o.close(); }
});
