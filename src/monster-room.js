import { GS } from "./state.js";
import { snd } from "./audio.js";
import { L } from "./content.js";
import { hurt, left, nextRoom, roomShell, updHud } from "./expedition.js";
import { PAL, PRAISE, burst } from "./fx.js";
import { MON_DEFS } from "./monsters.js";
import { PETSPR } from "./pets.js";
import { EICON, ELEM, SPR, counterOf, monsterOf } from "./props.js";
import { save } from "./save.js";
import { bakeClearing, bob, draw, mountCanvas } from "./scene.js";
import { heroName, petName, say } from "./shell.js";
import { $, app, esc, pick, reduced, ri, shuffle, sleep } from "./util.js";

/* ---------- Monster room (spells + math, turn-based) ---------- */
export function monsterRoom() {
  roomShell();
  const lv = L(), el = pick(Object.keys(ELEM)), mon = monsterOf(el, ri(0, MON_DEFS[el].length - 1)), maxHp = GS.G.level === 1 ? 2 : 3;
  const E = ELEM[el], adjGen = E.adj.slice(0, -1) + "ego", counter = counterOf(el);
  const cv = mountCanvas(8, 4); $("sc").appendChild(cv.c); cv.c.setAttribute("aria-label", "Potwór na polanie");
  const bg = bakeClearing(8, 4, GS.RUN.seed + GS.RUN.i);
  const run = GS.RUN;
  const st = { mhp: maxHp, shake: 0, gone: 0, swing: 0, proj: null, shield: 0, flash: 0 };
  GS.scene = { cv, draw(t) {
    const x = cv.x; x.drawImage(bg, 0, 0, bg.width / 2, bg.height / 2);
    draw(x, PETSPR[GS.G.hero.pet], 4, 34 - bob(t, 2), 1.25);
    if (!(st.flash && Math.floor(t / 80) % 2)) draw(x, GS.HERO, 20 + st.swing, 16 - bob(t), 1.75);
    if (st.shield) { x.strokeStyle = "rgba(140,220,255,.9)"; x.lineWidth = 2; x.beginPath(); x.arc(36, 34, 20, 0, 7); x.stroke(); x.fillStyle = "rgba(140,220,255,.18)"; x.fill(); }
    if (st.gone < 1) {
      x.save(); x.globalAlpha = 1 - st.gone;
      const sx = 82 + (st.shake ? Math.round(Math.sin(t / 20) * 2) : 0);
      draw(x, mon.frames[Math.floor(t / 240) % 2], sx, 16 - bob(t, 1) - st.gone * 10, 2.25);
      x.drawImage(E.icon, 70, 1, 13, 13);
      for (let i = 0; i < maxHp; i++) { x.globalAlpha = (1 - st.gone) * (i < st.mhp ? 1 : 0.22); x.drawImage(SPR.heart, 84 + i * 12, 1, 14, 14); }
      x.restore();
    }
    if (st.proj) x.drawImage(st.proj.spr, st.proj.x - 8, st.proj.y - 8, 16, 16);
  } };
  const anim = (ms, fn) => new Promise((res) => { const t0 = performance.now(); function f(n) { const p = Math.min(1, (n - t0) / (reduced() ? ms / 3 : ms)); fn(p); if (p < 1) requestAnimationFrame(f); else res(); } requestAnimationFrame(f); });
  const fly = (spr, a, b, y) => anim(450, (p) => { st.proj = p < 1 ? { spr, x: a + (b - a) * p, y: y - Math.sin(p * Math.PI) * 10 } : null; });
  const swing = () => anim(300, (p) => { st.swing = Math.round(Math.sin(p * Math.PI) * 18); });
  const shake = () => { st.shake = 1; setTimeout(() => (st.shake = 0), 500); };

  function makeHand(T) {
    const sol = [];
    if (T > 18 || (T >= 6 && Math.random() < lv.three)) { const a = ri(Math.max(1, T - 18), Math.min(9, T - 2)); const b = ri(Math.max(1, T - a - 9), Math.min(9, T - a - 1)); sol.push(a, b, T - a - b); }
    else { const a = ri(Math.max(1, T - 9), Math.min(9, T - 1)); sol.push(a, T - a); }
    const fill = []; while (sol.length + fill.length < lv.cards) { const v = ri(1, 9); if (v !== T) fill.push(v); }
    return shuffle(sol.concat(fill));
  }
  function attackQ() {
    const lvl = GS.G.level, kind = lvl === 1 ? pick(["add", "sub"]) : lvl === 2 ? pick(["add", "sub", "miss"]) : pick(["three", "miss", "sub", "three"]);
    const max = lvl === 1 ? 15 : 20;
    let show, sayTxt, ans;
    if (kind === "add") { const a = ri(3, max - 2), b = ri(2, max - a); ans = a + b; show = `${a} + ${b}`; sayTxt = `${a} dodać ${b}`; }
    else if (kind === "sub") { const a = ri(8, max), b = ri(2, a - 1); ans = a - b; show = `${a} − ${b}`; sayTxt = `${a} odjąć ${b}`; }
    else if (kind === "miss") { const s_ = ri(8, max), a = ri(2, s_ - 2); ans = s_ - a; show = `${a} + ? = ${s_}`; sayTxt = `${a} dodać ile daje ${s_}`; }
    else { const a = ri(4, 12), b = ri(2, 8), c = ri(1, Math.min(9, a + b - 1)); ans = a + b - c; show = `${a} + ${b} − ${c}`; sayTxt = `${a} dodać ${b} odjąć ${c}`; }
    const opts = new Set([ans]); while (opts.size < (lvl === 1 ? 3 : 4)) { const v = ans + ri(-3, 3); if (v >= 0) opts.add(v); }
    return { show, say: sayTxt, ans, opts: shuffle([...opts]), q: kind === "miss" ? show : show + " = ?" };
  }
  let wrongSpells = 0;
  function playerTurn(prefix) {
    const N = ri(lv.hp[0], lv.hp[1]), hand = makeHand(N), sel = new Set();
    let spell = null, busy = false;
    if (window.__LW_TEST) Object.assign(window.__LW_TEST, { T: N, el });
    $("ctl").innerHTML = `
      <div class="foe"><span class="power"><img src="${EICON[el]}" width="40" height="40" alt="">${esc(mon.name)} · moc <b>${N}</b></span></div>
      <div class="book" aria-label="Księga czarów">${Object.keys(ELEM).map((k) => `<span><img src="${EICON[k]}" alt="">${ELEM[k].name} pokonuje<img src="${EICON[ELEM[k].beats]}" alt=""></span>`).join("")}</div>
      <div class="spells" id="spells">${Object.keys(ELEM).map((k) => `<button class="spell" data-s="${k}" aria-pressed="false"><img src="${EICON[k]}" alt="">${ELEM[k].name}</button>`).join("")}</div>
      <div class="cards" id="cards">${hand.map((v, i) => `<button class="card" data-i="${i}" aria-pressed="false" aria-label="karta ${v}">${v}</button>`).join("")}</div>
      <div class="sum" id="sum" aria-live="polite"></div>
      <button class="btn main" id="cast" disabled>✨ Rzuć czar</button>`;
    const upd = () => {
      const v = [...sel].map((i) => hand[i]);
      $("sum").textContent = v.length ? `${v.join(" + ")} = ${v.reduce((a, b) => a + b, 0)}` : "";
      $("cast").disabled = !v.length || !spell;
      $("cast").textContent = !spell ? "Wybierz czar" : !v.length ? "Wybierz karty" : "✨ Rzuć czar";
    };
    upd();
    app.querySelectorAll(".spell").forEach((b) => b.addEventListener("click", () => {
      if (busy) return; spell = b.dataset.s; snd.letter();
      app.querySelectorAll(".spell").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); upd();
    }));
    app.querySelectorAll(".card").forEach((b) => b.addEventListener("click", () => {
      if (busy) return; const i = +b.dataset.i; if (sel.has(i)) sel.delete(i); else sel.add(i);
      b.classList.toggle("sel", sel.has(i)); b.setAttribute("aria-pressed", String(sel.has(i))); snd.letter(); upd();
    }));
    $("cast").addEventListener("click", async () => {
      if (busy || !spell || !sel.size) return; busy = true;
      const total = [...sel].reduce((a, i) => a + hand[i], 0), okSum = total === N, okEl = spell === counter;
      await swing(); await fly(ELEM[spell].icon, 44, 96, 30);
      if (left(run)) return;
      if (okSum && okEl) {
        snd.hit(); shake(); st.mhp--; burst(cv.c, 24, [ELEM[spell].main, "#ffffff", "#ffe14d"]);
        if (st.mhp <= 0) return defeat();
        say(heroName(), esc(`Trafione! ${ELEM[spell].why}! ${mon.name} ma jeszcze ${st.mhp} ${st.mhp === 1 ? "serduszko" : "serduszka"}.`));
      } else {
        snd.bad();
        let msg;
        if (!okSum) msg = total < N ? `${total} to za mało! Moc potwora to ${N}.` : `${total} to za dużo! Moc potwora to dokładnie ${N}.`;
        else { wrongSpells++; msg = `${ELEM[spell].name} nie działa na ${mon.name}! ` + (wrongSpells >= 2 || GS.G.level === 1 ? `Na ${adjGen} potwora działa ${ELEM[counter].name}.` : "Zajrzyj do księgi czarów."); }
        if (!okSum && !okEl) msg += " I sprawdź czar w księdze.";
        say(mon.name, esc("Hi hi! " + msg));
      }
      await sleep(1800); if (left(run)) return;
      monsterTurn();
    });
    say(petName(), esc((prefix ? prefix + " " : "") + `Twoja tura! ${mon.name} ma moc ${N}. Wybierz czar i karty, które razem dają ${N}.`));
  }

  function monsterTurn() {
    const q = attackQ();
    $("ctl").innerHTML = `<div class="foe"><span class="power">🛡️ Tarcza: ile to?</span></div><div class="sum">${q.q}</div>
      <div class="opts">${q.opts.map((v) => `<button class="btn num" data-v="${v}">${v}</button>`).join("")}</div>`;
    say(mon.name, esc(`${mon.name} ${mon.attack}! Osłoń się tarczą: ${q.q}`), `${mon.name} ${mon.attack}! Osłoń się tarczą. ${q.say}?`);
    let done = false;
    app.querySelectorAll("[data-v]").forEach((b) => b.addEventListener("click", async () => {
      if (done) return; done = true;
      const ok = +b.dataset.v === q.ans;
      b.classList.add(ok ? "right" : "wrong");
      if (ok) {
        st.shield = 1; snd.letter(); await fly(E.icon, 92, 40, 30); snd.ok();
        say(heroName(), esc(`Tarcza! Odpowiedź ${q.ans} jest dobra. Atak odbity!`));
        await sleep(1300); st.shield = 0; if (left(run)) return;
      } else {
        await fly(E.icon, 92, 36, 30); st.flash = 1; setTimeout(() => (st.flash = 0), 600);
        const fainted = await hurt(); if (left(run)) return;
        if (!fainted) say(petName(), esc(`Ała! Dobra odpowiedź to ${q.ans}. Następnym razem się uda!`));
        await sleep(1800); if (left(run)) return;
      }
      playerTurn();
    }));
  }

  async function defeat() {
    snd.poof(); burst(cv.c, 40, PAL);
    await anim(600, (p) => { st.gone = p; });
    if (left(run)) return;
    const loot = ri(2, 3) + (GS.G.level - 1); GS.RUN.coins += loot; GS.RUN.beaten++; GS.G.fights++; save(); updHud(); snd.coin();
    say(heroName(), esc(`${pick(PRAISE)} ${mon.name} uciekł i zostawił ${loot} monety!`));
    nextRoom();
  }

  const intro = GS.G.fights === 0
    ? `Uwaga! ${mon.name} to potwór ${E.adj}. Każdy potwór boi się innego czaru, to jest w księdze czarów. Wybierz dobry czar i karty, które razem dają jego moc. Potem potwór zaatakuje, a ty osłonisz się tarczą.`
    : `Grrr! ${mon.name} zagradza drogę!`;
  playerTurn(intro);
}
