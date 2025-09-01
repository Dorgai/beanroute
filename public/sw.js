// BeanRoute Service Worker v3.0
// Enhanced for background processing, mobile support, and reliable push notifications

const CACHE_NAME = 'beanroute-v3';
const OFFLINE_URL = '/offline.html';

// Background sync tags
const BACKGROUND_SYNC_TAGS = {
  PUSH_SUBSCRIPTION: 'push-subscription-sync',
  NOTIFICATION_UPDATE: 'notification-update-sync',
  DATA_SYNC: 'data-sync'
};

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
  console.log('[SW] Installing service worker v2.0...');
  
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
  console.log('[SW] Activating service worker v2.0...');
  
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
      .then(() => {
        console.log('[SW] Service worker is now controlling all clients');
        // Notify all clients that service worker is ready
        return self.clients.matchAll();
      })
      .then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ 
            type: 'SW_READY', 
            version: CACHE_NAME,
            timestamp: Date.now()
          });
        });
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
    event.respondWith(handleNavigationRequest(request).catch(error => {
      console.error('[SW] Navigation request failed:', error);
      // Return offline page as fallback
      return caches.match(OFFLINE_URL);
    }));
    return;
  }
  
  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request).catch(error => {
      console.error('[SW] API request failed:', error);
      // For API requests, try to return cached version or let error propagate
      if (request.method === 'GET') {
        return caches.match(request).catch(() => {
          // If even cache fails, return a basic error response
          return new Response(JSON.stringify({ error: 'Request failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        });
      }
      // For non-GET requests, let the error propagate naturally
      throw error;
    }));
    return;
  }
  
  // Handle static assets with cache-first strategy
  event.respondWith(handleStaticRequest(request).catch(error => {
    console.error('[SW] Static request failed:', error);
    // Return a basic error response for static assets
    return new Response('Asset not available', { status: 404 });
  }));
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
    
    // Enhanced notification options for better mobile support
    const notificationOptions = {
      body: data.body || 'You have a new notification',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/icon-72x72.png',
      data: data.data || {},
      tag: data.tag || 'default',
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      actions: data.actions || [
        {
          action: 'view',
          title: 'View',
          icon: '/icons/icon-72x72.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ],
      vibrate: data.vibrate || [200, 100, 200],
      timestamp: Date.now(),
      // Enhanced mobile-specific options
      dir: 'auto',
      lang: 'en',
      renotify: true,
      sticky: false,
      // Mobile notification center optimization
      image: data.image || null,
      // Ensure notifications appear in mobile notification center
      requireInteraction: data.requireInteraction || false,
      // Mobile-specific vibration patterns
      vibrate: data.vibrate || (navigator.userAgent.includes('Mobile') ? [200, 100, 200, 100, 200] : [200, 100, 200])
    };
    
    // Show the notification
    event.waitUntil(
      self.registration.showNotification(data.title || 'BeanRoute', notificationOptions)
        .then(() => {
          console.log('[SW] Notification displayed successfully');
          
          // Log notification display for analytics
          if (data.notificationId) {
            return fetch('/api/push/display', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                notificationId: data.notificationId,
                timestamp: Date.now()
              })
            }).catch(error => {
              console.error('[SW] Error logging notification display:', error);
            });
          }
        })
        .catch((error) => {
          console.error('[SW] Error showing notification:', error);
          
          // Fallback notification
          return self.registration.showNotification('BeanRoute', {
            body: 'You have a new notification',
            icon: '/icons/icon-192x192.png',
            tag: 'fallback'
          });
        })
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

// Background sync for reliable data synchronization
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  switch (event.tag) {
    case BACKGROUND_SYNC_TAGS.PUSH_SUBSCRIPTION:
      event.waitUntil(syncPushSubscription());
      break;
      
    case BACKGROUND_SYNC_TAGS.NOTIFICATION_UPDATE:
      event.waitUntil(syncNotificationUpdates());
      break;
      
    case BACKGROUND_SYNC_TAGS.DATA_SYNC:
      event.waitUntil(syncData());
      break;
      
    case 'background-order-sync':
      event.waitUntil(syncOrders());
      break;
      
    default:
      console.log('[SW] Unknown sync tag:', event.tag);
  }
});

// Periodic sync for background data updates (when supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync event:', event.tag);
  
  switch (event.tag) {
    case 'data-refresh':
      event.waitUntil(refreshDataInBackground());
      break;
    case 'notification-check':
      event.waitUntil(checkForNewNotifications());
      break;
    case 'inventory-sync':
      event.waitUntil(syncInventoryData());
      break;
    default:
      console.log('[SW] Unknown periodic sync tag:', event.tag);
  }
});

// Background sync functions
async function syncPushSubscription() {
  console.log('[SW] Syncing push subscription in background');
  try {
    // Attempt to sync push subscription with server
    const response = await fetch('/api/push/sync-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      console.log('[SW] Push subscription synced successfully');
    } else {
      console.log('[SW] Push subscription sync failed:', response.status);
    }
  } catch (error) {
    console.error('[SW] Error syncing push subscription:', error);
  }
}

async function syncNotificationUpdates() {
  console.log('[SW] Syncing notification updates in background');
  try {
    // Check for new notifications or updates
    const response = await fetch('/api/push/check-updates', {
      method: 'GET'
    });
    
    if (response.ok) {
      const updates = await response.json();
      if (updates.hasNewNotifications) {
        // Show notification about new updates
        self.registration.showNotification('BeanRoute Updates', {
          body: 'You have new notifications',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'updates-available'
        });
      }
    }
  } catch (error) {
    console.error('[SW] Error syncing notification updates:', error);
  }
}

async function syncData() {
  console.log('[SW] Syncing data in background');
  try {
    // Sync critical data like orders and inventory
    const response = await fetch('/api/retail/sync-data', {
      method: 'POST'
    });
    
    if (response.ok) {
      console.log('[SW] Data synced successfully');
    }
  } catch (error) {
    console.error('[SW] Error syncing data:', error);
  }
}

async function refreshDataInBackground() {
  console.log('[SW] Refreshing data in background');
  try {
    // Refresh data even when app is not active
    await syncData();
    await syncNotificationUpdates();
  } catch (error) {
    console.error('[SW] Error refreshing data in background:', error);
  }
}

// Future: Background sync for orders
async function syncOrders() {
  console.log('[SW] Background sync for orders - placeholder for future implementation');
  // This will be implemented in Phase 3 with push notifications
}

async function checkForNewNotifications() {
  console.log('[SW] Checking for new notifications in background');
  try {
    const response = await fetch('/api/push/check-updates', {
      method: 'GET'
    });
    
    if (response.ok) {
      const updates = await response.json();
      if (updates.hasNewNotifications) {
        // Show notification about new updates
        await self.registration.showNotification('BeanRoute Update', {
          body: 'New updates available in the app',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'app-update',
          requireInteraction: false,
          silent: false
        });
      }
    }
  } catch (error) {
    console.error('[SW] Error checking for notifications:', error);
  }
}

async function syncInventoryData() {
  console.log('[SW] Syncing inventory data in background');
  try {
    const response = await fetch('/api/retail/sync-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      console.log('[SW] Inventory data synced successfully');
    } else {
      console.log('[SW] Inventory sync failed:', response.status);
    }
  } catch (error) {
    console.error('[SW] Error syncing inventory data:', error);
  }
}

console.log('[SW] BeanRoute Service Worker loaded successfully');
