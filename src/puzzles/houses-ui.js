import { speak } from "../audio.js";
import { say } from "../shell.js";
import { $, esc } from "../util.js";
import { FEM, placer, runChecks, testHook } from "../puzzle-ui.js";
import { brokenClues, genHouses } from "./houses.js";

export async function playHouses(lvl) {
  const q = genHouses(lvl), A = Object.fromEntries(q.animals.map((a) => [a.k, a]));
  say("Mądra Sowa", "Ustaw zwierzaki w domkach tak, żeby pasowały wszystkie wskazówki. Dotknij wskazówki, a przeczytam ją jeszcze raz.",
    `Kto gdzie mieszka? Ustaw zwierzaki w domkach. Wskazówki: ${q.clues.map((c) => c.say).join(" ")}`);
  $("ctl").innerHTML = `<div class="task pz">
      <div class="hclues">${q.clues.map((c, i) => `<button class="hclue" data-c="${i}" aria-label="${esc(c.say)}"><span class="pic">${c.pic}</span><small>${esc(c.say)}</small></button>`).join("")}</div>
      <div class="pl-slots houses"></div><div class="pl-tray"></div></div>
    <button class="btn main" id="checkBtn">Sprawdź</button>`;
  const task = $("ctl").querySelector(".pz"), clueEls = task.querySelectorAll(".hclue");
  const markClues = (bad) => clueEls.forEach((el, i) => { el.classList.toggle("bad", bad.includes(i)); el.classList.toggle("good", bad && !bad.includes(i)); });
  const clearClues = () => clueEls.forEach((el) => el.classList.remove("bad", "good"));
  task.querySelector(".hclues").addEventListener("click", (e) => { const b = e.target.closest(".hclue"); if (b) speak(q.clues[+b.dataset.c].say, true); });
  const pl = placer(task, {
    keys: q.animals.map((a) => a.k), n: q.n,
    pieceHTML: (k) => `<span class="em">${A[k].e}</span>`,
    slotHTML: (i, k) => `<span class="roof">🏠</span><span class="em">${k ? A[k].e : ""}</span><small>${i + 1}</small>`,
    onChange: clearClues
  });
  testHook("houses", q.ans, q.ans.flatMap((k, i) => [`.pz-piece[data-k="${k}"]`, `.pz-slot[data-i="${i}"]`]).concat("#checkBtn"));
  return runChecks({
    skill: "logic.houses",
    check: () => {
      const arr = pl.get();
      if (arr.some((k) => !k)) return { ready: false, msg: "Najpierw wprowadź zwierzaki do wszystkich domków." };
      const bad = brokenClues(q, arr); markClues(bad);
      if (!bad.length) return { ok: true };
      return { ok: false, msg: bad.length === 1 ? "Jedna wskazówka jeszcze się nie zgadza. Popatrz na czerwoną." : `${cap(FEM[bad.length])} wskazówki jeszcze się nie zgadzają. Popatrz na czerwone.` };
    },
    reveal: () => { pl.set(q.ans); markClues([]); },
    lock: () => pl.lock(),
    note: (f) => `${q.n} domki, ${q.clues.length} wskazówki${f > 1 ? `, próby: ${f}` : ""}`
  });
}
const cap = (s) => s[0].toUpperCase() + s.slice(1);
