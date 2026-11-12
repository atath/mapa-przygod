import { GS } from "./state.js";

/* ================== Speech & sound ================== */
export let plVoice = null;
export function findVoice() { try { plVoice = speechSynthesis.getVoices().find((v) => /^pl/i.test(v.lang)) || null; } catch (e) {} }
try { findVoice(); speechSynthesis.onvoiceschanged = findVoice; } catch (e) {}
// force = the reader tapped a speaker button: always read, and say what went wrong if nothing plays
export function speak(text, force) {
  if ((!GS.G.voice && !force) || !text) return;
  if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") { if (force) speechProblem("Ta przeglądarka nie umie czytać na głos."); return; }
  try {
    const synth = window.speechSynthesis;
    if (!plVoice) findVoice();
    const go = () => {
      const u = new SpeechSynthesisUtterance(text); u.lang = "pl-PL"; u.rate = 0.92; u.pitch = 1.1; if (plVoice) u.voice = plVoice;
      let started = false; u.onstart = () => { started = true; };
      u.onerror = (e) => { if (force && e.error !== "interrupted" && e.error !== "canceled") speechProblem("Głos nie zadziałał (" + e.error + ")."); };
      try { synth.resume(); } catch (er) {}
      synth.speak(u);
      if (force) setTimeout(() => { if (!started && !synth.speaking) speechProblem(plVoice ? "Telefon nie odtworzył głosu." : "Nie znalazłem polskiego głosu w telefonie."); }, 2500);
    };
    // Chrome on Android drops an utterance queued right after cancel(), so wait a moment
    if (synth.speaking || synth.pending) { synth.cancel(); setTimeout(go, 120); } else go();
  } catch (e) { if (force) speechProblem("Głos nie zadziałał."); }
}
export function speechProblem(msg) {
  const t = document.getElementById("txt"); if (!t) return;
  let n = document.getElementById("sayErr");
  if (!n) { n = document.createElement("span"); n.id = "sayErr"; n.className = "sayerr"; t.parentNode.appendChild(n); }
  n.textContent = msg + " Sprawdź głośność multimediów, a w ustawieniach telefonu „Zamiana tekstu na mowę” pobierz język polski.";
}
export let ac = null;
export function audio() { if (!GS.G.sound) return null; try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); } catch (e) { return null; } return ac; }
export function note(f, start, dur, type = "square", vol = 0.07) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + start, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
}
export const snd = {
  step() { note(380 + Math.random() * 80, 0, 0.06, "square", 0.035); },
  coin() { note(988, 0, 0.08); note(1319, 0.07, 0.2); },
  ok() { note(659, 0, 0.1); note(880, 0.09, 0.1); note(1175, 0.18, 0.22); },
  bad() { note(220, 0, 0.15, "triangle", 0.12); note(175, 0.13, 0.25, "triangle", 0.12); },
  bump() { note(110, 0, 0.2, "sawtooth", 0.06); },
  hit() { note(180, 0, 0.08, "sawtooth", 0.08); note(90, 0.06, 0.18, "square", 0.06); },
  poof() { for (let i = 0; i < 6; i++) note(1200 - i * 150, i * 0.04, 0.08, "square", 0.04); },
  door() { [262, 330, 392, 523].forEach((f, i) => note(f, i * 0.09, 0.25, "triangle", 0.12)); },
  letter() { note(1047, 0, 0.08, "triangle", 0.1); },
  // fight: a breath of fire, a wave, roots in the ground; the shield forming, holding, breaking; the whirlwind
  fire() { [320, 250, 190, 140].forEach((f, i) => note(f + Math.random() * 20, i * 0.07, 0.14, "sawtooth", 0.045)); },
  water() { [520, 700, 610, 860, 740].forEach((f, i) => note(f, i * 0.06, 0.09, "sine", 0.07)); },
  earth() { note(92, 0, 0.26, "triangle", 0.14); note(70, 0.1, 0.32, "triangle", 0.14); note(120, 0.3, 0.1, "square", 0.035); },
  shield() { note(784, 0, 0.1, "sine", 0.08); note(1175, 0.08, 0.28, "sine", 0.07); },
  deflect() { note(1568, 0, 0.06, "triangle", 0.08); note(1319, 0.05, 0.22, "sine", 0.07); },
  crack() { note(900, 0, 0.05, "square", 0.06); note(520, 0.04, 0.06, "square", 0.06); note(240, 0.09, 0.22, "sawtooth", 0.07); },
  whirl() { for (let i = 0; i < 9; i++) note(280 + i * 85, i * 0.06, 0.1, "sine", 0.04); },
  fanfare() { [523, 523, 523, 659, 784, 659, 784].forEach((f, i) => note(f, [0, .12, .24, .36, .6, .78, .9][i], i === 6 ? 0.7 : 0.14)); }
};
