'use client';

import React, { useState, useEffect } from 'react';
import { 
  isNotificationSupported, 
  getNotificationPermission,
  sendTestWebNotification 
} from '@/lib/notifications';

interface NotificationToken {
  id: string;
  token: string;
  token_type: string;
  platform: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface NotificationLog {
  id: string;
  notification_type: string;
  title: string;
  body: string;
  status: string;
  created_at: string;
  error_message?: string;
}

export function NotificationManager() {
  const [tokens, setTokens] = useState<NotificationToken[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(isNotificationSupported());
    setPermission(getNotificationPermission());
    loadNotificationData();
  }, []);

  const loadNotificationData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/test');
      const data = await response.json();
      
      if (data.success) {
        setTokens(data.tokens || []);
        setLogs(data.recentLogs || []);
      }
    } catch (error) {
      console.error('Error loading notification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Test notification sent to ${result.successCount}/${result.tokenCount} devices`);
      } else {
        alert(`⚠️ ${result.message}`);
      }
      
      // Reload data to see the results
      await loadNotificationData();
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('❌ Failed to send test notification');
    } finally {
      setLoading(false);
    }
  };

  const requestPermission = async () => {
    if ('Notification' in window) {
      const newPermission = await Notification.requestPermission();
      setPermission(newPermission);
      
      if (newPermission === 'granted') {
        // Reload the page to reinitialize notifications
        window.location.reload();
      }
    }
  };

  if (!supported) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">🚫 Notifications Not Supported</h3>
        <p className="text-yellow-700 text-sm">
          Your browser doesn't support push notifications or service workers are not available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Permission Status */}
      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold mb-3">🔔 Notification Permission</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`inline-block w-3 h-3 rounded-full ${
              permission === 'granted' ? 'bg-green-500' : 
              permission === 'denied' ? 'bg-red-500' : 'bg-yellow-500'
            }`}></span>
            <span className="capitalize">{permission}</span>
          </div>
          
          {permission !== 'granted' && (
            <button
              onClick={requestPermission}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Request Permission
            </button>
          )}
        </div>
        
        {permission === 'denied' && (
          <p className="text-sm text-red-600 mt-2">
            Notifications are blocked. Please enable them in your browser settings.
          </p>
        )}
      </div>

      {/* Active Tokens */}
      <div className="p-4 border rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">📱 Active Notification Tokens</h3>
          <button
            onClick={loadNotificationData}
            disabled={loading}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
        {tokens.length === 0 ? (
          <p className="text-gray-500 text-sm">No active notification tokens found.</p>
        ) : (
          <div className="space-y-2">
            {tokens.map((token) => (
              <div key={token.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium capitalize">{token.platform}</span>
                  <span className="ml-2 text-sm text-gray-600">({token.token_type})</span>
                  {!token.is_active && (
                    <span className="ml-2 text-xs text-red-600">Inactive</span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(token.updated_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test Notification */}
      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold mb-3">🧪 Test Notifications</h3>
        <p className="text-sm text-gray-600 mb-3">
          Send a test notification to all your registered devices to verify the setup is working.
        </p>
        <button
          onClick={sendTestNotification}
          disabled={loading || tokens.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send Test Notification'}
        </button>
      </div>

      {/* Recent Notification Logs */}
      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold mb-3">📋 Recent Notifications</h3>
        
        {logs.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent notifications.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="p-2 bg-gray-50 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{log.title}</span>
                    <span className={`ml-2 text-xs px-2 py-1 rounded ${
                      log.status === 'sent' ? 'bg-green-100 text-green-800' :
                      log.status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                      log.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{log.body}</p>
                {log.error_message && (
                  <p className="text-xs text-red-600 mt-1">Error: {log.error_message}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
