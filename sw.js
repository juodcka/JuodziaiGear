// JuodziaiGear Service Worker
// IMPORTANT: Bump CACHE version on every deploy (jg-v1 → jg-v2, etc.)
const CACHE = 'jg-v9';

// Use self.location to build paths relative to the SW's own location.
// This works correctly on both custom domains and GitHub Pages subdirectories.
const BASE = self.location.pathname.replace(/\/sw\.js$/, '/');

const SHELL = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
  'https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.0/firebase-auth-compat.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Network-first for Firebase and Google auth endpoints — fall back to cache
  if (
    url.includes('firestore.googleapis.com') ||
    url.includes('googleapis.com/identitytoolkit') ||
    url.includes('securetoken.googleapis.com') ||
    url.includes('accounts.google.com') ||
    url.includes('googletagmanager.com') ||
    url.includes('google-analytics.com')
  ) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for app shell and static assets
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
