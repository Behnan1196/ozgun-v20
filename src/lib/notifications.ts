// Web Push Notifications using Firebase Cloud Messaging (FCM)
import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { initializeApp, getApps } from 'firebase/app';

// Firebase configuration (should match your mobile app's config)
const firebaseConfig = {
  apiKey: "AIzaSyA1QKxp-zDa8S2OOsnptmiJRC-wCKRkZp8",
  authDomain: "coaching-mobile-7e0c3.firebaseapp.com",
  projectId: "coaching-mobile-7e0c3",
  storageBucket: "coaching-mobile-7e0c3.firebasestorage.app",
  messagingSenderId: "563892471445",
  appId: "1:563892471445:web:57e247e17023557635fd9c"
};

// VAPID key for web push (you'll need to generate this in Firebase Console)
const VAPID_KEY = "BJU08P6HHEDgs0Phs9p4drSS0EOOmTewCTuy6qFTWTt0bXwP0JWyTXA9OEYEKdohc3x0qOeRex5CfprosQW96TA";
               

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
let messaging: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any

// Initialize messaging only in browser environment
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.error('Error initializing Firebase messaging:', error);
  }
}

export interface WebPushToken {
  token: string;
  userId: string;
  platform: 'web';
  browser?: string;
}

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return null;
    }

    // Check if messaging is available
    if (!messaging) {
      console.log('Firebase messaging not available');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY
    });

    if (token) {
      console.log('✅ FCM token obtained:', token);
      return token;
    } else {
      console.log('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting notification permission:', error);
    return null;
  }
}

/**
 * Save web push token to database
 */
export async function saveWebPushToken(userId: string, token: string): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/register-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        token,
        tokenType: 'fcm',
        platform: 'web',
        browser: navigator.userAgent.includes('Chrome') ? 'chrome' : 
                navigator.userAgent.includes('Firefox') ? 'firefox' : 
                navigator.userAgent.includes('Safari') ? 'safari' : 'unknown'
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save token: ${response.statusText}`);
    }

    console.log('✅ Web push token saved successfully');
    return true;
  } catch (error) {
    console.error('❌ Error saving web push token:', error);
    return false;
  }
}

/**
 * Setup foreground message listener
 */
export function setupMessageListener(onMessageReceived?: (payload: MessagePayload) => void) {
  if (!messaging) {
    console.log('Firebase messaging not available for message listener');
    return null;
  }

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('📨 Message received in foreground:', payload);
    
    // WEB NOTIFICATIONS DISABLED - Mobile-only notification system
    // Don't show any notifications on web to prevent conflicts
    console.log('📱 Web notifications disabled - mobile-only notifications active');

    // Call custom handler if provided (for in-app updates, etc.)
    if (onMessageReceived) {
      onMessageReceived(payload);
    }
  });

  return unsubscribe;
}

/**
 * Show browser notification
 */
export function showNotification(title: string, body: string, data?: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  if ('Notification' in window && Notification.permission === 'granted') {
    // Create unique tag to prevent Chrome from grouping notifications
    const uniqueTag = `${data?.type || 'message'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico', // Update with your app icon
      badge: '/badge-icon.png', // Optional badge icon
      tag: uniqueTag, // Unique tag prevents Chrome notification grouping
      data: data,
      requireInteraction: true, // Keep notification visible until user interacts
    });

    // Handle notification click
    notification.onclick = function(event) {
      event.preventDefault();
      
      // Focus the window
      window.focus();
      
      // Handle different notification types
      if (data?.type === 'chat_message' && data?.chatChannel) {
        // Navigate to chat (you'll need to implement this based on your routing)
        window.location.hash = `#/chat/${data.chatChannel}`;
      }
      
      // Close the notification
      notification.close();
    };

    return notification;
  }
}

/**
 * Initialize web push notifications for current user
 */
export async function initializeWebPushNotifications(userId: string): Promise<void> {
  try {
    console.log('🔔 Initializing web push notifications for user:', userId);

    // Request permission and get token
    const token = await requestNotificationPermission();
    if (!token) {
      console.log('⚠️ Failed to get web push token');
      return;
    }

    // Save token to database
    await saveWebPushToken(userId, token);

    // Setup message listener
    setupMessageListener((payload) => {
      console.log('📱 Custom message handler:', payload);
      // Add any custom logic for handling foreground messages
    });

    console.log('✅ Web push notifications initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing web push notifications:', error);
  }
}

/**
 * Clear Chrome notification registration and force re-registration
 */
export async function clearChromeNotificationCache(): Promise<void> {
  try {
    // Unregister service worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        if (registration.scope.includes('firebase-messaging')) {
          await registration.unregister();
          console.log('🧹 Firebase service worker unregistered');
        }
      }
    }

    // Clear notification permission (user will need to re-grant)
    if ('permissions' in navigator) {
      // Note: Cannot programmatically revoke permission, user must do this manually
      console.log('⚠️ User needs to manually reset notification permissions in Chrome settings');
    }

    // Clear any cached tokens
    localStorage.removeItem('fcm_token');
    sessionStorage.removeItem('fcm_token');
    
    console.log('✅ Chrome notification cache cleared');
  } catch (error) {
    console.error('❌ Error clearing Chrome notification cache:', error);
  }
}

/**
 * Debug Chrome notification status
 */
export async function debugChromeNotifications(): Promise<any> {
  const debugInfo: any = {
    permission: Notification.permission,
    serviceWorkerSupport: 'serviceWorker' in navigator,
    notificationSupport: 'Notification' in window,
    userAgent: navigator.userAgent,
    isChrome: navigator.userAgent.includes('Chrome'),
    timestamp: new Date().toISOString()
  };

  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      debugInfo.serviceWorkers = registrations.map(reg => ({
        scope: reg.scope,
        state: reg.active?.state,
        scriptURL: reg.active?.scriptURL
      }));
    } catch (error) {
      debugInfo.serviceWorkerError = error instanceof Error ? error.message : String(error);
    }
  }

  console.log('🔍 Chrome notification debug info:', debugInfo);
  return debugInfo;
}

/**
 * Send a test web notification
 */
export async function sendTestWebNotification(): Promise<void> {
  try {
    const response = await fetch('/api/notifications/test-web', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to send test notification: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📤 Test web notification sent:', result);
  } catch (error) {
    console.error('❌ Error sending test web notification:', error);
  }
}

/**
 * Check if notifications are supported and enabled
 */
export function isNotificationSupported(): boolean {
  return (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    messaging !== null
  );
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if ('Notification' in window) {
    return Notification.permission;
  }
  return 'default';
}
