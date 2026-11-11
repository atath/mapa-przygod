import { GS } from "./state.js";
import { snd } from "./audio.js";
import { buildScreen } from "./build.js";
import { DECOR_SPR, HOUSE, LIBRARY, PLANT_SPR, WELL } from "./camp-art.js";
import { CAMP_COLS, CAMP_ROWS, DECOR, FIRE_TILE, PLANTS, PLANT_NAME, RIPE, blockedTiles } from "./camp-data.js";
import { creator } from "./creator.js";
import { startTrip } from "./expedition.js";
import { burst } from "./fx.js";
import { parentHTML, wireParent } from "./parent.js";
import { PETSPR } from "./pets.js";
import { boot, whoPlays } from "./profiles.js";
import { SPR } from "./props.js";
import { save } from "./save.js";
import { bakeClearing, bob, draw, mountCanvas } from "./scene.js";
import { dialogHTML, gw, heroName, hudHTML, petName, say, wireHud, wireSay } from "./shell.js";
import { shop } from "./shop.js";
import { url } from "./sprites.js";
import { $, app, esc, pick, reduced as reducedMotion } from "./util.js";

/* ================== Camp ================== */
const PEN_SIZE = [0, 2, 4, 9];

export function camp() {
  GS.scene = null;
  const C = GS.G.camp;
  app.innerHTML = `${hudHTML(null)}<h1>Obóz</h1><div id="sc"></div>${dialogHTML()}
    <div class="decor-bar" id="decorBar" hidden></div>
    <button class="btn main" id="tripBtn">Wyprawa do lasu</button>
    <div class="row"><button class="btn small gold" id="buildBtn">Budowa obozu</button><button class="btn small" id="editBtn">Ustaw ozdoby</button></div>
    <div class="row"><button class="btn small" id="shopBtn">Sklep: czapki i zwierzaki</button><button class="btn small" id="lookBtn">Zmień wygląd</button><button class="btn small" id="playersBtn">Gracze</button></div>
    ${parentHTML()}`;
  wireHud(camp); wireSay();
  const cv = mountCanvas(CAMP_COLS, CAMP_ROWS); $("sc").appendChild(cv.c); cv.c.setAttribute("aria-label", "Obóz");
  const bg = bakeClearing(CAMP_COLS, CAMP_ROWS, 11);
  const blocked = blockedTiles();
  let editing = false, placing = null; // placing = decor key chosen from the bar
  const penPets = GS.G.pets.filter((p) => p !== GS.G.hero.pet).slice(0, PEN_SIZE[C.b.pen]);

  GS.scene = { cv, draw(t) {
    const x = cv.x; x.drawImage(bg, 0, 0, bg.width / 2, bg.height / 2);
    if (editing) {
      for (let r = 1; r < CAMP_ROWS; r++) for (let c = 0; c < CAMP_COLS; c++) if (!blocked.has(`${c},${r}`)) {
        const taken = C.decor.some((d) => d.c === c && d.r === r);
        x.strokeStyle = taken ? "rgba(255,255,255,.75)" : "rgba(255,240,150,.85)"; x.lineWidth = 0.75; x.strokeRect(c * 16 + 1, r * 16 + 1, 14, 14);
      }
    }
    // buildings
    const H = HOUSE[C.b.house]; draw(x, H, 0, 48 - H.height + 1, 2);
    // pen: fence around 2 × 2 tiles, the extra pets wander inside
    if (C.b.pen) {
      const X = 1, Y = 49, W = 30, H = 30;
      x.fillStyle = "#7a4b2a"; x.fillRect(X, Y, W, 1.2); x.fillRect(X, Y + H - 1.2, W, 1.2); x.fillRect(X, Y, 1.2, H); x.fillRect(X + W - 1.2, Y, 1.2, H);
      x.fillStyle = "#b07440"; for (let i = 0; i <= 5; i++) { x.fillRect(X + (i * W) / 5 - 0.6, Y - 1.5, 1.4, 3.5); x.fillRect(X + (i * W) / 5 - 0.6, Y + H - 2, 1.4, 3.5); }
      penPets.forEach((k, i) => {
        const ph = i * 1.7, wx = reducedMotion() ? 0 : Math.sin(t / 1400 + ph) * 4;
        draw(x, PETSPR[k], 3 + (i % 3) * 8 + wx, 52 + Math.floor(i / 3) * 8 - bob(t, ph), 0.55);
      });
    }
    if (C.b.library) draw(x, LIBRARY[C.b.library], 47, 11, 1.3);
    if (C.b.well) draw(x, WELL[C.b.well], 94, 11, 1.3);
    C.beds.forEach((b, i) => {
      const bx = (5 + i) * 16, by = 4 * 16;
      x.fillStyle = "#8a5a34"; x.fillRect(bx + 1, by + 9, 14, 6); x.fillStyle = "#6e4626"; x.fillRect(bx + 1, by + 13, 14, 2);
      draw(x, PLANT_SPR[b.p][b.s], bx, by - 2 - (b.s === RIPE ? bob(t, i) : 0), 1, true);
      if (b.s === RIPE && !reducedMotion() && Math.floor(t / 400 + i) % 3 === 0) { x.fillStyle = "#fff6c9"; x.fillRect(bx + 12, by + 1, 1.5, 1.5); }
    });
    C.decor.forEach((d) => draw(x, DECOR_SPR[d.k], d.c * 16, d.r * 16 - 2, 1));
    draw(x, (Math.floor(t / 180) % 2) ? SPR.fireA : SPR.fireB, FIRE_TILE[0] * 16 - 2, FIRE_TILE[1] * 16 - 4, 1.25);
    draw(x, GS.HERO, 30, 38 - bob(t), 1.3);
    draw(x, PETSPR[GS.G.hero.pet], 66, 48 - bob(t, 2), 1.05);
  } };

  // tap on the camp: harvest, place or pick up decorations
  cv.c.addEventListener("click", (e) => {
    const r0 = cv.c.getBoundingClientRect(), b = 4;
    const lx = ((e.clientX - r0.left - b) / (r0.width - 2 * b)) * CAMP_COLS * 16, ly = ((e.clientY - r0.top - b) / (r0.height - 2 * b)) * CAMP_ROWS * 16;
    const c = Math.floor(lx / 16), r = Math.floor(ly / 16);
    if (editing) return editTap(c, r);
    if (r === 4 && c >= 5 && c - 5 < C.beds.length) harvest(c - 5, e);
  });

  function harvest(i, e) {
    const bed = C.beds[i];
    if (bed.s < RIPE) { say(petName(), esc(`Ta grządka jeszcze rośnie. Po ${RIPE - bed.s === 1 ? "następnej wyprawie" : `${RIPE - bed.s} wyprawach`} będzie plon.`)); return; }
    const got = PLANT_NAME[bed.p];
    GS.G.coins += 3; bed.p = pick(PLANTS); bed.s = 0; save();
    snd.coin(); burst(cv.c, 18); $("coinN").textContent = GS.G.coins;
    say(heroName(), esc(`Zebrane: ${got}! +3 monety. Posiałam nowe nasionko.`.replace("Posiałam", gw("Posiałam", "Posiałem"))));
  }

  // decorations: the bar lists what is in the bag; edit mode shows free tiles
  function renderBar() {
    const inv = Object.keys(C.inv).filter((k) => C.inv[k] > 0);
    $("decorBar").hidden = !editing;
    $("decorBar").innerHTML = (inv.length
      ? inv.map((k) => `<button class="decor-chip" data-k="${k}" aria-pressed="${placing === k}"><img src="${url(DECOR_SPR[k])}" alt="">${esc(DECOR[k].name)} <b>×${C.inv[k]}</b></button>`).join("")
      : `<span class="note muted">Nie masz ozdób w plecaku. Kupisz je w „Budowie obozu”.</span>`)
      + `<span class="note muted">${placing ? "Dotknij wolnego pola w obozie." : C.decor.length ? "Wybierz ozdobę albo dotknij ustawionej, żeby ją zabrać." : "Wybierz ozdobę."}</span>`;
    $("decorBar").querySelectorAll(".decor-chip").forEach((b) => b.addEventListener("click", () => { placing = placing === b.dataset.k ? null : b.dataset.k; snd.letter(); renderBar(); }));
  }
  function editTap(c, r) {
    if (c < 0 || r < 1 || c >= CAMP_COLS || r >= CAMP_ROWS || blocked.has(`${c},${r}`)) { if (placing) say(petName(), "Tam nic nie postawimy. Wybierz pole z żółtą ramką."); return; }
    const at = C.decor.findIndex((d) => d.c === c && d.r === r);
    if (at >= 0) { const d = C.decor.splice(at, 1)[0]; C.inv[d.k] = (C.inv[d.k] || 0) + 1; snd.letter(); }
    else if (placing && C.inv[placing] > 0) { C.decor.push({ k: placing, c, r }); C.inv[placing]--; if (!C.inv[placing]) placing = null; snd.coin(); }
    else return;
    save(); renderBar();
  }
  $("editBtn").addEventListener("click", () => {
    editing = !editing; placing = null; $("editBtn").textContent = editing ? "Gotowe" : "Ustaw ozdoby"; renderBar();
    if (editing) say(petName(), "Urządzamy obóz! Wybierz ozdobę i dotknij pola z żółtą ramką.");
  });

  const ripe = C.beds.filter((b) => b.s === RIPE).length;
  const lines = [`Cześć, ${heroName()}! Las czeka na nas.`, `${petName()} merda ogonkiem. Idziemy na przygodę?`, `Ognisko grzeje. ${gw("Gotowa", "Gotowy")} na wyprawę?`];
  say(petName(), esc(ripe ? `W ogródku coś dojrzało! Dotknij grządki, żeby zebrać plon.`
    : GS.G.trips ? pick(lines) : `Cześć, ${heroName()}! Jestem ${petName()}. W lesie są potwory i zaczarowane drzwi. Za monety z wypraw zbudujemy tu wspaniały obóz!`));
  $("tripBtn").addEventListener("click", startTrip);
  $("buildBtn").addEventListener("click", buildScreen);
  $("shopBtn").addEventListener("click", shop);
  $("lookBtn").addEventListener("click", () => creator(true));
  $("playersBtn").addEventListener("click", whoPlays);
  wireParent((kind) => { if (kind === "deleted" || kind === "imported") boot(); });
}
