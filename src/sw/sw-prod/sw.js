/* eslint-disable no-restricted-globals */
const staticCache = 'currency-converter-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(staticCache)
    .then(cache => cache.addAll([
      './',
      './styles.css',
      './bundle.js',
    ]))
    .catch(error => console.log(error)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then(cacheNames => Promise.all(cacheNames
      .filter(cacheName => cacheName.startsWith('currency-converter-') && cacheName !== staticCache)
      .map(cacheName => caches.delete(cacheName)))));
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    event.respondWith(caches.match(event.request)
      .then((request) => {
        if (request) {
          console.log(`responding with cache: ${event.request.url}`);
          return request;
        }
        console.log(`file is not cached, fetching: ${event.request.url}`);
        return fetch(event.request);
      })
      .catch(error => console.log(error)));
  }

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname === '/hello') {
      event.respondWith(
        new Response('HELLO WORLD!!!'),
      );
    }
  }

  // event.respondWith(caches.match(event.request)
  // .then(response => response || fetch(event.request)));
});

self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    console.log('Message recieved ooo');
    self.skipWaiting();
  }
});
