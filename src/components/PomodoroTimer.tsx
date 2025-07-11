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

  // Enhanced audio notification using Web Audio API
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a pleasant 3-tone notification sound
      const playTone = (frequency: number, duration: number, delay: number) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + duration);
        }, delay);
      };
      
      // Three-tone sequence: C5, E5, G5
      playTone(523.25, 0.2, 0);    // C5
      playTone(659.25, 0.2, 150);  // E5  
      playTone(783.99, 0.3, 300);  // G5
      
    } catch (error) {
      console.log('Audio notification not available:', error);
    }
  };

  // Enhanced in-app notification with visual popup
  const showInAppNotification = (title: string, message: string) => {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm animate-pulse';
    notification.style.animation = 'slideInRight 0.3s ease-out';
    notification.innerHTML = `
      <div class="flex items-start">
        <div class="flex-1">
          <h4 class="font-semibold text-sm">${title}</h4>
          <p class="text-sm mt-1 opacity-90">${message}</p>
        </div>
        <button class="ml-2 text-white hover:text-gray-200 font-bold text-lg" onclick="this.parentElement.parentElement.remove()">
          ×
        </button>
      </div>
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  };

  // Enhanced browser notification - works regardless of focus
  const showBrowserNotification = (title: string, message: string) => {
    if (!notificationsEnabled) return;

    try {
      const notification = new Notification(title, {
        body: message,
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiM0Mjg1RjQiLz4KPHN2ZyB4PSIxNiIgeT0iMTYiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHN0eWxlPi50aW1lci1mYWNle2ZpbGw6I2ZmZjt9PC9zdHlsZT4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGNsYXNzPSJ0aW1lci1mYWNlIi8+CjxwYXRoIGQ9Im0xMiA2djZsNCAyIiBzdHJva2U9IiM0Mjg1RjQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPgo8L3N2Zz4K',
        tag: 'pomodoro-timer',
        requireInteraction: true,
        silent: false
      });

      notification.onclick = function(event) {
        window.focus();
        this.close();
      };

      // Auto-close after 10 seconds to prevent notification buildup
      setTimeout(() => {
        notification.close();
      }, 10000);

    } catch (error) {
      console.log('Browser notification failed:', error);
    }
  };

  // Comprehensive notification system
  const showNotification = (message: string) => {
    const title = isBreak ? '☕ Mola Zamanı!' : '🎯 Çalışma Zamanı!';
    
    // 1. Always play audio alert
    playNotificationSound();
    
    // 2. Always show in-app notification
    showInAppNotification(title, message);
    
    // 3. Show browser notification (works regardless of focus)
    showBrowserNotification(title, message);
    
    // 4. Call the onTimerComplete callback
    onTimerComplete?.();
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
        showNotification('Çalışma süresi bitti! Mola zamanı 🎉');
        setTimeLeft(breakDuration * 60);
        setIsBreak(true);
      } else {
        // Break completed
        showNotification('Mola bitti! Çalışmaya devam 💪');
        setTimeLeft(workDuration * 60);
        setIsBreak(false);
      }
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isBreak, workDuration, breakDuration]);

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