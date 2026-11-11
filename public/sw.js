// Offline cache. The game page is fetched fresh when online (so updates arrive)
// and served from the cache when there is no network.
const CACHE = "mapa-przygod-__VERSION__";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.mode === "navigate") {
    // a slow or broken home network should not leave the child staring at a blank page: after 4 s use the cache
    const net = fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put("index.html", copy)); } // never cache an error page
      return res;
    });
    const late = new Promise((res) => setTimeout(res, 4000)).then(() => caches.match("index.html"));
    e.respondWith(Promise.race([net.catch(() => caches.match("index.html")), late.then((hit) => hit || net)])
      .then((res) => res || net));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
