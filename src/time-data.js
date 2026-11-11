import { pick, ri, rnd, shuffle } from "./util.js";

/* ================== Clock and time tasks (no DOM: unit-tested in Node) ==================
   Grade-1 scope: full hours and half hours on a 12-hour clock, plus a feel for how long things take. */

const NOM = ["", "pierwsza", "druga", "trzecia", "czwarta", "piąta", "szósta", "siódma", "ósma", "dziewiąta", "dziesiąta", "jedenasta", "dwunasta"];
const GEN = ["", "pierwszej", "drugiej", "trzeciej", "czwartej", "piątej", "szóstej", "siódmej", "ósmej", "dziewiątej", "dziesiątej", "jedenastej", "dwunastej"];
export const h12 = (h) => ((h - 1 + 120) % 12) + 1;
export const digital = (h, m) => `${h12(h)}:${m === 30 ? "30" : "00"}`;
// how a Polish first-grader says it: 3:00 "trzecia", 3:30 "wpół do czwartej"
export const words = (h, m) => (m === 30 ? `wpół do ${GEN[h12(h + 1)]}` : NOM[h12(h)]);
const timeOpt = (h, m) => ({ a: digital(h, m), n: words(h, m), label: digital(h, m), sub: words(h, m), h: h12(h), m });

export function genRead(lvl) {
  const h = ri(1, 12), m = rnd() < (lvl === 1 ? 0.35 : 0.6) ? 30 : 0;
  // the usual mistakes: at half past, reading the hour the short hand is moving towards; one hour off; the other half
  const wrong = m === 30 ? [[h + 1, 30], [h, 0], [h + 1, 0], [h - 1, 30]] : [[h + 1, 0], [h - 1, 0], [h, 30], [h - 1, 30]];
  const opts = [timeOpt(h, m), ...shuffle(wrong).slice(0, lvl === 1 ? 2 : 3).map(([a, b]) => timeOpt(a, b))];
  return {
    kind: "read", title: "Która godzina?", h: h12(h), m, opts: shuffle(opts), ans: digital(h, m),
    say: "Która godzina jest na zegarze? Mała wskazówka pokazuje godzinę, duża minuty.",
    why: () => m === 30
      ? `Duża wskazówka stoi na 6, więc jest pół godziny. Mała jest między ${h12(h)} a ${h12(h + 1)}, czyli wpół do ${GEN[h12(h + 1)]}: ${digital(h, m)}.`
      : `Duża wskazówka stoi na 12, więc jest pełna godzina. Mała pokazuje ${h12(h)}, czyli ${NOM[h12(h)]}: ${digital(h, m)}.`
  };
}
export function genSet(lvl) {
  const h = ri(1, 12), m = lvl === 1 ? 0 : rnd() < 0.5 ? 30 : 0;
  return {
    kind: "set", title: `Ustaw zegar na ${digital(h, m)}`, h, m, ans: digital(h, m),
    say: `Ustaw zegar na godzinę ${words(h, m)}. Strzałkami przesuwasz małą wskazówkę, a przyciskiem dużą.`,
    why: () => m === 30
      ? `Na ${digital(h, m)} duża wskazówka stoi na 6, a mała między ${h12(h)} a ${h12(h + 1)}.`
      : `Na ${digital(h, m)} duża wskazówka stoi na 12, a mała na ${h12(h)}.`
  };
}
const EVENTS = [["Bajka", "🎬"], ["Wizyta u babci", "👵"], ["Basen", "🏊"], ["Urodziny u koleżanki", "🎂"], ["Spacer z psem", "🐕"], ["Wycieczka do zoo", "🦒"]];
const durWord = (min) => (min === 30 ? "pół godziny" : min === 60 ? "godzinę" : min === 90 ? "półtorej godziny" : `${min / 60} godziny`);
export function genElapsed(lvl) {
  const [ev, e] = pick(EVENTS);
  const sm = lvl === 3 && rnd() < 0.5 ? 30 : 0, dur = pick(lvl === 1 ? [60] : lvl === 2 ? [60, 120, 180] : [30, 60, 90, 120]);
  const h = ri(1, 11), endMin = h * 60 + sm + dur, eh = Math.floor(endMin / 60), em = endMin % 60;
  const wrong = [[eh + 1, em], [eh - 1, em], [h, sm], [eh, em === 30 ? 0 : 30]];
  const right = timeOpt(eh, em), opts = [right];
  for (const [a, b] of shuffle(wrong)) { const o = timeOpt(a, b); if (!opts.some((x) => x.a === o.a) && opts.length < (lvl === 1 ? 3 : 4)) opts.push(o); }
  return {
    kind: "elapsed", title: "O której się skończy?", h, m: sm, e, ans: right.a, opts: shuffle(opts),
    text: `${ev} zaczyna się o ${digital(h, sm)} i trwa ${durWord(dur)}.`,
    say: `${ev} zaczyna się o ${words(h, sm)} i trwa ${durWord(dur)}. O której się skończy?`,
    why: () => `${digital(h, sm)} i jeszcze ${durWord(dur)} to ${right.a}.${dur >= 60 ? " Godzina to jeden pełny obrót dużej wskazówki." : ""}`
  };
}

