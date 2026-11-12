// Shared helpers for the browser tests: a tiny static server for dist/, a browser page
// that records errors, and ready-made saves and actions used by several test files.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
export const { chromium } = require("playwright");

export const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
export const PIN = "66647";
export const PIN_HASH = "9f09a3853e2cc699d01ed23d54c0ba2aa4c9ad5502a604c38d35dd271d986975";
// One seed per test file run. Every page starts the game's random generator from it, so a
// failing expedition replays exactly with: SEED=<number> npm test   (or node --test <file>)
export const SEED = process.env.SEED ? Number(process.env.SEED) : Math.floor(Math.random() * 1e9);
console.log(`SEED=${SEED}  (powtórka: SEED=${SEED} node --test ${process.argv[1] ? process.argv[1].replace(/.*\/tests\//, "tests/") : "tests/"})`);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".png": "image/png", ".webmanifest": "application/manifest+json" };

// Serves dist/ on a free port. "localhost" counts as a secure origin, so the service worker runs.
export async function serve() {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    const f = path.join(DIST, p);
    if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream", "cache-control": "no-store" });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return { url: `http://localhost:${server.address().port}/`, close: () => new Promise((r) => server.close(r)) };
}

// Opens a browser page; `errs` collects every uncaught page error (each test asserts it stays empty).
export async function open({ viewport = { width: 700, height: 1100 }, hooks = true, seed = SEED } = {}) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport });
  const errs = [];
  const page = async () => {
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errs.push(e.message));
    if (hooks) await p.addInitScript((s) => { window.__LW_TEST = { seed: s }; }, seed);
    return p;
  };
  return { browser, ctx, errs, page, p: await page(), close: () => browser.close() };
}

export const text = (p, sel) => p.$eval(sel, (e) => e.textContent).catch(() => null);
export const readDB = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("lesna-wyprawa-v2")));
export const label = (p) => p.$eval("#sc canvas", (e) => e.getAttribute("aria-label")).catch(() => null);

// A version-2 save with one player; `over` is merged into the profile.
export function oneProfile(over = {}) {
  const prof = Object.assign({
    id: "p1",
    hero: { gender: "girl", name: "Ola", hair: "tails", hairColor: "#8a5a2b", skin: "#f5d0b5", outfit: "#e2445c", pet: "cat", hat: "none" },
    coins: 0, pets: ["cat", "dog"], level: 1
  }, over);
  return { v: 2, settings: { pinHash: PIN_HASH }, order: ["p1"], active: "p1", profiles: { p1: prof } };
}

// Loads the game with the given save already in place.
export async function startWith(p, url, db) {
  await p.goto(url);
  await p.evaluate((d) => { localStorage.clear(); if (d) localStorage.setItem("lesna-wyprawa-v2", JSON.stringify(d)); }, db);
  await p.reload();
  await p.waitForSelector("h1");
}

export async function openPanel(p, pin = PIN) {
  await p.click("#parentBtn"); await p.fill("#pin", pin); await p.click("#pinForm button[type=submit]");
  await p.waitForTimeout(250);
  return !(await p.$eval("#panel", (e) => e.hidden));
}

export async function setLevel(p, n) {
  await openPanel(p); await p.click(`#lvCh [data-v="${n}"]`); await p.click("#lockBtn");
}

// Fewest blocks that collect every coin and reach an exit (same rules as the game).
// Returns [[direction, steps]], where steps 99 is the "until blocked" block.
export function planPath(p) {
  return p.evaluate(() => {
    const M = window.__LW_TEST.M, loops = !!document.querySelector("[data-n]"), slide = !!document.querySelector('[data-n="99"]');
    const D = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }, maxRun = loops ? 4 : 1;
    const coins = [...M.coins], idx = new Map(coins.map((k, i) => [k, i])), FULL = (1 << coins.length) - 1, exits = new Set(M.exits.map((e) => e.cell + ""));
    const free = (r, c) => r >= 0 && r < M.ROWS && c >= 0 && c < M.COLS && !M.blocks.has(r + "," + c);
    const key = (r, c, m) => r + "," + c + "," + m, prev = new Map([[key(M.start[0], M.start[1], 0), null]]);
    let q = [[M.start[0], M.start[1], 0]], goal = null;
    while (q.length && !goal) {
      const nq = [];
      for (const [r0, c0, m0] of q) for (const d in D) {
        const moves = []; let r = r0, c = c0, m = m0;
        for (let k = 1; k <= maxRun; k++) { r += D[d][0]; c += D[d][1]; if (!free(r, c)) break; if (idx.has(r + "," + c)) m |= 1 << idx.get(r + "," + c); moves.push([r, c, m, k]); if (exits.has(r + "," + c)) break; }
        if (slide) { let r2 = r0, c2 = c0, m2 = m0, mv = 0; while (free(r2 + D[d][0], c2 + D[d][1])) { r2 += D[d][0]; c2 += D[d][1]; mv++; if (idx.has(r2 + "," + c2)) m2 |= 1 << idx.get(r2 + "," + c2); if (exits.has(r2 + "," + c2)) break; } if (mv) moves.push([r2, c2, m2, 99]); }
        for (const [r, c, m, k] of moves) {
          const kk = key(r, c, m); if (prev.has(kk)) continue;
          if (exits.has(r + "," + c)) { if (m !== FULL) continue; prev.set(kk, [key(r0, c0, m0), d, k]); goal = kk; break; }
          prev.set(kk, [key(r0, c0, m0), d, k]); nq.push([r, c, m]);
        }
        if (goal) break;
      }
      q = nq;
    }
    const out = []; for (let cur = goal; cur && prev.get(cur); cur = prev.get(cur)[0]) { const [, d, k] = prev.get(cur); out.unshift([d, k]); }
    return { out, coins: coins.length, loops, found: !!goal };
  });
}

