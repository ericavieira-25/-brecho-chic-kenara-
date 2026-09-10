// Retire the previously installed worker when returning visitors receive its update.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('kenara-offline-')).map(key => caches.delete(key)));
    await self.registration.unregister();
  })());
});
