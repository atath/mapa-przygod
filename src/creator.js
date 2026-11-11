import { GS } from "./state.js";
import { snd, speak } from "./audio.js";
import { camp } from "./camp.js";
import { HAIR, HAIRC, OUTFITS, SKINS, heroSprite } from "./hero.js";
import { PETS, PETSPR } from "./pets.js";
import { addProfile, blankProfile, profiles, save } from "./save.js";
import { whoPlays } from "./profiles.js";
import { bakeClearing, bob, draw, mountCanvas } from "./scene.js";
import { rebuildHero } from "./shell.js";
import { url } from "./sprites.js";
import { $, app, esc } from "./util.js";

/* ================== Creator ================== */
export function creator(fromCamp, newPlayer) {
  GS.scene = null;
  const isNew = !!newPlayer || !GS.G;
  const prev = GS.G;
  if (isNew) GS.G = blankProfile();
  const h = GS.G.hero ? Object.assign({ gender: "girl" }, GS.G.hero) : { gender: "girl", name: "", hair: "tails", hairColor: HAIRC[1], skin: SKINS[0], outfit: OUTFITS[0], pet: "cat", petName: "", hat: "none" };
  app.innerHTML = `<h1>${fromCamp ? "Zmień wygląd" : "Mapa Przygód"}</h1>
    <p class="sub">${fromCamp ? "Wybierz, jak ma wyglądać twoja postać." : "Stwórz postać i wybierz zwierzaka na wyprawę."}</p>
    <div id="pv"></div>
    <div class="panel">
      <div class="field"><span>Kim grasz?</span><div class="choices" id="genCh"><button class="choice" data-v="girl">👧 Dziewczynka</button><button class="choice" data-v="boy">👦 Chłopiec</button></div></div>
      <label class="field"><span>Imię</span><input type="text" id="nameIn" maxlength="14" autocomplete="off" value="${esc(h.name)}" placeholder="np. Ola albo Staś"></label>
      <div class="field"><span>Fryzura</span><div class="choices" id="hairCh"></div></div>
      <div class="field"><span>Kolor włosów</span><div class="choices" id="hcCh">${HAIRC.map((c) => `<button class="swatch" data-v="${c}" style="background:${c}" aria-label="kolor ${c}"></button>`).join("")}</div></div>
      <div class="field"><span>Skóra</span><div class="choices" id="skCh">${SKINS.map((c) => `<button class="swatch" data-v="${c}" style="background:${c}" aria-label="odcień ${c}"></button>`).join("")}</div></div>
      <div class="field"><span>Ubranie</span><div class="choices" id="ouCh">${OUTFITS.map((c) => `<button class="swatch" data-v="${c}" style="background:${c}" aria-label="kolor ${c}"></button>`).join("")}</div></div>
      <div class="field"><span>Zwierzak</span><div class="choices" id="petCh">${GS.G.pets.map((k) => `<button class="choice" data-v="${k}"><img src="${url(PETSPR[k])}" alt="">${PETS[k].name}</button>`).join("")}</div>
        <span style="font-weight:700;color:var(--muted);font-size:.95rem">Kolejne zwierzaki odblokujesz w sklepie za monety z wypraw.</span></div>
      <label class="field"><span>Imię zwierzaka</span><input type="text" id="petIn" maxlength="14" autocomplete="off" value="${esc(GS.G.petNames[h.pet] || "")}" placeholder=""></label>
    </div>
    <button class="btn main" id="goBtn">${fromCamp ? "Gotowe" : "Ruszamy!"}</button>${isNew && profiles().length ? `<button class="btn" id="cancelBtn">Wróć</button>` : ""}`;
  const cv = mountCanvas(6, 3); $("pv").appendChild(cv.c);
  const bg = bakeClearing(6, 3, 7);
  let spr = heroSprite(h);
  GS.scene = { cv, draw(t) { const x = cv.x; x.drawImage(bg, 0, 0, bg.width / 2, bg.height / 2); draw(x, spr, 26, 6 - bob(t), 2); draw(x, PETSPR[h.pet], 56, 18 - bob(t, 1.7), 1.5); } };
  function group(id, key) {
    const btns = [...$(id).querySelectorAll("button")];
    const mark = () => btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === h[key])));
    btns.forEach((b) => b.addEventListener("click", () => {
      if (key === "pet") { const v = $("petIn").value.trim(); if (v) GS.G.petNames[h.pet] = v; else delete GS.G.petNames[h.pet]; }
      h[key] = b.dataset.v; mark(); spr = heroSprite(h); snd.letter();
      if (key === "pet") { $("petIn").placeholder = PETS[h.pet].def; $("petIn").value = GS.G.petNames[h.pet] || ""; }
    }));
    mark();
  }
  function hairButtons() {
    $("hairCh").innerHTML = Object.keys(HAIR).filter((k) => (HAIR[k].gender || "girl") === h.gender).map((k) => `<button class="choice" data-v="${k}">${HAIR[k].name}</button>`).join("");
    group("hairCh", "hair");
  }
  const genBtns = [...$("genCh").querySelectorAll("button")];
  const markGen = () => genBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === h.gender)));
  genBtns.forEach((b) => b.addEventListener("click", () => {
    if (h.gender === b.dataset.v) return;
    h.gender = b.dataset.v; h.hair = h.gender === "boy" ? "bshort" : "tails"; markGen(); hairButtons(); spr = heroSprite(h); snd.letter();
  }));
  markGen(); hairButtons();
  group("hcCh", "hairColor"); group("skCh", "skin"); group("ouCh", "outfit"); group("petCh", "pet");
  $("petIn").placeholder = PETS[h.pet].def;
  $("goBtn").addEventListener("click", () => {
    h.name = $("nameIn").value.trim(); delete h.petName;
    const pn = $("petIn").value.trim(); if (pn) GS.G.petNames[h.pet] = pn; else delete GS.G.petNames[h.pet];
    if (!h.name) { $("nameIn").focus(); $("nameIn").classList.remove("shake"); void $("nameIn").offsetWidth; $("nameIn").classList.add("shake"); speak("Wpisz imię."); return; }
    GS.G.hero = h; if (isNew) addProfile(GS.G); else save(); rebuildHero(); camp();
  });
  if ($("cancelBtn")) $("cancelBtn").addEventListener("click", () => { GS.G = prev; whoPlays(); });
  try { window.scrollTo({ top: 0 }); } catch (e) {}
}
