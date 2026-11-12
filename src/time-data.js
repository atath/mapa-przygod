import { pick, ri, rnd, shuffle } from "./util.js";

/* ================== Clock and time tasks (no DOM: unit-tested in Node) ==================
   Grade-1 scope: full hours and half hours on a 12-hour clock, plus a feel for how long things take. */

const NOM = ["", "pierwsza", "druga", "trzecia", "czwarta", "piąta", "szósta", "siódma", "ósma", "dziewiąta", "dziesiąta", "jedenasta", "dwunasta"];
const GEN = ["", "pierwszej", "drugiej", "trzeciej", "czwartej", "piątej", "szóstej", "siódmej", "ósmej", "dziewiątej", "dziesiątej", "jedenastej", "dwunastej"];
export const h12 = (h) => ((h - 1 + 120) % 12) + 1;
export const digital = (h, m) => `${h12(h)}:${m === 30 ? "30" : "00"}`;
// how a Polish first-grader says it: 3:00 "trzecia", 3:30 "wpół do czwartej"
export const words = (h, m) => (m === 30 ? `wpół do ${GEN[h12(h + 1)]}` : NOM[h12(h)]);
// "na trzecią", "na wpół do czwartej": what you set the clock to
const ACC = ["", "pierwszą", "drugą", "trzecią", "czwartą", "piątą", "szóstą", "siódmą", "ósmą", "dziewiątą", "dziesiątą", "jedenastą", "dwunastą"];
export const wordsAcc = (h, m) => (m === 30 ? `wpół do ${GEN[h12(h + 1)]}` : ACC[h12(h)]);
// with only the short hand a child says it roughly: "trzecia", "trochę po trzeciej", "wpół do czwartej", "prawie czwarta"
export const rough = (h, m) => (m === 0 ? NOM[h12(h)] : m === 10 ? `trochę po ${GEN[h12(h)]}` : m === 30 ? `wpół do ${GEN[h12(h + 1)]}` : `prawie ${NOM[h12(h + 1)]}`);
// how an answer reads on each level: words at level 1, words with the digits small at level 2, digits at level 3
export function labelFor(o, lvl) {
  const w = words(o.h, o.m), d = digital(o.h, o.m);
  return lvl === 1 ? { ...o, label: w, sub: "" } : lvl === 2 ? { ...o, label: w, sub: d } : { ...o, label: d, sub: w };
}
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
// Level 1 starts here: a clock with only the short hand, read roughly
export function genHourOnly() {
  const h = ri(1, 12), m = pick([0, 10, 30, 50]);
  const near = { 0: [[-1, 50], [0, 30]], 10: [[-1, 50], [0, 30]], 30: [[0, 0], [0, 50]], 50: [[0, 30], [1, 10]] }[m];
  const o = (hh, mm) => ({ a: `${h12(hh)}:${mm}`, n: rough(hh, mm), h: h12(hh), m: mm });
  const right = o(h, m), opts = [right];
  for (const [dh, dm] of shuffle([[pick([-1, 1]), 0], ...near]).map(([a, b]) => (b === 0 && a !== 0 && !near.some((x) => x[0] === a && x[1] === b) ? [a, m] : [a, b]))) {
    const x = o(h + dh, dm); if (opts.length < 3 && !opts.some((y) => y.a === x.a)) opts.push(x);
  }
  const where = m === 0 ? `stoi dokładnie na ${h12(h)}` : m === 10 ? `minęła ${h12(h)} tylko trochę` : m === 30 ? `stoi w połowie drogi między ${h12(h)} a ${h12(h + 1)}` : `prawie dotyka ${h12(h + 1)}`;
  return {
    kind: "hour", title: "Która mniej więcej godzina?", h: h12(h), m, ans: right.a, opts: shuffle(opts),
    say: "Ten zegar ma tylko małą wskazówkę. Która mniej więcej jest godzina?",
    why: () => `Mała wskazówka ${where}, więc jest ${right.n}.`
  };
}

