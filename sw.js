// sw.js
const CACHE_NAME = 'am-usin-cache-v1';
const PRECACHE_URLS = [
  '/', '/index.html', '/manifest.json',
  // ajoute d'autres assets que tu veux précacher si nécessaire
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS).catch(()=>{}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); }));
    await self.clients.claim();
    // notifier clients qu'on a mis à jour le service worker
    const all = await self.clients.matchAll({ type: 'window' });
    all.forEach(client => {
      client.postMessage({ type: 'SW_UPDATED' });
    });
  })());
});

self.addEventListener('fetch', (e) => {
  try {
    // If the page requested bypass header, perform a straight network fetch and return it.
    // This avoids serving a cached manifest/index.html to the polling check.
    try {
      const bypass = e.request.headers.get('x-skip-sw');
      if (bypass === '1') {
        // network-only for this request
        e.respondWith(fetch(e.request));
        return;
      }
    } catch(err){
      // Ignore header access errors and continue to normal handling
    }

    const url = new URL(e.request.url);
    const pathname = url.pathname;

    // network-first for index and manifest (important pour le polling)
    if (pathname === '/' || pathname.endsWith('/index.html') || pathname.endsWith('/manifest.json')) {
      e.respondWith((async () => {
        try {
          const netRes = await fetch(e.request);
          // mettre à jour le cache
          const cache = await caches.open(CACHE_NAME);
          try { cache.put(e.request, netRes.clone()); } catch(e){/* ignore put errors */ }
          return netRes;
        } catch (err) {
          const cached = await caches.match(e.request);
          if (cached) return cached;
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        }
      })());
      return;
    }

    // pour les autres requêtes : cache-first puis réseau
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          const cloned = res.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, cloned).catch(()=>{});
          });
          return res;
        }).catch(() => cached || new Response('', { status: 404 }));
      })
    );
  } catch (err) {
    e.respondWith(fetch(e.request));
  }
});
