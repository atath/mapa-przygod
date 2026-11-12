import { GS } from "./state.js";
import { snd } from "./audio.js";
import { hurt, left } from "./expedition.js";
import { burst } from "./fx.js";
import { save } from "./save.js";
import { petName, say } from "./shell.js";
import { record, timer } from "./stats.js";
import { $, sleep } from "./util.js";

/* ================== Shared parts of the puzzles you arrange ==================
   No dragging: tap a thing, then tap where it goes. Every control is a plain button,
   so it works with a finger, a keyboard, a screen reader and the browser tests. */

// Pieces in a tray, slots in a row. slotHTML(i, key|null) draws a slot's inside, pieceHTML(key) a piece.
export function placer(host, { keys, n, pieceHTML, slotHTML, onChange = () => {} }) {
  let at = Array(n).fill(null), sel = null, locked = false, bad = new Set();
  const slotsEl = host.querySelector(".pl-slots"), trayEl = host.querySelector(".pl-tray");
  function render() {
    slotsEl.innerHTML = at.map((k, i) => `<button class="pz-slot${k ? " full" : ""}${bad.has(i) ? " bad" : ""}" data-i="${i}" aria-label="miejsce ${i + 1}${k ? ", zajęte" : ", puste"}">${slotHTML(i, k)}</button>`).join("");
    trayEl.innerHTML = keys.filter((k) => !at.includes(k)).map((k) => `<button class="pz-piece${sel === k ? " sel" : ""}" data-k="${k}" aria-pressed="${sel === k}">${pieceHTML(k)}</button>`).join("");
    trayEl.classList.toggle("empty", at.every(Boolean));
  }
  host.addEventListener("click", (e) => {
    if (locked) return;
    const p = e.target.closest(".pz-piece"), s = e.target.closest(".pz-slot");
    if (p && host.contains(p)) { sel = sel === p.dataset.k ? null : p.dataset.k; snd.step(); }
    else if (s && host.contains(s)) {
      const i = +s.dataset.i;
      if (sel) { at[i] = sel; sel = null; } else if (at[i]) at[i] = null; else return;
      bad = new Set(); snd.letter(); onChange(at.slice());
    } else return;
    render();
  });
  render();
  return {
    get: () => at.slice(),
    set(arr) { at = arr.slice(); sel = null; render(); },
    mark(set) { bad = new Set(set); render(); },
    lock() { locked = true; }
  };
}

// Digits 0–9 and a delete key; the value is kept as a number with at most `max` digits.
export function numPad(host, { max = 2, onInput = () => {} } = {}) {
  let v = "";
  host.innerHTML = `<div class="numpad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, "del", 0].map((d) => `<button class="btn np" data-d="${d}" aria-label="${d === "del" ? "usuń cyfrę" : d}">${d === "del" ? "⌫" : d}</button>`).join("")}</div>`;
  host.addEventListener("click", (e) => {
    const b = e.target.closest("[data-d]"); if (!b) return;
    const d = b.dataset.d;
    if (d === "del") v = v.slice(0, -1); else if (v.length < max) v = v === "0" ? d : v + d; else return;
    snd.step(); onInput(v);
  });
  return { get value() { return v === "" ? null : +v; }, set(x) { v = x == null ? "" : String(x); onInput(v); } };
}

/* The "Sprawdź" button of an arranged puzzle.
   check() → { ready: false, msg } | { ok: true } | { ok: false, msg }
   The first two failed checks only say what does not fit; the third costs a heart and reveal() shows the solution.
   note(checks) describes the task for the parent's report; checks = how many times the child pressed the button.
   Resolves { solved, perfect }: perfect = solved without a single failed check. */
export function runChecks({ skill, max = 3, check, reveal, note, onFail = () => {}, lock = () => {} }) {
  return new Promise((resolve) => {
    const run = GS.RUN, took = timer(); let fails = 0, busy = false;
    $("checkBtn").addEventListener("click", async () => {
      if (busy) return;
      const r = check();
      if (r.ready === false) { snd.bad(); say(petName(), r.msg); return; }
      if (r.ok) {
        busy = true; lock(); snd.ok(); burst($("checkBtn"));
        record(skill, fails === 0, took(), note(fails + 1)); save();
        resolve({ solved: true, perfect: fails === 0 }); return;
      }
      fails++; onFail();
      if (fails < max) { snd.bad(); say(petName(), r.msg); return; }
      busy = true; lock();
      const fainted = await hurt(); if (left(run)) return;
      reveal();
      if (!fainted) say(petName(), `Tak to wygląda, gdy wszystko pasuje. ${r.reveal || ""}`.trim());
      record(skill, false, took(), note(fails)); save();
      await sleep(3200); if (left(run)) return;
      resolve({ solved: false, perfect: false });
    });
  });
}

// what the browser tests need: the solution as a list of things to tap, in order
export function testHook(kind, ans, steps) { if (window.__LW_TEST) window.__LW_TEST.q = { kind, ans, steps }; }

// "jedna", "dwie"… for "dwie wskazówki" (feminine, as for wskazówka, płytka)
export const FEM = ["zero", "jedna", "dwie", "trzy", "cztery", "pięć", "sześć", "siedem", "osiem", "dziewięć", "dziesięć"];
