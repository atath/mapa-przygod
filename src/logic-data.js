import { pick, ri, shuffle } from "./util.js";

/* ================== Logic puzzles (no DOM: unit-tested in Node) ==================
   Every puzzle: { kind, title, say (spoken), items/clues to show, opts: [{a, e, n}], ans, why(a) }.
   kinds:
   - seq: what comes next in a repeating pattern of pictures
   - odd: which one does not belong (and why)
   - count: counting on or back in steps of 1, 2, 3, 4, 5 or 10
   - grow: figures of squares that grow; how many squares in the next one
   The bigger puzzles you arrange live in src/puzzles/. */

const cap = (s) => s[0].toUpperCase() + s.slice(1);

const THEMES = [
  [["🍎", "jabłko"], ["🍌", "banan"], ["🍇", "winogrona"], ["🍓", "truskawka"]],
  [["🔴", "czerwone kółko"], ["🔵", "niebieskie kółko"], ["🟡", "żółte kółko"], ["🟢", "zielone kółko"]],
  [["⭐", "gwiazdka"], ["🌙", "księżyc"], ["☀️", "słońce"], ["☁️", "chmurka"]],
  [["🐱", "kot"], ["🐶", "pies"], ["🐭", "mysz"], ["🐰", "królik"]],
  [["🌸", "kwiatek"], ["🍄", "grzybek"], ["🍁", "liść"], ["🌲", "choinka"]]
];
const PATTERNS = { 1: ["AB", "AAB", "ABB"], 2: ["ABC", "AABB", "ABAC", "AAB"], 3: ["ABCB", "AABC", "ABBC", "ABCD"] };
export function genSeq(lvl) {
  const th = pick(THEMES), pat = pick(PATTERNS[lvl]), letters = [...new Set(pat)], sym = shuffle(th).slice(0, letters.length);
  const of = (ch) => sym[letters.indexOf(ch)];
  const shown = pat.length * 2 + ri(0, pat.length - 1), items = Array.from({ length: shown }, (_, i) => of(pat[i % pat.length]));
  const ans = of(pat[shown % pat.length]);
  const pool = th.filter((x) => !sym.includes(x)), opts = shuffle([...sym, ...pool].slice(0, Math.max(sym.length, lvl === 1 ? 3 : 4)));
  if (!opts.includes(ans)) opts[0] = ans;
  const cycle = Array.from({ length: pat.length }, (_, i) => of(pat[i])[1]).join(", ");
  return {
    kind: "seq", title: "Co będzie dalej?", items: items.map((x) => x[0]),
    say: `Co będzie dalej? Popatrz, co się powtarza.`,
    opts: shuffle(opts).map(([e, n]) => ({ a: n, e, n })), ans: ans[1],
    why: () => `Powtarza się: ${cycle}. Potem znowu od początku.`
  };
}

const CATS = [
  { one: "owoc", many: "owoce", items: [["🍎", "jabłko"], ["🍌", "banan"], ["🍐", "gruszka"], ["🍇", "winogrona"], ["🍓", "truskawka"], ["🍊", "pomarańcza"]] },
  { one: "zwierzę", many: "zwierzęta", items: [["🐱", "kot"], ["🐶", "pies"], ["🐮", "krowa"], ["🐷", "świnka"], ["🐔", "kura"], ["🐴", "koń"]] },
  { one: "pojazd", many: "pojazdy", items: [["🚗", "auto"], ["🚲", "rower"], ["✈️", "samolot"], ["🚂", "pociąg"], ["🚌", "autobus"], ["🚀", "rakieta"]] },
  { one: "ubranie", many: "ubrania", items: [["👕", "koszulka"], ["👖", "spodnie"], ["🧢", "czapka"], ["🧦", "skarpetki"], ["👗", "sukienka"], ["🧤", "rękawiczki"]] }
];
// harder: same kind of things, the difference is a feature
const FEATS = [
  { yes: "latają", no: "nie lata", items: [["🦅", "orzeł"], ["🦋", "motyl"], ["🐝", "pszczoła"], ["🦉", "sowa"], ["🐦", "ptaszek"]], other: [["🐶", "pies"], ["🐌", "ślimak"], ["🐟", "ryba"], ["🐢", "żółw"]] },
  { yes: "mieszkają w wodzie", no: "nie mieszka w wodzie", items: [["🐟", "ryba"], ["🐙", "ośmiornica"], ["🐬", "delfin"], ["🐳", "wieloryb"]], other: [["🐒", "małpa"], ["🦒", "żyrafa"], ["🐱", "kot"], ["🐔", "kura"]] },
  { yes: "są zimne", no: "nie jest zimne", items: [["🍦", "lody"], ["🧊", "lód"], ["⛄", "bałwanek"], ["❄️", "śnieżynka"]], other: [["🔥", "ogień"], ["☕", "gorąca herbata"], ["☀️", "słońce"]] },
  { yes: "są okrągłe", no: "nie jest okrągłe", items: [["⚽", "piłka"], ["🍊", "pomarańcza"], ["🌕", "księżyc w pełni"], ["🍩", "pączek"], ["🏀", "piłka do kosza"]], other: [["📏", "linijka"], ["📚", "książki"], ["🧱", "cegła"]] }
];
export function genOdd(lvl) {
  const n = lvl === 1 ? 3 : 4;
  if (lvl === 1 || ri(0, 2) === 0) {
    const [a, b] = shuffle(CATS), same = shuffle(a.items).slice(0, n - 1), odd = pick(b.items);
    return oddOut(same, odd, `${cap(odd[1])} to ${b.one}, a reszta to ${a.many}.`);
  }
  const f = pick(FEATS), same = shuffle(f.items).slice(0, n - 1), odd = pick(f.other);
  return oddOut(same, odd, `Wszystkie ${f.yes}, a ${odd[1]} ${f.no}.`);
}
function oddOut(same, odd, why) {
  const all = shuffle([...same, odd]);
  return { kind: "odd", title: "Co tu nie pasuje?", say: "Co tu nie pasuje? Jedna rzecz jest inna niż reszta.",
    opts: all.map(([e, n]) => ({ a: n, e, n })), ans: odd[1], why: () => why };
}


