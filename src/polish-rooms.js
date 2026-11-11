import { GS } from "./state.js";
import { snd, speak } from "./audio.js";
import { L, WORDS } from "./content.js";
import { hurt, nextRoom, roomShell, updHud } from "./expedition.js";
import { PRAISE, burst } from "./fx.js";
import { PETSPR } from "./pets.js";
import { SPR } from "./props.js";
import { bakeClearing, bob, draw, mountCanvas } from "./scene.js";
import { heroName, petName, say } from "./shell.js";
import { $, app, esc, pick, ri, shuffle } from "./util.js";

/* ---------- Door room (Polish: build word) ---------- */
export function doorRoom() {
  roomShell();
  const lv = L(), pool = WORDS.filter((w) => w.w.length >= lv.word[0] && w.w.length <= lv.word[1]), x = pick(pool), letters = x.w.split("");
  if (window.__LW_TEST) window.__LW_TEST.word = x.w;
  const cv = mountCanvas(8, 4); $("sc").appendChild(cv.c); cv.c.setAttribute("aria-label", "Zaczarowane drzwi");
  const bg = bakeClearing(8, 4, GS.RUN.seed + GS.RUN.i * 7);
  const st = { open: 0, glow: 0 };
  GS.scene = { cv, draw(t) {
    const c = cv.x; c.drawImage(bg, 0, 0, bg.width / 2, bg.height / 2);
    c.save(); c.globalAlpha = 1 - st.open; draw(c, SPR.door, 52, 10 - st.open * 6, 1.6); c.restore();
    if (st.open > 0) { c.fillStyle = `rgba(255,233,140,${st.open * 0.8})`; c.fillRect(56, 14, 22, 36); }
    for (let i = 0; i < letters.length; i++) { const on = i < st.glow; c.fillStyle = on ? "#ffe14d" : "#5a4bb0"; c.fillRect(52 + i * 4, 6, 3, 3); }
    draw(c, PETSPR[GS.G.hero.pet], 6, 34 - bob(t, 2), 1.25); draw(c, GS.HERO, 22, 16 - bob(t), 1.75);
  } };
  // extra decoy runes make it harder on higher levels
  const decoys = GS.G.level === 1 ? [] : shuffle("aeiouykrstmnl".split("").filter((l) => !letters.includes(l))).slice(0, GS.G.level === 2 ? 1 : 2);
  if (lv.spoken) say(petName(), esc(`Zaczarowane drzwi! Otworzy je słowo z obrazka: „${x.w}”. Ułóż je z run.`), `Zaczarowane drzwi! Otworzy je słowo ${x.w}. Ułóż je z liter, po kolei.`);
  else say(petName(), "Zaczarowane drzwi! Otworzy je nazwa tego, co widzisz na obrazku. Ułóż ją z run. Uwaga, niektóre runy są fałszywe!");
  $("ctl").innerHTML = `<div class="hint-pic" aria-hidden="true">${x.e}</div><div class="slots">${letters.map(() => `<span class="slot"></span>`).join("")}</div>
    <div class="tiles">${shuffle(letters.concat(decoys)).map((l) => `<button class="tile" data-l="${esc(l)}">${esc(l)}</button>`).join("")}</div>`;
  let pos = 0, misses = 0; const slots = app.querySelectorAll(".slot");
  app.querySelectorAll(".tile").forEach((b) => b.addEventListener("click", async () => {
    if (pos >= letters.length || b.classList.contains("used")) return;
    if (b.dataset.l === letters[pos]) {
      slots[pos].textContent = letters[pos]; slots[pos].classList.add("filled"); b.classList.add("used"); pos++; st.glow = pos; snd.letter();
      if (pos === letters.length) {
        snd.door(); burst(app.querySelector(".slots"), 30); speak(x.w);
        await new Promise((res) => { const t0 = performance.now(); function f(n) { st.open = Math.min(1, (n - t0) / 700); if (st.open < 1) requestAnimationFrame(f); else res(); } requestAnimationFrame(f); });
        GS.RUN.coins += GS.G.level; updHud(); snd.coin();
        say(heroName(), esc(`${pick(PRAISE)} „${x.w}” otworzyło drzwi!`)); nextRoom();
      }
    } else {
      misses++; b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake"); snd.bad();
      if (misses >= 3) say(petName(), esc(`Następna litera to „${letters[pos]}”.`), `Następna litera to ${letters[pos]}.`);
      else say(petName(), "Ta runa nie pasuje. Powiedz słowo powoli i posłuchaj, jaka głoska jest następna.");
    }
  }));
}

