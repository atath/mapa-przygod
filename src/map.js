import { GS } from "./state.js";
import { snd } from "./audio.js";
import { camp } from "./camp.js";
import { startTrip } from "./expedition.js";
import { lands, LAND_ORDER, UNLOCK_TRIPS } from "./lands.js";
import { bakeClearing } from "./scene.js";
import { save } from "./save.js";
import { petName, say, dialogHTML, hudHTML, wireHud, wireSay } from "./shell.js";
import { $, app, esc } from "./util.js";

/* ================== World map: pick a land ================== */
export function worldMap() {
  GS.scene = null;
  // e.g. a save from another device: enough trips already, but the land was never opened
  if (GS.G.trips >= UNLOCK_TRIPS && !GS.G.lands.includes("mountains")) { GS.G.lands.push("mountains"); save(); }
  const open = GS.G.lands, left = Math.max(0, UNLOCK_TRIPS - GS.G.trips);
  app.innerHTML = `${hudHTML(null)}<h1>Mapa przygód</h1>${dialogHTML()}
    <div class="lands">${LAND_ORDER.map((k, i) => {
      const L = lands()[k], ok = open.includes(k);
      return `<button class="land${ok ? "" : " locked"}" data-land="${k}" ${ok ? "" : 'aria-disabled="true"'}>
        <canvas width="256" height="96" aria-hidden="true"></canvas>
        <b>${esc(L.name)}</b><span>${esc(ok ? L.desc : `Otworzy się po ${UNLOCK_TRIPS} wyprawach. Zostało: ${left}.`)}</span></button>`;
    }).join("")}</div>
    <button class="btn small" id="backBtn">Wróć do obozu</button>`;
  wireHud(worldMap); wireSay();
  app.querySelectorAll(".land").forEach((b, i) => {
    const pic = bakeClearing(8, 3, 40 + i * 9, 2, lands()[b.dataset.land]);
    b.querySelector("canvas").getContext("2d").drawImage(pic, 0, 0, 256, 96);
    b.addEventListener("click", () => {
      const k = b.dataset.land;
      if (!open.includes(k)) { snd.bad(); say(petName(), `Tam jeszcze nie dojdziemy. Jeszcze ${left} ${left === 1 ? "wyprawa" : left < 5 ? "wyprawy" : "wypraw"} w lesie i ruszamy!`); return; }
      snd.letter(); startTrip(k);
    });
  });
  $("backBtn").addEventListener("click", camp);
  say(petName(), open.length > 1 ? "Dokąd dziś idziemy? Las czy Góry Zegarowe?" : "Na razie znamy drogę do lasu. Za kilka wypraw odkryjemy góry!");
}
