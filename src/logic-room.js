import { GS } from "./state.js";
import { left, nextRoom, roomShell, updHud } from "./expedition.js";
import { logicRoomPuzzles } from "./logic-data.js";
import { PETSPR } from "./pets.js";
import { askChoice } from "./quiz.js";
import { bakeClearing, bob, draw, mountCanvas } from "./scene.js";
import { heroName, petName, say } from "./shell.js";
import { $, esc, sleep } from "./util.js";

/* ================== Chest guardian: logic puzzles before the chest, in every land ================== */
export async function logicRoom() {
  roomShell();
  const run = GS.RUN, lvl = GS.G.level;
  const cv = mountCanvas(8, 4); $("sc").appendChild(cv.c); cv.c.setAttribute("aria-label", "Strażnik skrzyni");
  const bg = bakeClearing(8, 4, run.seed + 777);
  GS.scene = { cv, draw(t) {
    const c = cv.x; c.drawImage(bg, 0, 0, bg.width / 2, bg.height / 2);
    draw(c, PETSPR.owl, 70, 12 - bob(t, 1), 2);
    draw(c, PETSPR[GS.G.hero.pet], 6, 34 - bob(t, 2), 1.25); draw(c, GS.HERO, 22, 16 - bob(t), 1.75);
  } };
  say(petName(), "Skrzyni pilnuje Mądra Sowa. Przepuści nas, jeśli rozwiążemy dwie zagadki. Myśl spokojnie, łącz wskazówki!");
  let good = 0;
  for (const q of logicRoomPuzzles(lvl)) {
    await sleep(700); if (left(run)) return;
    say("Mądra Sowa", q.kind === "who" ? `${q.intro} ${q.title}` : q.title, q.say);
    const r = await askChoice(q, { skill: "logic." + q.kind, cls: q.kind === "if" ? "wide" : "", head: headFor(q), note: (miss) => noteFor(q, miss) });
    if (left(run)) return;
    if (r.ok) good++;
  }
  const coins = good * 2;
  GS.RUN.coins += coins; updHud();
  say(heroName(), `${good === 2 ? "Obie zagadki rozwiązane!" : good ? "Udało się!" : "Przeszliśmy!"} Sowa przepuszcza nas do skrzyni.${coins ? ` +${coins} monety.` : ""}`);
  nextRoom();
}

function headFor(q) {
  if (q.kind === "who") return `<p class="task-q">${esc(q.intro)}</p><ol class="clues">${q.clues.map((c) => `<li>${esc(c)}</li>`).join("")}</ol><p class="task-q">${esc(q.title)}</p>`;
  if (q.kind === "if") return `<ol class="clues rules">${q.clues.map((c) => `<li>${esc(c)}</li>`).join("")}</ol><p class="task-q">${esc(q.title)}</p>`;
  if (q.kind === "seq") return `<p class="task-q">${esc(q.title)}</p><div class="seq" aria-label="Ciąg obrazków">${q.items.map((e) => `<span>${e}</span>`).join("")}<span class="q">?</span></div>`;
  return `<p class="task-q">${esc(q.title)}</p>`;
}
function noteFor(q, miss) {
  const tail = miss ? `, pomyłki: ${miss}` : "";
  if (q.kind === "who") return `${q.opts.length} podejrzanych, ${q.clues.length} wskazówki${tail}`;
  return `${q.title.replace(/\?$/, "")}: ${q.ans}${tail}`;
}
