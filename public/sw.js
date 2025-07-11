// Service Worker for TYT-AYT Coaching Platform
// Handles push notifications and offline functionality

const CACHE_NAME = 'coaching-app-v1';
const urlsToCache = [
  '/',
  '/login',
  '/coach',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 [SW] Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('📨 [SW] Push notification received:', event);
  
  const options = {
    body: 'Yeni bir bildirim aldınız',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'Görüntüle',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'dismiss',
        title: 'Kapat'
      }
    ],
    data: {
      timestamp: Date.now(),
      url: '/'
    }
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
      options.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(options.title, options)
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