'use client';

import React, { useState } from 'react';

export function NotificationTestButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const sendTestNotification = async () => {
    try {
      setLoading(true);
      setResult(null);

      const response = await fetch('/api/notifications/test', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult(`✅ Success: ${data.message}`);
      } else {
        setResult(`⚠️ Warning: ${data.message}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white border border-gray-300 rounded-lg shadow-lg max-w-sm">
      <h3 className="font-semibold text-sm mb-2">🧪 Notification Test</h3>
      
      <button
        onClick={sendTestNotification}
        disabled={loading}
        className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-2"
      >
        {loading ? 'Sending...' : 'Send Test Notification'}
      </button>
      
      {result && (
        <div className="text-xs p-2 bg-gray-50 rounded border">
          {result}
        </div>
      )}
    </div>
  );
}
