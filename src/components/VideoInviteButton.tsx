'use client';

import React, { useState } from 'react';
import { sendVideoInvite } from '@/lib/notifications';

interface VideoInviteButtonProps {
  toUserId: string;
  toUserName: string;
  className?: string;
  disabled?: boolean;
}

export default function VideoInviteButton({ 
  toUserId, 
  toUserName, 
  className = '', 
  disabled = false 
}: VideoInviteButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleSendInvite = async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);
    setLastResult(null);

    try {
      const result = await sendVideoInvite(toUserId, message.trim() || undefined);

      if (result.success) {
        setLastResult(`✅ Video daveti ${toUserName} adlı kişiye gönderildi!`);
        setMessage('');
        setShowMessageInput(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setLastResult(null), 3000);
      } else {
        setLastResult(`❌ Hata: ${result.error}`);
      }
    } catch (error) {
      setLastResult(`❌ Beklenmeyen hata: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMessage = () => {
    setShowMessageInput(!showMessageInput);
    if (!showMessageInput) {
      setMessage('');
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Button */}
      <div className="flex items-center space-x-2">
        <button
          onClick={showMessageInput ? handleSendInvite : handleToggleMessage}
          disabled={disabled || isLoading}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all
            ${disabled || isLoading 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
            }
          `}
        >
          <span className="text-lg">📹</span>
          <span>
            {isLoading 
              ? 'Gönderiliyor...' 
              : showMessageInput 
                ? 'Daveti Gönder'
                : 'Video Görüşme Daveti'
            }
          </span>
        </button>

        {showMessageInput && (
          <button
            onClick={handleToggleMessage}
            disabled={isLoading}
            className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Message Input */}
      {showMessageInput && (
        <div className="space-y-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`${toUserName} adlı kişiye özel mesaj (isteğe bağlı)...`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            maxLength={200}
            disabled={isLoading}
          />
          <div className="text-xs text-gray-500 text-right">
            {message.length}/200
          </div>
        </div>
      )}

      {/* Status Message */}
      {lastResult && (
        <div className={`
          p-3 rounded-lg text-sm font-medium
          ${lastResult.startsWith('✅') 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
          }
        `}>
          {lastResult}
        </div>
      )}

      {/* Info Text */}
      <div className="text-xs text-gray-500">
        💡 Bildirim sadece mobil uygulamada alınacaktır
      </div>
    </div>
  );
}
