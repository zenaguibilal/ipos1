// Ce service worker est intentionnellement simple pour l'instant.
// Il assure que l'application peut être enregistrée comme une PWA.
// Des stratégies de mise en cache plus avancées pourront être ajoutées ultérieurement.

self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activating...');
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Actuellement, nous passons directement au réseau.
  // Cela garantit que l'application fonctionne en ligne.
  // Une stratégie de cache-first sera nécessaire pour un fonctionnement hors-ligne complet.
  event.respondWith(fetch(event.request));
});
