/*
 * Smitten Singles participant app service worker.
 *
 * Hand written rather than generated, so the caching rules below are the whole
 * story. Bump CACHE_VERSION on any change to this file: the activate handler
 * deletes every cache that does not match, which is what retires an old shell.
 *
 * THE RULE THAT MATTERS MOST: nothing from Supabase is ever cached. Serving a
 * stale OTP response, session, or profile read out of cache would be a real
 * hazard, not a cosmetic bug. Every request that is not a same-origin GET for
 * our own static files falls straight through to the network, untouched.
 */

const CACHE_VERSION = "smitten-v1";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;

// Only unhashed, always-present files belong here. Vite's hashed bundles under
// /assets/ are picked up at runtime instead, since their names change per build.
const SHELL_URLS = [
  "/",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // addAll is all-or-nothing, so one 404 would fail the whole install.
      // Cache them individually and let the misses go.
      .then((cache) => Promise.all(SHELL_URLS.map((url) => cache.add(url).catch(() => undefined))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Lets the page tell a waiting worker to take over immediately after an update.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/assets/") ||
    /\.(?:css|js|png|jpg|jpeg|svg|gif|webp|avif|ico|woff2?|ttf|otf)$/i.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Writes and non-GET verbs never touch the cache.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Anything off this origin (Supabase REST, auth, storage, the GHL asset host,
  // Google Fonts) is left entirely alone.
  if (url.origin !== self.location.origin) return;

  // Belt and braces: even if Supabase were ever proxied through our own origin,
  // these paths stay uncached.
  if (url.pathname.startsWith("/auth/v1") || url.pathname.startsWith("/rest/v1")) return;

  // Navigations: network first so a deploy is picked up immediately, with the
  // cached shell as the offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put("/", copy));
          return response;
        })
        .catch(() => caches.match("/", { ignoreSearch: true }).then((cached) => cached || Response.error())),
    );
    return;
  }

  // Static assets: serve from cache, refresh in the background. Vite's hashed
  // filenames make this safe, a changed file is a changed URL.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              const copy = response.clone();
              caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});
