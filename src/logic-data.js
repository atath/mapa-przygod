import { pick, ri, shuffle } from "./util.js";

/* ================== Logic puzzles (no DOM: unit-tested in Node) ==================
   Every puzzle: { kind, title, say (spoken), items/clues to show, opts: [{a, e, n}], ans, why(a) }.
   kinds:
   - who: connect facts — clues together point to exactly one suspect, no single clue is enough
   - seq: what comes next in a repeating pattern
   - odd: which one does not belong (and why)
   - if:  "if … then …" rules, at level 3 chained */

// Facts are chosen so that a child can check them: no "tail" for birds or fish, no "lives in water" for frogs.
const ATTR = {
  fur: ["ma futerko", "nie ma futerka"],
  wings: ["ma skrzydła", "nie ma skrzydeł"],
  feathers: ["ma pióra", "nie ma piór"],
  legs4: ["ma cztery łapy", "nie ma czterech łap"],
  water: ["mieszka w wodzie", "nie mieszka w wodzie"]
};
export const ANIMALS = [
  { k: "kot", e: "🐱", g: "m", t: ["fur", "legs4"] }, { k: "pies", e: "🐶", g: "m", t: ["fur", "legs4"] },
  { k: "mysz", e: "🐭", g: "f", t: ["fur", "legs4"] }, { k: "królik", e: "🐰", g: "m", t: ["fur", "legs4"] },
  { k: "sowa", e: "🦉", g: "f", t: ["wings", "feathers"] }, { k: "kura", e: "🐔", g: "f", t: ["wings", "feathers"] },
  { k: "motyl", e: "🦋", g: "m", t: ["wings"] }, { k: "biedronka", e: "🐞", g: "f", t: ["wings"] },
  { k: "ryba", e: "🐟", g: "f", t: ["water"] }, { k: "ośmiornica", e: "🐙", g: "f", t: ["water"] },
  { k: "ślimak", e: "🐌", g: "m", t: [] }, { k: "jaszczurka", e: "🦎", g: "f", t: ["legs4"] }
];
const CRIMES = [
  ["zjadł ciastko", "Ktoś zjadł ciastko z obozu!", "Kto zjadł ciastko?"],
  ["schował czapkę", "Ktoś schował czapkę!", "Kto schował czapkę?"],
  ["rozsypał monety", "Ktoś rozsypał monety!", "Kto rozsypał monety?"],
  ["zabrał kredki", "Ktoś zabrał kredki!", "Kto zabrał kredki?"]
];
const notWas = (a) => `To nie ${a.g === "f" ? "była" : "był"} ${a.k}.`;

export function genWho(lvl) {
  const n = lvl === 1 ? 3 : 4, need = lvl === 3 ? 3 : 2;
  for (let tries = 0; tries < 500; tries++) {
    const sus = shuffle(ANIMALS).slice(0, n), cul = pick(sus), [verb, intro, q] = pick(CRIMES);
    const clues = [];
    for (const at of Object.keys(ATTR)) {
      const has = cul.t.includes(at), fit = sus.filter((s) => s.t.includes(at) === has);
      if (fit.length < n) clues.push({ text: `Ten, kto ${verb}, ${ATTR[at][has ? 0 : 1]}.`, fit: new Set(fit.map((s) => s.k)), at, has });
    }
    if (lvl > 1) for (const s of sus) if (s !== cul) clues.push({ text: notWas(s), fit: new Set(sus.filter((x) => x !== s).map((x) => x.k)), not: s.k });
    // look for `need` clues: together exactly the culprit, each one alone not enough, none of them useless
    const sets = combos(shuffle(clues), need).filter((cs) => cs.filter((c) => c.not).length <= 1);
    for (const cs of sets) {
      const both = sus.filter((s) => cs.every((c) => c.fit.has(s.k)));
      if (both.length !== 1 || both[0] !== cul) continue;
      if (cs.some((c) => c.fit.size < 2)) continue;
      if (cs.some((c, i) => sus.filter((s) => cs.every((d, j) => j === i || d.fit.has(s.k))).length < 2)) continue;
      const ordered = cs.slice().sort((a, b) => (a.not ? 1 : 0) - (b.not ? 1 : 0));
      return {
        kind: "who", title: q, intro, clues: ordered.map((c) => c.text),
        say: `${intro} Podejrzani: ${sus.map((s) => s.k).join(", ")}. Wskazówki: ${ordered.map((c) => c.text).join(" ")} ${q}`,
        opts: sus.map((s) => ({ a: s.k, e: s.e, n: s.k })), ans: cul.k,
        why: (a) => { const c = ordered.find((c) => !c.fit.has(a)); return c ? `${cap(a)} nie pasuje do wskazówki: „${c.text}”` : ""; }
      };
    }
  }
  throw new Error("genWho: no puzzle");
}
function combos(arr, k, start = 0, cur = [], out = []) {
  if (cur.length === k) { out.push(cur.slice()); return out; }
  for (let i = start; i < arr.length && out.length < 400; i++) { cur.push(arr[i]); combos(arr, k, i + 1, cur, out); cur.pop(); }
  return out;
}
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

