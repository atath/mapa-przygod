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
import { clockRoomTasks, digital, durWord, genDay, h12, labelFor, timeRoomTasks, words, wordsAcc, wordsAt } from "./time-data.js";
import { placer, runChecks, testHook } from "./puzzle-ui.js";
import { $, app, esc, reduced, ri, rnd, sleep } from "./util.js";

/* ================== Clock face ==================
   Drawn smoothly (not pixelated) so the numbers stay crisp. Colours make the hands easy to tell apart:
   the short hour hand is blue, the long minute hand red. */
export function drawClock(c, h, m, { minute = true } = {}) {
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
  if (minute) hand((m / 60) * Math.PI * 2, R * 0.74, W / 44, "#e8442c");
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
    if (q.kind === "set" || q.kind === "elapsed") r = await gearClock(q, lvl);
    else {
      const hour = q.kind === "hour";
      say(petName(), hour ? q.title : "Która godzina jest na zegarze?", q.say);
      r = await askChoice(hour ? q : { ...q, opts: q.opts.map((o) => labelFor(o, lvl)) }, {
        skill: hour ? "time.hour" : "time.read", cls: `times${hour || lvl < 3 ? " words" : ""}`,
        head: `${clockHTML()}<p class="task-q">${esc(q.title)}</p>`,
        after: (el) => drawClock(el.querySelector(".clock"), q.h, q.m, { minute: !hour }),
        note: (miss) => `${hour ? "mała wskazówka " : "zegar "}${q.ans}${miss ? `, pomyłki: ${miss}` : ""}`
      });
    }
    if (left(run)) return;
    if (r.ok) good++;
  }
  finish(run, good, "Zegar nie ma przed nami tajemnic!");
}

