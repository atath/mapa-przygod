import { GS } from "./state.js";

/* ================== Measurements (stage 3 groundwork) ==================
   Records what the child answers and how long play takes, without changing the game:
   - answers: one entry per task, by skill (e.g. "math.sub"), right or wrong, thinking time
   - trips: how long each expedition took in active time, finished or abandoned
   - days: active play seconds per calendar day (the future time limit counts the same way)
   "Active" = the game is on screen and was touched in the last 2 minutes. */
const MAX_ANSWERS = 400, MAX_TRIPS = 40, MAX_DAYS = 60, IDLE_MS = 120000;

export const SKILLS = {
  "math.cards": "Karty: suma równa mocy potwora",
  "math.add": "Dodawanie", "math.sub": "Odejmowanie", "math.miss": "Brakująca liczba", "math.three": "Trzy liczby",
  "math.buy": "Odejmowanie przy zakupach",
  "logic.spell": "Dobór czaru do potwora",
  "polish.word": "Układanie słowa z liter", "polish.read": "Czytanie drogowskazów", "polish.password": "Hasło do skrzyni",
  "code.path": "Ścieżka ze strzałek"
};

export const emptyStats = () => ({ answers: [], trips: [], days: {} });
export function normalizeStats(s) {
  const d = emptyStats();
  if (!s || typeof s !== "object") return d;
  if (Array.isArray(s.answers)) d.answers = s.answers.filter((a) => a && SKILLS[a.k] && typeof a.t === "number")
    .map((a) => ({ k: a.k, ok: !!a.ok, ms: Math.max(0, a.ms | 0), t: a.t, ...(typeof a.d === "string" ? { d: a.d.slice(0, 40) } : {}) })).slice(-MAX_ANSWERS);
  if (Array.isArray(s.trips)) d.trips = s.trips.filter((x) => x && typeof x.t === "number")
    .map((x) => ({ t: x.t, ms: Math.max(0, x.ms | 0), done: !!x.done, lv: x.lv | 0 })).slice(-MAX_TRIPS);
  if (s.days && typeof s.days === "object") for (const k of Object.keys(s.days).sort().slice(-MAX_DAYS)) if (/^\d{4}-\d\d-\d\d$/.test(k)) d.days[k] = Math.max(0, s.days[k] | 0);
  return d;
}

const st = () => GS.G && GS.G.stats;
// detail: a short reminder of the task for the parent's report, e.g. "14 − 6 → 7"
export function record(skill, ok, ms, detail) {
  const s = st(); if (!s || !SKILLS[skill]) return;
  s.answers.push({ k: skill, ok: !!ok, ms: Math.max(0, Math.round(ms || 0)), t: Date.now(), ...(detail != null ? { d: String(detail).slice(0, 40) } : {}) });
  if (s.answers.length > MAX_ANSWERS) s.answers.splice(0, s.answers.length - MAX_ANSWERS);
}
export function tripStart(run) { run.t0 = Date.now(); run.active = 0; }
export function tripEnd(run, done) {
  const s = st(); if (!s || !run || run.ended) return;
  run.ended = true;
  s.trips.push({ t: run.t0 || Date.now(), ms: run.active || 0, done: !!done, lv: GS.G.level });
  if (s.trips.length > MAX_TRIPS) s.trips.splice(0, s.trips.length - MAX_TRIPS);
}
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const timer = () => { const t0 = performance.now(); return () => performance.now() - t0; };

/* ---------- active-time clock ---------- */
let lastInput = Date.now(), dirty = 0;
export const isActive = () => typeof document !== "undefined" && document.visibilityState === "visible" && Date.now() - lastInput < IDLE_MS;
if (typeof window !== "undefined") {
  for (const ev of ["pointerdown", "keydown"]) addEventListener(ev, () => { lastInput = Date.now(); }, { capture: true, passive: true });
  setInterval(() => {
    const s = st(); if (!s || !isActive()) return;
    if (document.querySelector("#panel:not([hidden]), #pin1, #staleBox")) return; // a parent at work is not the child's play time
    const k = dayKey(); s.days[k] = (s.days[k] || 0) + 1;
    if (GS.RUN) GS.RUN.active = (GS.RUN.active || 0) + 1000;
    if (++dirty >= 30) { dirty = 0; if (onTick) onTick(); } // persist about every 30 s of play
  }, 1000);
}
let onTick = null;
export function persistWith(fn) { onTick = fn; }
