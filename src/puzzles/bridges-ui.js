import { GS } from "../state.js";
import { snd } from "../audio.js";
import { hurt, left } from "../expedition.js";
import { burst } from "../fx.js";
import { save } from "../save.js";
import { petName, say } from "../shell.js";
import { record, timer } from "../stats.js";
import { $, sleep } from "../util.js";
import { testHook } from "../puzzle-ui.js";
import { genBridges } from "./bridges.js";

const FREE = 3; // mistakes that cost nothing: the first moves are guesses by nature

const crHTML = (c) => `<span class="crb ${c.color} ${c.shape}">${c.hat === "hat" ? `<b class="hat"></b>` : ""}<i></i><i></i></span>`;

export function playBridges(lvl) {
  return new Promise((resolve) => {
    const q = genBridges(lvl), run = GS.RUN, took = timer();
    const where = q.crs.map(() => null), wrong = q.crs.map(() => null);
    let sel = null, fails = 0, done = false;
    say("Mądra Sowa", "Lewy most przepuszcza tylko niektóre stworki, prawy wszystkie inne. Którędy kto przejdzie? Dotknij stworka, potem most.",
      "Dwa mosty! Lewy most przepuszcza tylko niektóre stworki, a prawy wszystkie inne. Nie powiem, które. Wysyłaj stworki i patrz, co się stanie. Dotknij stworka, a potem most.");
    $("ctl").innerHTML = `<div class="task pz"><div class="brs">
        <div class="br"><button class="bridge" data-b="L" aria-label="lewy most">🌉 lewy</button><div class="over" id="overL"></div></div>
        <div class="br"><button class="bridge" data-b="R" aria-label="prawy most">prawy 🌉</button><div class="over" id="overR"></div></div>
      </div><div class="crs" id="crs"></div></div>`;
    const paint = () => {
      const cr = (c) => `<button class="cr${sel === c.id ? " sel" : ""}${wrong[c.id] ? " no" + wrong[c.id] : ""}" data-i="${c.id}" aria-pressed="${sel === c.id}" aria-label="stworek ${c.id + 1}">${crHTML(c)}</button>`;
      $("crs").innerHTML = q.crs.filter((c) => !where[c.id]).map(cr).join("");
      for (const b of ["L", "R"]) $("over" + b).innerHTML = q.crs.filter((c) => where[c.id] === b).map((c) => `<span class="cr in">${crHTML(c)}</span>`).join("");
    };
    paint();
    testHook("bridges", q.ans, q.crs.flatMap((c) => [`.cr[data-i="${c.id}"]`, `.bridge[data-b="${q.ans[c.id]}"]`]));
    const finish = async (solved) => {
      done = true;
      record("logic.bridges", solved && fails <= 2, took(), `${q.words}, pomyłki: ${fails}`.slice(0, 40)); save();
      if (solved) { snd.ok(); burst($("overL")); say(petName(), `Mamy to! Lewy most przepuszczał ${q.words}.`); await sleep(2200); }
      if (left(run)) return;
      resolve({ solved, perfect: solved && fails <= 2 });
    };
    $("ctl").querySelector(".crs").addEventListener("click", (e) => {
      const b = e.target.closest(".cr"); if (!b || done) return;
      sel = sel === +b.dataset.i ? null : +b.dataset.i; snd.step(); paint();
    });
    $("ctl").querySelector(".brs").addEventListener("click", async (e) => {
      const b = e.target.closest(".bridge"); if (!b || done) return;
      if (sel == null) { say(petName(), "Najpierw dotknij stworka, a potem most."); return; }
      const c = q.crs[sel], side = b.dataset.b; sel = null;
      if (q.ans[c.id] === side) {
        where[c.id] = side; wrong[c.id] = null; snd.letter(); paint();
        if (where.every(Boolean)) await finish(true);
        return;
      }
      fails++; wrong[c.id] = side; snd.bad(); paint();
      if (fails <= FREE) { say(petName(), side === "L" ? "Lewy most nie przepuścił tego stworka. Czym on się różni od tych, które przeszły?" : "Prawy most nie chce tego stworka. Może przejdzie lewym?"); return; }
      done = true;
      const fainted = await hurt(); if (left(run)) return;
      q.crs.forEach((x) => (where[x.id] = q.ans[x.id])); paint();
      if (!fainted) say(petName(), `Zdradzę ci tajemnicę: lewy most przepuszczał ${q.words}.`);
      await sleep(3200); if (left(run)) return;
      done = false; await finish(false);
    });
  });
}
