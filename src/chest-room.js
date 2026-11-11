import { GS } from "./state.js";
import { snd, speak } from "./audio.js";
import { camp } from "./camp.js";
import { L } from "./content.js";
import { roomShell, startTrip } from "./expedition.js";
import { bigEffect, praise } from "./fx.js";
import { PETSPR } from "./pets.js";
import { SPR } from "./props.js";
import { save } from "./save.js";
import { bakeClearing, bob, draw, mountCanvas } from "./scene.js";
import { heroName, petName, say } from "./shell.js";
import { $, app, esc, shuffle } from "./util.js";
import { growGarden, houseBonus } from "./camp-data.js";
import { libHintHTML, wireLibHint } from "./expedition.js";

/* ---------- Chest (password from collected runes) ---------- */
export function chestRoom() {
  roomShell();
  const lv = L(), pw = GS.RUN.pw, letters = pw.w.split("");
  if (window.__LW_TEST) window.__LW_TEST.pw = pw.w;
  const cv = mountCanvas(8, 4); $("sc").appendChild(cv.c); cv.c.setAttribute("aria-label", "Skrzynia ze skarbem");
  const bg = bakeClearing(8, 4, GS.RUN.seed + 999);
  const st = { open: false };
  GS.scene = { cv, draw(t) {
    const c = cv.x; c.drawImage(bg, 0, 0, bg.width / 2, bg.height / 2);
    draw(c, SPR.chest, 56, 18 - (st.open ? 0 : bob(t, 1)), 2);
    if (st.open) { for (let i = 0; i < 5; i++) draw(c, SPR.coin, 58 + i * 5, 8 - Math.round(Math.abs(Math.sin(t / 200 + i)) * 4), 0.9); }
    draw(c, PETSPR[GS.G.hero.pet], 6, 34 - bob(t, 2), 1.25); draw(c, GS.HERO, 22, 16 - bob(t), 1.75);
  } };
  let misses = 0, picShown = lv.picPass;
  const riddle = () => `<b>Zagadka:</b> ${esc(pw.r)}${picShown ? ` <span class="pic">${pw.e}</span>` : ""}`;
  say(petName(), `Skrzynia jest zamknięta na hasło! Ułóż je ze zdobytych run. ${riddle()}`, `Skrzynia jest zamknięta na hasło. Ułóż je ze zdobytych run. Zagadka: ${pw.r}`);
  $("ctl").innerHTML = `<div class="slots">${letters.map(() => `<span class="slot"></span>`).join("")}</div>
    <div class="tiles">${shuffle(letters).map((l) => `<button class="tile" data-l="${esc(l)}">${esc(l)}</button>`).join("")}</div>
    <div class="row">${picShown ? "" : `<button class="btn small" id="hintBtn">Podpowiedź</button>`}${libHintHTML()}</div>`;
  if ($("hintBtn")) $("hintBtn").addEventListener("click", () => { picShown = true; $("hintBtn").remove(); say(petName(), `${riddle()}`, `Zagadka: ${pw.r}. Spójrz na obrazek.`); });
  let pos = 0; const slots = app.querySelectorAll(".slot");
  wireLibHint(() => { const t = [...app.querySelectorAll(".tile:not(.used)")].find((b) => b.dataset.l === letters[pos]); if (!t) return false; t.click(); });
  app.querySelectorAll(".tile").forEach((b) => b.addEventListener("click", () => {
    if (pos >= letters.length || b.classList.contains("used")) return;
    if (b.dataset.l === letters[pos]) {
      slots[pos].textContent = letters[pos]; slots[pos].classList.add("filled"); b.classList.add("used"); pos++; snd.letter();
      if (pos === letters.length) openChest();
    } else {
      misses++; b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake"); snd.bad();
      if (misses === 2 && !picShown) { picShown = true; if ($("hintBtn")) $("hintBtn").remove(); say(petName(), `Podpowiem ci obrazkiem. ${riddle()}`, `Podpowiem ci obrazkiem. Zagadka: ${pw.r}`); }
      else if (misses >= 4) say(petName(), esc(`Następna runa to „${letters[pos]}”.`), `Następna litera to ${letters[pos]}.`);
      else say(petName(), "Ta runa jeszcze nie teraz. Pomyśl o zagadce.");
    }
  }));
  function openChest() {
    st.open = true; const house = houseBonus(GS.G.camp), bonus = 5 + GS.G.level * 2 + house; GS.RUN.coins += bonus;
    GS.G.coins += GS.RUN.coins; GS.G.trips++; growGarden(GS.G.camp); save();
    speak(pw.w); snd.fanfare(); praise(pw.w.toUpperCase() + "!"); bigEffect(); setTimeout(bigEffect, 700);
    $("coinN").textContent = GS.G.coins;
    setTimeout(() => say(heroName(), esc(`Hasło „${pw.w}” otworzyło skrzynię! Pokonane potwory: ${GS.RUN.beaten}. Zdobyte monety: ${GS.RUN.coins}${house ? ` (w tym ${house} od domu)` : ""}.${GS.G.camp.beds.length ? " W ogródku coś urosło!" : ""}`)), 900);
    $("ctl").innerHTML = `<button class="btn main" id="campBtn">Wracamy do obozu</button><button class="btn" id="againBtn">Następna wyprawa</button>`;
    $("campBtn").addEventListener("click", () => { GS.RUN = null; camp(); });
    $("againBtn").addEventListener("click", startTrip);
  }
}
