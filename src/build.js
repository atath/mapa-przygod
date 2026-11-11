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
import { record, timer } from "./stats.js";
import { $, app, esc, ri, shuffle } from "./util.js";

/* ================== Camp building screen ==================
   Before every purchase: "You have X coins, it costs Y — how many are left?"
   A right answer takes 1 coin off the price; a wrong one blocks nothing. */
const coinsWord = (n) => (n === 1 ? "moneta" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "monety" : "monet");

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
    <div class="ask" id="ask" hidden></div>
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
          <span class="price">${max ? "Gotowe ✓" : `<img src="${ICON.coin}" alt="">${B.cost[l]}`}</span></button>`;
      }).join("");
    } else {
      $("list").innerHTML = Object.keys(DECOR).map((k) => `<button class="item build" data-k="${k}">
          <img src="${url(DECOR_SPR[k])}" alt=""><span>${esc(DECOR[k].name)}</span>
          <small>W plecaku: ${C.inv[k] || 0}, w obozie: ${C.decor.filter((d) => d.k === k).length}</small>
          <span class="price"><img src="${ICON.coin}" alt="">${DECOR[k].price}</span></button>`).join("");
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
      say(petName(), `Potrzebujemy ${price} ${coinsWord(price)}, a mamy ${GS.G.coins}. Brakuje ${price - GS.G.coins}. Ruszajmy na wyprawę!`);
      return;
    }
    ask(price, label, apply, btn);
  }

  function ask(price, label, apply, btn) {
    const have = GS.G.coins, ans = have - price;
    const opts = new Set([ans]); while (opts.size < 3) { const v = ans + ri(-3, 3); if (v >= 0) opts.add(v); }
    asking = true; const took = timer();
    $("ask").hidden = false;
    $("ask").innerHTML = `<div class="sum">${have} − ${price} = ?</div><div class="opts">${shuffle([...opts]).map((v) => `<button class="btn num" data-v="${v}">${v}</button>`).join("")}</div>
      <button class="btn small" id="askCancel">Jednak nie kupuję</button>`;
    say(petName(), `Masz ${have} ${coinsWord(have)}. ${label} kosztuje ${price}. Ile monet zostanie? Dobra odpowiedź to 1 moneta rabatu!`,
      `Masz ${have} ${coinsWord(have)}. ${label} kosztuje ${price}. Ile monet zostanie? Dobra odpowiedź to jedna moneta rabatu.`);
    $("ask").scrollIntoView({ block: "nearest" });
    $("askCancel").addEventListener("click", () => { asking = null; $("ask").hidden = true; say(petName(), "Dobrze, zostawiamy monety na później."); });
    $("ask").querySelectorAll("[data-v]").forEach((b) => b.addEventListener("click", () => {
      if (!asking) return;
      const ok = +b.dataset.v === ans; b.classList.add(ok ? "right" : "wrong");
      record("math.buy", ok, took(), `${have} − ${price} → ${b.dataset.v}${ok ? "" : ` (${ans})`}`);
      const paid = ok ? price - 1 : price;
      GS.G.coins -= paid; const done = apply(); save();
      ok ? snd.ok() : snd.coin(); burst(btn, 30); $("coinN").textContent = GS.G.coins;
      say(petName(), (ok ? `Brawo, zostanie ${ans}! Z rabatem płacimy ${paid}. ` : `Zostanie ${ans}. Płacimy ${paid}. `) + done);
      setTimeout(() => { asking = null; $("ask").hidden = true; render(); }, 900);
    }));
  }

  $("tabB").addEventListener("click", () => { if (!asking) { tab = "build"; render(); } });
  $("tabD").addEventListener("click", () => { if (!asking) { tab = "decor"; render(); } });
  $("backBtn").addEventListener("click", camp);
  render();
  say(petName(), `Co budujemy? Masz ${GS.G.coins} ${coinsWord(GS.G.coins)}. Każdy budynek pomaga na wyprawach.`);
  try { window.scrollTo({ top: 0 }); } catch (e) {}
}
