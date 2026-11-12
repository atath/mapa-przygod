import { GS } from "./state.js";
import { levelFor } from "./content.js";
import { left, nextRoom, roomShell, updHud } from "./expedition.js";
import { figCells, patternPair } from "./logic-data.js";
import { PETSPR } from "./pets.js";
import { askChoice } from "./quiz.js";
import { save } from "./save.js";
import { bakeClearing, bob, draw, mountCanvas } from "./scene.js";
import { heroName, petName, say } from "./shell.js";
import { $, esc, pick, sleep } from "./util.js";
import { playHouses } from "./puzzles/houses-ui.js";
import { playTiles } from "./puzzles/tiles-ui.js";

/* ================== Chest guardian: one puzzle before the chest, in every land ==================
   The owl gives one bigger puzzle you arrange and check, or a quick pair of questions.
   Kinds rotate: the next one is drawn from those not played lately (profile.logicSeen). */
export const LOGIC_KINDS = {
  houses: { play: () => playHouses(levelFor("logic")) },
  patterns: { play: () => playPatterns(levelFor("logic")) },
  tiles: { play: () => playTiles(levelFor("logic")) }
};

export function nextLogicKind(seen) {
  const all = Object.keys(LOGIC_KINDS);
  let fresh = all.filter((k) => !seen.includes(k));
  if (!fresh.length) { seen.splice(0, seen.length, ...seen.slice(-1)); fresh = all.filter((k) => !seen.includes(k)); }
  const k = pick(fresh);
  seen.push(k); if (seen.length > all.length - 1) seen.splice(0, seen.length - (all.length - 1));
  return k;
}

export async function logicRoom() {
  roomShell();
  const run = GS.RUN;
  const cv = mountCanvas(8, 4); $("sc").appendChild(cv.c); cv.c.setAttribute("aria-label", "Strażnik skrzyni");
  const bg = bakeClearing(8, 4, run.seed + 777);
  GS.scene = { cv, draw(t) {
    const c = cv.x; c.drawImage(bg, 0, 0, bg.width / 2, bg.height / 2);
    draw(c, PETSPR.owl, 70, 12 - bob(t, 1), 2);
    draw(c, PETSPR[GS.G.hero.pet], 6, 34 - bob(t, 2), 1.25); draw(c, GS.HERO, 22, 16 - bob(t), 1.75);
  } };
  const forced = window.__LW_TEST && window.__LW_TEST.logic;
  const kind = forced && LOGIC_KINDS[forced] ? forced : nextLogicKind(GS.G.logicSeen);
  save();
  say(petName(), "Skrzyni pilnuje Mądra Sowa. Przepuści nas, jeśli rozwiążemy jej zagadkę. Myśl spokojnie!");
  await sleep(900); if (left(run)) return;
  const r = await LOGIC_KINDS[kind].play();
  if (left(run)) return;
  // 4 zł without a mistake, 2 zł with corrections, nothing when the owl had to show the answer
  const coins = r.coins != null ? r.coins : r.perfect ? 4 : r.solved ? 2 : 0;
  GS.RUN.coins += coins; updHud();
  say(heroName(), `${r.solved ? "Zagadka rozwiązana!" : "Przeszliśmy!"} Sowa przepuszcza nas do skrzyni.${coins ? ` +${coins} zł.` : ""}`);
  nextRoom();
}

/* ---------- the quick pair: what comes next, odd one out, counting in steps, growing figures ---------- */
const SKILL = { seq: "logic.seq", odd: "logic.odd", count: "math.count", grow: "logic.grow" };
export function figHTML(f, k, cls = "") {
  const cells = figCells(f, k), H = Math.max(...cells.map((c) => c[0])) + 1, W = Math.max(...cells.map((c) => c[1])) + 1;
  return `<span class="fig ${cls}" style="grid-template-columns:repeat(${W},var(--gc));grid-template-rows:repeat(${H},var(--gc))" aria-label="figura z ${cells.length} kwadratów">${cells.map(([r, c]) => `<i style="grid-area:${r + 1}/${c + 1}"></i>`).join("")}</span>`;
}
function headFor(q) {
  if (q.kind === "seq" || q.kind === "count") return `<p class="task-q">${esc(q.title)}</p><div class="seq${q.kind === "count" ? " nums" : ""}" aria-label="Ciąg">${q.items.map((e) => `<span>${esc(e)}</span>`).join("")}<span class="q">?</span></div>`;
  if (q.kind === "grow") return `<p class="task-q">${esc(q.title)}</p><div class="grow">${q.ks.map((k) => figHTML(q.fig, k)).join("")}<span class="q">?</span></div>`;
  return `<p class="task-q">${esc(q.title)}</p>`;
}
async function playPatterns(lvl) {
  const run = GS.RUN; let good = 0;
  for (const q of patternPair(lvl)) {
    await sleep(500); if (left(run)) return { coins: 0 };
    say("Mądra Sowa", q.title, q.say);
    const r = await askChoice(q, {
      skill: SKILL[q.kind], cls: q.kind === "count" || q.kind === "grow" ? "nums" : "", head: headFor(q),
      note: (miss) => `${q.kind === "grow" ? `figura ${q.fig}` : q.items ? q.items.join(",") : q.title.replace(/\?$/, "")} → ${q.ans}${miss ? `, pomyłki: ${miss}` : ""}`
    });
    if (left(run)) return { coins: 0 };
    if (q.kind === "grow") { const g = $("ctl").querySelector(".grow .q"); if (g) g.outerHTML = figHTML(q.fig, q.next, "new"); await sleep(1400); if (left(run)) return { coins: 0 }; }
    if (r.ok) good++;
  }
  return { coins: good * 2, solved: good > 0, perfect: good === 2 };
}