/* ---------- how long things take ---------- */
export const SPANS = [
  { k: "s", label: "sekundę lub dwie", hint: "Sekunda to tyle, co jedno klaśnięcie." },
  { k: "m1", label: "około minuty", hint: "Minuta to 60 sekund — tyle, co porządne mycie rąk." },
  { k: "m5", label: "kilka minut", hint: "Kilka minut to na przykład mycie zębów albo jedna piosenka." },
  { k: "h1", label: "około godziny", hint: "Godzina to 60 minut — tyle, co lekcja w szkole i przerwa." },
  { k: "long", label: "wiele godzin", hint: "Wiele godzin to na przykład cała noc snu." }
];
export const ACTS = [
  ["klaśnięcie w dłonie", "👏", "s"], ["mrugnięcie okiem", "😉", "s"], ["kichnięcie", "🤧", "s"], ["podskok", "🦘", "s"],
  ["umycie rąk", "🧼", "m1"], ["zawiązanie butów", "👟", "m1"], ["założenie kurtki", "🧥", "m1"],
  ["mycie zębów", "🦷", "m5"], ["zjedzenie jabłka", "🍎", "m5"], ["ubranie się rano", "👕", "m5"], ["jedna piosenka", "🎵", "m5"],
  ["lekcja w szkole", "🏫", "h1"], ["upieczenie ciasta", "🎂", "h1"], ["zabawa na placu zabaw", "🤸", "h1"],
  ["sen w nocy", "🛏️", "long"], ["wycieczka w góry", "🏔️", "long"], ["dzień w szkole", "🎒", "long"]
].map(([n, e, c]) => ({ n, e, c }));
const spanIdx = (k) => SPANS.findIndex((s) => s.k === k);

export function genHowLong(lvl) {
  const act = pick(ACTS), i = spanIdx(act.c);
  // level 1 keeps the wrong answers far from the right one; higher levels add the neighbours
  const far = SPANS.filter((_, j) => Math.abs(j - i) >= 2), near = SPANS.filter((_, j) => Math.abs(j - i) === 1);
  const others = lvl === 1 ? shuffle(far).slice(0, 2) : shuffle([...shuffle(near).slice(0, 1), ...shuffle(far)]).slice(0, lvl === 2 ? 2 : 3);
  return {
    kind: "howlong", title: `Ile trwa ${act.n}?`, e: act.e, ans: act.c,
    opts: shuffle([SPANS[i], ...others]).map((s) => ({ a: s.k, n: s.label })),
    say: `Ile trwa ${act.n}?`, why: () => `${cap(act.n)} trwa ${SPANS[i].label}. ${SPANS[i].hint}`
  };
}
export function genLonger(lvl) {
  for (;;) {
    const [a, b] = shuffle(ACTS), d = spanIdx(b.c) - spanIdx(a.c);
    if (Math.abs(d) < (lvl === 1 ? 2 : 1)) continue;
    const win = d > 0 ? b : a, lose = d > 0 ? a : b;
    return {
      kind: "longer", title: "Co trwa dłużej?", ans: win.n,
      opts: [a, b].map((x) => ({ a: x.n, e: x.e, n: x.n })),
      say: `Co trwa dłużej: ${a.n} czy ${b.n}?`,
      why: () => `${cap(win.n)} trwa ${SPANS[spanIdx(win.c)].label}, a ${lose.n} tylko ${SPANS[spanIdx(lose.c)].label}.`
    };
  }
}
// feel a span without looking: press start, count in your head, press stop
export function genFeel(lvl) {
  const secs = lvl === 1 ? 5 : 10;
  return { kind: "feel", title: `Wyczuj ${secs} sekund`, secs, tol: lvl === 3 ? 2 : 3,
    say: `Naciśnij start i policz w myślach do ${secs}, powoli, tak jak tyka zegar. Potem naciśnij stop.` };
}
const cap = (s) => s[0].toUpperCase() + s.slice(1);

export function clockRoomTasks(lvl) { return [genRead(lvl), genSet(lvl), genElapsed(lvl)]; }
export function timeRoomTasks(lvl) { return lvl === 3 ? [genHowLong(lvl), genLonger(lvl), genHowLong(lvl), genFeel(lvl)] : [genHowLong(lvl), genLonger(lvl), genFeel(lvl)]; }

// "This trip took 12 minutes — as long as four songs": real time the child has just lived through
export function tripTimeLine(ms) {
  const min = Math.round(ms / 60000);
  if (min < 1) return "";
  const mw = min === 1 ? "minutę" : min % 10 >= 2 && min % 10 <= 4 && (min % 100 < 12 || min % 100 > 14) ? "minuty" : "minut";
  const songs = Math.round(min / 3);
  const cmp = songs >= 1 ? ` To tyle, co ${songs} ${songs === 1 ? "piosenka" : songs >= 2 && songs <= 4 ? "piosenki" : "piosenek"}.` : " To krócej niż jedna piosenka.";
  return `Ta wyprawa trwała ${min === 1 ? "minutę" : `${min} ${mw}`}.${cmp}${min >= 45 ? " Prawie jak cała lekcja w szkole!" : ""}`;
}
