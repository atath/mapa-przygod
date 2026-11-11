import { GS } from "./state.js";

/* ================== Content ================== */
export const WORDS = [
  ["kot", "🐱"], ["pies", "🐶"], ["dom", "🏠"], ["las", "🌲"], ["ser", "🧀"], ["sok", "🧃"], ["lis", "🦊"], ["koń", "🐴"], ["miś", "🧸"], ["but", "👟"], ["nos", "👃"],
  ["tort", "🎂"], ["mysz", "🐭"], ["ryba", "🐟"], ["sowa", "🦉"], ["żaba", "🐸"], ["auto", "🚗"], ["balon", "🎈"], ["lody", "🍦"], ["kura", "🐔"], ["krowa", "🐮"],
  ["rower", "🚲"], ["zegar", "⏰"], ["banan", "🍌"], ["motyl", "🦋"], ["owca", "🐑"], ["arbuz", "🍉"], ["piłka", "⚽"], ["jabłko", "🍎"], ["ślimak", "🐌"],
  ["gruszka", "🍐"], ["samolot", "✈️"], ["pomidor", "🍅"], ["rakieta", "🚀"], ["kapelusz", "🎩"]
].map(([w, e]) => ({ w, e }));

export const LV = {
  1: { name: "Łatwy", showPath: true, loops: false, limitExtra: null, maxSeg: 3, hp: [6, 15], three: 0, cards: 4, word: [4, 5], spoken: true, signs: 3, phrase: false, exits: 2, pass: [4, 5], picPass: true },
  2: { name: "Średni", showPath: false, loops: true, limitExtra: 1, maxSeg: 3, hp: [10, 18], three: 0.4, cards: 5, word: [5, 6], spoken: true, signs: 4, phrase: false, exits: 3, pass: [5, 6], picPass: false },
  3: { name: "Trudny", slide: true, showPath: false, loops: true, limitExtra: 0, maxSeg: 4, hp: [12, 24], three: 0.7, cards: 5, word: [5, 8], spoken: false, signs: 4, phrase: true, exits: 3, pass: [6, 7], picPass: false }
};
export const L = () => LV[GS.G.level];
