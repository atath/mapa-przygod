import { GS } from "./state.js";
import { snd } from "./audio.js";
import { camp } from "./camp.js";
import { burst } from "./fx.js";
import { HATS, heroSprite } from "./hero.js";
import { PETS, PETSPR } from "./pets.js";
import { ICON } from "./props.js";
import { save } from "./save.js";
import { bakeClearing, bob, draw, mountCanvas } from "./scene.js";
import { dialogHTML, heroName, hudHTML, isBoy, petName, rebuildHero, say, wireHud, wireSay } from "./shell.js";
import { url } from "./sprites.js";
import { pay } from "./money-ui.js";
import { zl, zlGen } from "./money.js";
import { $, app, esc } from "./util.js";

/* ================== Shop ================== */
export function shop() {
  GS.scene = null;
  app.innerHTML = `${hudHTML(null)}<h1>Sklep</h1><div id="sc"></div>${dialogHTML()}
    <div class="tabs" role="tablist"><button class="choice" id="tabHats" aria-pressed="true">Czapki</button><button class="choice" id="tabPets" aria-pressed="false">Zwierzaki</button></div>
    <div class="shop" id="shop"></div><button class="btn" id="backBtn">Wróć do obozu</button>`;
  wireHud(camp); wireSay();
  const cv = mountCanvas(4, 2); $("sc").appendChild(cv.c);
  const bg = bakeClearing(4, 2, 5);
  GS.scene = { cv, draw(t) { cv.x.drawImage(bg, 0, 0, bg.width / 2, bg.height / 2); draw(cv.x, GS.HERO, 12, 0 - bob(t), 1.5); draw(cv.x, PETSPR[GS.G.hero.pet], 40, 8 - bob(t, 2), 1.25); } };
  let tab = "hats";
  let paying = false;
  function noMoney(b, price) { b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake"); snd.bad(); say(petName(), `To kosztuje ${zl(price)}, a mamy ${zl(GS.G.coins)}. Brakuje ${zlGen(price - GS.G.coins)}. Ruszajmy na wyprawę!`); }
  function render() {
    $("tabHats").setAttribute("aria-pressed", String(tab === "hats")); $("tabPets").setAttribute("aria-pressed", String(tab === "pets"));
    if (tab === "hats") {
      $("shop").innerHTML = Object.keys(HATS).map((k) => {
        const it = HATS[k], own = GS.G.owned.includes(k), on = GS.G.hero.hat === k;
        return `<button class="item" data-k="${k}" aria-pressed="${on}"><img src="${url(heroSprite(Object.assign({}, GS.G.hero, { hat: k })))}" alt=""><span>${esc(isBoy() && it.nameM || it.name)}</span>
          <span class="price">${on ? "Założona" : own ? "Załóż" : `${it.price} zł`}</span></button>`;
      }).join("");
    } else {
      $("shop").innerHTML = Object.keys(PETS).map((k) => {
        const it = PETS[k], own = GS.G.pets.includes(k), on = GS.G.hero.pet === k;
        return `<button class="item" data-k="${k}" aria-pressed="${on}"><img src="${url(PETSPR[k])}" alt="" class="${own ? "" : "lockd"}"><span>${esc(it.name)}</span>
          <span class="price">${on ? "Na wyprawie" : own ? "Weź na wyprawę" : `${it.price} zł`}</span></button>`;
      }).join("");
    }
    $("shop").querySelectorAll(".item").forEach((b) => b.addEventListener("click", async () => {
      const k = b.dataset.k; if (paying) return;
      if (tab === "hats") {
        const it = HATS[k];
        if (!GS.G.owned.includes(k)) {
          if (GS.G.coins < it.price) return noMoney(b, it.price);
          paying = true; const r = await pay(it.price, isBoy() && it.nameM || it.name); paying = false; if (r !== "paid") return;
          GS.G.owned.push(k); snd.coin(); burst(b); setTimeout(() => say(petName(), `Kupione! ${isBoy() && it.nameM || it.name} wygląda super!`), 200);
        }
        else snd.letter();
        GS.G.hero.hat = k;
      } else {
        const it = PETS[k];
        if (!GS.G.pets.includes(k)) {
          if (GS.G.coins < it.price) return noMoney(b, it.price);
          paying = true; const r = await pay(it.price, it.name); paying = false; if (r !== "paid") return;
          GS.G.pets.push(k); snd.fanfare(); burst(b, 40);
        }
        else snd.letter();
        GS.G.hero.pet = k; say(petName(), `Cześć, ${heroName()}! Jestem ${petName()}. Idę z tobą na wyprawę!`);
      }
      save(); rebuildHero(); $("coinN").textContent = GS.G.coins; render();
    }));
  }
  $("tabHats").addEventListener("click", () => { tab = "hats"; render(); });
  $("tabPets").addEventListener("click", () => { tab = "pets"; render(); say(petName(), "Tu odblokujesz nowych przyjaciół na wyprawy. Najrzadszy jest jednorożec!"); });
  render();
  say(petName(), `Masz ${zl(GS.G.coins)}. Kup czapkę albo odblokuj nowego zwierzaka!`);
  $("backBtn").addEventListener("click", camp);
}
