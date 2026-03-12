const CACHE_NAME = 'gestion-stock-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/vente.html',
  '/stock.html',
  '/admin.html',
  '/assets/css/main.css',
  '/assets/js/pwa.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
