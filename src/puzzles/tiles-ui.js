import { snd } from "../audio.js";
import { say } from "../shell.js";
import { $ } from "../util.js";
import { numPad, runChecks, testHook } from "../puzzle-ui.js";
import { genTiles, placePiece } from "./tiles.js";

const K = (r, c) => r * 100 + c;
const tilesWord = (n) => (n === 1 ? "płytka" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "płytki" : "płytek");

function floorHTML(q) {
  const hole = new Set(q.hole.map(([r, c]) => K(r, c)));
  let h = `<div class="floor${q.dark ? " chess" : ""}" style="grid-template-columns:repeat(${q.W},var(--tc))" role="img" aria-label="Podłoga z dziurą">`;
  for (let r = 0; r < q.H; r++) for (let c = 0; c < q.W; c++) {
    const inHole = hole.has(K(r, c)), d = (r + c) % 2 === 0;
    // hole cells know their neighbours, so the patch is drawn as one shape with an outline only on its edge
    const edge = inHole ? ["t", "b", "l", "r"].filter((s, i) => !hole.has(K(r + [-1, 1, 0, 0][i], c + [0, 0, -1, 1][i]))).join(" ") : "";
    h += `<i class="${inHole ? `h ${edge}` : "t"}${d ? " d" : ""}" data-r="${r}" data-c="${c}"></i>`;
  }
  return h + `</div>`;
}
function miniHTML(cells, cls = "") {
  const H = Math.max(...cells.map((x) => x[0])) + 1, W = Math.max(...cells.map((x) => x[1])) + 1;
  return `<span class="mini ${cls}" style="grid-template-columns:repeat(${W},var(--mc));grid-template-rows:repeat(${H},var(--mc))">${cells.map(([r, c]) => `<i style="grid-area:${r + 1}/${c + 1}"></i>`).join("")}</span>`;
}

export function playTiles(lvl) {
  const q = genTiles(lvl);
  return q.v === "floor" ? playFloor(q) : playPiece(q);
}

function playFloor(q) {
  const what = q.dark ? "ciemnych płytek" : "płytek";
  say("Mądra Sowa", `W podłodze jest dziura. Ile ${what} brakuje? Policz rzędy i kolumny wokół dziury.`, `W podłodze jest dziura. Ile ${what} brakuje?`);
  $("ctl").innerHTML = `<div class="task pz"><div class="floorwrap">${floorHTML(q)}<span class="extra" id="extra"></span></div>
      <p class="task-q">Brakuje ${q.dark ? "ciemnych " : ""}płytek: <b class="ans" id="ansBox">?</b></p><div id="pad"></div></div>
    <button class="btn main" id="checkBtn">Sprawdź</button>`;
  const holeEls = q.hole.map(([r, c]) => $("ctl").querySelector(`.floor i[data-r="${r}"][data-c="${c}"]`)).filter((el) => !q.dark || el.classList.contains("d"));
  const clear = () => { holeEls.forEach((el) => el.classList.remove("fill")); $("extra").textContent = ""; };
  const pad = numPad($("pad"), { onInput: (v) => { $("ansBox").textContent = v || "?"; clear(); } });
  testHook("tiles", q.ans, [...String(q.ans)].map((d) => `[data-d="${d}"]`).concat("#checkBtn"));
  return runChecks({
    skill: "logic.tiles",
    check: () => {
      const v = pad.value; if (v == null) return { ready: false, msg: "Wpisz liczbę płytek." };
      clear(); holeEls.slice(0, v).forEach((el) => el.classList.add("fill"));
      if (v > q.ans) $("extra").textContent = `+${v - q.ans}`;
      if (v === q.ans) return { ok: true };
      return { ok: false, msg: v < q.ans ? `Za mało! Z ${v} ${v === 1 ? "płytką" : "płytkami"} zostaje jeszcze dziura.` : `Za dużo! ${v - q.ans} ${tilesWord(v - q.ans)} już się nie mieści.`,
        reveal: `Brakowało ${q.ans} ${q.dark ? "ciemnych " : ""}${tilesWord(q.ans)}.` };
    },
    reveal: () => { clear(); holeEls.forEach((el) => el.classList.add("fill")); $("ansBox").textContent = q.ans; },
    note: (f) => `${q.dark ? "ciemne " : ""}${q.hole.length} pól → ${q.ans}${f > 1 ? `, próby: ${f}` : ""}`
  });
}

function playPiece(q) {
  say("Mądra Sowa", q.turn ? "Który kawałek załata dziurę? Kawałki są obrócone." : "Który kawałek załata dziurę?",
    q.turn ? "Który kawałek załata dziurę? Uwaga, kawałki są poobracane. Wybierz kawałek i naciśnij sprawdź." : "Który kawałek załata dziurę? Wybierz kawałek i naciśnij sprawdź.");
  $("ctl").innerHTML = `<div class="task pz"><div class="floorwrap">${floorHTML({ ...q, dark: false })}</div>
      <div class="pc-opts">${q.opts.map((o) => `<button class="pc-opt" data-o="${o.id}" aria-pressed="false" aria-label="kawałek ${o.id + 1}">${miniHTML(o.cells)}</button>`).join("")}</div></div>
    <button class="btn main" id="checkBtn">Sprawdź</button>`;
  const ctl = $("ctl"); let sel = null;
  const cell = (r, c) => ctl.querySelector(`.floor i[data-r="${r}"][data-c="${c}"]`);
  const clear = () => ctl.querySelectorAll(".floor i").forEach((el) => el.classList.remove("fill", "over", "gap"));
  ctl.querySelector(".pc-opts").addEventListener("click", (e) => {
    const b = e.target.closest(".pc-opt"); if (!b || b.disabled) return;
    sel = +b.dataset.o; snd.step(); clear();
    ctl.querySelectorAll(".pc-opt").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  });
  const show = (cells) => {
    clear(); const p = placePiece(q, cells);
    p.cover.forEach(([r, c]) => cell(r, c).classList.add("fill"));
    p.over.forEach(([r, c]) => { const el = cell(r, c); if (el) el.classList.add("over"); });
    q.hole.forEach(([r, c]) => { const el = cell(r, c); if (!el.classList.contains("fill")) el.classList.add("gap"); });
    return p;
  };
  testHook("tiles", q.ans, [`.pc-opt[data-o="${q.ans}"]`, "#checkBtn"]);
  return runChecks({
    skill: "logic.tiles",
    check: () => {
      if (sel == null) return { ready: false, msg: "Najpierw wybierz kawałek." };
      const p = show(q.opts[sel].cells);
      if (p.fit) return { ok: true };
      const b = ctl.querySelector(`.pc-opt[data-o="${sel}"]`); b.disabled = true; b.setAttribute("aria-pressed", "false"); sel = null;
      return { ok: false, msg: p.over.length && p.cover.length < q.hole.length ? "Ten kawałek wystaje i jeszcze zostaje dziura." : p.over.length ? "Ten kawałek wystaje poza dziurę." : "Za mały: zostaje dziura." };
    },
    reveal: () => show(q.opts.find((o) => o.right).cells),
    note: (f) => `kawałek z ${q.hole.length} pól${q.turn ? ", obrócony" : ""}${f > 1 ? `, próby: ${f}` : ""}`
  });
}
