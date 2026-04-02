const CACHE_NAME = 'ipos-cache-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/sell',
  '/products',
  '/customers',
  '/settings',
  '/install'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});