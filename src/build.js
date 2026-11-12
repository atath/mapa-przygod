import { GS } from "./state.js";
import { snd } from "./audio.js";
import { camp } from "./camp.js";
import { DECOR_SPR, HOUSE, LIBRARY, PLANT_SPR, WELL } from "./camp-art.js";
import { BUILDINGS, BUILD_ORDER, DECOR, PLANTS } from "./camp-data.js";
import { burst } from "./fx.js";
import { PETSPR } from "./pets.js";
import { ICON } from "./props.js";
import { save } from "./save.js";
import { dialogHTML, hudHTML, petName, say, wireHud, wireSay } from "./shell.js";
import { url } from "./sprites.js";
import { pay } from "./money-ui.js";
import { zl, zlGen } from "./money.js";
import { $, app, esc, ri } from "./util.js";

/* ================== Camp building screen ==================
   Every purchase is paid with coins and notes from the wallet (see money-ui.js):
   too much money on the counter means working out the change, a right answer gives 1 zł off. */

function preview(k, lvl) {
  if (k === "house") return HOUSE[lvl];
  if (k === "well") return WELL[lvl];
  if (k === "library") return LIBRARY[lvl];
  if (k === "garden") return PLANT_SPR.pumpkin[3];
  return PETSPR.dog;
}

export function buildScreen() {
  GS.scene = null;
  const C = GS.G.camp;
  let tab = "build", asking = null;
  app.innerHTML = `${hudHTML(null)}<h1>Budowa obozu</h1>${dialogHTML()}
    <div class="tabs"><button class="choice" id="tabB" aria-pressed="true">Budynki</button><button class="choice" id="tabD" aria-pressed="false">Ozdoby</button></div>
    <div class="shop" id="list"></div>
    <button class="btn" id="backBtn">Wróć do obozu</button>`;
  wireHud(camp); wireSay();

  function render() {
    $("tabB").setAttribute("aria-pressed", String(tab === "build")); $("tabD").setAttribute("aria-pressed", String(tab === "decor"));
    if (tab === "build") {
      $("list").innerHTML = BUILD_ORDER.map((k) => {
        const B = BUILDINGS[k], l = C.b[k], max = l >= 3, next = max ? l : l + 1;
        return `<button class="item build" data-k="${k}" ${max ? 'aria-disabled="true"' : ""}>
          <img src="${url(preview(k, next))}" alt="">
          <span>${esc(B.name)}</span>
          <small>${l ? `Teraz: ${esc(B.levels[l])}` : k === "house" ? `Teraz: ${esc(B.levels[0])}` : "Jeszcze nie ma"}</small>
          <small class="eff">${max ? esc(B.effect(l)) : `${esc(B.levels[next])}: ${esc(B.effect(next))}`}</small>
          <span class="price">${max ? "Gotowe ✓" : `${B.cost[l]} zł`}</span></button>`;
      }).join("");
    } else {
      $("list").innerHTML = Object.keys(DECOR).map((k) => `<button class="item build" data-k="${k}">
          <img src="${url(DECOR_SPR[k])}" alt=""><span>${esc(DECOR[k].name)}</span>
          <small>W plecaku: ${C.inv[k] || 0}, w obozie: ${C.decor.filter((d) => d.k === k).length}</small>
          <span class="price">${DECOR[k].price} zł</span></button>`).join("");
    }
    $("list").querySelectorAll(".item").forEach((b) => b.addEventListener("click", () => choose(b)));
  }

  function choose(btn) {
    if (asking) return;
    const k = btn.dataset.k;
    let price, label, apply;
    if (tab === "build") {
      const B = BUILDINGS[k], l = C.b[k]; if (l >= 3) { say(petName(), `${B.name} jest już w pełni rozbudowany.`); return; }
      price = B.cost[l]; label = `${B.levels[l + 1]}`;
      apply = () => {
        C.b[k] = l + 1;
        if (k === "garden") while (C.beds.length < C.b.garden) C.beds.push({ p: PLANTS[ri(0, PLANTS.length - 1)], s: 0 });
        return `Zbudowane: ${B.levels[l + 1]}! ${B.effect(l + 1)}.`;
      };
    } else {
      price = DECOR[k].price; label = DECOR[k].name;
      apply = () => { C.inv[k] = (C.inv[k] || 0) + 1; return `${DECOR[k].name} w plecaku! Ustawisz ją w obozie przyciskiem „Ustaw ozdoby”.`; };
    }
    if (GS.G.coins < price) {
      btn.classList.remove("shake"); void btn.offsetWidth; btn.classList.add("shake"); snd.bad();
      say(petName(), `To kosztuje ${zl(price)}, a mamy ${zl(GS.G.coins)}. Brakuje ${zlGen(price - GS.G.coins)}. Ruszajmy na wyprawę!`);
      return;
    }
    buy(price, label, apply, btn);
  }

  async function buy(price, label, apply, btn) {
    asking = true;
    const r = await pay(price, label);
    asking = null;
    if (r !== "paid") { say(petName(), "Dobrze, zostawiamy złotówki na później."); return; }
    const done = apply(); save(); burst(btn, 30); $("coinN").textContent = GS.G.coins;
    setTimeout(() => say(petName(), done), 200); render();
  }

  $("tabB").addEventListener("click", () => { if (!asking) { tab = "build"; render(); } });
  $("tabD").addEventListener("click", () => { if (!asking) { tab = "decor"; render(); } });
  $("backBtn").addEventListener("click", camp);
  render();
  say(petName(), `Co budujemy? Masz ${zl(GS.G.coins)}. Każdy budynek pomaga na wyprawach.`);
  try { window.scrollTo({ top: 0 }); } catch (e) {}
}
