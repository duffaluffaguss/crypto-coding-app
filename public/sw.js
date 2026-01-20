const CACHE_NAME = 'crypto-dev-v3';
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/learn',
  '/dashboard',
  '/editor',
];

// Cache configurations
const DYNAMIC_CACHE = 'crypto-dev-dynamic-v2';
const API_CACHE = 'crypto-dev-api-v1';
const LESSON_CACHE = 'crypto-dev-lessons-v1';
const IMAGE_CACHE = 'crypto-dev-images-v1';

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  CACHE_ONLY: 'cache-only',
  NETWORK_ONLY: 'network-only',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// API endpoints that should be cached
const CACHEABLE_APIS = [
  '/api/lessons',
  '/api/tutorials',
  '/api/paths',
  '/api/templates',
  '/api/snippets',
  '/api/leaderboard',
  '/api/user/progress'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      }),
      // Pre-cache critical CSS and JS files
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.addAll([
          '/_next/static/css/',
          '/_next/static/chunks/',
        ].filter(url => url)); // Filter out any empty URLs
      })
    ])
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const expectedCaches = [CACHE_NAME, DYNAMIC_CACHE, API_CACHE, LESSON_CACHE, IMAGE_CACHE];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !expectedCaches.includes(name))
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Enhanced fetch event handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for POST/PUT/DELETE operations
  if (request.method !== 'GET') {
    // Handle offline POST requests by queuing them
    if (!navigator.onLine && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      event.respondWith(handleOfflineWriteRequest(request));
    }
    return;
  }

  // Skip cross-origin requests
  if (!url.origin.startsWith(self.location.origin)) return;

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
  } else if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isImage(url.pathname)) {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(handleGenericRequest(request));
  }
});

// Handle API requests with smart caching
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const isCacheable = CACHEABLE_APIS.some(api => url.pathname.startsWith(api));

  if (!isCacheable) {
    // Non-cacheable API requests - network only with offline fallback
    try {
      return await fetch(request);
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Offline' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Cacheable API requests - network first with cache fallback
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      // Only cache successful responses
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Add offline indicator to cached responses
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Served-By', 'sw-cache');
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
    }
    
    return new Response(JSON.stringify({ error: 'Offline - no cached data' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle navigation requests (HTML pages)
async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    
    // Cache successful page responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    const offlineResponse = await caches.match('/offline');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Fallback offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head><title>Offline - CryptoDev</title></head>
        <body>
          <h1>You're offline</h1>
          <p>Please check your connection and try again.</p>
          <button onclick="window.location.reload()">Retry</button>
        </body>
      </html>
    `, {
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Return cached and update in background
    fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response);
      }
    }).catch(() => {}); // Ignore background update errors
    
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Return a placeholder for missing static assets
    return new Response('Asset not available offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Handle image requests with long-term caching
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache images for longer periods
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Return placeholder image or error response
    return new Response('Image not available offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Handle offline write requests by queuing them
async function handleOfflineWriteRequest(request) {
  try {
    // Store the request for later sync
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.text(),
      timestamp: Date.now()
    };
    
    // Use IndexedDB to queue the request
    await queueOfflineRequest(requestData);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Request queued for sync when online',
      queued: true
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to queue request',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Generic request handler
async function handleGenericRequest(request) {
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Content not available offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Helper functions
function isStaticAsset(pathname) {
  return pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/) ||
         pathname.startsWith('/_next/static/');
}

function isImage(pathname) {
  return pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/);
}

// Queue offline requests (simplified - would use IndexedDB in production)
async function queueOfflineRequest(requestData) {
  // This would normally use IndexedDB
  // For now, we'll just log it
  console.log('Queued offline request:', requestData);
}

// Handle push notifications (future use)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New update available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'CryptoDev', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
