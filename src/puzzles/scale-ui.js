import { snd } from "../audio.js";
import { say } from "../shell.js";
import { $ } from "../util.js";
import { numPad, runChecks, testHook } from "../puzzle-ui.js";
import { calc, genScale, genSigns, howMany, weigh } from "./scale.js";

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const pan = (items, label) => `<span class="pan">${items}</span>${label != null ? `<b class="wgt">${label}</b>` : ""}`;

function scaleHTML(left, right, id, tilt = 0) {
  return `<div class="scale" id="${id}"><div class="beam" style="transform:rotate(${tilt}deg)"><span class="side l">${left}</span><span class="side r">${right}</span></div><div class="post"></div></div>`;
}

export function playScale(lvl) {
  const q = genScale(lvl);
  const items = (it, n, lbl) => Array.from({ length: n }, () => `<span class="itm">${it.e}<small>${lbl}</small></span>`).join("");
  let draw;
  if (q.two) {
    say("Mądra Sowa", `Ile waży ${q.b.one}? Popatrz najpierw na pierwszą wagę.`, `Dwie wagi są w równowadze. Na pierwszej dwa razy ${q.a.one} i odważnik ${q.S1}. Na drugiej ${q.a.one}, ${q.b.one} i odważnik ${q.S2}. Ile waży ${q.b.one}?`);
    draw = (x, tilt) => scaleHTML(items(q.a, 2, ""), pan("", q.S1), "sc1") + scaleHTML(items(q.a, 1, "") + items(q.b, 1, x ?? "?"), pan("", q.S2), "sc2", tilt);
  } else {
    const what = q.n === 1 ? `${q.it.one} i odważnik ${q.k}` : howMany(q.it, q.n);
    say("Mądra Sowa", `Waga stoi równo. Ile waży ${q.it.one}?`, `Waga stoi równo. Po jednej stronie ${what}, po drugiej odważnik ${q.S}. Ile waży ${q.it.one}?`);
    draw = (x, tilt) => scaleHTML(items(q.it, q.n, x ?? "?") + (q.k ? `<b class="wgt">${q.k}</b>` : ""), pan("", q.S), "sc1", tilt);
  }
  $("ctl").innerHTML = `<div class="task pz"><div class="scales" id="scales">${draw(null, 0)}</div>
      <p class="task-q">${cap(q.two ? q.b.one : q.it.one)} waży: <b class="ans" id="ansBox">?</b></p><div id="pad"></div></div>
    <button class="btn main" id="checkBtn">⚖️ Zważ</button>`;
  const pad = numPad($("pad"), { onInput: (v) => { $("ansBox").textContent = v || "?"; } });
  testHook("scale", q.ans, [...String(q.ans)].map((d) => `[data-d="${d}"]`).concat("#checkBtn"));
  const show = (x) => { const [l, r] = weigh(q, x); $("scales").innerHTML = draw(x, l > r ? -8 : l < r ? 8 : 0); return [l, r]; };
  return runChecks({
    skill: "math.scale", max: 5, okFails: 1,
    check: () => {
      const x = pad.value; if (x == null) return { ready: false, msg: "Wpisz, ile waży jedna rzecz." };
      const [l, r] = show(x);
      if (l === r) return { ok: true };
      const side = l < r ? "Za lekko!" : "Za ciężko!";
      if (q.two) return { ok: false, msg: `${side} Druga waga się przechyla.` };
      const sum = q.n === 1 ? `${cap(q.it.one)} ${x} i odważnik ${q.k} to ${l}.` : `${cap(howMany(q.it, q.n))} po ${x} to ${l}.`;
      return { ok: false, msg: `${sum} ${side}` };
    },
    reveal: () => { show(q.ans); $("ansBox").textContent = q.ans; },
    note: (n) => `${q.two ? `A+A=${q.S1}, A+B=${q.S2}` : `${q.n}×A${q.k ? `+${q.k}` : ""}=${q.S}`} → ${q.ans}${n > 1 ? `, ważenia: ${n}` : ""}`
  });
}

export function playSigns(lvl) {
  const q = genSigns(lvl), cur = q.ans.map(() => "");
  say("Mądra Sowa", "Wstaw plus albo minus, żeby wynik się zgadzał. Dotknij okienka, żeby zmienić znak.", `Wstaw plus albo minus między liczby, żeby wyszło ${q.res}. Dotykaj okienek, żeby zmieniać znak.`);
  const paint = (bad = false) => {
    $("eq").innerHTML = q.nums.map((n, i) => `<b class="n">${n}</b>${i < cur.length ? `<button class="sg${bad ? " bad" : ""}" data-i="${i}" aria-label="znak ${i + 1}: ${cur[i] || "pusty"}">${cur[i] || "?"}</button>` : ""}`).join("") + `<b class="eqs">=</b><b class="n">${q.res}</b>`;
  };
  $("ctl").innerHTML = `<div class="task pz"><p class="task-q">Jakie znaki pasują?</p><div class="eq" id="eq"></div></div><button class="btn main" id="checkBtn">Sprawdź</button>`;
  paint();
  let locked = false;
  $("eq").addEventListener("click", (e) => {
    const b = e.target.closest(".sg"); if (!b || locked) return;
    const i = +b.dataset.i; cur[i] = cur[i] === "" ? "+" : cur[i] === "+" ? "−" : ""; snd.step(); paint();
  });
  testHook("signs", q.ans, q.ans.flatMap((s, i) => (s === "+" ? [`.sg[data-i="${i}"]`] : [`.sg[data-i="${i}"]`, `.sg[data-i="${i}"]`])).concat("#checkBtn"));
  const expr = () => q.nums.map((n, i) => `${n}${i < cur.length ? ` ${cur[i]} ` : ""}`).join("");
  return runChecks({
    skill: "math.signs",
    check: () => {
      if (cur.some((s) => !s)) return { ready: false, msg: "Wstaw znak do każdego okienka." };
      const v = calc(q.nums, cur);
      if (v === q.res) return { ok: true };
      paint(true);
      return { ok: false, msg: `${expr()} to ${v}, a ma być ${q.res}.` };
    },
    reveal: () => { q.ans.forEach((s, i) => (cur[i] = s)); paint(); },
    lock: () => { locked = true; },
    note: (n) => `${q.nums.join(" □ ")} = ${q.res}${n > 1 ? `, próby: ${n}` : ""}`
  });
}
