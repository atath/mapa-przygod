import { GS } from "./state.js";
import { snd } from "./audio.js";
import { camp } from "./camp.js";
import { chestRoom } from "./chest-room.js";
import { L } from "./content.js";
import { burst } from "./fx.js";
import { monsterRoom } from "./monster-room.js";
import { pathRoom } from "./path-room.js";
import { doorRoom, signRoom } from "./polish-rooms.js";
import { ICON } from "./props.js";
import { dialogHTML, gw, heroName, hudHTML, petName, say, wireHud, wireSay } from "./shell.js";
import { $, app, esc, pick, ri, shuffle, sleep } from "./util.js";
import { libraryHints, wellHearts } from "./camp-data.js";
import { tripEnd, tripStart } from "./stats.js";
import { save } from "./save.js";

/* ================== Expedition ================== */
export const PASSWORDS = [
  ["sowa", "🦉", "Mądry ptak. Nie śpi w nocy i woła: hu, hu!"], ["smok", "🐉", "Ma skrzydła i zieje ogniem."], ["lody", "🍦", "Zimne i słodkie, jemy je latem."],
  ["skarb", "💎", "Szukają go piraci. Ukrywa się w skrzyni."], ["zamek", "🏰", "Mieszka w nim król i królewna."], ["tęcza", "🌈", "Kolorowy łuk na niebie po deszczu."],
  ["grzyb", "🍄", "Rośnie w lesie. Ma kapelusz i nóżkę."], ["motyl", "🦋", "Ma kolorowe skrzydła. Kiedyś był gąsienicą."], ["zegar", "⏰", "Pokazuje, która jest godzina."],
  ["kwiat", "🌸", "Rośnie na łące, pachnie i ma płatki."], ["korona", "👑", "Nosi ją król na głowie."], ["jabłko", "🍎", "Rośnie na drzewie. Bywa czerwone albo zielone."],
  ["ślimak", "🐌", "Nosi swój domek na plecach."], ["wróżka", "🧚", "Ma różdżkę i spełnia życzenia."], ["rakieta", "🚀", "Leci w kosmos, do gwiazd."],
  ["gwiazda", "⭐", "Świeci w nocy wysoko na niebie."], ["księżyc", "🌙", "Świeci w nocy. Bywa okrągły albo jak rogalik."], ["pingwin", "🐧", "Ptak w czarnym fraku. Nie lata, ale pływa."]
].map(([w, e, r]) => ({ w, e, r }));
export const ROOM_NAME = { monster: "potwór", door: "zaczarowane drzwi", sign: "rozdroże" };
GS.RUN = null;
export function startTrip() {
  const lv = L(), pw = pick(PASSWORDS.filter((p) => p.w.length >= lv.pass[0] && p.w.length <= lv.pass[1]));
  const rooms = ["path", null, "path", null, "path", null, "chest"], spots = 6;
  // spread the password letters over the 6 rooms, in random order
  const order = shuffle(pw.w.split("").map((l, i) => i)), runes = Array.from({ length: spots }, () => []);
  order.forEach((idx, k) => runes[Math.floor((k * spots) / order.length)].push(pw.w[idx]));
  const maxHp = 3 + wellHearts(GS.G.camp);
  GS.RUN = { rooms, i: 0, hp: maxHp, maxHp, coins: 0, beaten: 0, seed: ri(1, 1e6), pw, runes, got: [], hints: libraryHints(GS.G.camp) };
  tripStart(GS.RUN);
  room();
}
export function roomShell() {
  GS.scene = null;
  app.innerHTML = `${hudHTML(GS.RUN)}<div id="sc"></div>${dialogHTML()}<div class="ctl" id="ctl"></div>`;
  wireHud(); wireSay();
  $("quitBtn").addEventListener("click", () => {
    if ($("quitBtn").dataset.armed) { try { speechSynthesis.cancel(); } catch (e) {} tripEnd(GS.RUN, false); save(); GS.RUN = null; camp(); return; }
    $("quitBtn").dataset.armed = "1"; say(petName(), "Wracamy do obozu? Kliknij namiot jeszcze raz. Monety z tej wyprawy przepadną.");
    setTimeout(() => { if ($("quitBtn")) delete $("quitBtn").dataset.armed; }, 4000);
  });
  try { window.scrollTo({ top: 0 }); } catch (e) {}
}
export function updHud() {
  const h = app.querySelector(".hearts"); if (h) h.innerHTML = Array.from({ length: GS.RUN.maxHp }, (_, i) => `<img src="${ICON.heart}" alt="" class="${i < GS.RUN.hp ? "" : "empty"}">`).join("");
  if ($("coinN")) $("coinN").textContent = GS.G.coins + GS.RUN.coins;
  const r = app.querySelector(".runes"); if (r) r.innerHTML = runesHTML();
}
export function runesHTML() { return GS.RUN.got.length ? GS.RUN.got.map((l) => `<b>${esc(l)}</b>`).join("") : `<em>runy hasła</em>`; }
export function room() {
  const t = GS.RUN.rooms[GS.RUN.i];
  ({ path: pathRoom, monster: monsterRoom, door: doorRoom, sign: signRoom, chest: chestRoom })[t]();
}
// Rooms wait on animations. If the child went back to camp (or started a new trip) meanwhile,
// the old room must not touch the new screen: every await is followed by this check.
export const left = (run) => GS.RUN !== run || !run;
export async function nextRoom() {
  const run = GS.RUN; if (!run) return;
  const got = run.runes[run.i] || [];
  if (got.length) {
    await sleep(1300); if (left(run)) return;
    GS.RUN.got = GS.RUN.got.concat(got); updHud(); snd.letter();
    say(petName(), `Zdobywamy ${got.length === 1 ? "runę" : "runy"}: ${got.join(", ").toUpperCase()}! Przyda się do hasła skrzyni.`, `Zdobywamy ${got.length === 1 ? "runę" : "runy"}: ${got.join(", ")}. Przyda się do hasła skrzyni.`);
    const r = app.querySelector(".runes"); if (r) burst(r, 18);
    await sleep(1900);
  } else await sleep(900);
  if (left(run)) return;
  GS.RUN.i++; room();
}
export async function hurt() {
  const run = GS.RUN; if (!run) return true;
  GS.RUN.hp--; updHud(); snd.bad();
  if (GS.RUN.hp > 0) return false;
  await sleep(700); if (left(run)) return true;
  const lost = Math.min(2, GS.RUN.coins); GS.RUN.coins -= lost; GS.RUN.hp = GS.RUN.maxHp; updHud();
  say(petName(), `Ojej, ${heroName()} się ${gw("zmęczyła", "zmęczył")}. Odpoczywamy chwilkę… Już lepiej! ${lost ? gw("Zgubiłyśmy ", "Zgubiliśmy ") + lost + " " + (lost === 1 ? "monetę" : "monety") + ". " : ""}Spróbujmy jeszcze raz.`);
  return true;
}

/* ---------- Library hints: the camp library gives a few per expedition ---------- */
export function libHintHTML() {
  return GS.RUN.hints > 0 ? `<button class="btn small hint" id="libHint">📖 Podpowiedź z biblioteczki (${GS.RUN.hints})</button>` : "";
}
// use() performs the hint and returns false when there was nothing to help with
export function wireLibHint(use) {
  const b = document.getElementById("libHint"); if (!b) return;
  b.addEventListener("click", () => {
    if (GS.RUN.hints <= 0 || use() === false) return;
    GS.RUN.hints--;
    if (GS.RUN.hints > 0) b.textContent = `📖 Podpowiedź z biblioteczki (${GS.RUN.hints})`; else b.remove();
  });
}
