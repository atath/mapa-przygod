import { GS } from "./state.js";
import { snd } from "./audio.js";
import { hurt, left, nextRoom, roomShell, updHud } from "./expedition.js";
import { burst } from "./fx.js";
import { msprites } from "./lands.js";
import { PETSPR } from "./pets.js";
import { askChoice } from "./quiz.js";
import { save } from "./save.js";
import { bakeClearing, bob, draw, mountCanvas } from "./scene.js";
import { heroName, petName, say } from "./shell.js";
import { record, timer } from "./stats.js";
import { clockRoomTasks, digital, h12, timeRoomTasks, words } from "./time-data.js";
import { $, app, esc, sleep } from "./util.js";

/* ================== Clock face ==================
   Drawn smoothly (not pixelated) so the numbers stay crisp. Colours make the hands easy to tell apart:
   the short hour hand is blue, the long minute hand red. */
export function drawClock(c, h, m) {
  const x = c.getContext("2d"), W = c.width, R = W / 2 - 6;
  x.clearRect(0, 0, W, W); x.save(); x.translate(W / 2, W / 2);
  x.fillStyle = "#7a4b2a"; x.beginPath(); x.arc(0, 0, R, 0, Math.PI * 2); x.fill();
  x.fillStyle = "#fff6dc"; x.beginPath(); x.arc(0, 0, R * 0.9, 0, Math.PI * 2); x.fill();
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2, big = i % 5 === 0;
    x.strokeStyle = big ? "#2a1d2e" : "#b9a98a"; x.lineWidth = big ? W / 90 : W / 220;
    x.beginPath(); x.moveTo(Math.sin(a) * R * 0.86, -Math.cos(a) * R * 0.86); x.lineTo(Math.sin(a) * R * (big ? 0.76 : 0.81), -Math.cos(a) * R * (big ? 0.76 : 0.81)); x.stroke();
  }
  x.fillStyle = "#2a1d2e"; x.font = `900 ${Math.round(W / 9)}px Nunito, sans-serif`; x.textAlign = "center"; x.textBaseline = "middle";
  for (let n = 1; n <= 12; n++) { const a = (n / 12) * Math.PI * 2; x.fillText(String(n), Math.sin(a) * R * 0.6, -Math.cos(a) * R * 0.6 + W / 120); }
  const hand = (a, len, w, col) => { x.strokeStyle = col; x.lineWidth = w; x.lineCap = "round"; x.beginPath(); x.moveTo(-Math.sin(a) * len * 0.12, Math.cos(a) * len * 0.12); x.lineTo(Math.sin(a) * len, -Math.cos(a) * len); x.stroke(); };
  hand(((h12(h) % 12) + m / 60) / 12 * Math.PI * 2, R * 0.45, W / 26, "#2b6cb0");
  hand((m / 60) * Math.PI * 2, R * 0.74, W / 44, "#e8442c");
  x.fillStyle = "#ffcf3a"; x.beginPath(); x.arc(0, 0, W / 40, 0, Math.PI * 2); x.fill();
  x.restore();
}
const clockHTML = (cls = "") => `<canvas class="clock ${cls}" width="440" height="440" role="img" aria-label="Zegar ze wskazówkami"></canvas>`;

function sceneFor(label, prop, seed) {
  const cv = mountCanvas(8, 4); $("sc").appendChild(cv.c); cv.c.setAttribute("aria-label", label);
  const bg = bakeClearing(8, 4, seed);
  GS.scene = { cv, draw(t) {
    const c = cv.x; c.drawImage(bg, 0, 0, bg.width / 2, bg.height / 2);
    draw(c, msprites().stone, 64, 26, 1.4); draw(c, prop, 66, 6 - bob(t, 1), 1.6);
    draw(c, PETSPR[GS.G.hero.pet], 6, 34 - bob(t, 2), 1.25); draw(c, GS.HERO, 22, 16 - bob(t), 1.75);
  } };
}

