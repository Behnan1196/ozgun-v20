// Service Worker for TYT-AYT Coaching Platform
// Handles push notifications and offline functionality

const CACHE_NAME = 'coaching-app-v2'; // Increment version to force cache update
const urlsToCache = [
  // Only cache static assets, not HTML pages
  // '/', // Removed to prevent serving stale HTML
  // '/login', // Removed to prevent serving stale HTML  
  // '/coach' // Removed to prevent serving stale HTML
];

// Install event - cache resources (with error handling)
self.addEventListener('install', (event) => {
  console.log('📦 [SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 [SW] Opened cache');
        
        // Cache URLs individually to handle failures gracefully
        const cachePromises = urlsToCache.map(url => {
          return cache.add(url).catch(error => {
            console.warn('⚠️ [SW] Failed to cache:', url, error);
            // Don't throw error, just log it
          });
        });
        
        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log('✅ [SW] Service worker installed successfully');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ [SW] Service worker installation failed:', error);
        // Don't block installation completely
      })
  );
});

// Activate event - clean up old caches and take control immediately
self.addEventListener('activate', (event) => {
  console.log('🚀 [SW] Service worker activated');
  event.waitUntil(
    // Delete old caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ [SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - network-first strategy for HTML documents
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // For HTML documents (navigation requests), always try network first
  if (event.request.mode === 'navigate' || 
      event.request.destination === 'document' ||
      event.request.headers.get('Accept')?.includes('text/html')) {
    
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Always return fresh HTML from network
          console.log('🌐 [SW] Serving fresh HTML from network:', url.pathname);
          return response;
        })
        .catch(() => {
          // Only fallback to cache if network fails
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('📦 [SW] Serving HTML from cache (offline):', url.pathname);
              return cachedResponse;
            }
            // Final fallback for offline navigation
            return new Response('App offline - please check your connection', { 
              status: 200, 
              headers: { 'Content-Type': 'text/html' } 
            });
          });
        })
    );
    return;
  }
  
  // For other resources (JS, CSS, images), try cache first
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log('📦 [SW] Serving from cache:', url.pathname);
          return response;
        }
        
        // Fetch from network and cache static assets
        return fetch(event.request).then((response) => {
          // Only cache successful responses for static assets
          if (response.status === 200 && 
              (url.pathname.includes('/_next/static/') || 
               url.pathname.includes('/icons/') ||
               url.pathname.includes('.css') ||
               url.pathname.includes('.js'))) {
            
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          
          return response;
        });
      })
      .catch(() => {
        // If both cache and network fail for non-navigation requests
        console.log('❌ [SW] Resource unavailable:', url.pathname);
        return new Response('Resource unavailable', { status: 404 });
      })
  );
});

// Push event - handle incoming push notifications with improved error handling
self.addEventListener('push', (event) => {
  console.log('📨 [SW] Push notification received:', event);
  
  const notificationIcon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0VjVDMTcuMyA2IDE5LjggOC43IDE5LjggMTJWMTZMMjEgMTdIMTNIMTFIM1YxNkM0LjIgMTYgNS4yIDE1IDUuMiAxM1Y5QzUuMiA2LjggNy4yIDUgOS40IDVWNEMxMCAyLjkgMTAuOSAyIDEyIDJaTTEyIDIxQzEzLjEgMjEgMTQgMjAuMSAxNCAxOUgxMEMxMCAyMC4xIDEwLjkgMjEgMTIgMjFaIiBmaWxsPSIjNDI4NUY0Ii8+Cjwvc3ZnPgo=';

  const options = {
    body: 'Yeni bir bildirim aldınız',
    icon: notificationIcon,
    vibrate: [200, 100, 200],
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'Görüntüle',
        icon: notificationIcon
      },
      {
        action: 'dismiss',
        title: 'Kapat'
      }
    ],
    data: {
      timestamp: Date.now(),
      url: '/',
      notificationId: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    },
    tag: `coaching_${Date.now()}` // Prevent duplicate notifications
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      
      // Customize notification based on type
      if (payload.type === 'new_coaching_session') {
        options.title = '📅 Yeni Koçluk Seansı';
        options.body = payload.body || `${payload.data?.taskTitle} - ${payload.data?.sessionDate} ${payload.data?.sessionTime}`;
        options.data.url = '/coach';
        options.data.type = 'coaching_session';
        options.data.taskId = payload.data?.taskId;
      } else if (payload.type === 'session_updated') {
        options.title = '🔄 Koçluk Seansı Güncellendi';
        options.body = payload.body;
        options.data.url = '/coach';
        options.data.type = 'session_updated';
        options.data.taskId = payload.data?.taskId;
      } else if (payload.type === 'session_reminder') {
        options.title = '⏰ Koçluk Seansı Hatırlatması';
        options.body = payload.body;
        options.data.url = '/coach';
        options.data.type = 'session_reminder';
        options.requireInteraction = true;
      } else {
        options.title = payload.title || 'Coaching Platform';
        options.body = payload.body || payload.message;
      }
      
      // Add custom data
      if (payload.data) {
        options.data = { ...options.data, ...payload.data };
      }
      
    } catch (error) {
      console.error('❌ [SW] Error parsing push payload:', error);
      options.title = 'Coaching Platform';
      options.body = event.data ? event.data.text() : 'Yeni bildirim';
    }
  } else {
    options.title = 'Coaching Platform';
    options.body = 'Yeni bir bildirim aldınız';
  }

  event.waitUntil(
    self.registration.showNotification(options.title, options)
      .then(() => {
        console.log('✅ [SW] Notification shown successfully:', options.title);
      })
      .catch((error) => {
        console.error('❌ [SW] Failed to show notification:', error);
        // Fallback: try showing a simpler notification
        return self.registration.showNotification('Coaching Platform', {
          body: 'Yeni bildirim',
          icon: notificationIcon,
          tag: `fallback_${Date.now()}`
        });
      })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('👆 [SW] Notification clicked:', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'dismiss') {
    return;
  }
  
  // Handle different notification types
  let targetUrl = '/';
  
  if (data.type === 'coaching_session' || data.type === 'session_updated' || data.type === 'session_reminder') {
    targetUrl = '/coach';
  } else if (data.url) {
    targetUrl = data.url;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window if app is not open
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 [SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks here
      console.log('📡 [SW] Performing background sync')
    );
  }
});

// Message event - communication with main thread
self.addEventListener('message', (event) => {
  console.log('💬 [SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 