// Cache only the generic offline notice. Prices, accounts and orders always use the network.
const CACHE = 'kenara-offline-v1';
const OFFLINE = '/offline.html';
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.add(OFFLINE)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('kenara-offline-') && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate' ||
      url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  event.respondWith(fetch(event.request).catch(async () =>
    (await caches.match(OFFLINE)) || new Response('Sem conexão. Conecte-se à internet e tente novamente.', {
      status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    })
  ));
});
