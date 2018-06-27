/* eslint-disable no-restricted-globals */
const staticCache = 'headlines-v4';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(staticCache)
    .then(cache => cache.addAll([
      '/skeleton',
      '/styles.css',
      '/bundle.js',
    ]))
    .catch(error => console.log(error)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then(cacheNames => Promise.all(cacheNames.filter(cacheName =>
      cacheName.startsWith('headlines-') && cacheName !== staticCache)
      .map(cacheName => caches.delete(cacheName)))));
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname === '/') {
      event.respondWith(caches.match('/skeleton'));
      return;
    }
  }

  event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));

  /* event.respondWith(caches.match(event.request)
    .then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      // return fetch(event.request);
    })); */
});

self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
