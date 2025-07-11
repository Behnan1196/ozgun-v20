// Web Push Notifications Utility for Coaching Platform
import { createClient } from '@/lib/supabase/client';

// Simplified approach - we'll generate proper VAPID keys later
const VAPID_PUBLIC_KEY = null; // Set to null for now to avoid invalid key errors

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
    // Wait for any existing service worker to be ready
    const existingRegistration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (existingRegistration) {
      console.log('✅ [WEB-PUSH] Service worker already registered:', existingRegistration);
      return existingRegistration;
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('✅ [WEB-PUSH] Service worker registered:', registration);
    
    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    
    return registration;
  } catch (error) {
    console.error('❌ [WEB-PUSH] Service worker registration failed:', error);
    throw error;
  }
};

// Subscribe to push notifications (simplified version for now)
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

    // For now, just save a placeholder subscription to indicate the user wants notifications
    // We'll implement full push subscription when VAPID keys are properly configured
    const supabase = createClient();
    
    const { error: dbError } = await supabase
      .from('web_push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: `placeholder_${Date.now()}`,
        p256dh_key: 'placeholder_p256dh',
        auth_key: 'placeholder_auth',
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

    console.log('✅ [WEB-PUSH] Subscription saved to database (placeholder mode)');

    // Show a test notification to confirm it works
    if (registration.active) {
      new Notification('Bildirimler Etkinleştirildi! 🎉', {
        body: 'Web bildirimleri başarıyla kuruldu. Koçluk seansı bildirimleri alacaksınız.',
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0VjVDMTcuMyA2IDE5LjggOC43IDE5LjggMTJWMTZMMjEgMTdIMTNIMTFIM1YxNkM0LjIgMTYgNS4yIDE1IDUuMiAxM1Y5QzUuMiA2LjggNy4yIDUgOS40IDVWNEMxMCAyLjkgMTAuOSAyIDEyIDJaTTEyIDIxQzEzLjEgMjEgMTQgMjAuMSAxNCAxOUgxMEMxMCAyMC4xIDEwLjkgMjEgMTIgMjFaIiBmaWxsPSIjNDI4NUY0Ii8+Cjwvc3ZnPgo='
      });
    }

    return {
      success: true,
      subscription: undefined // Will be a real subscription once VAPID keys are configured
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

    // Remove from database only - don't touch browser push manager
    // This preserves browser notification permissions for real-time notifications
    const supabase = createClient();
    const { error } = await supabase
      .from('web_push_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('❌ [WEB-PUSH] Failed to remove subscription from database:', error);
      return false;
    }

    console.log('✅ [WEB-PUSH] Subscription removed from database (browser permissions preserved)');
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

    // For now, just return false since we're in placeholder mode
    // This will be updated when proper VAPID keys are configured
    return false;

  } catch (error) {
    console.error('❌ [WEB-PUSH] Failed to check subscription status:', error);
    return false;
  }
};

// Utility function to convert VAPID key (for future use)
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