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
import { $, app, esc, pick, reduced, ri, shuffle, sleep, rnd } from "./util.js";
import { record, timer } from "./stats.js";
import { zl } from "./money.js";
import { dotRows, explain, genShield } from "./math-data.js";
import { showExplain } from "./explain-ui.js";
import { ARRIVE, SPELL_FX, aura, charge, fightFx, groundY, makeShield, silhouette, sparks, tornado } from "./fight-fx.js";

/* ---------- Monster room (spells + math, turn-based) ---------- */
export function monsterRoom() {
  roomShell();
  const lv = L(), el = pick(Object.keys(ELEM)), mon = monsterOf(el, ri(0, MON_DEFS[el].length - 1)), maxHp = GS.G.level === 1 ? 2 : 3;
  const E = ELEM[el], adjGen = E.adj.slice(0, -1) + "ego", counter = counterOf(el);
  const cv = mountCanvas(8, 4); $("sc").appendChild(cv.c); cv.c.setAttribute("aria-label", "Potwór na polanie");
  const bg = bakeClearing(8, 4, GS.RUN.seed + GS.RUN.i);
  const run = GS.RUN;
  // where things are in the scene (128×64): the hero's hand, the monster, its mouth, the rim of the shield
  const HAND = { x: 49, y: 31 }, HEROC = { x: 34, y: 32 }, MONC = { x: 100, y: 36 }, MOUTH = { x: 86, y: 38 }, EDGE = { x: 53, y: 35 };
  const FX = fightFx(), shield = makeShield(32, 33, 21), auraFx = FX.loop(aura(el, MONC));
  const st = { mhp: maxHp, gone: 0, lean: 0, monLean: 0, hop: 0, flash: 0, monHit: -1e9, heroHit: -1e9 };
  GS.scene = { cv, draw(t) {
    const x = cv.x, [ox, oy] = FX.offset(t);
    x.drawImage(bg, ox - 1, oy - 1, bg.width / 2 + 2, bg.height / 2 + 2);
    x.save(); x.translate(ox, oy);
    draw(x, PETSPR[GS.G.hero.pet], 4, 34 - bob(t, 2), 1.25);
    const hAge = t - st.heroHit, hk = hAge < 220 ? -Math.round(3 * (1 - hAge / 220)) : 0; // knocked back when hit
    if (!(st.flash && Math.floor(t / 80) % 2)) draw(x, GS.HERO, 20 + st.lean + hk, 16 - bob(t), 1.75);
    if (st.gone < 1) {
      // hit: a white flash and a step back; beaten: the whirlwind lifts it, spinning and shrinking
      const g = st.gone, age = t - st.monHit, kb = age < 260 ? Math.round(5 * (1 - age / 260)) : 0, sc = 2.25 * (1 - 0.45 * g);
      const mx = 100 - 8 * sc + kb + st.monLean + (g ? Math.round(Math.sin(t / 45) * 5 * g) : 0), my = 34 - 8 * sc - bob(t, 1) - st.hop - g * 18;
      const frame = mon.frames[Math.floor(t / 240) % 2];
      x.globalAlpha = 1 - g * g; draw(x, frame, mx, my, sc, g > 0);
      if (age < 130) { x.globalAlpha = 0.85; draw(x, silhouette(frame), mx, my, sc, true); }
      x.globalAlpha = 1 - g; x.drawImage(E.icon, 70, 1, 13, 13);
      for (let i = 0; i < maxHp; i++) { x.globalAlpha = (1 - g) * (i < st.mhp ? 1 : 0.22); x.drawImage(SPR.heart, 84 + i * 12, 1, 14, 14); }
      x.globalAlpha = 1;
    }
    const dt = FX.draw(x, t); shield.draw(x, t, dt);
    x.restore();
  } };
  const anim = (ms, fn) => new Promise((res) => { const t0 = performance.now(); function f(n) { const p = Math.min(1, (n - t0) / (reduced() ? ms / 3 : ms)); fn(p); if (p < 1) requestAnimationFrame(f); else res(); } requestAnimationFrame(f); });
  const SND = { fire: snd.fire, water: snd.water, earth: snd.earth };
  // The hero gathers the spell in the hand and lets it go; onImpact runs the moment it reaches the monster.
  // good: it hits (flash, step back, shake). Otherwise it dies out on the way and the monster hops with glee.
  async function castSpell(k, good, onImpact) {
    const d = FX.time(950);
    FX.play(charge(HAND, k), 280); snd.letter();
    await anim(280, (p) => { st.lean = Math.round(Math.sin((p * Math.PI) / 2) * 4); });
    if (left(run)) return;
    SND[k](); FX.play(SPELL_FX[k](HAND, MONC, { hit: good }), 950);
    anim(260, (p) => { st.lean = Math.round(4 * (1 - p)); });
    await sleep(d * ARRIVE); if (left(run)) return;
    if (good) { st.monHit = performance.now(); FX.shake(2, 240); }
    else anim(520, (p) => { st.hop = Math.round(Math.abs(Math.sin(p * Math.PI * 2)) * 3); });
    onImpact();
    await sleep(d * (1 - ARRIVE));
  }
  // The monster leans in and lets its element loose. blocked: the sphere stands and the attack breaks on it.
  // Otherwise the sphere flickers, too thin, and bursts when the attack arrives.
  async function monsterAttack(blocked, k = el) {
    const d = FX.time(850);
    FX.play(charge(MOUTH, k), 260);
    await anim(260, (p) => { st.monLean = -Math.round(Math.sin(p * Math.PI) * 5); });
    if (left(run)) return;
    if (blocked) { shield.show(); snd.shield(); } else shield.weak();
    SND[k](); FX.play(SPELL_FX[k](MOUTH, blocked ? EDGE : HEROC, { hit: true, spikes: !blocked, small: true, back: blocked ? 0.04 : 0 }), 850);
    await sleep(d * ARRIVE); if (left(run)) return;
    if (blocked) { shield.hit(EDGE.x, EDGE.y); snd.deflect(); FX.shake(1, 160); }
    else { shield.shatter(); snd.crack(); st.heroHit = performance.now(); st.flash = 1; setTimeout(() => (st.flash = 0), 600); FX.play(sparks(HEROC, k), 500); FX.shake(2, 260); }
    await sleep(d * (1 - ARRIVE));
  }
  // for the browser tests and the effect preview: play any effect on demand
  if (window.__LW_TEST) window.__LW_TEST.fight = { cast: castSpell, attack: monsterAttack, shield, whirl: () => FX.play(tornado(MONC.x, groundY(MONC.x) + 2), 1150) };

  function makeHand(T) {
    const sol = [];
    if (T > 18 || (T >= 6 && rnd() < lv.three)) { const a = ri(Math.max(1, T - 18), Math.min(9, T - 2)); const b = ri(Math.max(1, T - a - 9), Math.min(9, T - a - 1)); sol.push(a, b, T - a - b); }
    else { const a = ri(Math.max(1, T - 9), Math.min(9, T - 1)); sol.push(a, T - a); }
    const fill = []; while (sol.length + fill.length < lv.cards) { const v = ri(1, 9); if (v !== T) fill.push(v); }
    return shuffle(sol.concat(fill));
  }
  let wrongSpells = 0;
  function playerTurn(prefix) {
    const N = ri(lv.hp[0], lv.hp[1]), hand = makeHand(N), sel = new Set();
    let spell = null, busy = false; const took = timer();
    if (window.__LW_TEST) Object.assign(window.__LW_TEST, { T: N, el });
    $("ctl").innerHTML = `
      <div class="foe"><span class="power"><img src="${EICON[el]}" width="40" height="40" alt="">${esc(mon.name)} · moc <b>${N}</b></span></div>
      <div class="spells" id="spells">${Object.keys(ELEM).map((k) => `<button class="spell" data-s="${k}" aria-pressed="false" aria-label="${ELEM[k].name}, pokonuje: ${ELEM[ELEM[k].beats].name}"><img src="${EICON[k]}" alt="">${ELEM[k].name}<small>pokonuje <img src="${EICON[ELEM[k].beats]}" alt=""></small></button>`).join("")}</div>
      <div class="cards" id="cards">${hand.map((v, i) => `<button class="card" data-i="${i}" aria-pressed="false" aria-label="karta ${v}">${v}${GS.G.level === 1 ? `<span class="dots" aria-hidden="true">${dotRows(v).map((n) => `<span>${"<i></i>".repeat(n)}</span>`).join("")}</span>` : ""}</button>`).join("")}</div>
      <div class="sum" id="sum" aria-live="polite"></div>
      <button class="btn main" id="cast" disabled>✨ Rzuć czar</button>`;
    const upd = () => {
      const v = [...sel].map((i) => hand[i]);
      $("sum").textContent = v.length ? `${v.join(" + ")} = ${v.reduce((a, b) => a + b, 0)}` : "";
      $("cast").disabled = !v.length || !spell;
      $("cast").innerHTML = !spell ? "Wybierz czar" : !v.length ? "Wybierz karty" : `✨ Rzuć czar<span class="castsum">: ${v.join(" + ")} = ${v.reduce((a, b) => a + b, 0)}</span>`;
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
      const total = [...sel].reduce((a, i) => a + hand[i], 0), okSum = total === N, okEl = spell === counter, ms = took();
      record("math.cards", okSum, ms, `moc ${N}: ${[...sel].map((i) => hand[i]).join(" + ")} = ${total}`);
      record("logic.spell", okEl, ms, `${E.adj} → ${ELEM[spell].name}`);
      const good = okSum && okEl;
      await castSpell(spell, good, () => { if (good) { snd.hit(); st.mhp--; burst(cv.c, 24, [ELEM[spell].main, "#ffffff", "#ffe14d"]); } });
      if (left(run)) return;
      if (good) {
        if (st.mhp <= 0) return defeat();
        say(heroName(), `Trafione! ${ELEM[spell].why}! ${mon.name} ma jeszcze ${st.mhp} ${st.mhp === 1 ? "serduszko" : "serduszka"}.`);
      } else {
        snd.bad();
        let msg;
        if (!okSum) msg = total < N ? `${total} to za mało! Moc potwora to ${N}.` : `${total} to za dużo! Moc potwora to dokładnie ${N}.`;
        else { wrongSpells++; msg = `${ELEM[spell].name} nie działa na ${mon.name}! ` + (wrongSpells >= 2 || GS.G.level === 1 ? `Na ${adjGen} potwora działa ${ELEM[counter].name}.` : "Sprawdź, co pokonuje każdy czar."); }
        if (!okSum && !okEl) msg += " I sprawdź, co pokonuje każdy czar.";
        say(mon.name, "Hi hi! " + msg);
      }
      await sleep(1400); if (left(run)) return;
      monsterTurn();
    });
    // prefix: a string, or {show, speak} when the spoken version is longer than what fits on screen
    const show = prefix && typeof prefix === "object" ? prefix.show : prefix, spoken = prefix && typeof prefix === "object" ? prefix.speak : prefix;
    say(petName(), (show ? show + " " : "") + `Wybierz czar i karty, które razem dają ${N}.`,
      (spoken ? spoken + " " : "") + `Twoja tura! ${mon.name} ma moc ${N}. Wybierz czar i karty, które razem dają ${N}.`);
  }

  function monsterTurn() {
    const q = genShield(GS.G.level);
    $("ctl").innerHTML = `<div class="foe"><span class="power">🛡️ Tarcza: ile to?</span></div><div class="sum">${q.q}</div>
      <div class="opts">${q.opts.map((o) => `<button class="btn num" data-v="${o.v}">${o.v}</button>`).join("")}</div>`;
    say(mon.name, `${mon.name} ${mon.attack}! Osłoń się tarczą: ${q.q}`, `${mon.name} ${mon.attack}! Osłoń się tarczą. ${q.say}?`);
    let done = false; const took = timer();
    app.querySelectorAll("[data-v]").forEach((b) => b.addEventListener("click", async () => {
      if (done) return; done = true;
      const v = +b.dataset.v, ok = v === q.ans, tag = ok ? "" : (q.opts.find((o) => o.v === v) || {}).tag || "";
      record("math." + q.kind, ok, took(), `${q.show.replace("?", "□")} → ${v}${ok ? "" : ` (${q.ans}) ${tag}`}`); save();
      b.classList.add(ok ? "right" : "wrong");
      if (ok) {
        await monsterAttack(true); if (left(run)) return;
        snd.ok(); say(heroName(), `Tarcza! Odpowiedź ${q.ans} jest dobra. Atak odbity!`);
        await sleep(1000); shield.hide(); if (left(run)) return;
      } else {
        await monsterAttack(false); if (left(run)) return;
        const fainted = await hurt(); if (left(run)) return;
        // a picture of how to get there instead of just the number
        const m = explain(q);
        if (!fainted) say(petName(), `Ała! Zobacz, jak to policzyć. ${m.speak}`);
        await showExplain($("ctl"), m); if (left(run)) return;
      }
      playerTurn();
    }));
  }

  async function defeat() {
    // a whirlwind picks the monster up and carries it off
    auraFx.stop(); snd.whirl(); burst(cv.c, 40, PAL);
    FX.play(tornado(MONC.x, groundY(MONC.x) + 2), 1150);
    await anim(1000, (p) => { st.gone = p; });
    if (left(run)) return;
    const loot = ri(2, 3) + (GS.G.level - 1); GS.RUN.coins += loot; GS.RUN.beaten++; GS.G.fights++; save(); updHud(); snd.coin();
    say(heroName(), `${pick(PRAISE)} ${mon.name} uciekł i zostawił ${zl(loot)}!`);
    nextRoom();
  }

  const intro = GS.G.fights === 0
    ? { show: `Uwaga! ${mon.name} to potwór ${E.adj}. Pod każdym czarem widać, kogo pokonuje.`,
        speak: `Uwaga! ${mon.name} to potwór ${E.adj}. Każdy potwór boi się innego czaru: pod każdym czarem widać, kogo pokonuje. Wybierz dobry czar i karty, które razem dają jego moc. Potem potwór zaatakuje, a ty osłonisz się tarczą.` }
    : `Grrr! ${mon.name} zagradza drogę!`;
  playerTurn(intro);
}
