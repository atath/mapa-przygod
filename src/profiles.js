import { GS } from "./state.js";
import { snd } from "./audio.js";
import { camp } from "./camp.js";
import { creator } from "./creator.js";
import { HAIR, heroSprite } from "./hero.js";
import { sha256, validPin } from "./parent.js";
import { ICON } from "./props.js";
import { profiles, removeProfile, save, selectProfile } from "./save.js";
import { rebuildHero } from "./shell.js";
import { url } from "./sprites.js";
import { $, app, esc } from "./util.js";

/* ================== Start: parent PIN on first run, then "Who's playing?" ================== */
export function boot() {
  // a profile whose character was never finished is not a player yet
  for (const p of profiles()) if (!p.hero) removeProfile(p.id);
  for (const p of profiles()) if (!HAIR[p.hero.hair]) p.hero.hair = p.hero.gender === "boy" ? "bshort" : "tails";
  if (!GS.DB.settings.pinHash) return pinSetup(boot);
  const list = profiles();
  if (!list.length) return creator(false, true);
  if (list.length === 1) { selectProfile(list[0].id); rebuildHero(); return camp(); }
  whoPlays();
}

export function pinSetup(next) {
  GS.scene = null;
  app.innerHTML = `<h1>Mapa Przygód</h1>
    <p class="sub">Witaj! Zanim dziecko zacznie grać, ustaw PIN rodzica.</p>
    <form class="panel" id="pinSet" novalidate>
      <p class="note muted">PIN otwiera panel rodzica: poziom trudności, kopię zapisu gry i usuwanie graczy. Wybierz od 4 do 8 cyfr, których dziecko nie zna.</p>
      <label class="field"><span>PIN</span><input type="password" id="pin1" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="new-password"></label>
      <label class="field"><span>Powtórz PIN</span><input type="password" id="pin2" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="new-password"></label>
      <button class="btn main" type="submit">Zapisz PIN i zaczynamy</button>
      <p class="note err" id="pinSetMsg" role="status"></p>
    </form>
    <p class="sub small">Masz kopię zapisu z innego urządzenia? Wczytasz ją później w panelu „Dla rodzica”.</p>`;
  $("pin1").focus();
  $("pinSet").addEventListener("submit", async (e) => {
    e.preventDefault();
    const a = $("pin1").value, b = $("pin2").value;
    if (!validPin(a)) { $("pinSetMsg").textContent = "PIN musi mieć od 4 do 8 cyfr."; return; }
    if (a !== b) { $("pinSetMsg").textContent = "PIN-y się różnią. Wpisz ten sam dwa razy."; return; }
    try { GS.DB.settings.pinHash = await sha256(a); }
    catch (er) { $("pinSetMsg").textContent = "Ta przeglądarka nie obsługuje szyfrowania PIN-u. Otwórz grę przez https albo z domowego serwera."; return; }
    save(); next();
  });
}

export function whoPlays() {
  GS.scene = null;
  const list = profiles();
  app.innerHTML = `<h1>Kto gra?</h1>
    <div class="players">${list.map((p) => `<button class="player" data-id="${p.id}">
        <img src="${url(heroSprite(p.hero))}" alt="">
        <b>${esc(p.hero.name)}</b>
        <span class="mini-coins"><img src="${ICON.coin}" alt="">${p.coins}</span></button>`).join("")}
      <button class="player add" id="addPlayer"><span class="plus" aria-hidden="true">+</span><b>Nowy gracz</b></button>
    </div>`;
  app.querySelectorAll(".player[data-id]").forEach((b) => b.addEventListener("click", () => {
    snd.letter(); selectProfile(b.dataset.id); rebuildHero(); camp();
  }));
  $("addPlayer").addEventListener("click", () => creator(false, true));
  try { window.scrollTo({ top: 0 }); } catch (e) {}
}
