/* Minimal service worker: just enables "Add to Home Screen" / offline shell. No caching strategy yet — add one
 * (cache-first for shared/*, icons/*, and each course's own static files) once the app is closer to real deployment. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
