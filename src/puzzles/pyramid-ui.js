import { snd } from "../audio.js";
import { say } from "../shell.js";
import { $ } from "../util.js";
import { numPad, runChecks, testHook } from "../puzzle-ui.js";
import { badTriples, genPyramid } from "./pyramid.js";

export function playPyramid(lvl) {
  const q = genPyramid(lvl), vals = q.values.map((x, j) => (q.given.includes(j) ? x : null));
  let sel = null, locked = false;
  say("Mądra Sowa", "Każda cegła to suma dwóch cegieł pod nią. Dotknij pustą cegłę i wpisz liczbę.", "Piramida liczbowa! Każda cegła to suma dwóch cegieł pod nią. Dotknij pustą cegłę i wpisz liczbę.");
  const rows = []; for (let k = q.nRows - 1; k >= 0; k--) rows.push(q.cells.map((c, j) => ({ ...c, j })).filter((c) => c.k === k));
  $("ctl").innerHTML = `<div class="task pz"><div class="pyr">${rows.map((r) => `<div class="pyr-row">${r.map((c) => q.given.includes(c.j)
      ? `<span class="brick given">${q.values[c.j]}</span>` : `<button class="brick" data-j="${c.j}" aria-label="pusta cegła">?</button>`).join("")}</div>`).join("")}</div>
      <div id="pad"></div></div><button class="btn main" id="checkBtn">Sprawdź</button>`;
  const brick = (j) => $("ctl").querySelector(`.brick[data-j="${j}"]`);
  const paint = () => q.cells.forEach((_, j) => { const b = brick(j); if (!b) return; b.textContent = vals[j] == null ? "?" : vals[j]; b.classList.toggle("sel", sel === j); b.classList.remove("bad"); });
  const pad = numPad($("pad"), { onInput: (v) => { if (sel == null || locked) return; vals[sel] = v === "" ? null : +v; paint(); } });
  $("ctl").querySelector(".pyr").addEventListener("click", (e) => {
    const b = e.target.closest("button.brick"); if (!b || locked) return;
    sel = +b.dataset.j; snd.step(); paint(); pad.set(vals[sel]);
  });
  const empty = q.cells.map((_, j) => j).filter((j) => !q.given.includes(j));
  testHook("pyramid", empty.map((j) => ({ j, v: q.values[j] })), empty.flatMap((j) => [`.brick[data-j="${j}"]`, ...[...String(q.values[j])].map((d) => `[data-d="${d}"]`)]).concat("#checkBtn"));
  return runChecks({
    skill: "math.pyramid",
    check: () => {
      if (empty.some((j) => vals[j] == null)) return { ready: false, msg: "Najpierw wpisz liczby do wszystkich pustych cegieł." };
      const bad = badTriples(q, vals);
      bad.forEach((t) => [t.top, t.l, t.r].forEach((j) => { const b = brick(j); if (b) b.classList.add("bad"); }));
      if (!bad.length) return { ok: true };
      const t = bad[0];
      return { ok: false, msg: `${vals[t.l]} i ${vals[t.r]} to nie ${vals[t.top]}. Popraw czerwone cegły.` };
    },
    reveal: () => { empty.forEach((j) => (vals[j] = q.values[j])); sel = null; paint(); },
    lock: () => { locked = true; sel = null; paint(); },
    note: (n) => `${q.nRows} rzędy, odejmowań: ${q.subs}${n > 1 ? `, próby: ${n}` : ""}`
  });
}
