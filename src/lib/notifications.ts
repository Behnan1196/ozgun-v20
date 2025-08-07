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
const VAPID_KEY = "BL8J8vL8vL8vL8vL8vL8vL8vL8vL8vL8vL8vL8vL8vL8vL8vL8vL8vL8vL8vL8vL8vL8vL8vL8vL8vL8vL8vL8vL8vL8vL8vL8vL8vL8vL8vL8";

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
    
    // Show custom notification or handle as needed
    if (payload.notification) {
      showNotification(
        payload.notification.title || 'New Message',
        payload.notification.body || '',
        payload.data
      );
    }

    // Call custom handler if provided
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
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico', // Update with your app icon
      badge: '/badge-icon.png', // Optional badge icon
      tag: data?.type || 'default',
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