// Pays in the open payment window: exact money when the wallet allows it, otherwise the smallest
// overpayment, then answers the change question (wrongly when asked to). Returns what happened.
export async function payWith(p, { wrongChange = false, overpay = false } = {}) {
  await p.waitForSelector(".payov #payGo");
  const { price, wallet } = await p.evaluate(() => window.__LW_TEST.pay);
  // subset sums over the wallet's pieces: pick an exact one, else the smallest sum above the price
  let best = null;
  const n = wallet.length, lim = Math.min(n, 14);
  for (let m = 1; m < 1 << lim; m++) {
    let s = 0; const pick = []; for (let i = 0; i < lim; i++) if (m & (1 << i)) { s += wallet[i]; pick.push(wallet[i]); }
    if (s < price) continue;
    if (overpay && s === price) continue;
    if (!best || s < best.s || (s === best.s && pick.length < best.pick.length)) best = { s, pick };
  }
  for (const v of best.pick) await p.click(`.payov [data-w="${v}"]`);
  await p.click("#payGo");
  if (best.s === price) { await p.waitForSelector(".payov", { state: "detached" }); return { price, given: best.s, change: 0 }; }
  await p.waitForSelector(".payov [data-v]");
  const ch = await p.evaluate(() => window.__LW_TEST.pay.change);
  const opts = await p.$$eval(".payov [data-v]", (b) => b.map((x) => +x.dataset.v));
  await p.click(`.payov [data-v="${wrongChange ? opts.find((v) => v !== ch) : ch}"]`);
  await p.waitForSelector(".payov", { state: "detached" });
  return { price, given: best.s, change: ch };
}

// From camp through the world map into a land.
export async function go(p, land = "forest", guess) {
  await p.click("#tripBtn"); await p.click(`[data-land="${land}"]`);
  await passGuess(p, guess);
}
// The "how long will the trip take?" question that comes before some trips: answers it (first option by default).
export async function passGuess(p, guess) {
  await p.waitForSelector("#sc canvas");
  if ((await label(p)) !== "Przed wyprawą") return false;
  await p.click(guess ? `[data-g="${guess}"]` : "[data-g]");
  await p.waitForFunction(() => document.querySelector("#sc canvas")?.getAttribute("aria-label") !== "Przed wyprawą");
  return true;
}
export const PATH_LABELS = ["Leśna ścieżka", "Górski szlak"];
const leaves = (p, kind) => p.waitForFunction((k) => document.querySelector("#sc canvas")?.getAttribute("aria-label") !== k, kind, { timeout: 20000 });

// Answers the multiple-choice and clock tasks of the logic and time rooms until the room is left.
async function quizRoom(p, kind) {
  const asked = [];
  for (let n = 0; n < 12 && (await label(p)) === kind; n++) {
    const ready = await p.waitForFunction((k) => {
      const q = window.__LW_TEST.q, lb = document.querySelector("#sc canvas")?.getAttribute("aria-label");
      return lb !== k ? "left" : q && !q.used && document.querySelector(q.steps ? q.steps[0] : q.kind === "set" ? "#clockOk" : q.kind === "feel" ? "#feelBtn" : "#ctl .opt") ? q.kind : false;
    }, kind, { timeout: 20000 }).then((h) => h.jsonValue());
    if (ready === "left") break;
    const q = await p.evaluate(() => { const q = window.__LW_TEST.q; q.used = true; return { kind: q.kind, ans: q.ans, h: q.h, m: q.m, cur: q.cur && q.cur(), steps: q.steps }; });
    asked.push(q.kind);
    if (q.steps) {
      for (const sel of q.steps) await p.click(sel);
    } else if (q.kind === "set") {
      for (let i = 0; i < 12 && (await p.evaluate(() => window.__LW_TEST.q.cur().h)) !== q.h; i++) await p.click("#hFwd");
      if ((await p.evaluate(() => window.__LW_TEST.q.cur().m)) !== q.m) await p.click("#mFlip");
      await p.click("#clockOk");
    } else if (q.kind === "feel") {
      await p.click("#feelBtn"); await p.waitForTimeout(150); await p.click("#feelBtn");
    } else {
      const opts = await p.$$eval("#ctl .opt", (b) => b.map((x) => x.dataset.a));
      if (!opts.includes(q.ans)) return { kind, ok: false, why: `answer ${q.ans} not offered: ${opts}` };
      await p.click(`#ctl .opt[data-a="${q.ans}"]`);
    }
  }
  await leaves(p, kind);
  return { kind: { "Wieża zegarowa": "clock", "Kamień czasu": "time", "Strażnik skrzyni": "logic" }[kind], ok: true, asked };
}

