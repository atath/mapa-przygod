import { snd } from "../audio.js";
import { say } from "../shell.js";
import { $ } from "../util.js";
import { runChecks, testHook } from "../puzzle-ui.js";
import { clashes, genSudoku } from "./sudoku.js";

export function playSudoku(lvl) {
  const q = genSudoku(lvl), g = q.puzzle.map((r) => r.slice());
  let sel = null, locked = false;
  const rule = q.boxes ? "w każdym rzędzie, w każdej kolumnie i w każdym kwadracie" : "w każdym rzędzie i w każdej kolumnie";
  say("Mądra Sowa", `Każdy obrazek ma być raz ${rule}. Dotknij puste pole, potem obrazek.`, `Obrazkowe sudoku. Każdy obrazek ma być dokładnie raz ${rule}. Dotknij puste pole, a potem obrazek.`);
  $("ctl").innerHTML = `<div class="task pz"><div class="sdk n${q.n}${q.boxes ? " boxes" : ""}" style="grid-template-columns:repeat(${q.n},1fr)"></div>
      <div class="sdk-pal">${q.icons.map((e, v) => `<button class="sdk-p" data-v="${v}" aria-label="obrazek ${v + 1}">${e}</button>`).join("")}</div></div>
    <button class="btn main" id="checkBtn">Sprawdź</button>`;
  const grid = $("ctl").querySelector(".sdk");
  const paint = (bad = []) => {
    grid.innerHTML = g.map((row, r) => row.map((v, c) => {
      const given = q.puzzle[r][c] != null, i = r * q.n + c;
      return given ? `<span class="sc given">${q.icons[v]}</span>`
        : `<button class="sc${sel === i ? " sel" : ""}${bad.includes(i) ? " bad" : ""}" data-i="${i}" aria-label="pole ${r + 1}, ${c + 1}${v == null ? ", puste" : ""}">${v == null ? "" : q.icons[v]}</button>`;
    }).join("")).join("");
  };
  grid.addEventListener("click", (e) => {
    const b = e.target.closest("button.sc"); if (!b || locked) return;
    const i = +b.dataset.i, r = Math.floor(i / q.n), c = i % q.n;
    if (g[r][c] != null) { g[r][c] = null; sel = i; } else sel = sel === i ? null : i;
    snd.step(); paint();
  });
  $("ctl").querySelector(".sdk-pal").addEventListener("click", (e) => {
    const b = e.target.closest(".sdk-p"); if (!b || locked || sel == null) return;
    g[Math.floor(sel / q.n)][sel % q.n] = +b.dataset.v; sel = null; snd.letter(); paint();
  });
  paint();
  const empty = []; q.puzzle.forEach((row, r) => row.forEach((v, c) => { if (v == null) empty.push([r, c]); }));
  testHook("sudoku", empty.map(([r, c]) => ({ r, c, v: q.sol[r][c] })), empty.flatMap(([r, c]) => [`.sc[data-i="${r * q.n + c}"]`, `.sdk-p[data-v="${q.sol[r][c]}"]`]).concat("#checkBtn"));
  return runChecks({
    skill: "logic.sudoku",
    check: () => {
      if (empty.some(([r, c]) => g[r][c] == null)) return { ready: false, msg: "Najpierw wypełnij wszystkie puste pola." };
      const bad = clashes(q, g); paint(bad);
      if (!bad.length) return { ok: true };
      return { ok: false, msg: "Te same obrazki się spotkały. Popatrz na czerwone pola." };
    },
    reveal: () => { empty.forEach(([r, c]) => (g[r][c] = q.sol[r][c])); sel = null; paint(); },
    lock: () => { locked = true; sel = null; paint(); },
    note: (n) => `${q.n}×${q.n}${q.boxes ? " z kwadratami" : ""}, puste: ${empty.length}${n > 1 ? `, próby: ${n}` : ""}`
  });
}
