import { GS } from "./state.js";
import { snd } from "./audio.js";
import { camp } from "./camp.js";
import { burst } from "./fx.js";
import { changeOptions, gr, grGen, piggyCoins } from "./money.js";
import { pieceHTML } from "./money-ui.js";
import { save } from "./save.js";
import { dialogHTML, hudHTML, petName, say, wireHud, wireSay } from "./shell.js";
import { record, timer } from "./stats.js";
import { $, app, pick } from "./util.js";

/* ================== Piggy bank: 100 groszy make 1 złoty ==================
   With 100 gr or more the child picks coins that make exactly 100 gr and swaps them for 1 zł.
   With less: how many grosze are still missing to a whole złoty? */
export function piggy() {
  GS.scene = null;
  app.innerHTML = `${hudHTML(null)}<h1>Skarbonka</h1>${dialogHTML()}<div class="panel piggy" id="pig"></div>
    <button class="btn" id="backBtn">Wróć do obozu</button>`;
  wireHud(camp); wireSay();
  $("backBtn").addEventListener("click", camp);
  GS.G.gr >= 100 ? exchange() : missing();
}

function missing() {
  const have = GS.G.gr, ans = 100 - have, took = timer();
  if (have === 0) {
    $("pig").innerHTML = `<p class="task-q"><span class="em big">🐷</span><br>Skarbonka jest pusta.</p>`;
    say(petName(), "Skarbonka jest pusta. Grosze zbieramy na ścieżkach w czasie wyprawy. Sto groszy to jeden złoty!"); return;
  }
  $("pig").innerHTML = `<p class="task-q"><span class="em big">🐷</span><br>W skarbonce jest <b>${have} gr</b>.<br>Ile groszy brakuje do złotówki?</p>
    <p class="note muted">1 zł = 100 gr</p>
    <div class="opts">${changeOptions(ans).map((v) => `<button class="btn num" data-v="${v}">${v}<small>gr</small></button>`).join("")}</div>`;
  if (window.__LW_TEST) window.__LW_TEST.piggy = { missing: ans };
  say(petName(), `W skarbonce jest ${gr(have)}. Złotówka to sto groszy. Ile groszy brakuje do złotówki?`);
  let done = false;
  $("pig").querySelectorAll("[data-v]").forEach((b) => b.addEventListener("click", () => {
    if (done) return; done = true;
    const ok = +b.dataset.v === ans; b.classList.add(ok ? "right" : "wrong");
    record("money.missing", ok, took(), `${have} gr + ? = 100 gr → ${b.dataset.v}${ok ? "" : ` (${ans})`}`); save();
    if (ok) { snd.ok(); burst(b, 20); } else snd.bad();
    say(petName(), ok ? `Tak! ${have} i ${ans} to razem sto. Jeszcze ${gr(ans)} i wymienimy je na złotówkę.` : `Brakuje ${grGen(ans)}, bo ${have} i ${ans} to razem sto.`);
  }));
}

function exchange() {
  const coins = piggyCoins(GS.G.gr, pick).map((s) => ({ d: s.d, n: s.n })), chosen = [], took = timer();
  let misses = 0;
  const sum = () => chosen.reduce((a, d) => a + d.v, 0);
  const render = () => {
    const s = sum();
    $("pig").innerHTML = `<p class="task-q"><span class="em big">🐷</span><br>W skarbonce jest <b>${GS.G.gr} gr</b>. Wybierz monety, które razem dają <b>100 gr</b>.</p>
      <div class="wallet">${coins.filter((c) => c.n).map((c) => `<span class="stack">${pieceHTML(c.d, "gr", `data-w="${c.d.v}"`)}${c.n > 1 ? `<i>×${c.n}</i>` : ""}</span>`).join("")}</div>
      <p class="lbl">Odłożone: <b>${s} gr</b>${s > 100 ? " — za dużo!" : ""}</p>
      <div class="counter">${chosen.length ? chosen.map((d, i) => pieceHTML(d, "gr", `data-c="${i}"`)).join("") : `<span class="muted">pusto</span>`}</div>
      <button class="btn main" id="swapBtn" ${s === 100 ? "" : "disabled"}>Wymieniam na 1 zł</button>`;
    if (window.__LW_TEST) window.__LW_TEST.piggy = { sum: s, coins: coins.flatMap((c) => Array(c.n).fill(c.d.v)) };
    $("pig").querySelectorAll("[data-w]").forEach((b) => b.addEventListener("click", () => {
      const c = coins.find((x) => x.d.v === +b.dataset.w); if (!c || !c.n) return;
      c.n--; chosen.push(c.d); snd.coin(); render();
      if (sum() > 100) { misses++; say(petName(), "Za dużo! Złotówka to dokładnie sto groszy. Zabierz którąś monetę z powrotem."); }
    }));
    $("pig").querySelectorAll("[data-c]").forEach((b) => b.addEventListener("click", () => {
      const d = chosen.splice(+b.dataset.c, 1)[0]; coins.find((x) => x.d.v === d.v).n++; snd.letter(); render();
    }));
    $("swapBtn").addEventListener("click", () => {
      if (sum() !== 100) return;
      GS.G.gr -= 100; GS.G.coins += 1;
      record("money.exchange", misses === 0, took(), `${chosen.map((d) => d.v).join(" + ")} = 100 gr`); save();
      snd.fanfare(); burst($("swapBtn"), 30);
      $("coinN").textContent = GS.G.coins; if ($("grN")) $("grN").textContent = GS.G.gr;
      say(petName(), `${chosen.map((d) => d.v).join(" plus ")} to sto groszy, czyli jeden złoty! Masz już ${GS.G.coins} zł.`);
      setTimeout(() => (GS.G.gr >= 100 ? exchange() : missing()), 1600);
    });
  };
  render();
  say(petName(), `Mamy ${gr(GS.G.gr)}! Wybierz monety, które razem dają sto groszy, a wymienimy je na złotówkę.`);
}
