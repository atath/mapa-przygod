import { GS } from "./state.js";
import { LV } from "./content.js";
import { exportText, importText, profiles, removeProfile, save } from "./save.js";
import { $, esc } from "./util.js";

/* ================== Parent panel (behind the PIN) ================== */
export async function sha256(t) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return Array.from(new Uint8Array(b)).map((v) => v.toString(16).padStart(2, "0")).join("");
}
export const validPin = (p) => /^\d{4,8}$/.test(p);
let pinFails = 0, pinLock = 0;

export function parentHTML() {
  const name = esc((GS.G && GS.G.hero && GS.G.hero.name) || "gracza");
  return `<button class="parent-toggle" id="parentBtn">Dla rodzica 🔒</button>
    <form class="panel" id="pinForm" hidden novalidate>
      <label class="field"><span>PIN rodzica</span><input type="password" id="pin" inputmode="numeric" pattern="[0-9]*" autocomplete="off" maxlength="8"></label>
      <div class="row"><button type="submit" class="btn small">Otwórz</button></div><p class="note err" id="pinMsg"></p>
    </form>
    <div class="panel" id="panel" hidden>
      <div class="field"><span>Poziom trudności: ${name}</span><div class="choices" id="lvCh">${[1, 2, 3].map((n) => `<button class="choice" data-v="${n}">${n}. ${LV[n].name}</button>`).join("")}</div></div>
      <p class="note muted">1: ścieżka widoczna, działania do 15, krótkie słowa. 2: ukryta ścieżka i pętle, liczby do 20. 3: limit klocków i prób, trzy karty, dłuższe słowa i frazy.</p>
      <div class="row"><button class="btn small" id="soundBtn">${GS.G.sound ? "Dźwięki: włączone" : "Dźwięki: wyłączone"}</button></div>

      <div class="field"><span>Zapis gry</span>
        <p class="note muted">Kopia zapisu wszystkich graczy. Przyda się przy zmianie urządzenia albo przed wyczyszczeniem przeglądarki.</p>
        <div class="row"><button class="btn small" id="exportBtn">Zrób kopię zapisu</button><button class="btn small" id="importBtn">Wczytaj zapis</button></div>
        <div class="savebox" id="exportBox" hidden>
          <textarea id="exportTxt" readonly rows="4" aria-label="Kopia zapisu"></textarea>
          <div class="row"><button class="btn small" id="copyBtn">Kopiuj tekst</button><button class="btn small" id="dlBtn">Pobierz plik</button></div>
          <p class="note muted">Zapisz plik albo skopiowany tekst, np. w notatkach lub mailu do siebie. Jeśli plik się nie pobiera, użyj „Kopiuj tekst”.</p>
        </div>
        <div class="savebox" id="importBox" hidden>
          <label class="field"><span>Wybierz plik z kopią</span><input type="file" id="importFile" accept=".json,.txt,application/json,text/plain"></label>
          <label class="field"><span>…albo wklej skopiowany tekst</span><textarea id="importTxt" rows="4"></textarea></label>
          <div class="row"><button class="btn small danger" id="loadBtn">Wczytaj i zastąp obecny zapis</button></div>
        </div>
      </div>

      <div class="field"><span>PIN rodzica</span>
        <div class="row"><button class="btn small" id="pinChangeBtn">Zmień PIN</button></div>
        <form class="savebox" id="pinChange" hidden novalidate>
          <label class="field"><span>Nowy PIN (4–8 cyfr)</span><input type="password" id="newPin1" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="new-password"></label>
          <label class="field"><span>Powtórz nowy PIN</span><input type="password" id="newPin2" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="new-password"></label>
          <div class="row"><button type="submit" class="btn small">Zapisz nowy PIN</button></div>
        </form>
      </div>

      <div class="field"><span>Gracz</span>
        <div class="row"><button class="btn small danger" id="deleteBtn">Usuń gracza: ${name}</button></div>
      </div>

      <div class="row"><button class="btn small" id="lockBtn">Zamknij panel</button></div>
      <p class="note" id="panelMsg" role="status"></p>
    </div>`;
}

