import { GS } from "./state.js";
import { creator } from "./creator.js";
import { startTrip } from "./expedition.js";
import { PETSPR } from "./pets.js";
import { SPR } from "./props.js";
import { parentHTML, wireParent } from "./parent.js";
import { boot, whoPlays } from "./profiles.js";
import { bakeClearing, bob, draw, mountCanvas } from "./scene.js";
import { dialogHTML, gw, heroName, hudHTML, petName, say, wireHud, wireSay } from "./shell.js";
import { shop } from "./shop.js";
import { $, app, esc, pick } from "./util.js";

/* ================== Camp ================== */
export function camp() {
  GS.scene = null;
  app.innerHTML = `${hudHTML(null)}<h1>Obóz</h1><div id="sc"></div>${dialogHTML()}
    <button class="btn main" id="tripBtn">Wyprawa do lasu</button>
    <div class="row"><button class="btn small" id="shopBtn">Sklep: czapki i zwierzaki</button><button class="btn small" id="lookBtn">Zmień wygląd</button><button class="btn small" id="playersBtn">Gracze</button></div>
    ${parentHTML()}`;
  wireHud(camp); wireSay();
  const cv = mountCanvas(8, 4); $("sc").appendChild(cv.c);
  const bg = bakeClearing(8, 4, 11);
  GS.scene = { cv, draw(t) { const x = cv.x; x.drawImage(bg, 0, 0, bg.width / 2, bg.height / 2); draw(x, (Math.floor(t / 180) % 2) ? SPR.fireA : SPR.fireB, 56, 30, 1.25); draw(x, GS.HERO, 28, 18 - bob(t), 1.5); draw(x, PETSPR[GS.G.hero.pet], 88, 36 - bob(t, 2), 1.25); } };
  const lines = [`Cześć, ${heroName()}! Las czeka na nas.`, `${petName()} merda ogonkiem. Idziemy na przygodę?`, `Ognisko grzeje. ${gw("Gotowa", "Gotowy")} na wyprawę?`];
  say(petName(), esc(GS.G.trips ? pick(lines) : `Cześć, ${heroName()}! Jestem ${petName()}. W lesie są potwory i zaczarowane drzwi. Pomożesz mi?`));
  $("tripBtn").addEventListener("click", startTrip);
  $("shopBtn").addEventListener("click", shop);
  $("lookBtn").addEventListener("click", () => creator(true));
  $("playersBtn").addEventListener("click", whoPlays);
  wireParent((kind) => { if (kind === "deleted" || kind === "imported") boot(); });
}