// [rule(s), fact, question, right [text, emoji], wrong answers...]; the right answer follows from the rules alone
const IFS = [
  [["Jeśli pada deszcz, Tosia bierze parasol."], "Pada deszcz.", "Co zrobi Tosia?", ["Weźmie parasol", "☂️"], ["Weźmie okulary od słońca", "🕶️"], ["Pójdzie spać", "🛏️"]],
  [["Jeśli jest zimno, Kuba zakłada czapkę."], "Jest bardzo zimno.", "Co zrobi Kuba?", ["Założy czapkę", "🧢"], ["Zje lody", "🍦"], ["Zdejmie buty", "👟"]],
  [["Jeśli kot jest głodny, miauczy przy misce."], "Kot jest głodny.", "Co zrobi kot?", ["Będzie miauczeć przy misce", "🐱"], ["Pójdzie pływać", "🏊"], ["Będzie szczekać", "🐶"]],
  [["Jeśli zadzwoni dzwonek, dzieci wychodzą na przerwę."], "Zadzwonił dzwonek.", "Co zrobią dzieci?", ["Wyjdą na przerwę", "🤸"], ["Pójdą spać", "🛏️"], ["Zaczną lekcję od nowa", "📚"]],
  [["Jeśli zrobi się ciemno, w obozie zapalamy lampion."], "Zrobiło się ciemno.", "Co zrobimy?", ["Zapalimy lampion", "🏮"], ["Zgasimy ognisko", "💨"], ["Zjemy śniadanie", "🥣"]],
  [["Jeśli roślina nie dostaje wody, więdnie."], "Nikt nie podlewał kwiatka.", "Co stanie się z kwiatkiem?", ["Zwiędnie", "🥀"], ["Urośnie wielki", "🌻"], ["Zamieni się w drzewo", "🌳"]],
  [["Jeśli Ola skończy obiad, dostanie deser."], "Ola zjadła cały obiad.", "Co dostanie Ola?", ["Deser", "🍰"], ["Nic", "🚫"], ["Drugi obiad", "🍲"]]
];
const CHAINS = [
  [["Jeśli zadzwoni budzik, Kuba wstanie.", "Jeśli Kuba wstanie, zje śniadanie."], "Budzik zadzwonił.", "Co na pewno zrobi Kuba?", ["Zje śniadanie", "🥣"], ["Zostanie w łóżku", "🛏️"], ["Zje kolację", "🍝"]],
  [["Jeśli spadnie śnieg, ulepimy bałwana.", "Jeśli ulepimy bałwana, damy mu marchewkę."], "Spadł śnieg.", "Co dostanie bałwan?", ["Marchewkę", "🥕"], ["Parasol", "☂️"], ["Okulary od słońca", "🕶️"]],
  [["Jeśli piesek jest brudny, kąpiemy go.", "Jeśli kąpiemy pieska, potem go wycieramy ręcznikiem."], "Piesek wrócił cały w błocie.", "Co zrobimy na końcu?", ["Wytrzemy go ręcznikiem", "🧺"], ["Pójdziemy na spacer w błocie", "🌧️"], ["Nic", "🚫"]],
  [["Jeśli zbierzemy wszystkie runy, otworzymy skrzynię.", "Jeśli otworzymy skrzynię, dostaniemy monety."], "Mamy wszystkie runy.", "Co dostaniemy?", ["Monety", "💰"], ["Nic", "🚫"], ["Patyk", "🌿"]]
];
export function genIf(lvl) {
  const [rules, fact, q, right, ...wrong] = pick(lvl === 3 ? CHAINS : IFS);
  return {
    kind: "if", title: q, clues: [...rules, fact], say: `${rules.join(" ")} ${fact} ${q}`,
    opts: shuffle([right, ...wrong]).map(([n, e]) => ({ a: n, e, n })), ans: right[0],
    why: () => `${rules[rules.length - 1]} A z tego, co wiemy: ${fact.toLowerCase()}`
  };
}

// one room = two puzzles; "who" (connecting facts) is always one of them
export function logicRoomPuzzles(lvl) {
  return shuffle([genWho(lvl), pick([genSeq, genOdd, genIf])(lvl)]);
}
