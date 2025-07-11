import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, Bell, Settings } from 'lucide-react';

interface PomodoroTimerProps {
  onTimerComplete?: () => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ onTimerComplete }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);

  useEffect(() => {
    // Check if notifications are already permitted
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true);
      }
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
      }
    }
  };

  const playNotificationSound = () => {
    try {
      // Create a simple notification sound using Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio notification not available:', error);
    }
  };

  const showInAppNotification = (title: string, message: string) => {
    // Create a temporary in-app notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm';
    notification.innerHTML = `
      <div class="flex items-center">
        <div class="mr-3">🎯</div>
        <div>
          <div class="font-semibold">${title}</div>
          <div class="text-sm opacity-90">${message}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  };

  const showNotification = (title: string, message: string) => {
    // Always play sound
    playNotificationSound();
    
    // Always show in-app notification
    showInAppNotification(title, message);
    
    // Show browser notification if permission granted
    if (notificationsEnabled) {
      try {
        const notification = new Notification(title, {
          body: message,
          icon: '/icons/icon-192x192.png',
          tag: 'pomodoro-timer',
          requireInteraction: true
        });
        
        // Auto close after 10 seconds
        setTimeout(() => notification.close(), 10000);
      } catch (error) {
        console.log('Browser notification failed:', error);
      }
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      if (!isBreak) {
        // Work session completed
        showNotification('Pomodoro Tamamlandı! 🎉', 'Çalışma süresi bitti! Mola zamanı.');
        setTimeLeft(breakDuration * 60);
        setIsBreak(true);
      } else {
        // Break completed
        showNotification('Mola Bitti! 💪', 'Mola süresi bitti! Çalışmaya devam edin.');
        setTimeLeft(workDuration * 60);
        setIsBreak(false);
      }
      onTimerComplete?.();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isBreak, onTimerComplete, notificationsEnabled, workDuration, breakDuration]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(isBreak ? breakDuration * 60 : workDuration * 60);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const applySettings = () => {
    setTimeLeft(isBreak ? breakDuration * 60 : workDuration * 60);
    setShowSettings(false);
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-3">
          <div className="flex items-center">
            {isBreak ? (
              <Coffee className="h-5 w-5 text-green-600 mr-2" />
            ) : (
              <div className="h-5 w-5 text-blue-600 mr-2">🎯</div>
            )}
            <span className="text-sm font-medium text-gray-700">
              {isBreak ? 'Mola Zamanı' : 'Çalışma Zamanı'}
            </span>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-full hover:bg-gray-100"
            title="Ayarlar"
          >
            <Settings className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        {showSettings ? (
          <div className="w-full mb-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Çalışma Süresi (dakika)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={workDuration}
                onChange={(e) => setWorkDuration(Math.min(60, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mola Süresi (dakika)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={breakDuration}
                onChange={(e) => setBreakDuration(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={applySettings}
              className="w-full bg-blue-600 text-white py-1.5 rounded-md text-sm hover:bg-blue-700 transition-colors"
            >
              Ayarları Kaydet
            </button>
          </div>
        ) : (
          <>
            <div className="text-3xl font-bold text-gray-900 mb-4">
              {formatTime(timeLeft)}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={toggleTimer}
                className={`p-2 rounded-full ${
                  isRunning
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                }`}
              >
                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                onClick={resetTimer}
                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              {!notificationsEnabled && (
                <button
                  onClick={requestNotificationPermission}
                  className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                  title="Bildirimleri Etkinleştir"
                >
                  <Bell className="h-4 w-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PomodoroTimer; 