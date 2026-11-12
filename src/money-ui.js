import { GS } from "./state.js";
import { snd } from "./audio.js";
import { burst } from "./fx.js";
import { ZL_DENOMS, breakdown, changeOptions, zl, zlShort } from "./money.js";
import { save } from "./save.js";
import { petName, say } from "./shell.js";
import { record, timer } from "./stats.js";
import { $, esc, sleep } from "./util.js";

/* ================== Coins and notes on screen, and paying with them ================== */
export function pieceHTML(d, unit, attrs = "") {
  return `<button class="piece ${d.look}${d.note ? " note" : ""}" ${attrs} aria-label="${d.v} ${unit === "gr" ? "groszy" : d.v === 1 ? "złoty" : d.v < 5 ? "złote" : "złotych"}"><b>${d.v}</b><small>${unit}</small></button>`;
}

/* Pay `price` złotych: the child lays coins and notes from the wallet on the counter.
   Exact money: done. Too much: how much change? A right answer earns 1 zł off, as before.
   Resolves "paid" or "cancel"; the caller checks beforehand that the wallet holds enough. */
export function pay(price, what) {
  return new Promise((resolve) => {
    const took = timer(), wallet = breakdown(GS.G.coins, ZL_DENOMS).map((s) => ({ d: s.d, n: s.n })), counter = [];
    const ov = document.createElement("div"); ov.className = "payov"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "Płacenie");
    document.body.appendChild(ov);
    const close = (r) => { ov.remove(); resolve(r); };
    const sum = () => counter.reduce((a, d) => a + d.v, 0);
    const render = () => {
      ov.innerHTML = `<div class="panel paybox">
        <p class="task-q">Zapłać <b>${zlShort(price)}</b> za: ${esc(what)}</p>
        <p class="lbl">Twój portfel — dotknij, żeby położyć na ladzie</p>
        <div class="wallet">${wallet.filter((s) => s.n).map((s) => `<span class="stack">${pieceHTML(s.d, "zł", `data-w="${s.d.v}"`)}${s.n > 1 ? `<i>×${s.n}</i>` : ""}</span>`).join("")}</div>
        <p class="lbl">Na ladzie: <b>${zlShort(sum())}</b></p>
        <div class="counter">${counter.length ? counter.map((d, i) => pieceHTML(d, "zł", `data-c="${i}"`)).join("") : `<span class="muted">pusto</span>`}</div>
        <p class="note" id="payMsg" role="status"></p>
        <div class="row"><button class="btn small" id="payCancel">Rezygnuję</button><button class="btn main" id="payGo" ${sum() >= price ? "" : "disabled"}>Płacę</button></div>
      </div>`;
      ov.querySelectorAll("[data-w]").forEach((b) => b.addEventListener("click", () => {
        const s = wallet.find((x) => x.d.v === +b.dataset.w); if (!s || !s.n) return;
        s.n--; counter.push(s.d); snd.coin(); render();
      }));
      ov.querySelectorAll("[data-c]").forEach((b) => b.addEventListener("click", () => {
        const d = counter.splice(+b.dataset.c, 1)[0]; wallet.find((x) => x.d.v === d.v).n++; snd.letter(); render();
      }));
      $("payCancel").addEventListener("click", () => close("cancel"));
      $("payGo").addEventListener("click", () => settle());
      if (window.__LW_TEST) window.__LW_TEST.pay = { price, sum: sum(), wallet: wallet.flatMap((s) => Array(s.n).fill(s.d.v)) };
    };
    async function settle() {
      const given = sum(); if (given < price) return;
      if (given === price) {
        GS.G.coins -= price; record("money.pay", true, took(), `${zlShort(price)} odliczone dokładnie`); save();
        snd.ok(); burst(ov.querySelector(".counter"), 24);
        say(petName(), `Dokładnie ${zl(price)}. Bez reszty!`); await sleep(900); close("paid"); return;
      }
      const ans = given - price, opts = changeOptions(ans), tk = timer();
      record("money.pay", true, took(), `${zlShort(price)}, dane ${zlShort(given)}`);
      ov.querySelector(".paybox").innerHTML = `<p class="task-q">Dajesz <b>${zlShort(given)}</b>, a to kosztuje <b>${zlShort(price)}</b>.<br>Ile reszty dostaniesz?</p>
        <div class="opts">${opts.map((v) => `<button class="btn num" data-v="${v}">${v}<small>zł</small></button>`).join("")}</div><p class="note" id="payMsg" role="status"></p>`;
      say(petName(), `Dajesz ${zl(given)}, a to kosztuje ${zl(price)}. Ile reszty? Dobra odpowiedź to złotówka rabatu!`);
      if (window.__LW_TEST) window.__LW_TEST.pay = { price, sum: given, change: ans };
      let done = false;
      ov.querySelectorAll("[data-v]").forEach((b) => b.addEventListener("click", async () => {
        if (done) return; done = true;
        const ok = +b.dataset.v === ans; b.classList.add(ok ? "right" : "wrong");
        record("money.change", ok, tk(), `${given} − ${price} → ${b.dataset.v}${ok ? "" : ` (${ans})`}`);
        const paid = ok ? Math.max(0, price - 1) : price;
        GS.G.coins -= paid; save();
        if (ok) { snd.ok(); burst(b, 24); } else snd.coin();
        $("payMsg").textContent = ok ? `Tak! ${ans} zł reszty, a kupiec daje złotówkę rabatu.` : `Reszta to ${ans} zł.`;
        say(petName(), ok ? `Brawo, ${zl(ans)} reszty! Kupiec daje złotówkę rabatu.` : `Reszta to ${zl(ans)}. ${given} odjąć ${price} to ${ans}.`);
        await sleep(1500); close("paid");
      }));
    }
    render();
  });
}