/* ---------- Sign room (Polish: careful reading) ---------- */
export function mutate(w) {
  const vowels = "aeiouy", cons = "bdkmnprstwlz";
  for (let g = 0; g < 60; g++) {
    const i = ri(0, w.length - 1), ch = w[i], pool = vowels.includes(ch) ? vowels : cons.includes(ch) ? cons : null;
    if (!pool) continue;
    const v = w.slice(0, i) + pick(pool.split("").filter((c) => c !== ch)) + w.slice(i + 1);
    if (v !== w) return v;
  }
  return w + "a";
}
export function signRoom() {
  roomShell();
  const lv = L(), pool = WORDS.filter((w) => w.w.length >= 3 && w.w.length <= 6);
  let target, choices;
  if (lv.phrase) {
    const [a, b] = shuffle(pool).slice(0, 2);
    target = { w: `${a.w} i ${b.w}`, e: a.e + b.e };
    const set = new Set([target.w]);
    for (let g = 0; set.size < lv.signs && g < 50; g++) set.add(Math.random() < 0.5 ? `${mutate(a.w)} i ${b.w}` : Math.random() < 0.5 ? `${a.w} i ${mutate(b.w)}` : `${b.w} i ${a.w}`);
    choices = shuffle([...set]);
  } else {
    target = pick(pool);
    const set = new Set([target.w]);
    const similar = shuffle(pool.filter((w) => w.w !== target.w && (w.w[0] === target.w[0] || w.w.length === target.w.length))).map((w) => w.w);
    if (similar.length) set.add(similar[0]);
    for (let g = 0; set.size < lv.signs && g < 50; g++) set.add(mutate(target.w));
    choices = shuffle([...set]);
  }
  if (window.__LW_TEST) window.__LW_TEST.target = target.w;
  const cv = mountCanvas(8, 4); $("sc").appendChild(cv.c); cv.c.setAttribute("aria-label", "Rozdroże z drogowskazami");
  const bg = bakeClearing(8, 4, GS.RUN.seed + GS.RUN.i * 13, 3);
  GS.scene = { cv, draw(t) {
    const c = cv.x; c.drawImage(bg, 0, 0, bg.width / 2, bg.height / 2);
    choices.forEach((_, i) => draw(c, SPR.sign, 54 + i * 18, 22, 1.2));
    draw(c, PETSPR[GS.G.hero.pet], 6, 34 - bob(t, 2), 1.25); draw(c, GS.HERO, 22, 16 - bob(t), 1.75);
  } };
  say(petName(), `Rozdroże! Musimy dojść tam, gdzie jest <span class="pic">${target.e}</span>. Drogowskazy są podobne — czytaj bardzo uważnie, litera po literze!`,
    "Rozdroże! Spójrz na obrazek. Drogowskazy są do siebie podobne, więc czytaj bardzo uważnie, litera po literze.");
  $("ctl").innerHTML = `<div class="opts">${choices.map((c) => `<button class="btn sign" data-w="${esc(c)}">${esc(c)}</button>`).join("")}</div>`;
  let done = false;
  app.querySelectorAll("[data-w]").forEach((b) => b.addEventListener("click", async () => {
    if (done || b.disabled) return;
    if (b.dataset.w === target.w) {
      done = true; b.classList.add("right"); snd.ok(); burst(b); speak(target.w);
      GS.RUN.coins += GS.G.level; updHud();
      say(heroName(), esc(`${pick(PRAISE)} „${target.w}” — to nasza droga.`)); nextRoom();
    } else {
      b.classList.add("wrong"); b.disabled = true; b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake");
      const fainted = await hurt();
      if (!fainted) say(petName(), esc(`Tu jest napisane „${b.dataset.w}”. To nie to! Szukamy dalej.`), `Tu jest napisane ${b.dataset.w}. To nie to. Szukamy dalej.`);
    }
  }));
}
