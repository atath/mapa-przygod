import "./save.js";
import { boot } from "./profiles.js";

/* ================== Boot ================== */
boot();

// Offline play when served over http(s): the service worker caches the game after the first visit.
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
}