/* ---------- Clock tower: read the clock, set it, work out when something ends ---------- */
export async function clockRoom() {
  roomShell();
  const run = GS.RUN, lvl = GS.G.level;
  sceneFor("Wieża zegarowa", msprites().clock, run.seed + run.i * 17);
  say(petName(), "Wieża zegarowa! Zegarmistrz da nam trzy zadania. Mała niebieska wskazówka pokazuje godzinę, duża czerwona minuty.");
  let good = 0;
  for (const q of clockRoomTasks(lvl)) {
    await sleep(500); if (left(run)) return;
    let r;
    if (q.kind === "set") r = await setClock(q);
    else {
      say(petName(), q.kind === "read" ? "Która godzina jest na zegarze?" : `${q.text} O której się skończy?`, q.say);
      r = await askChoice(q, {
        skill: q.kind === "read" ? "time.read" : "time.elapsed", cls: "times",
        head: `${clockHTML()}<p class="task-q">${q.kind === "read" ? "Która godzina?" : `<span class="em">${q.e}</span> ${esc(q.text)}<br>O której się skończy?`}</p>`,
        after: (el) => drawClock(el.querySelector(".clock"), q.h, q.m),
        note: (miss) => `${q.kind === "read" ? "zegar " : "koniec "}${q.ans}${miss ? `, pomyłki: ${miss}` : ""}`
      });
    }
    if (left(run)) return;
    if (r.ok) good++;
  }
  finish(run, good, "Zegar nie ma przed nami tajemnic!");
}

// the child moves the hands: arrows turn the short hand an hour, one button flips the long hand between 12 and 6
function setClock(q) {
  return new Promise((resolve) => {
    const run = GS.RUN, took = timer();
    let h = h12(q.h + 4 + Math.floor(Math.random() * 5)), m = q.m === 30 ? 0 : 30, misses = 0, done = false;
    say(petName(), `Ustaw zegar na ${q.ans}, czyli ${words(q.h, q.m)}.`, q.say);
    $("ctl").innerHTML = `<div class="task">${clockHTML("big")}<p class="task-q">Ustaw: <b>${esc(q.ans)}</b></p></div>
      <div class="setclock">
        <button class="btn small" id="hBack" aria-label="Mała wskazówka do tyłu">◀ mała</button>
        <button class="btn small" id="hFwd" aria-label="Mała wskazówka do przodu">mała ▶</button>
        <button class="btn small" id="mFlip">duża na ${m === 0 ? "6" : "12"}</button>
      </div>
      <button class="btn main" id="clockOk">Gotowe</button>`;
    if (window.__LW_TEST) window.__LW_TEST.q = { kind: "set", ans: q.ans, h: h12(q.h), m: q.m, cur: () => ({ h, m }) };
    const cnv = app.querySelector("#ctl .clock"), paint = () => { drawClock(cnv, h, m); $("mFlip").textContent = `duża na ${m === 0 ? "6" : "12"}`; };
    paint();
    $("hBack").addEventListener("click", () => { if (done) return; h = h12(h - 1); snd.step(); paint(); });
    $("hFwd").addEventListener("click", () => { if (done) return; h = h12(h + 1); snd.step(); paint(); });
    $("mFlip").addEventListener("click", () => { if (done) return; m = m === 0 ? 30 : 0; snd.step(); paint(); });
    $("clockOk").addEventListener("click", async () => {
      if (done) return;
      if (h === h12(q.h) && m === q.m) {
        done = true; snd.ok(); burst(cnv); record("time.set", misses === 0, took(), `${q.ans}${misses ? `, pomyłki: ${misses}` : ""}`); save();
        say(heroName(), `Jest ${q.ans}!`); resolve({ ok: misses === 0 }); return;
      }
      misses++;
      const hint = m !== q.m ? (q.m === 30 ? "Przy pół godzinie duża wskazówka stoi na 6." : "Przy pełnej godzinie duża wskazówka stoi na 12.")
        : `Mała wskazówka ma pokazać ${q.m === 30 ? `miejsce między ${h12(q.h)} a ${h12(q.h + 1)}` : h12(q.h)}.`;
      if (misses === 1) { snd.bad(); say(petName(), `Jeszcze nie. ${hint}`); return; }
      done = true;
      const fainted = await hurt(); if (left(run)) return;
      h = h12(q.h); m = q.m; paint();
      if (!fainted) say(petName(), `Tak wygląda ${q.ans}. ${q.why()}`);
      record("time.set", false, took(), `${q.ans}, pomyłki: ${misses}`); save();
      await sleep(3200); if (left(run)) return;
      resolve({ ok: false });
    });
  });
}

