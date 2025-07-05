# 🔔 Push Notifications Setup Guide

## Overview
This guide will help you add push notifications to your coaching mobile app, allowing students to receive notifications when the app is closed or in background.

## ✅ What You'll Get
- **Chat notifications**: New messages from coaches
- **Assignment notifications**: New tasks and deadlines  
- **Background processing**: App can respond even when closed
- **Deep linking**: Notifications can open specific screens
- **Rich notifications**: Images, custom sounds, action buttons

---

## 📦 Step 1: Install Required Packages

```bash
npx expo install expo-notifications expo-device expo-constants expo-task-manager
```

## 🛠️ Step 2: Database Schema Updates

Add push token fields to your profiles table:

```sql
-- Add to your Supabase database
ALTER TABLE profiles 
ADD COLUMN push_token TEXT,
ADD COLUMN push_token_updated_at TIMESTAMPTZ;

-- Create index for faster queries
CREATE INDEX idx_profiles_push_token ON profiles(push_token);
```

## 📱 Step 3: Initialize Notifications in App.tsx

```typescript
// src/App.tsx
import { useEffect } from 'react'
import NotificationService from './services/NotificationService'

export default function App() {
  useEffect(() => {
    let cleanupListeners: (() => void) | undefined

    const initializeNotifications = async () => {
      // Initialize notification service
      await NotificationService.initialize()
      
      // Setup listeners for handling notifications
      cleanupListeners = NotificationService.setupListeners()
    }

    initializeNotifications()

    // Cleanup on unmount
    return () => {
      if (cleanupListeners) {
        cleanupListeners()
      }
    }
  }, [])

  // ... rest of your app
}
```

## 🔧 Step 4: Integrate with AuthContext

```typescript
// src/contexts/AuthContext.tsx
import NotificationService from '../services/NotificationService'

// Add to your signIn function:
const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    
    // Initialize notifications after successful login
    await NotificationService.initialize()
    
    return { user: data.user, error: null }
  } catch (error) {
    return { user: null, error }
  }
}

// Add to your signOut function:
const signOut = async () => {
  try {
    // Clear notifications on logout
    await NotificationService.clearBadge()
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Error signing out:', error)
  }
}
```

## 🎯 Step 5: Add Test Button (Development)

Add to your HomeScreen for testing:

```typescript
// src/screens/HomeScreen.tsx
import NotificationService from '../services/NotificationService'

// Add this button for testing
<TouchableOpacity
  style={styles.testButton}
  onPress={() => NotificationService.sendTestNotification()}
>
  <Text style={styles.buttonText}>Test Notification</Text>
</TouchableOpacity>
```

## 🌐 Step 6: Backend Integration

### Option A: Use Expo Push API
```typescript
// Your backend (Node.js/Python/etc.)
async function sendNotificationToStudent(studentId: string, message: any) {
  // Get student's push token from database
  const student = await getStudentProfile(studentId)
  
  if (!student.push_token) return
  
  const notification = {
    to: student.push_token,
    sound: 'default',
    title: 'New Message from Coach',
    body: message.text,
    data: {
      type: 'chat',
      messageId: message.id,
      channelId: message.channel_id
    }
  }
  
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(notification)
  })
}
```

### Option B: Integrate with Stream.io
```typescript
// Stream.io webhook or event handler
streamClient.on('message.new', async (event) => {
  if (event.user.id !== studentId) { // Don't notify the sender
    await sendNotificationToStudent(studentId, event.message)
  }
})
```

## 📨 Step 7: Enhanced Chat Integration

Update your ChatScreen to handle notification navigation:

```typescript
// src/screens/ChatScreen.tsx
import { useEffect } from 'react'
import * as Notifications from 'expo-notifications'

export default function ChatScreen() {
  useEffect(() => {
    // Handle notification that opened the app
    const checkInitialNotification = async () => {
      const response = await Notifications.getLastNotificationResponseAsync()
      
      if (response?.notification.request.content.data?.type === 'chat') {
        const channelId = response.notification.request.content.data.channelId
        // Navigate to specific channel
        console.log('Open channel from notification:', channelId)
      }
    }
    
    checkInitialNotification()
  }, [])
  
  // ... rest of component
}
```

## 🚀 Step 8: Testing on Physical Device

1. **Build for device**:
   ```bash
   npx expo run:android
   # or
   npx expo run:ios
   ```

2. **Test flow**:
   - Login to app
   - Press "Test Notification" button  
   - Close/background the app
   - Notification should appear in 2 seconds
   - Tap notification to open app

3. **Test with chat**:
   - Send message from web app (coach)
   - Student should receive notification
   - Tap notification to open chat

## 🔒 Production Considerations

### Security
- Store push tokens securely
- Validate notification payloads
- Rate limit notifications per user

### User Experience  
- Request permissions at appropriate time
- Allow users to customize notification types
- Respect Do Not Disturb settings

### Performance
- Batch notifications when possible
- Use background tasks efficiently
- Clean up expired tokens

## 🐛 Common Issues & Solutions

### Issue: Notifications not received
- ✅ Check if app is on physical device (not simulator)
- ✅ Verify push token is saved in database
- ✅ Check notification permissions are granted
- ✅ Verify app.json configuration is correct

### Issue: Background task not running
- ✅ Ensure UIBackgroundModes is set in app.json
- ✅ Check if task is registered before app closes
- ✅ iOS may throttle background execution

### Issue: Token changes unexpectedly
- ✅ Use addPushTokenListener to handle token updates
- ✅ Store new tokens immediately in database

## 📊 Notification Analytics

Track notification effectiveness:

```typescript
// Add to NotificationService
static async trackNotificationOpen(notificationId: string) {
  await supabase.from('notification_analytics').insert({
    notification_id: notificationId,
    action: 'opened',
    timestamp: new Date().toISOString()
  })
}
```

---

## 🎉 Ready to Go!

After following this guide, your students will receive:
- ✅ Real-time chat notifications when app is closed
- ✅ Assignment and deadline reminders  
- ✅ Direct navigation to relevant content
- ✅ Proper badge counts and sound alerts

The notification system integrates seamlessly with your existing Supabase database and Stream.io chat functionality! 