export function genSet(lvl) {
  const h = ri(1, 12), m = lvl === 1 ? 0 : rnd() < 0.5 ? 30 : 0;
  return {
    kind: "set", title: `Ustaw zegar na ${wordsAcc(h, m)}`, h, m, ans: digital(h, m),
    say: `Ustaw zegar na ${wordsAcc(h, m)}. Kręć wskazówkami: o pół godziny albo o całą godzinę.`,
    why: () => m === 30
      ? `O ${wordsAt(h, m)} duża wskazówka stoi na 6, a mała między ${h12(h)} a ${h12(h + 1)}.`
      : `O ${wordsAt(h, m)} duża wskazówka stoi na 12, a mała na ${h12(h)}.`
  };
}
const EVENTS = [["Bajka", "🎬"], ["Wizyta u babci", "👵"], ["Basen", "🏊"], ["Urodziny u koleżanki", "🎂"], ["Spacer z psem", "🐕"], ["Wycieczka do zoo", "🦒"]];
// "pół godziny", "godzinę", "półtorej godziny", "2 godziny", "2 i pół godziny", "5 godzin"
export function durWord(min) {
  if (min <= 0) return "nic"; if (min === 30) return "pół godziny"; if (min === 60) return "godzinę"; if (min === 90) return "półtorej godziny";
  const k = Math.floor(min / 60), half = min % 60 === 30;
  return half ? `${k} i pół godziny` : `${k} ${k % 10 >= 2 && k % 10 <= 4 && (k % 100 < 12 || k % 100 > 14) ? "godziny" : "godzin"}`;
}
// "o trzeciej", "o wpół do czwartej"
export const wordsAt = (h, m) => (m === 30 ? `wpół do ${GEN[h12(h + 1)]}` : GEN[h12(h)]);
export function genElapsed(lvl) {
  const [ev, e] = pick(EVENTS);
  const sm = lvl === 3 && rnd() < 0.5 ? 30 : 0, dur = pick(lvl === 1 ? [60] : lvl === 2 ? [60, 120, 180] : [30, 60, 90, 120]);
  const h = ri(1, 11), endMin = h * 60 + sm + dur, eh = Math.floor(endMin / 60), em = endMin % 60;
  const wrong = [[eh + 1, em], [eh - 1, em], [h, sm], [eh, em === 30 ? 0 : 30]];
  const right = timeOpt(eh, em), opts = [right];
  for (const [a, b] of shuffle(wrong)) { const o = timeOpt(a, b); if (!opts.some((x) => x.a === o.a) && opts.length < (lvl === 1 ? 3 : 4)) opts.push(o); }
  return {
    kind: "elapsed", title: "O której się skończy?", h, m: sm, e, ans: right.a, opts: shuffle(opts), ev, dur, start: h * 60 + sm, end: endMin,
    text: `${ev} zaczyna się o ${lvl === 3 ? digital(h, sm) : wordsAt(h, sm)} i trwa ${durWord(dur)}.`,
    say: `${ev} zaczyna się o ${words(h, sm)} i trwa ${durWord(dur)}. O której się skończy?`,
    why: () => `Jeśli zaczniemy o ${wordsAt(h, sm)} i poczekamy ${durWord(dur)}, będzie ${words(eh, em)}.${dur >= 60 ? " Godzina to jeden pełny obrót dużej wskazówki." : ""}`
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

export function clockRoomTasks(lvl) { return lvl === 1 ? [genHourOnly(), genSet(1), pick([genRead, genElapsed])(1)] : [genRead(lvl), genSet(lvl), genElapsed(lvl)]; }
export function timeRoomTasks(lvl) { const mid = rnd() < 0.5 ? genDay(lvl) : genLonger(lvl); return lvl === 3 ? [genHowLong(lvl), mid, genHowLong(lvl), genFeel(lvl)] : [genHowLong(lvl), mid, genFeel(lvl)]; }

// "This trip took 12 minutes — as long as four songs": real time the child has just lived through
export function tripTimeLine(ms) {
  const min = Math.round(ms / 60000);
  if (min < 1) return "";
  const mw = min === 1 ? "minutę" : min % 10 >= 2 && min % 10 <= 4 && (min % 100 < 12 || min % 100 > 14) ? "minuty" : "minut";
  const songs = Math.round(min / 3);
  const cmp = songs >= 1 ? ` To tyle, co ${songs} ${songs === 1 ? "piosenka" : songs >= 2 && songs <= 4 ? "piosenki" : "piosenek"}.` : " To krócej niż jedna piosenka.";
  return `Ta wyprawa trwała ${min === 1 ? "minutę" : `${min} ${mw}`}.${cmp}${min >= 45 ? " Prawie jak cała lekcja w szkole!" : ""}`;
}

/* ---------- guess how long the trip will take, then compare at the chest ---------- */
export const guessOptions = (lvl) => (lvl === 1 ? [2, 10, 60] : [2, 10, 30, 60]);
const GUESS_ACC = { 2: "2 minuty", 10: "10 minut", 30: "pół godziny", 60: "godzinę" }, GUESS_GEN = { 2: "2 minut", 10: "10 minut", 30: "pół godziny", 60: "godziny" };
export const guessLabel = (g) => GUESS_ACC[g];
// the answer nearest to the real time, measured in ratios (2 → 10 minutes is as far as 10 → 50)
export function guessHit(guess, min, opts) {
  const d = (g) => Math.abs(Math.log(g) - Math.log(Math.max(0.5, min)));
  return opts.reduce((best, g) => (d(g) < d(best) ? g : best), opts[0]) === guess;
}
const minAcc = (min) => (min < 1 ? "niecałą minutę" : min === 1 ? "minutę" : `${min} ${min % 10 >= 2 && min % 10 <= 4 && (min % 100 < 12 || min % 100 > 14) ? "minuty" : "minut"}`);
// lines for the card at the chest; fem: the hero is a girl
export function guessLines(guess, ms, opts, fem) {
  const min = Math.round(ms / 60000), out = [];
  if (guess) {
    const hit = guessHit(guess, ms / 60000, opts), thought = fem ? "Myślałaś" : "Myślałeś";
    out.push(hit ? `${fem ? "Dobrze myślałaś" : "Dobrze myślałeś"}: wyprawa trwała ${minAcc(min)}${min === guess ? "" : `, czyli około ${GUESS_GEN[guess]}`}!` : `${thought}, że potrwa ${GUESS_ACC[guess]}. Trwała ${minAcc(min)}.`);
  }
  // the song comparison; its first sentence repeats the time when the guess line already said it
  const t = tripTimeLine(ms); if (t) out.push(guess ? t.split(". ").slice(1).join(". ") : t);
  if (min >= 3) {
    const n = Math.round(60 / min);
    out.push(n <= 1 ? "Godzina to mniej więcej tyle, co ta wyprawa." : `Godzina to tyle, co ${n} ${n <= 4 ? "takie wyprawy" : "takich wypraw"}.`);
  }
  return out;
}

/* ---------- the plan of a day: put the day's events in order, morning to night ----------
   The clock alone cannot tell 7 in the morning from 7 in the evening, so every event also shows
   the part of the day. Times are on a 24-hour scale here; the clocks show them on 12 hours. */
export const DAY_PARTS = [{ k: "rano", e: "🌅", to: 12 }, { k: "po południu", e: "☀️", to: 18 }, { k: "wieczorem", e: "🌆", to: 21 }, { k: "w nocy", e: "🌙", to: 24 }];
export const partOf = (t) => DAY_PARTS.find((p) => t / 60 < p.to);
const DAY_EVENTS = [
  ["wake", "Pobudka", "⏰", [6, 7]], ["breakfast", "Śniadanie", "🥣", [7, 7.5, 8]], ["school", "Szkoła", "🏫", [8]],
  ["lunch", "Obiad", "🍲", [13, 14, 14.5]], ["walk", "Spacer z psem", "🐕", [16, 16.5, 17]], ["supper", "Kolacja", "🍝", [18, 18.5, 19]],
  ["tale", "Bajka", "📺", [19, 19.5, 20]], ["bath", "Kąpiel", "🛁", [20]], ["sleep", "Sen", "🛏️", [21, 21.5, 22]]
];
export function genDay(lvl) {
  const n = lvl === 1 ? 3 : 4;
  for (;;) {
    const evs = shuffle(DAY_EVENTS).slice(0, n).map(([k, name, e, times]) => {
      const ok = times.filter((t) => lvl > 1 || t % 1 === 0);
      return ok.length ? { k, name, e, t: Math.round(pick(ok) * 60) } : null;
    });
    if (evs.some((x) => !x)) continue;
    const sorted = evs.slice().sort((a, b) => a.t - b.t);
    if (sorted.some((x, i) => i && x.t - sorted[i - 1].t < 60)) continue; // an hour apart at least, so the order is clear
    // at level 3 two events show the same number on the clock (7 in the morning and 7 in the evening)
    if (lvl === 3 && !evs.some((a) => evs.some((b) => a !== b && a.t % 720 === b.t % 720)) && rnd() < 0.7) continue;
    return { kind: "day", title: "Ułóż plan dnia", evs: evs.map((x) => ({ ...x, part: partOf(x.t), h: Math.floor(x.t / 60), m: x.t % 60 })), ans: sorted.map((x) => x.k),
      say: "Ułóż plan dnia: od rana do nocy. Popatrz na zegary i na to, czy jest rano, czy wieczorem." };
  }
}
