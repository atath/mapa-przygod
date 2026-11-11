import { GS } from "./state.js";
import { snd } from "./audio.js";
import { L } from "./content.js";
import { ROOM_NAME, hurt, left, nextRoom, roomShell, updHud } from "./expedition.js";
import { burst } from "./fx.js";
import { MON_FRAMES } from "./monsters.js";
import { PETSPR } from "./pets.js";
import { SPR } from "./props.js";
import { land, msprites } from "./lands.js";
import { bob, draw, light, mountCanvas } from "./scene.js";
import { gw, heroName, petName, say } from "./shell.js";
import { P } from "./sprites.js";
import { $, app, esc, mulberry, reduced, ri, shuffle, sleep, rnd } from "./util.js";
import { record, timer } from "./stats.js";
import { save } from "./save.js";

/* ---------- Path room (programming, several exits) ---------- */
export const DIRS = { up: [-1, 0, "↑", "w górę"], down: [1, 0, "↓", "w dół"], left: [0, -1, "←", "w lewo"], right: [0, 1, "→", "w prawo"] };
export const MINI_MON = MON_FRAMES.fire[0][0];
export function minBlocks(M, target, maxRun, slide) {
  const key = (p) => p[0] + "," + p[1], seen = new Map([[key(M.start), 0]]), q = [M.start];
  const exitSet = new Set(M.exits.map((e) => key(e.cell)));
  while (q.length) {
    const cur = q.shift(), d = seen.get(key(cur));
    if (key(cur) === key(target)) return d;
    if (exitSet.has(key(cur)) && key(cur) !== key(M.start)) continue;
    for (const [dr, dc] of Object.values(DIRS)) {
      let r = cur[0], c = cur[1];
      for (let k = 1; k <= maxRun; k++) {
        r += dr; c += dc;
        if (r < 0 || r >= M.ROWS || c < 0 || c >= M.COLS || M.blocks.has(r + "," + c)) break;
        const kk = r + "," + c;
        if (!seen.has(kk)) { seen.set(kk, d + 1); q.push([r, c]); }
        if (exitSet.has(kk)) break;
      }
      if (slide) {
        let r2 = cur[0], c2 = cur[1], moved = 0;
        while (true) {
          const nr = r2 + dr, nc = c2 + dc;
          if (nr < 0 || nr >= M.ROWS || nc < 0 || nc >= M.COLS || M.blocks.has(nr + "," + nc)) break;
          r2 = nr; c2 = nc; moved++; if (exitSet.has(r2 + "," + c2)) break;
        }
        const kk = r2 + "," + c2;
        if (moved && !seen.has(kk)) { seen.set(kk, d + 1); q.push([r2, c2]); }
      }
    }
  }
  return Infinity;
}
export function genMap(lv, types) {
  const COLS = 7, ROWS = 6; let best = null;
  for (let attempt = 0; attempt < 400; attempt++) {
    const sr = ri(1, ROWS - 2), start = [sr, 0], open = new Set([sr + ",0"]);
    // exit rows: distinct, at least 2 apart, on the right edge
    const rows = []; for (const r of shuffle([0, 1, 2, 3, 4, 5])) if (rows.every((x) => Math.abs(x - r) >= 2)) rows.push(r);
    if (rows.length < types.length) continue;
    const exits = types.map((t, i) => ({ type: t, cell: [rows[i], COLS - 1] }));
    for (const ex of exits) {
      let r = sr, c = 0, horiz = true, guard = 0;
      while (c < COLS - 2 && guard++ < 30) {
        if (horiz) { const n = ri(1, Math.min(lv.maxSeg, COLS - 2 - c)); for (let i = 0; i < n; i++) open.add(r + "," + ++c); }
        else if (rnd() < 0.8) {
          const towards = rnd() < 0.6 ? Math.sign(ex.cell[0] - r) : (rnd() < 0.5 ? -1 : 1);
          const dir = towards || (r > 2 ? -1 : 1), room_ = dir < 0 ? r : ROWS - 1 - r;
          if (room_ >= 1) { const n = ri(1, Math.min(lv.maxSeg, room_)); for (let i = 0; i < n; i++) { r += dir; open.add(r + "," + c); } }
        }
        horiz = !horiz;
      }
      while (r !== ex.cell[0]) { r += Math.sign(ex.cell[0] - r); open.add(r + "," + c); }
      open.add(r + "," + (COLS - 1));
    }
    const exitKeys = new Set(exits.map((e) => e.cell + ""));
    const blocks = new Map();
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const k = r + "," + c; if (open.has(k)) continue;
      if (c === COLS - 1) { blocks.set(k, "tree"); continue; } // right edge: only exits are open
      const v = rnd(); if (v < 0.55) blocks.set(k, "tree"); else if (v < 0.68) blocks.set(k, "rock");
    }
    const M = { COLS, ROWS, start, exits, blocks, seed: ri(1, 99999) };
    const need = exits.map((e) => minBlocks(M, e.cell, lv.loops ? 4 : 1, lv.slide));
    if (need.some((n) => !isFinite(n))) continue;
    M.need = need;
    const score = Math.min(...need);
    if (!best || score > best.score) best = { M, open, exitKeys, start, score };
    if (score < (lv.slide ? 4 : lv.loops ? 4 : 7)) continue; // not too trivial
    M.need = need;
    return placeCoins(M, open, exitKeys, start, lv);
  }
  if (!best) return genMap(lv, types); // practically never: 400 unusable random layouts in a row
  const { M, open, exitKeys, start } = best;
  return placeCoins(M, open, exitKeys, start, lv);
}
export const SLIDE = 99;
// fewest blocks to pick up every coin in one run and still walk out through any exit
export function minBlocksAll(M, coinsArr, maxRun, slide) {
  const idx = new Map(coinsArr.map((k, i) => [k, i])), FULL = (1 << coinsArr.length) - 1;
  const exitSet = new Set(M.exits.map((e) => e.cell + ""));
  const free = (r, c) => r >= 0 && r < M.ROWS && c >= 0 && c < M.COLS && !M.blocks.has(r + "," + c);
  const seen = new Set([M.start[0] + "," + M.start[1] + ",0"]); let frontier = [[M.start[0], M.start[1], 0]], d = 0;
  while (frontier.length && d < 60) {
    d++; const next = [];
    for (const [r0, c0, m0] of frontier) for (const [dr, dc] of Object.values(DIRS)) {
      const runs = []; let r = r0, c = c0, m = m0;
      for (let k = 1; k <= maxRun; k++) { r += dr; c += dc; if (!free(r, c)) break; const key = r + "," + c; if (idx.has(key)) m |= 1 << idx.get(key); runs.push([r, c, m]); if (exitSet.has(key)) break; }
      if (slide) { let r2 = r0, c2 = c0, m2 = m0, mv = 0; while (free(r2 + dr, c2 + dc)) { r2 += dr; c2 += dc; mv++; const key = r2 + "," + c2; if (idx.has(key)) m2 |= 1 << idx.get(key); if (exitSet.has(key)) break; } if (mv) runs.push([r2, c2, m2]); }
      for (const [r2, c2, m2] of runs) {
        if (exitSet.has(r2 + "," + c2)) { if (m2 === FULL) return d; continue; }
        const st = r2 + "," + c2 + "," + m2; if (!seen.has(st)) { seen.add(st); next.push([r2, c2, m2]); }
      }
    }
    frontier = next;
  }
  return Infinity;
}
export function placeCoins(M, open, exitKeys, start, lv) {
  const free = [...open].filter((k) => k !== start + "" && !exitKeys.has(k));
  for (let t = 0; t < 40; t++) {
    const arr = shuffle(free).slice(0, ri(2, 3)), n = minBlocksAll(M, arr, lv.loops ? 4 : 1, lv.slide);
    if (isFinite(n)) { M.coins = new Set(arr); M.needAll = n; return M; }
  }
  M.coins = new Set(); M.needAll = Math.max(...M.need); return M;
}
// expands the program into single steps; a SLIDE block walks until the next field is blocked
export function simulate(M, prog) {
  const steps = []; let r = M.start[0], c = M.start[1];
  const exitAt = (a, b) => M.exits.some((e) => e.cell[0] === a && e.cell[1] === b);
  const free = (a, b) => a >= 0 && a < M.ROWS && b >= 0 && b < M.COLS && !M.blocks.has(a + "," + b);
  for (let bi = 0; bi < prog.length; bi++) {
    const { d, n } = prog[bi], [dr, dc] = DIRS[d];
    for (let k = 0; n === SLIDE || k < n; k++) {
      const nr = r + dr, nc = c + dc;
      if (!free(nr, nc)) { if (n === SLIDE && k > 0) break; steps.push({ bi, crash: true, r: nr, c: nc, what: M.blocks.get(nr + "," + nc) || "edge" }); return steps; }
      r = nr; c = nc; steps.push({ bi, r, c, dr, dc });
      if (exitAt(r, c)) return steps;
      if (k > 40) break;
    }
  }
  return steps;
}
export function hedge(ctx, x0, y0, w, h, seed) {
  const rnd = mulberry(seed), P = 0.5, [base, a, b, hi] = land().hedge;
  ctx.fillStyle = base; ctx.fillRect(x0, y0, w, h);
  for (let i = 0; i < (w * h) / 6; i++) {
    const cx = x0 + Math.floor(rnd() * w / P) * P, cy = y0 + Math.floor(rnd() * h / P) * P, rr = 1 + Math.floor(rnd() * 3);
    ctx.fillStyle = rnd() < 0.5 ? a : b;
    for (let dy = -rr; dy <= rr; dy += P) { const hw = Math.round(Math.sqrt(rr * rr - dy * dy) / P) * P; ctx.fillRect(cx - hw, cy + dy, hw * 2 + P, P); }
    ctx.fillStyle = hi; ctx.fillRect(cx - rr / 2, cy - rr / 2, P, P);
  }
}
export function pathRoom() {
  roomShell();
  const lv = L(), run = GS.RUN, first = run.i === 0;
  const T = land(), types = T.exits(lv.exits);
  const M = genMap(lv, types); if (window.__LW_TEST) { window.__LW_TEST.M = M; window.__LW_TEST.need = M.need; window.__LW_TEST.needAll = M.needAll; }
  const limit = lv.limitExtra == null ? Math.max(20, M.needAll + 4) : Math.max(Math.max(...M.need), M.needAll) + lv.limitExtra;
  const OY = 8, BW = (M.COLS + 1) * 16, BH = (M.ROWS + 1) * 16;
  const cv = mountCanvas(M.COLS + 1, M.ROWS + 1); $("sc").appendChild(cv.c); cv.c.setAttribute("aria-label", T.pathLabel);
  const bg = document.createElement("canvas"); bg.width = BW * 2; bg.height = BH * 2; const bx = bg.getContext("2d"); bx.imageSmoothingEnabled = false; bx.scale(2, 2);
  const rnd = mulberry(M.seed);
  const isExit = (r, c) => M.exits.some((e) => e.cell[0] === r && e.cell[1] === c);
  bx.save(); bx.translate(0, OY);
  for (let r = 0; r < M.ROWS; r++) for (let c = 0; c < M.COLS; c++) {
    const k = r + "," + c, openCell = !M.blocks.has(k);
    bx.drawImage((lv.showPath && openCell) || isExit(r, c) ? T.lane[(r + c) % 2] : T.ground[Math.floor(rnd() * 3)], c * 16, r * 16, 16, 16);
    if (!openCell && rnd() < 0.3) draw(bx, rnd() < 0.5 ? T.flowers[0] : T.flowers[1], c * 16, r * 16);
  }
  for (let r = 0; r < M.ROWS; r++) for (let c = 0; c < M.COLS; c++) {
    if ((r + c) % 2) { bx.fillStyle = "rgba(255,255,255,.10)"; bx.fillRect(c * 16, r * 16, 16, 16); }
    bx.fillStyle = "rgba(30,60,20,.28)"; bx.fillRect(c * 16, r * 16, 16, 1); bx.fillRect(c * 16, r * 16, 1, 16);
  }
  for (let r = 0; r < M.ROWS; r++) for (let c = 0; c < M.COLS; c++) { const b = M.blocks.get(r + "," + c); if (b) draw(bx, b === "tree" ? T.tree : SPR[b], c * 16, r * 16 - (b === "tree" ? 2 : 0)); }
  // the frame: exits continue as a dirt lane beyond the board, everything else is a hedge
  for (let r = 0; r < M.ROWS; r++) {
    const X = M.COLS * 16, Y = r * 16;
    if (M.exits.some((e) => e.cell[0] === r)) { bx.drawImage(T.lane[r % 2], X, Y, 16, 16); bx.fillStyle = "rgba(30,60,20,.28)"; bx.fillRect(X, Y, 16, 1); }
    else hedge(bx, X, Y, 16, 16, M.seed + r);
  }
  bx.restore();
  hedge(bx, 0, 0, BW, OY, M.seed + 50); hedge(bx, 0, BH - OY, BW, OY, M.seed + 60);
  light(bx, BW, BH);
  const EXSPR = { monster: MINI_MON, door: SPR.door, sign: SPR.sign, clock: msprites().clock, time: msprites().hourglass };
  let coins = new Set(M.coins), crash = false;
  const hero = { x: 0, y: M.start[0] * 16, hop: 0 }, pet = { x: 0, y: M.start[0] * 16 + 6 };
  let cell = M.start.slice();
  GS.scene = { cv, draw(t) {
    const x = cv.x; x.drawImage(bg, 0, 0, bg.width / 2, bg.height / 2);
    x.save(); x.translate(0, OY);
    M.exits.forEach((e, i) => {
      const [r, c] = e.cell, glow = reduced() ? 0.5 : (Math.sin(t / 300 + i) + 1) / 2;
      x.strokeStyle = `rgba(255,225,80,${0.55 + glow * 0.45})`; x.lineWidth = 1.5; x.strokeRect(c * 16 + 1.5, r * 16 + 1.5, 13, 13);
      draw(x, EXSPR[e.type], (c + 1) * 16 + 1, r * 16 + 1, e.type === "door" ? 0.85 : 0.9);
      const ax = c * 16 + 9 + (reduced() ? 0 : Math.round(glow * 2));
      x.fillStyle = "#fff6c9"; x.fillRect(ax, r * 16 + 7, 4, 2); x.fillRect(ax + 2, r * 16 + 6, 1, 4); x.fillRect(ax + 3, r * 16 + 7, 1, 2);
    });
    coins.forEach((k) => { const [r, c] = k.split(",").map(Number); draw(x, SPR.coin, c * 16, r * 16 - bob(t, r + c)); });
    if (!busy && prog.length) {
      x.font = "bold 7px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
      simulate(M, prog).forEach((st, n) => {
        if (st.crash) {
          const cx = Math.max(0, Math.min(M.COLS - 1, st.c)) * 16 + 8, cy = Math.max(0, Math.min(M.ROWS - 1, st.r)) * 16 + 8;
          x.fillStyle = "#e8442c"; x.save(); x.translate(cx, cy); x.rotate(Math.PI / 4); x.fillRect(-5, -1, 10, 3); x.fillRect(-1, -5, 3, 10); x.restore();
          return;
        }
        const cx = st.c * 16 + 8, cy = st.r * 16 + 8;
        x.fillStyle = "rgba(255,255,255,.88)"; x.beginPath(); x.arc(cx, cy, 4.5, 0, 7); x.fill();
        x.fillStyle = "#2a1d2e"; x.fillText(String(n + 1), cx, cy + 0.5);
      });
    }
    draw(x, PETSPR[GS.G.hero.pet], pet.x + 2, pet.y + 3 - bob(t, 2), 0.8);
    draw(x, GS.HERO, hero.x, hero.y - 3 - hero.hop - (crash ? 0 : bob(t)), 1);
    if (crash) { x.fillStyle = "#fff"; x.font = "bold 9px monospace"; x.fillText("!", hero.x + 13, hero.y + 2); }
    x.restore();
  } };
  function tween(obj, tx, ty, ms, hop) {
    return new Promise((res) => { const sx = obj.x, sy = obj.y, t0 = performance.now();
      function f(now) { const p = Math.min(1, (now - t0) / ms); obj.x = sx + (tx - sx) * p; obj.y = sy + (ty - sy) * p; if (hop) obj.hop = Math.round(Math.sin(p * Math.PI) * 3); if (p < 1) requestAnimationFrame(f); else { obj.hop = 0; res(); } }
      requestAnimationFrame(f); });
  }
  let took = timer();
  let prog = [], busy = false, active = -1, fails = 0, tries = 0; const maxTries = GS.G.level === 3 ? 3 : Infinity;
  const triesWord = (n) => n === 1 ? "próba" : n < 5 ? "próby" : "prób", leftWord = (n) => (n === 1 ? "Została" : "Zostały");
  $("ctl").innerHTML = `<div class="program" id="program" aria-label="Plan drogi"></div><span class="limit" id="limit"></span>
    <div class="pad">${Object.keys(DIRS).map((d) => `<button class="btn" data-d="${d}" aria-label="${DIRS[d][3]}">${DIRS[d][2]}</button>`).join("")}</div>
    ${lv.loops ? `<div class="times">${[2, 3, 4].map((n) => `<button class="btn gold" data-n="${n}">×${n}</button>`).join("")}${lv.slide ? `<button class="btn gold wide" data-n="${SLIDE}">aż do przeszkody</button>` : ""}</div>` : ""}
    <div class="run"><button class="btn" id="clearBtn">Wyczyść</button><button class="btn main" id="goBtn">▶ Idziemy!</button></div>`;
  const blkLabel = (b) => `${DIRS[b.d][2]}${b.n === SLIDE ? "<sup>…</sup>" : b.n > 1 ? `<sup>×${b.n}</sup>` : ""}`;
  function drawProg(scroll) {
    const el = $("program");
    el.innerHTML = prog.length ? prog.map((b, i) => `<button class="blk${i === active ? " active" : ""}" data-i="${i}" aria-label="${DIRS[b.d][3]}${b.n === SLIDE ? " aż do przeszkody" : b.n > 1 ? " razy " + b.n : ""}">${blkLabel(b)}</button>`).join("")
      : `<span class="empty">Ułóż strzałki — tak pójdzie ${esc(heroName())}</span>`;
    $("limit").textContent = (lv.limitExtra != null ? `Klocki: ${prog.length} / ${limit}` : `Strzałki: ${prog.length} / ${limit}`) + (isFinite(maxTries) ? ` · ${leftWord(maxTries - tries)} ${maxTries - tries} ${triesWord(maxTries - tries)}` : "");
    el.querySelectorAll(".blk").forEach((b) => b.addEventListener("click", () => { if (busy) return; prog.splice(+b.dataset.i, 1); snd.letter(); drawProg(); }));
    if (scroll === "end") el.scrollLeft = el.scrollWidth;
    else if (active >= 0) { const a = el.querySelector(".blk.active"); if (a) el.scrollLeft = a.offsetLeft - el.clientWidth / 2; }
  }
  drawProg();
  app.querySelectorAll("[data-d]").forEach((b) => b.addEventListener("click", () => {
    if (busy) return;
    if (prog.length >= limit) { snd.bad(); say(petName(), lv.loops ? `Mamy tylko ${limit} klocków. Użyj ×2, ×3 albo ×4!` : "To już bardzo dużo strzałek!"); return; }
    prog.push({ d: b.dataset.d, n: 1 }); snd.letter(); drawProg("end");
  }));
  app.querySelectorAll("[data-n]").forEach((b) => b.addEventListener("click", () => {
    if (busy) return; if (!prog.length) { say(petName(), "Najpierw wybierz strzałkę, potem razy."); return; }
    prog[prog.length - 1].n = +b.dataset.n; snd.letter(); drawProg("end");
  }));
  $("clearBtn").addEventListener("click", () => { if (busy) return; prog = []; drawProg(); });
  $("goBtn").addEventListener("click", async () => {
    if (busy) return;
    if (!prog.length) { say(petName(), "Najpierw ułóż strzałki."); return; }
    busy = true; let result = "short", reached = null; const picked = [], thought = took(), blocks = prog.length;
    const steps = simulate(M, prog);
    for (const stp of steps) {
      if (stp.bi !== active) { active = stp.bi; drawProg(); }
      if (stp.crash) {
        result = stp.what; const dr = stp.r - cell[0], dc = stp.c - cell[1];
        await tween(hero, hero.x + dc * 5, hero.y + dr * 5, 120); crash = true; snd.bump();
        await tween(hero, cell[1] * 16, cell[0] * 16, 160); break;
      }
      const prev = cell.slice(); cell = [stp.r, stp.c]; snd.step();
      await Promise.all([tween(hero, stp.c * 16, stp.r * 16, reduced() ? 120 : 300, true), tween(pet, prev[1] * 16 - 2, prev[0] * 16 + 4, reduced() ? 120 : 300)]);
      if (left(run)) return;
      if (coins.delete(stp.r + "," + stp.c)) { picked.push(stp.r + "," + stp.c); snd.coin(); }
      reached = M.exits.find((e) => e.cell[0] === stp.r && e.cell[1] === stp.c);
      if (reached) { result = "win"; break; }
    }
    active = -1; drawProg();
    const detail = (ok) => `${blocks} ${blocks === 1 ? "klocek" : blocks < 5 ? "klocki" : "klocków"}, monety ${picked.length}/${M.coins.size}${ok ? "" : `, ${result === "short" ? "za krótko" : "zderzenie"}`}`;
    if (result === "win") {
      record("code.path", true, thought, detail(true)); save();
      GS.RUN.rooms[GS.RUN.i + 1] = reached.type; GS.RUN.coins += picked.length; updHud();
      const all = picked.length > 0 && coins.size === 0;
      snd.ok(); burst(cv.c, 30);
      say(heroName(), `Udało się! ${picked.length ? `Zebrane monety: ${picked.length}${all ? " — wszystkie!" : ""}. ` : ""}Idziemy: ${ROOM_NAME[reached.type]}.`);
      return nextRoom();
    }
    record("code.path", false, thought, detail(false)); took = timer();
    picked.forEach((k) => coins.add(k));
    fails++; tries++;
    const msg = result === "tree" ? T.treeHit : result === "rock" ? "Ups, kamień!" : result === "edge" ? "Tam nie ma przejścia." : `Nie ${gw("doszłyśmy", "doszliśmy")} jeszcze do żadnego wyjścia.`;
    const back = picked.length ? " Monety wróciły na miejsce — liczą się dopiero, gdy dojdziesz do wyjścia." : "";
    await sleep(500); if (left(run)) return;
    crash = false; cell = M.start.slice(); hero.x = 0; hero.y = M.start[0] * 16; pet.x = 0; pet.y = hero.y + 6;
    if (tries >= maxTries) return guide();
    say(petName(), msg + back + (isFinite(maxTries) ? ` ${leftWord(maxTries - tries)} ${maxTries - tries} ${triesWord(maxTries - tries)}.` : " Popraw strzałki i spróbuj jeszcze raz."));
    drawProg();
    busy = false;
  });
  // level 3: after the last failed try the companion leads the way out — no coins this time
  async function guide() {
    const fainted = await hurt(); if (left(run)) return;
    if (!fainted) say(petName(), "Skończyły się próby. Pokażę ci drogę, ale tym razem bez monet.");
    const key = (r, c) => r + "," + c, prev = new Map([[key(...M.start), null]]), q = [M.start.slice()], exitSet = new Set(M.exits.map((e) => e.cell + ""));
    let end = null;
    while (q.length && !end) {
      const [r0, c0] = q.shift();
      for (const [dr, dc] of Object.values(DIRS)) {
        const r = r0 + dr, c = c0 + dc, k = key(r, c);
        if (r < 0 || r >= M.ROWS || c < 0 || c >= M.COLS || M.blocks.has(k) || prev.has(k)) continue;
        prev.set(k, key(r0, c0)); if (exitSet.has(k)) { end = k; break; } q.push([r, c]);
      }
    }
    const path = []; for (let k = end; k && k !== key(...M.start); k = prev.get(k)) path.unshift(k.split(",").map(Number));
    await sleep(1200); if (left(run)) return;
    for (const [r, c] of path) { const p0 = cell.slice(); cell = [r, c]; snd.step(); await Promise.all([tween(hero, c * 16, r * 16, 260, true), tween(pet, p0[1] * 16 - 2, p0[0] * 16 + 4, 260)]); if (left(run)) return; }
    const ex = M.exits.find((e) => e.cell[0] === cell[0] && e.cell[1] === cell[1]);
    GS.RUN.rooms[GS.RUN.i + 1] = ex.type;
    say(petName(), `Jesteśmy przy wyjściu. Idziemy: ${ROOM_NAME[ex.type]}.`);
    nextRoom();
  }
  const exitsTxt = M.exits.map((e) => ROOM_NAME[e.type]).join(", ");
  const intro = first
    ? `Wyruszamy! Jedna strzałka to jeden krok, czyli jedno pole. ${T.key === "mountains" ? "Szlak ma" : "Z lasu prowadzą"} ${M.exits.length === 2 ? "dwa wyjścia" : "trzy wyjścia"}: ${exitsTxt}. Wybierz, dokąd idziemy, i ułóż strzałki. Monety liczą się, gdy dojdziesz do wyjścia — zawsze da się zebrać wszystkie naraz.${isFinite(maxTries) ? " Masz 3 próby." : ""}`
    : `${T.key === "mountains" ? "Szlak się rozwidla" : "Las się rozwidla"}. Wyjścia: ${exitsTxt}. Dokąd idziemy?`;
  // on screen a short line (the board shows the rest); read aloud the full explanation
  const short = `${first ? "Ułóż strzałki do wyjścia i zbierz monety." : "Dokąd idziemy?"} Wyjścia: ${exitsTxt}.${first && isFinite(maxTries) ? " Masz 3 próby." : ""}`;
  say(petName(), short, intro + (lv.loops && first ? ` Możesz użyć najwyżej ${limit} klocków — pomogą ci ×2, ×3 i ×4.` : "")
    + (lv.slide && first ? ` Nowy klocek: „aż do przeszkody”. ${gw("Bohaterka idzie tak długo, dopóki nic jej nie zatrzyma.", "Bohater idzie tak długo, dopóki nic go nie zatrzyma.")}` : ""));
}
