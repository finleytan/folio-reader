// Folio Service Worker — offline caching
// Cache version: bump this string to force a cache refresh on update
const CACHE = 'folio-v1';

// Everything Folio needs to run offline
const PRECACHE = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap',
];

// Install: pre-cache the app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // Cache what we can — font CDN may fail, that's OK
      return Promise.allSettled(
        PRECACHE.map(url => cache.add(url).catch(() => {}))
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate: delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for app shell, network-first for everything else
self.addEventListener('fetch', e => {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // For the app HTML itself: cache-first (works offline)
  const isAppShell = url.pathname.endsWith('/') ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/audiobook-reader.html');

  // For Google Fonts: cache-first
  const isFonts = url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com');

  // For JSZip CDN (used for EPUB): cache-first once fetched
  const isCDN = url.hostname.includes('cdnjs.cloudflare.com');

  if (isAppShell || isFonts || isCDN) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        }).catch(() => cached); // offline fallback to cache
      })
    );
    return;
  }

  // Everything else (blob URLs for audio etc): pass through
  // Don't try to cache blob: or data: URLs
  if (url.protocol === 'blob:' || url.protocol === 'data:') return;
});
