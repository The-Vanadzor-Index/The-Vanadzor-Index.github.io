// Install-only service worker: makes the site installable as a PWA.
// No caching — the existing offline-download button is the offline story.
// A fetch handler is what several browsers still check for installability,
// so it stays here even though it does nothing but let the request through.
self.addEventListener("install", function (event) {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function (event) {});
