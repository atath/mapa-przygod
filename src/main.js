import "./save.js";
import { boot } from "./profiles.js";

/* ================== Boot ================== */
// Expedition rooms (they have the #ctl control area) use a layout that fits one screen.
const appEl = document.getElementById("app");
new MutationObserver(() => {
  document.body.classList.toggle("room", !!appEl.querySelector(":scope > #ctl"));
  document.body.classList.toggle("campview", !!appEl.querySelector(":scope > #tripBtn"));
}).observe(appEl, { childList: true });
boot();

// Offline play when served over http(s): the service worker caches the game after the first visit.
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
}
