// Watson Tutor Service Worker — minimal, enables PWA install
const CACHE_NAME = 'watson-tutor-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through all requests — no offline caching for now
  // Voice conversations need live network anyway
  event.respondWith(fetch(event.request));
});