/* ---------- counting in steps ---------- */
const COUNT_STEPS = { 1: [1, 2, -1], 2: [2, 5, 10, -2], 3: [3, 4, -3, -5] }, COUNT_MAX = { 1: 20, 2: 50, 3: 60 };
const numWord = (n) => (n === 1 ? "o jeden" : `o ${n}`);
export function genCount(lvl) {
  const st = pick(COUNT_STEPS[lvl]), max = COUNT_MAX[lvl], up = st > 0, span = Math.abs(st) * 4;
  const first = up ? ri(0, max - span) : ri(span, max);
  const items = [0, 1, 2, 3].map((i) => first + st * i), last = items[3], ans = last + st;
  const others = COUNT_STEPS[lvl].filter((x) => Math.sign(x) === Math.sign(st) && x !== st);
  const opts = [ans];
  const add = (v) => { if (opts.length < (lvl === 1 ? 3 : 4) && v >= 0 && !opts.includes(v)) opts.push(v); };
  add(last + Math.sign(st)); if (others.length) add(last + pick(others)); add(last); add(ans + 1); add(ans - 1); add(ans + 2);
  return {
    kind: "count", title: "Jaka liczba będzie dalej?", items: items.map(String),
    say: `Jaka liczba będzie dalej? ${items.join(", ")}, i co dalej?`,
    opts: shuffle(opts).map((v) => ({ a: String(v), n: String(v) })), ans: String(ans),
    why: () => `Każda liczba jest ${numWord(Math.abs(st))} ${up ? "większa" : "mniejsza"}: ${items.join(", ")}, potem ${ans}.`
  };
}

/* ---------- growing figures: [row, col] cells of the k-th figure ---------- */
const FIG = {
  row: { lv: [2], k0: [1, 2], cells: (k) => Array.from({ length: k }, (_, i) => [0, i]) },
  two: { lv: [2], k0: [1, 2], cells: (k) => Array.from({ length: 2 * k }, (_, i) => [i % 2, Math.floor(i / 2)]) },
  ell: { lv: [2], k0: [1, 2], cells: (k) => [...Array.from({ length: k }, (_, i) => [i, 0]), ...Array.from({ length: k - 1 }, (_, i) => [k - 1, i + 1])] },
  cross: { lv: [2, 3], k0: [1], cells: (k) => [[k, k], ...Array.from({ length: k }, (_, i) => [[k - 1 - i, k], [k + 1 + i, k], [k, k - 1 - i], [k, k + 1 + i]]).flat()] },
  stairs: { lv: [3], k0: [1], cells: (k) => Array.from({ length: k }, (_, r) => Array.from({ length: r + 1 }, (_, c) => [r, c])).flat() },
  square: { lv: [3], k0: [1], cells: (k) => Array.from({ length: k * k }, (_, i) => [Math.floor(i / k), i % k]) }
};
export const figCells = (f, k) => FIG[f].cells(k);
const sqWord = (n) => (n === 1 ? "kwadrat" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "kwadraty" : "kwadratów");
export function genGrow(lvl) {
  const f = pick(Object.keys(FIG).filter((k) => FIG[k].lv.includes(lvl))), k0 = pick(FIG[f].k0);
  const ks = [k0, k0 + 1, k0 + 2], counts = ks.map((k) => figCells(f, k).length), ans = figCells(f, k0 + 3).length;
  const [a, b, c] = counts, opts = [ans];
  const add = (v) => { if (opts.length < 4 && v > c && !opts.includes(v)) opts.push(v); };
  add(c + (c - b)); add(c + 1); add(ans + 1); add(ans - 1); add(c * 2); add(ans + 2); add(ans + 3); add(ans + 4);
  const why = f === "stairs" ? `Dochodzi coraz dłuższy schodek: najpierw 2, potem 3, a teraz 4. Razem ${ans}.`
    : f === "square" ? `To kwadraty: 2 na 2, 3 na 3, a następny 4 na 4, czyli ${ans}.`
    : `Każda następna figura ma o ${b - a} ${sqWord(b - a)} więcej: ${a}, ${b}, ${c}, potem ${ans}.`;
  return {
    kind: "grow", title: "Z ilu kwadratów będzie następna?", fig: f, ks, next: k0 + 3,
    say: "Figury rosną. Z ilu kwadratów będzie następna figura?",
    opts: shuffle(opts).map((v) => ({ a: String(v), n: String(v) })), ans: String(ans), why: () => why
  };
}

// The quick pair of questions in the owl's room: grade 1 pictures, then numbers and figures
export function patternPair(lvl) {
  return lvl === 1 ? [pick([genSeq, genOdd])(1), genCount(1)] : lvl === 2 ? [genCount(2), genGrow(2)] : [genGrow(3), genCount(3)];
}
