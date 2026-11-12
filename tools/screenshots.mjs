// Takes the screenshots used in README.md: `npm run screenshots` (after `npm run build`).
// Every picture starts from a fixed seed and a showcase save, so they come out the same each time.
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium, serve, startWith, oneProfile, go } from "../tests/helpers.mjs";

const OUT = fileURLToPath(new URL("../docs/img/", import.meta.url));
fs.mkdirSync(OUT, { recursive: true });
const PHONE = { width: 390, height: 844 }, TABLET = { width: 1180, height: 820 };

const showcase = (over = {}) => oneProfile(Object.assign({
  coins: 64, gr: 85, level: 1, trips: 12, pets: ["cat", "dog", "fox", "bunny", "owl"], owned: ["none", "flower"],
  hero: { gender: "girl", name: "Ola", hair: "tails", hairColor: "#8a5a2b", skin: "#f5d0b5", outfit: "#e2445c", pet: "cat", hat: "flower" },
  camp: {
    b: { house: 3, well: 2, garden: 3, library: 2, pen: 2 }, inv: {},
    decor: [{ k: "flowers", c: 2, r: 1 }, { k: "lantern", c: 4, r: 2 }, { k: "flag", c: 7, r: 3 }, { k: "bench", c: 2, r: 3 }, { k: "mushroom", c: 6, r: 3 }],
    beds: [{ p: "carrot", s: 3 }, { p: "pumpkin", s: 2 }, { p: "strawberry", s: 3 }]
  }
}, over));

const srv = await serve();
const browser = await chromium.launch();
async function shot(name, { viewport = PHONE, rooms, seed = 7, save = showcase(), prepare, scale = 1.5 } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale }), p = await ctx.newPage(), errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.addInitScript(({ s, r }) => { window.__LW_TEST = { seed: s }; if (r) window.__LW_TEST.rooms = r; }, { s: seed, r: rooms || null });
  await startWith(p, srv.url, save);
  if (prepare) await prepare(p);
  await p.waitForTimeout(900);
  await p.screenshot({ path: OUT + name + ".png" });
  await ctx.close();
  if (errs.length) throw new Error(`${name}: ${errs.join("; ")}`);
  console.log("✓", name);
}

await shot("oboz");
await shot("mapa", { prepare: (p) => p.click("#tripBtn") });
await shot("sciezka", {
  prepare: async (p) => {
    await go(p, "forest");
    for (const d of ["down", "right", "right"]) await p.click(`[data-d="${d}"]`);
  }
});
await shot("potwor", {
  rooms: ["monster", "chest"],
  prepare: async (p) => {
    await go(p, "forest"); await p.waitForSelector(".card");
    const { T, el } = await p.evaluate(() => window.__LW_TEST);
    const vals = await p.$$eval(".card", (cs) => cs.map((c) => +c.textContent));
    const counter = { fire: "water", water: "earth", earth: "fire" }[el];
    await p.click(`.spell[data-s="${counter}"]`);
    for (let m = 1; m < 1 << vals.length; m++) { let s = 0; vals.forEach((v, i) => { if (m & (1 << i)) s += v; }); if (s === T) { for (let i = 0; i < vals.length; i++) if (m & (1 << i)) await p.click(`.card[data-i="${i}"]`); break; } }
  }
});
await shot("zegar", { rooms: ["clock", "chest"], seed: 5, prepare: async (p) => { await go(p, "mountains"); await p.waitForSelector(".clock"); } });
await shot("sowa", { rooms: ["logic", "chest"], seed: 9, save: showcase({ level: 2 }), prepare: async (p) => { await go(p, "forest"); await p.waitForSelector(".clues"); } });
await shot("zakupy", {
  save: showcase({ coins: 37 }),
  prepare: async (p) => { await p.click("#buildBtn"); await p.click("#tabD"); await p.click('.item.build[data-k="lantern"]'); await p.waitForSelector(".payov"); await p.click('.payov [data-w="20"]'); }
});
await shot("skarbonka", { save: showcase({ gr: 145 }), prepare: async (p) => { await p.click("#piggyBtn"); await p.waitForSelector("#swapBtn"); await p.click('#pig [data-w="50"]'); } });
await shot("tablet", { viewport: TABLET, scale: 1, rooms: ["path", null, "chest"], seed: 11, save: showcase({ level: 2 }), prepare: (p) => go(p, "mountains") });

// Banner: the camp scene with the game's title, in the game's own fonts.
{
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 }), p = await ctx.newPage();
  await p.addInitScript(() => { window.__LW_TEST = { seed: 7 }; });
  await startWith(p, srv.url, showcase()); await p.waitForTimeout(900);
  const scene = (await p.locator("#sc canvas").screenshot()).toString("base64");
  const font = (pkg, f) => fs.readFileSync(fileURLToPath(new URL(`../node_modules/@fontsource/${pkg}/files/${f}`, import.meta.url))).toString("base64");
  await p.setViewportSize({ width: 1280, height: 440 });
  await p.setContent(`<!doctype html><meta charset="utf-8"><style>
    @font-face { font-family: Pix; font-weight: 700; src: url(data:font/woff2;base64,${font("pixelify-sans", "pixelify-sans-latin-ext-700-normal.woff2")}); unicode-range: U+0100-024F; }
    @font-face { font-family: Pix; font-weight: 700; src: url(data:font/woff2;base64,${font("pixelify-sans", "pixelify-sans-latin-700-normal.woff2")}); }
    @font-face { font-family: Nun; font-weight: 800; src: url(data:font/woff2;base64,${font("nunito", "nunito-latin-ext-800-normal.woff2")}); unicode-range: U+0100-024F; }
    @font-face { font-family: Nun; font-weight: 800; src: url(data:font/woff2;base64,${font("nunito", "nunito-latin-800-normal.woff2")}); }
    body { margin: 0; width: 1280px; height: 440px; overflow: hidden; background: #f4ead3; }
    .b { position: relative; width: 1280px; height: 440px; background: url(data:image/png;base64,${scene}) right center / auto 100% no-repeat; image-rendering: pixelated; }
    .b::before { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, #f4ead3 0 38%, rgba(244,234,211,.85) 48%, rgba(244,234,211,0) 64%); }
    .t { position: absolute; left: 52px; top: 50px; }
    h1 { margin: 0; font: 700 84px/0.95 Pix; color: #3f9b4a; text-shadow: 4px 4px 0 #1f5c2e; letter-spacing: 1px; }
    p { margin: 18px 0 0; font: 800 24px/1.3 Nun; color: #22301f; white-space: nowrap; }
    .chips { margin-top: 18px; display: grid; grid-template-columns: repeat(3, max-content); gap: 10px 8px; }
    .chips span { font: 800 16px Nun; background: #fffaf0; border: 3px solid #6e4223; border-radius: 10px; padding: 4px 10px; box-shadow: 0 3px 0 #6e4223; }
  </style><div class="b"><div class="t"><h1>Mapa<br>Przygód</h1><p>Przygodowa gra pixel art dla dzieci z klas 1–3.</p>
    <div class="chips"><span>🧭 programowanie</span><span>➕ liczenie</span><span>📖 czytanie</span><span>🦉 logika</span><span>⏰ zegar</span><span>🪙 pieniądze</span></div></div></div>`);
  await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + "baner.png" });
  await ctx.close();
  console.log("✓ baner");
}
await browser.close(); await srv.close();
