// sw.js
const CACHE_NAME = 'am-usin-cache-v1';
const PRECACHE_URLS = [
  '/', '/index.html', '/manifest.json',
  // ajoute d'autres assets que tu veux précacher si nécessaire
];

self.addEventListener('install', (e) => {
  // précache basique (optionnel)
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS).catch(()=>{}))
  );
  // prendre le contrôle tout de suite
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // nettoyer anciens caches si besoin
    const keys = await caches.keys();
    await Promise.all(keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); }));
    // prendre le contrôle des clients
    await self.clients.claim();
    // notifier clients qu'on a mis à jour le service worker
    const all = await self.clients.matchAll({ type: 'window' });
    all.forEach(client => {
      client.postMessage({ type: 'SW_UPDATED' });
    });
  })());
});

// stratégie fetch : network-first pour index & manifest; fallback cache.
// pour le reste : cache-first (puis réseau)
self.addEventListener('fetch', (e) => {
  try {
    const url = new URL(e.request.url);
    const pathname = url.pathname;

    // network-first for index and manifest (important pour ton check polling)
    if (pathname === '/' || pathname.endsWith('/index.html') || pathname.endsWith('/manifest.json')) {
      e.respondWith((async () => {
        try {
          const netRes = await fetch(e.request);
          // mettre à jour le cache
          const cache = await caches.open(CACHE_NAME);
          cache.put(e.request, netRes.clone());
          return netRes;
        } catch (err) {
          // offline fallback to cache
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
          // optionnel : ne pas cacher les réponses cross-origin si tu veux
          const cloned = res.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, cloned).catch(()=>{});
          });
          return res;
        }).catch(() => cached || new Response('', { status: 404 }));
      })
    );
  } catch (err) {
    // sécurité: si URL parsing fail
    e.respondWith(fetch(e.request));
  }
});
