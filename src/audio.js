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
  fanfare() { [523, 523, 523, 659, 784, 659, 784].forEach((f, i) => note(f, [0, .12, .24, .36, .6, .78, .9][i], i === 6 ? 0.7 : 0.14)); }
};
