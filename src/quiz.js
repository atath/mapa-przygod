import { GS } from "./state.js";
import { snd } from "./audio.js";
import { hurt, left } from "./expedition.js";
import { burst } from "./fx.js";
import { save } from "./save.js";
import { petName, say } from "./shell.js";
import { record, timer } from "./stats.js";
import { $, app, esc, sleep } from "./util.js";

/* ================== One multiple-choice task, shared by the logic and time rooms ==================
   A gentle failure: the first wrong pick only greys out that answer and explains why it does not fit;
   a second wrong pick costs a heart, shows the right answer and moves on.
   o.head: HTML above the options (built with esc() for anything not written by us)
   o.after(ctl): draws canvases into the freshly built task
   o.skill: stats key; o.note(misses): a short reminder of the task for the parent's report */
export function askChoice(q, o) {
  return new Promise((resolve) => {
    const run = GS.RUN, took = timer();
    $("ctl").innerHTML = `<div class="task">${o.head || ""}</div>
      <div class="opts ${o.cls || ""}">${q.opts.map((op) => `<button class="btn opt" data-a="${esc(op.a)}">${op.e ? `<span class="em" aria-hidden="true">${op.e}</span>` : ""}<span class="lb">${esc(op.label != null ? op.label : op.n)}</span>${op.sub ? `<small>${esc(op.sub)}</small>` : ""}</button>`).join("")}</div>`;
    if (o.after) o.after($("ctl"));
    if (window.__LW_TEST) window.__LW_TEST.q = { kind: q.kind, ans: q.ans };
    const labelOf = (a) => { const op = q.opts.find((x) => x.a === a); return op ? (op.label != null ? op.label : op.n) : a; };
    let misses = 0, done = false;
    app.querySelectorAll("#ctl .opt").forEach((b) => b.addEventListener("click", async () => {
      if (done || b.disabled) return;
      const a = b.dataset.a;
      if (a === q.ans) {
        done = true; b.classList.add("right"); snd.ok(); burst(b);
        record(o.skill, misses === 0, took(), o.note(misses)); save();
        resolve({ ok: misses === 0 }); return;
      }
      misses++; b.classList.add("wrong"); b.disabled = true; b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake");
      if (misses === 1) { snd.bad(); say(petName(), `Hmm, to nie to. ${q.why(a)}`); return; }
      done = true;
      const fainted = await hurt(); if (left(run)) return;
      const right = app.querySelector(`#ctl .opt[data-a="${CSS.escape(q.ans)}"]`); if (right) right.classList.add("right");
      if (!fainted) say(petName(), `Dobra odpowiedź to: ${labelOf(q.ans)}. ${q.why(a)}`);
      record(o.skill, false, took(), o.note(misses)); save();
      await sleep(3200); if (left(run)) return;
      resolve({ ok: false });
    }));
  });
}
