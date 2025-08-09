// Firebase Cloud Messaging Service Worker
// This file must be served from the root domain (not from a subdirectory)

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration (same as in your main app)
const firebaseConfig = {
  apiKey: "AIzaSyA1QKxp-zDa8S2OOsnptmiJRC-wCKRkZp8",
  authDomain: "coaching-mobile-7e0c3.firebaseapp.com",
  projectId: "coaching-mobile-7e0c3",
  storageBucket: "coaching-mobile-7e0c3.firebasestorage.app",
  messagingSenderId: "563892471445",
  appId: "1:563892471445:web:57e247e17023557635fd9c"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  // Extract notification data
  const notificationTitle = payload.notification?.title || 'Özgün Koçluk';
  const notificationOptions = {
    body: payload.notification?.body || 'Yeni mesajınız var',
    icon: '/favicon.ico', // Your app icon
    badge: '/badge-icon.png', // Optional badge icon
    tag: payload.data?.type || 'default',
    data: payload.data,
    requireInteraction: true,
    actions: [
      {
        action: 'open_chat',
        title: 'Open Chat',
        icon: '/chat-icon.png' // Optional action icon
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  // Show the notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received:', event);
  
  event.notification.close();
  
  // Handle different actions
  if (event.action === 'open_chat') {
    // Open chat page
    const chatUrl = event.notification.data?.chatUrl || '/';
    event.waitUntil(
      clients.openWindow(chatUrl)
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification (already closed above)
    return;
  } else {
    // Default click action - open the app
    const defaultUrl = event.notification.data?.url || '/';
    event.waitUntil(
      clients.matchAll().then(function(clientList) {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url === defaultUrl && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if no existing window found
        if (clients.openWindow) {
          return clients.openWindow(defaultUrl);
        }
      })
    );
  }
});

// Handle notification close events
self.addEventListener('notificationclose', function(event) {
  console.log('[firebase-messaging-sw.js] Notification closed:', event);
  
  // Optional: Track notification dismissal
  // You could send analytics data here
});
