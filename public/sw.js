/**
 * Deliberately narrow. Typedeck's actual content — 2,046 fonts from two live
 * catalogues — is not something a service worker should cache wholesale;
 * doing so risks serving a stale font list indefinitely. This worker only
 * makes the app *shell* resilient: it lets the page open when offline and
 * speeds up repeat visits, while every live data fetch (the catalogue APIs,
 * and every font file from Google/Fontshare) passes straight through to the
 * network untouched.
 */

// Bump this to force every client onto a fresh cache after a shell change.
const CACHE = "typedeck-shell-v1";
const OFFLINE_URL = "/offline.html";

const SHELL_ASSETS = [
  "/",
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icon.png",
  "/icon-192.png",
  "/logo.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      // Take over from any previous worker on next load rather than
      // waiting for every open tab to close.
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Everything not on this origin — Google Fonts, Fontshare, Clarity — is
  // left entirely alone. These need to stay live, and adding our own cache
  // layer on top of theirs only risks masking updates.
  if (url.origin !== self.location.origin) return;

  // The catalogue routes must always reflect what the server currently has;
  // Next's own HTTP caching (s-maxage=86400) already handles their freshness.
  if (url.pathname.startsWith("/api/")) return;

  // A page load: try the network first so content is never stale while
  // online, and fall back to whatever is cached, then the offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // A transient 500 (or any non-2xx) must never overwrite a good
          // cached shell — that would turn one bad request into a
          // permanently broken offline experience.
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))),
    );
    return;
  }

  // Static, content-hashed build assets: safe to serve from cache first and
  // only hit the network on a miss, since a hashed filename never changes
  // its content.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
