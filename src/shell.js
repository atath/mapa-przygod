import { GS } from "./state.js";
import { speak } from "./audio.js";
import { runesHTML } from "./expedition.js";
import { heroSprite } from "./hero.js";
import { PETS } from "./pets.js";
import { ICON } from "./props.js";
import { lands } from "./lands.js";
import { save } from "./save.js";
import { $, esc } from "./util.js";

/* ================== Shell bits ================== */
export function hudHTML(run) {
  lands(); // makes sure the land icons (pine, clock, hourglass, owl) are in ICON
  const hearts = run ? Array.from({ length: run.maxHp }, (_, i) => `<img src="${ICON.heart}" alt="" class="${i < run.hp ? "" : "empty"}">`).join("") : "";
  const TI = { path: run && run.land === "mountains" ? "pine" : "tree", monster: "heart", door: "door", sign: "sign", chest: "chest", clock: "clock", time: "time", logic: "logic" };
  const trail = run ? run.rooms.map((r, i) => `${i ? "<i></i>" : ""}<span class="${i < run.i ? "done" : i === run.i ? "now" : ""}">${r ? `<img src="${ICON[TI[r]]}" alt="">` : "<b>?</b>"}</span>`).join("") : "";
  return `<div class="hud">
    ${run ? `<span class="hearts" aria-label="Serduszka: ${run.hp}">${hearts}</span>` : `<button class="icon-btn" id="homeBtn" aria-label="Obóz">⛺</button>`}
    <span class="coins" aria-label="Monety"><img src="${ICON.coin}" alt=""><span id="coinN">${GS.G.coins + (run ? run.coins : 0)}</span></span>
    <button class="icon-btn" id="voiceBtn" aria-pressed="${GS.G.voice}" aria-label="Czytanie na głos">${GS.G.voice ? "🔊" : "🔇"}</button>
    ${run ? `<button class="icon-btn" id="quitBtn" aria-label="Wróć do obozu">⛺</button>` : ""}
    ${run ? `<div class="trail" aria-label="Postęp wyprawy">${trail}</div><div class="runes" aria-label="Zdobyte runy">${runesHTML()}</div>` : ""}
  </div>`;
}
export function wireHud(onHome) {
  $("voiceBtn").addEventListener("click", (e) => { GS.G.voice = !GS.G.voice; save(); e.currentTarget.setAttribute("aria-pressed", GS.G.voice); e.currentTarget.textContent = GS.G.voice ? "🔊" : "🔇"; if (!GS.G.voice) try { speechSynthesis.cancel(); } catch (er) {} });
  if ($("homeBtn")) $("homeBtn").addEventListener("click", onHome);
}
export let lastSay = "";
export function dialogHTML() { return `<div class="dialog" role="status" aria-live="polite"><div class="body"><span class="who" id="who"></span><span class="txt" id="txt"></span></div><button class="say" id="sayBtn" aria-label="Przeczytaj jeszcze raz">🔊</button></div>`; }
// say() shows plain text: names, words and numbers can never turn into markup.
// sayHTML() is only for the few lines that carry a picture or bold text on purpose.
export function say(who, text, spoken) { sayHTML(who, esc(text), spoken != null ? spoken : String(text)); }
export function sayHTML(who, html, spoken) {
  const oldErr = document.getElementById("sayErr"); if (oldErr) oldErr.remove();
  $("who").textContent = who || ""; $("txt").innerHTML = html;
  lastSay = spoken != null ? spoken : $("txt").textContent; speak(lastSay);
}
export function wireSay() { $("sayBtn").addEventListener("click", () => speak(lastSay, true)); }
export const isBoy = () => !!(GS.G.hero && GS.G.hero.gender === "boy");
export const gw = (fem, masc) => (isBoy() ? masc : fem);
export const heroName = () => GS.G.hero.name || gw("Bohaterka", "Bohater");
export const petName = () => GS.G.petNames[GS.G.hero.pet] || PETS[GS.G.hero.pet].def;
GS.HERO = null;
export function rebuildHero() { GS.HERO = heroSprite(GS.G.hero); }
