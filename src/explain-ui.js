import { $, reduced, sleep } from "./util.js";

/* ================== Picture explanation after a wrong sum ==================
   Draws the model from math-data.js explain() into `host` (ten frames or a number line),
   plays it step by step and resolves when the child presses "Dalej". */

const fast = () => reduced() || !!window.__LW_TEST;

function framesHTML(m) {
  const total = m.a + m.b, cells = Math.max(10, Math.ceil(total / 10) * 10);
  let h = "";
  for (let f = 0; f < cells / 10; f++) {
    h += `<div class="tf">`;
    for (let i = f * 10; i < f * 10 + 10; i++) h += `<i data-i="${i}"></i>`;
    h += `</div>`;
  }
  return `<div class="tfs">${h}</div>`;
}

function lineHTML(m) {
  const W = 420, x = (v) => 10 + (v / 20) * (W - 20);
  let s = `<svg class="nline" viewBox="0 0 ${W} 74" role="img" aria-label="Oś liczbowa od 0 do 20"><line x1="10" y1="56" x2="${W - 10}" y2="56" stroke="currentColor" stroke-width="2"/>`;
  for (let v = 0; v <= 20; v++) {
    const big = v % 5 === 0, mark = v === m.from || v === m.to || v === 10;
    s += `<line x1="${x(v)}" y1="${big ? 48 : 52}" x2="${x(v)}" y2="${big ? 64 : 60}" stroke="currentColor" stroke-width="${big ? 2 : 1}"/>`;
    if (big || mark) s += `<text x="${x(v)}" y="73" text-anchor="middle" font-size="11" font-weight="${mark ? 900 : 700}">${v}</text>`;
  }
  m.jumps.forEach((j, k) => {
    const x1 = x(j.from), x2 = x(j.to), mid = (x1 + x2) / 2, hgt = 18 + Math.min(26, (x2 - x1) / 4);
    s += `<g class="jump" data-k="${k}"><path d="M${x1} 54 Q${mid} ${54 - hgt * 2} ${x2} 54" fill="none" stroke="#e8442c" stroke-width="3" stroke-linecap="round"/>`
      + `<text x="${mid}" y="${54 - hgt - 6}" text-anchor="middle" font-size="13" font-weight="900" fill="#e8442c">+${j.to - j.from}</text></g>`;
  });
  return s + `</svg>`;
}

export function showExplain(host, m) {
  return new Promise((resolve) => {
    host.innerHTML = `<div class="explain">${m.pic === "frames" ? framesHTML(m) : lineHTML(m)}
      <div class="ex-lines">${m.lines.map((l, i) => `<span data-l="${i}">${l}</span>`).join("")}</div></div>
      <button class="btn main" id="explainOk" disabled>Dalej</button>`;
    const dots = host.querySelectorAll(".tf i"), jumps = host.querySelectorAll(".jump"), lines = host.querySelectorAll(".ex-lines span");
    const on = (el, cls) => el && el.classList.add(cls);
    const done = () => { lines.forEach((l) => on(l, "on")); jumps.forEach((j) => on(j, "on")); if ($("explainOk")) $("explainOk").disabled = false; };
    (async () => {
      if (m.pic === "frames") {
        for (let i = 0; i < m.a; i++) on(dots[i], "a");
        if (fast()) {
          for (let i = m.a; i < m.a + m.b; i++) on(dots[i], "b");
          for (let k = 0; k < m.gone; k++) on(dots[m.a + m.b - 1 - k], "gone");
          return done();
        }
        const tens = m.a < 10 && m.a + m.b > 10 ? 10 - m.a : m.a > 10 && m.a - m.gone < 10 ? m.a - 10 : -1;
        await sleep(400); on(lines[0], "on");
        for (let k = 0; k < m.b; k++) { if (!host.isConnected) return; on(dots[m.a + k], "b"); if (k + 1 === tens && m.b) { await sleep(500); on(lines[1], "on"); } await sleep(230); }
        if (m.b && m.gone) on(lines[1], "on");
        for (let k = 0; k < m.gone; k++) { if (!host.isConnected) return; on(dots[m.a + m.b - 1 - k], "gone"); if (k + 1 === tens) { await sleep(500); on(lines[1], "on"); } await sleep(230); }
      } else {
        if (fast()) return done();
        for (let k = 0; k < jumps.length; k++) { await sleep(500); if (!host.isConnected) return; on(jumps[k], "on"); on(lines[k], "on"); }
      }
      await sleep(400); if (host.isConnected) done();
    })();
    $("explainOk").addEventListener("click", () => resolve());
  });
}
