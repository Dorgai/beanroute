// BeanRoute Service Worker v1.0
// Provides offline functionality and caching for better performance

const CACHE_NAME = 'beanroute-v1';
const OFFLINE_URL = '/offline.html';

// Critical pages to cache for offline access
const CRITICAL_PAGES = [
  '/',
  '/login',
  '/dashboard',
  '/orders',
  '/coffee',
  '/offline.html'
];

// Static assets to cache
const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.ico'
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching critical pages and assets');
        return cache.addAll([
          ...CRITICAL_PAGES,
          ...STATIC_ASSETS
        ].filter(url => url)); // Filter out any undefined URLs
      })
      .then(() => {
        console.log('[SW] Service worker installed successfully');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache resources during install:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Handle navigation requests (page loads)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
  
  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle static assets with cache-first strategy
  event.respondWith(handleStaticRequest(request));
});

// Navigation request handler - network first, fallback to cache, then offline page
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    // If successful, cache the response
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed for navigation, trying cache...');
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to offline page
    console.log('[SW] No cached version, showing offline page');
    return caches.match(OFFLINE_URL);
  }
}

// API request handler - network first, limited cache fallback
async function handleApiRequest(request) {
  try {
    const response = await fetch(request);
    
    // Only cache GET requests that are successful
    if (request.method === 'GET' && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // For GET requests, try cache as fallback
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        console.log('[SW] Serving cached API response');
        return cachedResponse;
      }
    }
    
    // For other methods or no cache, let the error propagate
    throw error;
  }
}

// Static asset handler - cache first, fallback to network
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Failed to fetch static asset:', request.url);
    throw error;
  }
}

// Push notification event handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);
  
  if (!event.data) {
    console.log('[SW] Push event without data');
    return;
  }
  
  try {
    const data = event.data.json();
    console.log('[SW] Push notification data:', data);
    
    const notificationOptions = {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/icon-72x72.png',
      data: data.data || {},
      tag: data.tag || 'default',
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      actions: data.actions || [],
      vibrate: data.vibrate || [200, 100, 200],
      timestamp: Date.now()
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, notificationOptions)
    );
  } catch (error) {
    console.error('[SW] Error processing push notification:', error);
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('BeanRoute', {
        body: 'You have a new notification',
        icon: '/icons/icon-192x192.png',
        tag: 'fallback'
      })
    );
  }
});

// Notification click event handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification);
  
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  const action = event.action;
  
  let urlToOpen = '/';
  
  // Handle different notification types
  if (notificationData.type) {
    switch (notificationData.type) {
      case 'ORDER':
        urlToOpen = notificationData.orderId 
          ? `/orders?highlight=${notificationData.orderId}` 
          : '/orders';
        break;
      case 'INVENTORY':
        urlToOpen = notificationData.shopId 
          ? `/shops/${notificationData.shopId}` 
          : '/coffee';
        break;
      case 'MESSAGE':
        urlToOpen = '/dashboard'; // Message board is in dashboard
        break;
      default:
        urlToOpen = notificationData.url || '/dashboard';
    }
  }
  
  // Handle action buttons
  if (action) {
    switch (action) {
      case 'view':
        // Use the URL determined above
        break;
      case 'dismiss':
        // Just close, don't open anything
        return;
      default:
        console.log('[SW] Unknown notification action:', action);
    }
  }
  
  // Open the app or focus existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to find an existing window to focus
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            console.log('[SW] Focusing existing window');
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        
        // No existing window found, open a new one
        console.log('[SW] Opening new window:', urlToOpen);
        return clients.openWindow(urlToOpen);
      })
  );
  
  // Log notification click for analytics
  if (notificationData.notificationId) {
    fetch('/api/push/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        notificationId: notificationData.notificationId,
        action: action || 'click'
      })
    }).catch(error => {
      console.error('[SW] Error logging notification click:', error);
    });
  }
});

// Notification close event handler
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
  
  // Log notification dismissal for analytics (optional)
  const notificationData = event.notification.data || {};
  if (notificationData.notificationId) {
    fetch('/api/push/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        notificationId: notificationData.notificationId 
      })
    }).catch(error => {
      console.error('[SW] Error logging notification close:', error);
    });
  }
});

// Message handling for app communication
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'SUBSCRIPTION_CHANGE':
      // Handle push subscription changes
      console.log('[SW] Push subscription changed:', payload);
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Background sync for future implementation
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  switch (event.tag) {
    case 'background-order-sync':
      event.waitUntil(syncOrders());
      break;
      
    default:
      console.log('[SW] Unknown sync tag:', event.tag);
  }
});

// Future: Background sync for orders
async function syncOrders() {
  console.log('[SW] Background sync for orders - placeholder for future implementation');
  // This will be implemented in Phase 3 with push notifications
}

console.log('[SW] BeanRoute Service Worker loaded successfully');
