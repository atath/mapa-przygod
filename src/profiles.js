import { GS } from "./state.js";
import { snd } from "./audio.js";
import { camp } from "./camp.js";
import { creator } from "./creator.js";
import { HAIR, HAIRC, HATS, OUTFITS, SKINS, heroSprite } from "./hero.js";
import { sha256, validPin } from "./parent.js";
import { PETS } from "./pets.js";
import { ICON } from "./props.js";
import { profiles, reloadDB, removeProfile, save, selectProfile, whenStale } from "./save.js";
import { rebuildHero } from "./shell.js";
import { url } from "./sprites.js";
import { $, app, esc } from "./util.js";

/* ================== Start: parent PIN on first run, then "Who's playing?" ================== */
// Anything the game does not know (from an old version or an edited file) falls back to a default,
// so a bad save never stops the game from starting.
function repair(p) {
  const h = p.hero;
  if (!h.name) h.name = h.gender === "boy" ? "Bohater" : "Bohaterka";
  if (h.gender !== "boy") h.gender = "girl";
  if (!HAIR[h.hair] || (HAIR[h.hair].gender || "girl") !== h.gender) h.hair = h.gender === "boy" ? "bshort" : "tails";
  const color = (v, list) => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : list[0]);
  h.hairColor = color(h.hairColor, HAIRC); h.skin = color(h.skin, SKINS); h.outfit = color(h.outfit, OUTFITS);
  p.pets = p.pets.filter((k, i) => PETS[k] && p.pets.indexOf(k) === i); if (!p.pets.length) p.pets = ["cat"];
  if (!PETS[h.pet] || !p.pets.includes(h.pet)) h.pet = p.pets[0];
  p.owned = p.owned.filter((k, i) => HATS[k] && p.owned.indexOf(k) === i); if (!p.owned.includes("none")) p.owned.unshift("none");
  if (!HATS[h.hat] || !p.owned.includes(h.hat)) h.hat = "none";
}
export function boot() {
  // a profile whose character was never finished is not a player yet
  for (const p of profiles()) if (!p.hero) removeProfile(p.id);
  profiles().forEach(repair); if (profiles().length) save();
  if (!GS.DB.settings.pinHash) return pinSetup(boot);
  const list = profiles();
  if (!list.length) return creator(false, true);
  if (list.length === 1) { selectProfile(list[0].id); rebuildHero(); return camp(); }
  whoPlays();
}

// another tab saved: this copy stops writing until it reloads (see save.js)
whenStale(() => {
  if (document.getElementById("staleBox")) return;
  const d = document.createElement("div"); d.id = "staleBox"; d.className = "stale"; d.setAttribute("role", "alertdialog");
  d.innerHTML = `<div class="panel"><h2>Gra jest otwarta jeszcze gdzieś indziej</h2>
    <p>W innej karcie albo oknie zapisały się nowsze postępy. Żeby ich nie nadpisać, wczytaj je tutaj.</p>
    <button class="btn main" id="staleBtn">Wczytaj najnowszy zapis</button></div>`;
  document.body.appendChild(d);
  d.querySelector("#staleBtn").addEventListener("click", () => {
    try { speechSynthesis.cancel(); } catch (e) {}
    GS.RUN = null; reloadDB(); d.remove(); boot();
  });
});

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
    GS.DB.settings.pinHash = await sha256(a);
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
        <span class="mini-coins"><img src="${ICON.coin}" alt="">${p.coins} zł</span></button>`).join("")}
      <button class="player add" id="addPlayer"><span class="plus" aria-hidden="true">+</span><b>Nowy gracz</b></button>
    </div>`;
  app.querySelectorAll(".player[data-id]").forEach((b) => b.addEventListener("click", () => {
    snd.letter(); selectProfile(b.dataset.id); rebuildHero(); camp();
  }));
  $("addPlayer").addEventListener("click", () => creator(false, true));
  try { window.scrollTo({ top: 0 }); } catch (e) {}
}
