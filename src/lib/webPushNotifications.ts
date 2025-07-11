// Web Push Notifications Utility for Coaching Platform
import { createClient } from '@/lib/supabase/client';

// VAPID public key - you'll need to generate this
const VAPID_PUBLIC_KEY = 'BH7Z8r9_J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6';

interface WebPushRegistrationResult {
  success: boolean;
  error?: string;
  subscription?: PushSubscription;
}

// Check if browser supports web push notifications
export const isWebPushSupported = (): boolean => {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isWebPushSupported()) {
    throw new Error('Web push notifications are not supported in this browser');
  }

  // Check current permission
  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  // Request permission
  const permission = await Notification.requestPermission();
  return permission;
};

// Register service worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported');
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('✅ [WEB-PUSH] Service worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('❌ [WEB-PUSH] Service worker registration failed:', error);
    throw error;
  }
};

// Subscribe to push notifications
export const subscribeToWebPush = async (userId: string): Promise<WebPushRegistrationResult> => {
  try {
    console.log('📱 [WEB-PUSH] Starting web push subscription process...');

    // Check browser support
    if (!isWebPushSupported()) {
      return {
        success: false,
        error: 'Web push notifications are not supported in this browser'
      };
    }

    // Request permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        error: `Notification permission ${permission}. Please enable notifications in your browser settings.`
      };
    }

    // Register service worker
    const registration = await registerServiceWorker();

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('✅ [WEB-PUSH] Browser subscription created:', subscription);

    // Save subscription to database
    const supabase = createClient();
    const subscriptionJson = subscription.toJSON();
    
    const { error: dbError } = await supabase
      .from('web_push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscriptionJson.endpoint!,
        p256dh_key: subscriptionJson.keys!.p256dh!,
        auth_key: subscriptionJson.keys!.auth!,
        user_agent: navigator.userAgent,
        updated_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('❌ [WEB-PUSH] Failed to save subscription to database:', dbError);
      return {
        success: false,
        error: 'Failed to save notification subscription'
      };
    }

    console.log('✅ [WEB-PUSH] Subscription saved to database');

    return {
      success: true,
      subscription
    };

  } catch (error) {
    console.error('❌ [WEB-PUSH] Subscription failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during subscription'
    };
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromWebPush = async (userId: string): Promise<boolean> => {
  try {
    console.log('🔇 [WEB-PUSH] Unsubscribing from web push...');

    if (!isWebPushSupported()) {
      return false;
    }

    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!registration) {
      console.log('🔇 [WEB-PUSH] No service worker registration found');
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log('✅ [WEB-PUSH] Browser subscription removed');
    }

    // Remove from database
    const supabase = createClient();
    const { error } = await supabase
      .from('web_push_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('❌ [WEB-PUSH] Failed to remove subscription from database:', error);
      return false;
    }

    console.log('✅ [WEB-PUSH] Subscription removed from database');
    return true;

  } catch (error) {
    console.error('❌ [WEB-PUSH] Unsubscription failed:', error);
    return false;
  }
};

// Check if user is subscribed
export const isSubscribedToWebPush = async (): Promise<boolean> => {
  try {
    if (!isWebPushSupported()) {
      return false;
    }

    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!registration) {
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;

  } catch (error) {
    console.error('❌ [WEB-PUSH] Failed to check subscription status:', error);
    return false;
  }
};

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Show in-app notification (fallback)
export const showInAppNotification = (title: string, body: string): void => {
  console.log('📢 [IN-APP] Showing notification:', title, body);
  
  // Create a simple toast notification
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
  notification.innerHTML = `
    <div class="flex items-start">
      <div class="flex-1">
        <h4 class="font-semibold text-sm">${title}</h4>
        <p class="text-sm mt-1">${body}</p>
      </div>
      <button class="ml-2 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
        ✕
      </button>
    </div>
  `;

  document.body.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}; 