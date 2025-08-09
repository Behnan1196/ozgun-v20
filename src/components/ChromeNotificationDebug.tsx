'use client'

import React, { useState } from 'react';
import { debugChromeNotifications, clearChromeNotificationCache, initializeWebPushNotifications } from '@/lib/notifications';

interface ChromeNotificationDebugProps {
  userId: string;
  className?: string;
}

interface DebugInfo {
  permission?: string;
  serviceWorkerSupport?: boolean;
  notificationSupport?: boolean;
  userAgent?: string;
  isChrome?: boolean;
  timestamp?: string;
  serviceWorkers?: Array<{
    scope: string;
    state?: string;
    scriptURL?: string;
  }>;
  serviceWorkerError?: string;
  serverInfo?: any;
}

export function ChromeNotificationDebug({ userId, className = '' }: ChromeNotificationDebugProps) {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDebug = async () => {
    setLoading(true);
    try {
      const info = await debugChromeNotifications();
      setDebugInfo(info);
      
      // Also fetch server-side debug info
      const response = await fetch('/api/notifications/debug-chrome');
      const serverInfo = await response.json();
      
      setDebugInfo((prev: DebugInfo | null) => ({
        ...prev,
        serverInfo: serverInfo.data
      }));
    } catch (error) {
      console.error('Debug error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    setLoading(true);
    try {
      await clearChromeNotificationCache();
      
      // Clear server tokens
      await fetch('/api/notifications/debug-chrome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh_token', userId })
      });
      
      alert('Cache cleared! Please refresh the page and re-grant notification permissions.');
    } catch (error) {
      console.error('Clear cache error:', error);
      alert('Error clearing cache: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  const handleReinitialize = async () => {
    setLoading(true);
    try {
      await initializeWebPushNotifications(userId);
      alert('Notifications re-initialized successfully!');
    } catch (error) {
      console.error('Re-initialize error:', error);
      alert('Error re-initializing: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="text-yellow-600">🔧</div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Chrome Notification Debug
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            If Chrome notifications aren't working, use these tools to diagnose and fix the issue.
          </p>
          
          <div className="mt-3 space-x-2">
            <button
              onClick={handleDebug}
              disabled={loading}
              className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:opacity-50"
            >
              {loading ? 'Debugging...' : 'Debug Status'}
            </button>
            
            <button
              onClick={handleClearCache}
              disabled={loading}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
            >
              Clear Cache
            </button>
            
            <button
              onClick={handleReinitialize}
              disabled={loading}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Re-initialize
            </button>
          </div>
          
          {debugInfo && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
              <h4 className="font-medium mb-2">Debug Information:</h4>
              <pre className="whitespace-pre-wrap overflow-auto max-h-64">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