// onLeave(kind) is called after a change that needs a new screen: "deleted" or "imported"
export function wireParent(onLeave) {
  const msg = (text, ok = true) => { $("panelMsg").className = "note " + (ok ? "ok" : "err"); $("panelMsg").textContent = text; };
  const lock = () => { $("panel").hidden = true; $("pinForm").hidden = true; $("parentBtn").textContent = "Dla rodzica 🔒"; };
  $("parentBtn").addEventListener("click", () => { if (!$("panel").hidden || !$("pinForm").hidden) return lock(); $("pinForm").hidden = false; $("pin").focus(); });
  $("pinForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (Date.now() < pinLock) { $("pinMsg").textContent = `Za dużo prób. Poczekaj ${Math.ceil((pinLock - Date.now()) / 1000)} s.`; return; }
    let ok = false; try { ok = (await sha256($("pin").value)) === GS.DB.settings.pinHash; } catch (er) {}
    $("pin").value = "";
    if (ok) { pinFails = 0; $("pinForm").hidden = true; $("panel").hidden = false; $("pinMsg").textContent = ""; $("parentBtn").textContent = "Dla rodzica 🔓"; }
    else { pinFails++; if (pinFails >= 3) { pinFails = 0; pinLock = Date.now() + 30000; $("pinMsg").textContent = "Zły PIN. Panel zablokowany na 30 s."; } else $("pinMsg").textContent = "Zły PIN."; }
  });

  const lvBtns = [...$("lvCh").querySelectorAll("button")];
  const mark = () => lvBtns.forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.v === GS.G.level)));
  lvBtns.forEach((b) => b.addEventListener("click", () => { GS.G.level = +b.dataset.v; save(); mark(); msg(`Ustawiono poziom: ${LV[GS.G.level].name}.`); }));
  mark();
  $("soundBtn").addEventListener("click", (e) => { GS.G.sound = !GS.G.sound; save(); e.target.textContent = GS.G.sound ? "Dźwięki: włączone" : "Dźwięki: wyłączone"; });

  // export
  $("exportBtn").addEventListener("click", () => {
    $("importBox").hidden = true; $("exportBox").hidden = false;
    $("exportTxt").value = exportText(); msg(`Kopia gotowa: ${profiles().length} ${profiles().length === 1 ? "gracz" : "graczy"}.`);
  });
  $("copyBtn").addEventListener("click", async () => {
    const t = $("exportTxt");
    try { await navigator.clipboard.writeText(t.value); msg("Skopiowano. Wklej tekst tam, gdzie go przechowasz."); }
    catch (e) { t.focus(); t.select(); msg("Tekst jest zaznaczony — skopiuj go ręcznie (Kopiuj w menu)."); }
  });
  $("dlBtn").addEventListener("click", () => {
    try {
      const a = document.createElement("a"), day = new Date().toISOString().slice(0, 10);
      a.href = URL.createObjectURL(new Blob([$("exportTxt").value], { type: "application/json" }));
      a.download = `mapa-przygod-zapis-${day}.json`; document.body.appendChild(a); a.click(); a.remove();
      msg("Plik powinien się pobrać. Jeśli nic się nie stało, użyj „Kopiuj tekst”.");
    } catch (e) { msg("Nie udało się pobrać pliku — użyj „Kopiuj tekst”.", false); }
  });

  // import
  $("importBtn").addEventListener("click", () => { $("exportBox").hidden = true; $("importBox").hidden = false; });
  $("importFile").addEventListener("change", () => {
    const f = $("importFile").files[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => { $("importTxt").value = r.result; msg("Plik wczytany. Sprawdź i naciśnij „Wczytaj”."); }; r.readAsText(f);
  });
  let armedLoad = false;
  $("loadBtn").addEventListener("click", (e) => {
    if (!$("importTxt").value.trim()) { msg("Najpierw wybierz plik albo wklej tekst kopii.", false); return; }
    if (!armedLoad) { armedLoad = true; e.target.textContent = "To zastąpi wszystkie obecne postępy. Kliknij jeszcze raz"; setTimeout(() => { armedLoad = false; e.target.textContent = "Wczytaj i zastąp obecny zapis"; }, 5000); return; }
    try { const n = importText($("importTxt").value); msg(`Wczytano zapis: ${n} ${n === 1 ? "gracz" : "graczy"}.`); setTimeout(() => onLeave("imported"), 900); }
    catch (er) { armedLoad = false; e.target.textContent = "Wczytaj i zastąp obecny zapis"; msg(er.message, false); }
  });

  // change PIN
  $("pinChangeBtn").addEventListener("click", () => { $("pinChange").hidden = !$("pinChange").hidden; });
  $("pinChange").addEventListener("submit", async (e) => {
    e.preventDefault();
    const a = $("newPin1").value, b = $("newPin2").value;
    if (!validPin(a)) { msg("PIN musi mieć od 4 do 8 cyfr.", false); return; }
    if (a !== b) { msg("PIN-y się różnią. Wpisz ten sam dwa razy.", false); return; }
    GS.DB.settings.pinHash = await sha256(a); save();
    $("newPin1").value = ""; $("newPin2").value = ""; $("pinChange").hidden = true; msg("Nowy PIN zapisany.");
  });

  // delete the current player
  let armedDel = false;
  $("deleteBtn").addEventListener("click", (e) => {
    if (!armedDel) { armedDel = true; const t = e.target.textContent; e.target.textContent = "Na pewno? Postępy znikną. Kliknij jeszcze raz"; setTimeout(() => { armedDel = false; e.target.textContent = t; }, 5000); return; }
    removeProfile(GS.G.id); onLeave("deleted");
  });
  $("lockBtn").addEventListener("click", lock);
}