// The geared clock: the child turns the hands by half an hour or a whole hour and both hands move together,
// the short one gliding along with the long one. "set": set a time; "elapsed": start at the beginning of
// something and turn the clock on by how long it lasts, while a bar of half hours fills up.
function gearClock(q, lvl) {
  return new Promise((resolve) => {
    const run = GS.RUN, took = timer(), el = q.kind === "elapsed", mod = (x) => ((x % 720) + 720) % 720;
    const target = el ? q.end : h12(q.h) * 60 + q.m, start = el ? q.start : mod(target + (rnd() < 0.5 ? -1 : 1) * 30 * ri(4, 8));
    let t = start, shown = start, misses = 0, done = false, anim = 0;
    const segs = el ? q.dur / 30 : 0;
    if (el) say(petName(), `${q.text} Przekręć zegar o ${durWord(q.dur)}.`, `${q.say.replace(" O której się skończy?", "")} Przekręć zegar o ${durWord(q.dur)} i zobacz, o której się skończy.`);
    else say(petName(), `Ustaw zegar na ${wordsAcc(q.h, q.m)}.`, q.say);
    $("ctl").innerHTML = `<div class="task">${clockHTML("big")}<p class="task-q">${el ? `<span class="em">${q.e}</span> ${esc(q.text)}` : `Ustaw: <b>${esc(lvl === 3 ? q.ans : words(q.h, q.m))}</b>`}</p>
        ${el ? `<div class="hbar" aria-label="Upływający czas">${Array.from({ length: segs }, () => "<i></i>").join("")}<b class="over" hidden>+</b></div>` : ""}</div>
      <div class="gear">
        <button class="btn small" id="tBack60" aria-label="Godzinę do tyłu">◀ godz.</button><button class="btn small" id="tBack30" aria-label="Pół godziny do tyłu">◀ pół</button>
        <button class="btn small" id="tFwd30" aria-label="Pół godziny do przodu">pół ▶</button><button class="btn small" id="tFwd60" aria-label="Godzinę do przodu">godz. ▶</button>
      </div>
      <button class="btn main" id="clockOk">Gotowe</button>`;
    const diff = mod(target - start);
    testHook(q.kind, q.ans, [...Array(Math.floor(diff / 60)).fill("#tFwd60"), ...Array((diff % 60) / 30).fill("#tFwd30"), "#clockOk"]);
    if (window.__LW_TEST) Object.assign(window.__LW_TEST.q, { h: h12(q.h), m: q.m, cur: () => ({ h: h12(Math.floor(t / 60)), m: t % 60 }) });
    const cnv = app.querySelector("#ctl .clock");
    const paint = () => {
      drawClock(cnv, Math.floor(shown / 60), shown % 60);
      if (el) { const n = Math.round((t - start) / 30); app.querySelectorAll(".hbar i").forEach((x, i) => x.classList.toggle("on", i < n)); app.querySelector(".hbar .over").hidden = n <= segs; }
    };
    const move = (d) => {
      if (done) return; const from = shown; t += d; snd.step();
      if (el) t = Math.max(start - 60, Math.min(start + 12 * 60, t)); else t = mod(t);
      const to = el ? t : from + (((t - from) % 720) + 1080) % 720 - 360; // the short way round
      if (reduced() || window.__LW_TEST) { shown = mod(t); return paint(); }
      const t0 = performance.now(), my = ++anim;
      const step = (now) => { if (my !== anim) return; const p = Math.min(1, (now - t0) / 350); shown = mod(from + (to - from) * p); paint(); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    paint();
    $("tBack60").addEventListener("click", () => move(-60)); $("tBack30").addEventListener("click", () => move(-30));
    $("tFwd30").addEventListener("click", () => move(30)); $("tFwd60").addEventListener("click", () => move(60));
    $("clockOk").addEventListener("click", async () => {
      if (done) return;
      const ch = Math.floor(mod(t) / 60), cm = mod(t) % 60;
      if (mod(t) === mod(target)) {
        done = true; snd.ok(); burst(cnv); record(el ? "time.elapsed" : "time.set", misses === 0, took(), `${q.ans}${misses ? `, pomyłki: ${misses}` : ""}`); save();
        say(heroName(), el ? `${q.ev} skończy się o ${wordsAt(Math.floor(target / 60), target % 60)}!` : `Jest ${words(q.h, q.m)}!`); resolve({ ok: misses === 0 }); return;
      }
      misses++;
      const passed = t - start;
      const hint = el ? (passed < 0 ? "Zegar cofnął się przed początek. Kręć do przodu." : `Minęło ${durWord(passed)}, a ${q.ev.toLowerCase()} trwa ${durWord(q.dur)}.`)
        : `Jest ${words(ch, cm)}, a ma być ${words(q.h, q.m)}.${cm !== q.m ? (q.m === 30 ? " Przy pół godzinie duża wskazówka stoi na 6." : " Przy pełnej godzinie duża wskazówka stoi na 12.") : ""}`;
      if (misses === 1) { snd.bad(); say(petName(), `Jeszcze nie. ${hint}`); return; }
      done = true;
      const fainted = await hurt(); if (left(run)) return;
      t = el ? target : mod(target); shown = mod(target); paint();
      if (!fainted) say(petName(), `Tak wygląda ${words(Math.floor(mod(target) / 60), target % 60)}. ${q.why()}`);
      record(el ? "time.elapsed" : "time.set", false, took(), `${q.ans}, pomyłki: ${misses}`); save();
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
  const tasks = timeRoomTasks(lvl);
  if (window.__LW_TEST && window.__LW_TEST.day) tasks[1] = genDay(lvl); // tests: always the day plan
  for (const q of tasks) {
    await sleep(500); if (left(run)) return;
    let r;
    if (q.kind === "feel") r = await feel(q);
    else if (q.kind === "day") r = await playDay(q);
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

// A small clock for the day plan: plain SVG, so it survives the placer redrawing the pieces
export function clockSVG(h, m) {
  const a = (v) => v * Math.PI * 2, hh = ((h % 12) + m / 60) / 12, mm = m / 60;
  const ticks = Array.from({ length: 12 }, (_, i) => { const t = a(i / 12); return `<line x1="${20 + Math.sin(t) * 15}" y1="${20 - Math.cos(t) * 15}" x2="${20 + Math.sin(t) * 17}" y2="${20 - Math.cos(t) * 17}" stroke="#2a1d2e" stroke-width="${i % 3 ? 1 : 2}"/>`; }).join("");
  return `<svg class="mclock" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="#fff6dc" stroke="#7a4b2a" stroke-width="2"/>${ticks}`
    + `<line x1="20" y1="20" x2="${20 + Math.sin(a(hh)) * 9}" y2="${20 - Math.cos(a(hh)) * 9}" stroke="#2b6cb0" stroke-width="3" stroke-linecap="round"/>`
    + `<line x1="20" y1="20" x2="${20 + Math.sin(a(mm)) * 14}" y2="${20 - Math.cos(a(mm)) * 14}" stroke="#e8442c" stroke-width="2" stroke-linecap="round"/></svg>`;
}

function playDay(q) {
  const E = Object.fromEntries(q.evs.map((x) => [x.k, x]));
  say(petName(), q.title + ": od rana do nocy.", q.say);
  $("ctl").innerHTML = `<div class="task pz day"><p class="task-q">🌅 rano → noc 🌙</p><div class="pl-slots dayline"></div><div class="pl-tray"></div></div>
    <button class="btn main" id="checkBtn">Sprawdź</button>`;
  const ev = (k) => `<span class="ev"><span class="em">${E[k].e}</span>${clockSVG(E[k].h, E[k].m)}<small>${E[k].part.e} ${esc(E[k].part.k)}</small></span>`;
  const pl = placer($("ctl").querySelector(".pz"), { keys: q.evs.map((x) => x.k), n: q.evs.length, pieceHTML: ev, slotHTML: (i, k) => (k ? ev(k) : `<b class="no">${i + 1}</b>`) });
  testHook("day", q.ans, q.ans.flatMap((k, i) => [`.pz-piece[data-k="${k}"]`, `.pz-slot[data-i="${i}"]`]).concat("#checkBtn"));
  return runChecks({
    skill: "time.day",
    check: () => {
      const at = pl.get(); if (at.some((k) => !k)) return { ready: false, msg: "Najpierw ułóż wszystkie obrazki." };
      const bad = at.map((k, i) => (k === q.ans[i] ? -1 : i)).filter((i) => i >= 0); pl.mark(bad);
      if (!bad.length) return { ok: true };
      const k = at[bad[0]];
      return { ok: false, msg: `${E[k].name} jest ${E[k].part.k}, o ${wordsAt(E[k].h, E[k].m)}. Popraw czerwone miejsca.` };
    },
    reveal: () => pl.set(q.ans),
    lock: () => pl.lock(),
    note: (n) => `${q.evs.length} zdarzenia${n > 1 ? `, próby: ${n}` : ""}`
  }).then((r) => ({ ok: r.perfect }));
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
