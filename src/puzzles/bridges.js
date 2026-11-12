import { pick, shuffle } from "../util.js";

/* ================== Two bridges: find the hidden rule by trying (no DOM) ==================
   Little creatures differ in colour, shape and (level 3) a hat. The left bridge lets through those
   that match a secret rule, the right bridge all the others. Nobody says the rule: the child sends
   creatures over and watches. Exactly one of the rules possible on the level splits the creatures this way. */

export const FEATS = {
  color: { vals: ["red", "blue", "yellow"], word: { red: "czerwone", blue: "niebieskie", yellow: "żółte" }, gen: { red: "czerwonych", blue: "niebieskich", yellow: "żółtych" } },
  shape: { vals: ["round", "square", "tri"], word: { round: "okrągłe", square: "kwadratowe", tri: "trójkątne" }, gen: { round: "okrągłych", square: "kwadratowych", tri: "trójkątnych" } },
  hat: { vals: ["hat", "none"], word: { hat: "w czapce", none: "bez czapki" }, gen: { hat: "w czapce", none: "bez czapki" } }
};

// rule: { all: [[feat, val]...] } (every condition), or { not: [feat, val] }
export const passes = (rule, cr) => (rule.not ? cr[rule.not[0]] !== rule.not[1] : rule.all.every(([f, v]) => cr[f] === v));
export function ruleWords(rule) {
  if (rule.not) return `wszystkie oprócz ${FEATS[rule.not[0]].gen[rule.not[1]]}`;
  const parts = rule.all.slice().sort((a, b) => (a[0] === "hat") - (b[0] === "hat")).map(([f, v]) => FEATS[f].word[v]);
  return `tylko ${parts.join(" ")}`;
}

function rulesFor(lvl, feats) {
  const one = feats.flatMap((f) => FEATS[f].vals.map((v) => ({ all: [[f, v]] })));
  const not = lvl >= 2 ? feats.flatMap((f) => FEATS[f].vals.map((v) => ({ not: [f, v] }))) : [];
  const two = [];
  if (lvl === 3) for (let i = 0; i < feats.length; i++) for (let j = i + 1; j < feats.length; j++) for (const a of FEATS[feats[i]].vals) for (const b of FEATS[feats[j]].vals) two.push({ all: [[feats[i], a], [feats[j], b]] });
  return [...one, ...not, ...two];
}

export function genBridges(lvl) {
  const feats = lvl === 3 ? ["color", "shape", "hat"] : ["color", "shape"];
  const n = lvl === 3 ? 10 : 8, all = rulesFor(lvl, feats);
  const kinds = lvl === 1 ? all.filter((r) => r.all && r.all.length === 1) : lvl === 2 ? all.filter((r) => r.not || r.all.length === 1) : all.filter((r) => r.all && r.all.length === 2);
  const combos = feats.reduce((acc, f) => acc.flatMap((c) => FEATS[f].vals.map((v) => ({ ...c, [f]: v }))), [{}]);
  for (;;) {
    const rule = pick(kinds), crs = shuffle(combos).slice(0, n).map((c, i) => ({ ...c, id: i }));
    const left = crs.filter((c) => passes(rule, c)).length;
    if (left < 3 || n - left < 3) continue;
    const key = (r) => crs.map((c) => (passes(r, c) ? 1 : 0)).join("");
    if (all.filter((r) => key(r) === key(rule)).length !== 1) continue;
    return { kind: "bridges", rule, crs, words: ruleWords(rule), ans: crs.map((c) => (passes(rule, c) ? "L" : "R")) };
  }
}
