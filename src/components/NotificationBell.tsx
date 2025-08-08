'use client'

import React, { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface NotificationBellProps {
  className?: string;
  size?: number;
}

export function NotificationBell({ className = '', size = 20 }: NotificationBellProps) {
  const [user, setUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch count on mount and when user changes
  useEffect(() => {
    fetchUnreadCount();
  }, [user]);

  // Poll for updates every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Listen for new messages from Stream Chat
  useEffect(() => {
    const handleNewMessage = () => {
      // Refresh count when new messages arrive
      fetchUnreadCount();
    };

    // Listen for custom events from Stream Chat
    window.addEventListener('stream-chat-new-message', handleNewMessage);
    
    return () => {
      window.removeEventListener('stream-chat-new-message', handleNewMessage);
    };
  }, []);

  if (!user) return null;

  const BellIcon = unreadCount > 0 ? BellRing : Bell;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <BellIcon 
        size={size} 
        className={`transition-colors ${
          unreadCount > 0 
            ? 'text-blue-600 animate-pulse' 
            : 'text-gray-500 hover:text-gray-700'
        }`}
      />
      
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium min-w-[20px] animate-bounce">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      
      {isLoading && (
        <div className="absolute -top-1 -right-1 w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      )}
    </div>
  );
}

export default NotificationBell;
