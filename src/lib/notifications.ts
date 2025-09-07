/**
 * Web Notification System - DISABLED
 * 
 * This module is intentionally disabled to prevent conflicts with the mobile-first
 * notification system. All web push functionality is commented out to ensure
 * notifications only work on mobile platforms (iOS/Android).
 */

console.log('⚠️ Web notifications are disabled - Mobile-only notification system active');

// Disabled Firebase configuration
/*
import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { initializeApp, getApps } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyA1QKxp-zDa8S2OOsnptmiJRC-wCKRkZp8",
  authDomain: "coaching-mobile-7e0c3.firebaseapp.com",
  projectId: "coaching-mobile-7e0c3",
  storageBucket: "coaching-mobile-7e0c3.firebasestorage.app",
  messagingSenderId: "563892471445",
  appId: "1:563892471445:web:57e247e17023557635fd9c"
};

const VAPID_KEY = "BJU08P6HHEDgs0Phs9p4drSS0EOOmTewCTuy6qFTWTt0bXwP0JWyTXA9OEYEKdohc3x0qOeRex5CfprosQW96TA";

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
let messaging: any = null;

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.error('Error initializing Firebase messaging:', error);
  }
}
*/

export interface WebPushToken {
  token: string;
  userId: string;
  platform: 'web';
  browser?: string;
}

/**
 * Request notification permission - DISABLED
 */
export async function requestNotificationPermission(): Promise<string | null> {
  console.log('🚫 Web notification permission request blocked - Mobile-only system');
  return null;
}

/**
 * Save web push token - DISABLED
 */
export async function saveWebPushToken(userId: string, token: string): Promise<boolean> {
  console.log('🚫 Web push token registration blocked - Mobile-only system');
  return false;
}

/**
 * Setup message listener - DISABLED
 */
export function setupMessageListener(onMessageReceived?: (payload: any) => void) {
  console.log('🚫 Web message listener blocked - Mobile-only system');
  return null;
}

/**
 * Show browser notification - DISABLED
 */
export function showNotification(title: string, body: string, data?: any) {
  console.log('🚫 Web notification display blocked - Mobile-only system');
  console.log('📱 Use mobile app to receive notifications:', { title, body, data });
  return null;
}

/**
 * Initialize web push notifications - DISABLED
 */
export async function initializeWebPushNotifications(userId: string): Promise<void> {
  console.log('🚫 Web push notifications disabled - Mobile-only system');
  console.log('📱 Please use the mobile app to receive video call invites and chat notifications');
}

/**
 * Video invite functions for web interface
 */
export async function sendVideoInvite(
  toUserId: string, 
  message?: string
): Promise<{ success: boolean; error?: string; inviteId?: string }> {
  try {
    const response = await fetch('/api/notifications/video-invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        toUserId,
        message,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Error sending video invite:', result);
      return { success: false, error: result.error || 'Failed to send video invite' };
    }

    console.log('✅ Video invite sent successfully (notification sent to mobile):', result);
    return { 
      success: true, 
      inviteId: result.inviteId,
    };
  } catch (error) {
    console.error('❌ Error sending video invite:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Get pending video invites
 */
export async function getPendingVideoInvites(): Promise<{
  success: boolean;
  receivedInvites: any[];
  sentInvites: any[];
  error?: string;
}> {
  try {
    const response = await fetch('/api/notifications/video-invite', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Error fetching video invites:', result);
      return { 
        success: false, 
        receivedInvites: [], 
        sentInvites: [], 
        error: result.error || 'Failed to fetch video invites' 
      };
    }

    return {
      success: true,
      receivedInvites: result.receivedInvites || [],
      sentInvites: result.sentInvites || [],
    };
  } catch (error) {
    console.error('❌ Error fetching video invites:', error);
    return {
      success: false,
      receivedInvites: [],
      sentInvites: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Check if notifications are supported - ALWAYS FALSE for web
 */
export function isNotificationSupported(): boolean {
  return false; // Web notifications disabled
}

/**
 * Get current notification permission status - ALWAYS DENIED for web
 */
export function getNotificationPermission(): NotificationPermission {
  return 'denied'; // Web notifications disabled
}
