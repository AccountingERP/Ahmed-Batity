/* =========================================
   Ahmed Batity ERP - Service Worker
   ========================================= */

const CACHE_NAME = 'ahmed-batity-erp-v7';
const STATIC_CACHE = 'static-v7';
const DYNAMIC_CACHE = 'dynamic-v7';
const IMAGE_CACHE = 'images-v7';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/assets/css/app.css',
  '/assets/js/config.js',
  '/assets/js/utils.js',
  '/assets/js/logger.js',
  '/assets/js/export.js',
  '/assets/js/print.js',
  '/assets/js/api.js',
  '/assets/js/auth.js',
  '/assets/js/router.js',
  '/assets/js/ui.js',
  '/assets/js/store.js',
  '/assets/js/forms.js',
  '/assets/js/components.js',
  '/assets/js/global-search.js',
  '/assets/js/app.js',
  '/assets/js/pwa-update.js',
  '/assets/images/icon-72.png',
  '/assets/images/icon-96.png',
  '/assets/images/icon-128.png',
  '/assets/images/icon-144.png',
  '/assets/images/icon-152.png',
  '/assets/images/icon-192.png',
  '/assets/images/icon-384.png',
  '/assets/images/icon-512.png',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(err => console.error('[SW] Cache failed:', err))
  );

  // Note: skipWaiting() is NOT called automatically here on purpose.
  // We want the new service worker to stay in "waiting" state so the
  // app can notify the user and let them choose when to update
  // (see assets/js/pwa-update.js). It only activates after the client
  // sends a 'skipWaiting' message (button press or pull-to-refresh).
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => {
            return name.startsWith('ahmed-batity-erp-') && 
                   name !== STATIC_CACHE && 
                   name !== DYNAMIC_CACHE && 
                   name !== IMAGE_CACHE;
          })
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );

  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and API calls
  if (request.method !== 'GET') return;
  if (url.pathname.includes('/api/') || url.host.includes('script.google.com')) return;

  // Cache strategy: Cache First for static assets
  if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset))) {
    event.respondWith(
      caches.match(request).then(cached => {
        return cached || fetch(request).then(response => {
          return caches.open(STATIC_CACHE).then(cache => {
            cache.put(request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // Cache strategy: Network First for dynamic content
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then(cached => {
          if (cached) return cached;

          // Return offline fallback for HTML requests
          if (request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }

          return new Response('Offline - Content not available', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  console.log('[SW] Background sync triggered');
  // Implement sync logic here
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data.json();

  const options = {
    body: data.body || 'New notification',
    icon: '/assets/images/icon-192.png',
    badge: '/assets/images/badge-72.png',
    tag: data.tag || 'default',
    requireInteraction: true,
    data: data
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Ahmed batity - ERP', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

// Message from client
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
