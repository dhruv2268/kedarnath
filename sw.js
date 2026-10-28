/* Offline support — the whole app works without network.
   Bump VERSION whenever you change files so phones get the update. */
const VERSION = "family-trip2-v3";
const SHELL = [
  "./",
  "./assets/css/style.css",
  "./assets/fonts/geist-mono-latin-500-normal.woff2",
  "./assets/fonts/geist-sans-latin-400-normal.woff2",
  "./assets/fonts/geist-sans-latin-500-normal.woff2",
  "./assets/fonts/geist-sans-latin-600-normal.woff2",
  "./assets/fonts/geist-sans-latin-700-normal.woff2",
  "./assets/fonts/instrument-serif-latin-400-italic.woff2",
  "./assets/fonts/instrument-serif-latin-400-normal.woff2",
  "./assets/img/icon-192.png",
  "./assets/img/icon-512.png",
  "./assets/img/icon-maskable-512.png",
  "./assets/js/app.js",
  "./assets/js/db.js",
  "./assets/js/expense-form.js",
  "./assets/js/pages/expenses.js",
  "./assets/js/pages/home.js",
  "./assets/js/pages/journal.js",
  "./assets/js/pages/plan.js",
  "./assets/js/pages/route.js",
  "./assets/js/pages/settings.js",
  "./assets/js/reports.js",
  "./assets/js/routes.js",
  "./assets/js/ui.js",
  "./assets/vendor/jspdf.plugin.autotable.min.js",
  "./assets/vendor/jspdf.umd.min.js",
  "./assets/vendor/leaflet.css",
  "./assets/vendor/leaflet.js",
  "./assets/vendor/xlsx.mini.min.js",
  "./config.js",
  "./expenses.html",
  "./index.html",
  "./journal.html",
  "./manifest.webmanifest",
  "./plan.html",
  "./route.html",
  "./settings.html",
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== "yatra-tiles").map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Database calls always go to the network (sync handles offline itself)
  if (url.pathname.includes("/rest/v1/")) return;
  // Map tiles: cache as you browse, so maps you've seen work offline
  if (url.hostname.endsWith("tile.openstreetmap.org")) {
    e.respondWith(caches.open("yatra-tiles").then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      try { const res = await fetch(req); if (res.ok) c.put(req, res.clone()); return res; } catch (err) { return hit || Response.error(); }
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // config.js: always try the network first so a new database setting is picked up immediately
  if (url.pathname.endsWith("/config.js")) {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res; }).catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  // App files: serve from cache instantly, refresh in background
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => null);
    return hit || (await net) || c.match("./index.html");
  }));
});