// Plays one room of whatever kind is on screen. Returns a short record for assertions.
const COUNTER = { fire: "water", water: "earth", earth: "fire" };
export async function playRoom(p) {
  const H = (k) => p.evaluate((k) => window.__LW_TEST[k], k);
  const kind = await label(p);
  if (["Wieża zegarowa", "Kamień czasu", "Strażnik skrzyni"].includes(kind)) return quizRoom(p, kind);
  if (PATH_LABELS.includes(kind)) {
    const plan = await planPath(p);
    const before = +(await text(p, "#grN"));
    for (const [d, n] of plan.out) {
      if (plan.loops) { await p.click(`[data-d="${d}"]`); if (n > 1) await p.click(`[data-n="${n}"]`); }
      else for (let i = 0; i < n; i++) await p.click(`[data-d="${d}"]`);
    }
    const limit = await text(p, "#limit");
    await p.click("#goBtn");
    await p.waitForFunction(() => /Udało się|Popraw|Został/.test(document.getElementById("txt").textContent), null, { timeout: 30000 });
    const msg = await text(p, "#txt");
    const after = +(await text(p, "#grN"));
    await leaves(p, kind);
    return { kind: "path", ok: /Udało się/.test(msg), found: plan.found, coins: (after - before) / 5, expected: plan.coins, blocks: plan.out.length, limit };
  }
  if (kind === "Potwór na polanie") {
    for (let turn = 0; turn < 30 && (await label(p)) === "Potwór na polanie"; turn++) {
      await p.waitForSelector(".card, .btn.num, #explainOk:not([disabled])", { timeout: 10000 }).catch(() => {});
      if (await p.$("#explainOk:not([disabled])")) { await p.click("#explainOk"); continue; }
      if ((await label(p)) !== "Potwór na polanie") break;
      if (await p.$(".card")) {
        const T = await H("T"), el = await H("el"), vals = await p.$$eval(".card", (cs) => cs.map((c) => +c.textContent));
        let pick = 0; for (let m = 1; m < 1 << vals.length && !pick; m++) { let s = 0; vals.forEach((v, i) => { if (m & (1 << i)) s += v; }); if (s === T) pick = m; }
        if (!pick) return { kind: "monster", ok: false, why: `no cards make ${T}: ${vals}` };
        if (vals.includes(T)) return { kind: "monster", ok: false, why: `hand holds the answer ${T}` };
        await p.click(`.spell[data-s="${COUNTER[el]}"]`);
        for (let i = 0; i < vals.length; i++) if (pick & (1 << i)) await p.click(`.card[data-i="${i}"]`);
        await p.click("#cast"); await p.waitForTimeout(2600);
      } else if (await p.$(".btn.num")) {
        const q = (await text(p, ".sum")).replace(/−/g, "-").replace("= ?", "").trim();
        let ans; if (q.includes("?")) { const [l, r] = q.split("="); ans = +r - +l.split("+")[0]; } else ans = Function("return " + q)();
        await p.click(`.btn.num[data-v="${ans}"]`); await p.waitForTimeout(1800);
      }
    }
    await p.waitForFunction(() => document.querySelector("#sc canvas")?.getAttribute("aria-label") !== "Potwór na polanie", null, { timeout: 15000 });
    return { kind: "monster", ok: true };
  }
  if (kind === "Zaczarowane drzwi" || kind === "Skrzynia ze skarbem") {
    const word = await H(kind === "Zaczarowane drzwi" ? "word" : "pw");
    for (const ch of word) {
      const tiles = await p.$$(".tile:not(.used)");
      for (const t of tiles) if ((await t.textContent()) === ch) { await t.click(); break; }
    }
    if (kind === "Skrzynia ze skarbem") { await p.waitForSelector("#campBtn"); return { kind: "chest", ok: true }; }
    await p.waitForFunction(() => document.querySelector("#sc canvas")?.getAttribute("aria-label") !== "Zaczarowane drzwi", null, { timeout: 15000 });
    return { kind: "door", ok: true };
  }
  if (kind === "Rozdroże z drogowskazami") {
    await p.click(`[data-w="${await H("target")}"]`);
    await p.waitForFunction(() => document.querySelector("#sc canvas")?.getAttribute("aria-label") !== "Rozdroże z drogowskazami", null, { timeout: 15000 });
    return { kind: "sign", ok: true };
  }
  return { kind: String(kind), ok: false, why: "unknown room" };
}