/* ---------- Time stone: how long things take, and a feel for seconds ---------- */
export async function timeRoom() {
  roomShell();
  const run = GS.RUN, lvl = GS.G.level;
  sceneFor("Kamień czasu", msprites().hourglass, run.seed + run.i * 19);
  say(petName(), "Kamień czasu! Sprawdzimy, ile co trwa: sekunda, minuta, godzina.");
  let good = 0;
  for (const q of timeRoomTasks(lvl)) {
    await sleep(500); if (left(run)) return;
    let r;
    if (q.kind === "feel") r = await feel(q);
    else {
      say(petName(), q.title, q.say);
      r = await askChoice(q, {
        skill: q.kind === "howlong" ? "time.howlong" : "time.longer", cls: q.kind === "longer" ? "two" : "spans",
        head: `<p class="task-q">${q.e ? `<span class="em big">${q.e}</span><br>` : ""}${esc(q.title)}</p>`,
        note: (miss) => `${q.title} → ${q.opts.find((o) => o.a === q.ans).n}${miss ? `, pomyłki: ${miss}` : ""}`
      });
    }
    if (left(run)) return;
    if (r.ok) good++;
  }
  finish(run, good, "Czujemy już, ile trwa czas!");
}

function feel(q) {
  return new Promise((resolve) => {
    const run = GS.RUN; let t0 = 0, done = false;
    say(petName(), `${q.title}! Naciśnij start i policz w myślach do ${q.secs}. Potem stop.`, q.say);
    $("ctl").innerHTML = `<div class="task"><p class="task-q"><span class="em big">⏱️</span><br>Policz w myślach do ${q.secs}: „raz i, dwa i, trzy i…”</p></div>
      <button class="btn main" id="feelBtn">Start</button>`;
    if (window.__LW_TEST) window.__LW_TEST.q = { kind: "feel", secs: q.secs };
    $("feelBtn").addEventListener("click", async () => {
      if (done) return;
      if (!t0) { t0 = performance.now(); snd.step(); $("feelBtn").textContent = "Stop"; $("feelBtn").classList.add("gold"); return; }
      done = true;
      const s = (performance.now() - t0) / 1000, d = s - q.secs, ok = Math.abs(d) <= q.tol, shown = Math.round(s * 10) / 10;
      record("time.feel", ok, s * 1000, `${q.secs} s → ${shown} s`); save();
      if (ok) { snd.ok(); burst($("feelBtn")); }
      const said = `${String(shown).replace(".", ",")} ${secWord(shown)}`;
      say(petName(), ok ? `Minęło ${said}. Świetne wyczucie!`
        : `Minęło ${said}. ${d < 0 ? "Za szybko! Licz wolniej: raz i, dwa i…" : "Trochę za długo. Licz odrobinę szybciej."} Każda sekunda to jedno tyknięcie zegara.`);
      await sleep(2600); if (left(run)) return;
      resolve({ ok });
    });
  });
}

// Polish: 1 sekundę, 2–4 sekundy, 5+ sekund, fractions "sekundy" (2,5 sekundy)
const secWord = (n) => (n % 1 ? "sekundy" : n === 1 ? "sekunda" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "sekundy" : "sekund");
function finish(run, good, line) {
  GS.RUN.coins += good; updHud();
  say(heroName(), `${line} ${good ? `+${good} zł.` : ""}`);
  nextRoom();
}
export { digital };
