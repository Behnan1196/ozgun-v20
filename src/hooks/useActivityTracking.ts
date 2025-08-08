import { useEffect, useRef, useCallback } from 'react';

interface UseActivityTrackingProps {
  channelId: string | null;
  isEnabled: boolean;
}

export function useActivityTracking({ channelId, isEnabled }: UseActivityTrackingProps) {
  const isActiveRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateActivity = useCallback(async (isActive: boolean) => {
    if (!channelId || !isEnabled) return;

    try {
      await fetch('/api/notifications/user-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId,
          isActive,
          platform: 'web'
        }),
      });

      console.log(`🔄 Activity tracking: ${isActive ? 'started' : 'stopped'} for channel ${channelId}`);
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  }, [channelId, isEnabled]);

  const startActivity = useCallback(() => {
    if (!isActiveRef.current) {
      isActiveRef.current = true;
      updateActivity(true);
    }
  }, [updateActivity]);

  const stopActivity = useCallback(() => {
    if (isActiveRef.current) {
      isActiveRef.current = false;
      updateActivity(false);
    }
  }, [updateActivity]);

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Stop activity after 30 seconds of inactivity
    timeoutRef.current = setTimeout(() => {
      stopActivity();
    }, 30000);
  }, [stopActivity]);

  // Track page visibility
  useEffect(() => {
    if (!channelId || !isEnabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopActivity();
      } else {
        startActivity();
        resetTimeout();
      }
    };

    const handleFocus = () => {
      startActivity();
      resetTimeout();
    };

    const handleBlur = () => {
      stopActivity();
    };

    const handleActivity = () => {
      if (!document.hidden) {
        startActivity();
        resetTimeout();
      }
    };

    // Start tracking when component mounts
    if (!document.hidden) {
      startActivity();
      resetTimeout();
    }

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    // Track user interactions
    document.addEventListener('mousedown', handleActivity);
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('scroll', handleActivity);
    document.addEventListener('touchstart', handleActivity);

    return () => {
      // Cleanup
      stopActivity();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Remove event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('mousedown', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('scroll', handleActivity);
      document.removeEventListener('touchstart', handleActivity);
    };
  }, [channelId, isEnabled, startActivity, stopActivity, resetTimeout]);

  // Stop activity when channel changes
  useEffect(() => {
    return () => {
      if (isActiveRef.current) {
        stopActivity();
      }
    };
  }, [channelId, stopActivity]);

  return {
    startActivity,
    stopActivity,
    isActive: isActiveRef.current
  };
}
