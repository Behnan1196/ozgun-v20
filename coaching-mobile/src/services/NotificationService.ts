import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK'

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

// Define the background task to handle notifications when app is closed/backgrounded
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  console.log('Received background notification:', data)
  
  if (error) {
    console.error('Background notification error:', error)
    return Promise.resolve()
  }

  // Handle different types of notifications
  if (data && typeof data === 'object' && 'notification' in data) {
    const notificationData = (data as any).notification?.request?.content?.data
    
    if (notificationData?.type === 'chat') {
      console.log('New chat message from coach:', notificationData.message)
    }
    
    if (notificationData?.type === 'assignment') {
      console.log('New assignment notification:', notificationData.assignment)
    }
  }
  
  return Promise.resolve()
})

export class NotificationService {
  private static expoPushToken: string | null = null
  private static isInitialized = false

  // Initialize notification service
  static async initialize() {
    if (this.isInitialized) return

    try {
      // For Expo Go - skip background task registration (not supported)
      // Only register if using development build or production
      try {
        await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK)
        console.log('✅ Background tasks registered')
      } catch (bgError) {
        console.log('⚠️ Background tasks not available (Expo Go limitation)')
      }
      
      // Request permissions and get token
      await this.requestPermissions()
      
      // Set up notification channels for Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels()
      }
      
      this.isInitialized = true
      console.log('✅ Notification service initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error)
    }
  }

  // Request notification permissions
  static async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('⚠️ Push notifications require a physical device')
      return false
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      if (finalStatus !== 'granted') {
        console.warn('❌ Push notification permission not granted')
        return false
      }

      console.log('✅ Notification permissions granted')

      // Get and store push token
      const token = await this.getExpoPushToken()
      if (token) {
        await this.storePushToken(token)
      }

      return true
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error)
      return false
    }
  }

  // Get Expo push token
  static async getExpoPushToken(): Promise<string | null> {
    if (this.expoPushToken) {
      return this.expoPushToken
    }

    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? 
                      Constants?.easConfig?.projectId

      if (!projectId) {
        console.log('⚠️ Project ID not found - push tokens not available in Expo Go')
        return null
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId })
      this.expoPushToken = tokenData.data
      
      console.log('📱 Expo push token generated:', this.expoPushToken?.substring(0, 20) + '...')
      return this.expoPushToken
    } catch (error) {
      console.log('⚠️ Push tokens not available in Expo Go - use development build for full functionality')
      return null
    }
  }

  // Store push token in database
  static async storePushToken(token: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.warn('⚠️ No authenticated user to store push token')
        return
      }

      // Store token in user profile
      const { error } = await supabase
        .from('profiles')
        .update({ 
          push_token: token,
          push_token_updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('❌ Error storing push token:', error)
      } else {
        console.log('✅ Push token stored successfully')
      }
    } catch (error) {
      console.error('❌ Error storing push token:', error)
    }
  }

  // Setup Android notification channels
  static async setupAndroidChannels() {
    try {
      // Chat messages channel
      await Notifications.setNotificationChannelAsync('chat', {
        name: 'Chat Messages',
        description: 'Messages from your coach',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
        sound: 'default',
      })

      // General notifications channel
      await Notifications.setNotificationChannelAsync('general', {
        name: 'General Notifications',
        description: 'General app notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
      })

      console.log('📱 Android notification channels created')
    } catch (error) {
      console.error('❌ Error setting up Android channels:', error)
    }
  }

  // Send test notification (for development)
  static async sendTestNotification() {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification 📚',
          body: 'Your coaching app notifications are working perfectly!',
          data: { 
            type: 'test',
            timestamp: Date.now()
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2,
        },
      })
      
      console.log('🔔 Test notification scheduled for 2 seconds')
    } catch (error) {
      console.error('❌ Error sending test notification:', error)
    }
  }

  // Set up notification listeners
  static setupListeners() {
    // Listen for notifications received while app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('🔔 Received notification in foreground:', notification.request.content.title)
      }
    )

    // Listen for user interactions with notifications
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 User tapped notification:', response.notification.request.content.title)
        
        const data = response.notification.request.content.data
        
        // Handle navigation based on notification type
        if (data?.type === 'chat') {
          console.log('🗨️ Navigate to chat for message:', data.messageId)
        }
      }
    )

    // Listen for push token changes
    const tokenListener = Notifications.addPushTokenListener((token) => {
      console.log('🔄 Push token changed:', token.data?.substring(0, 20) + '...')
      this.expoPushToken = token.data
      this.storePushToken(token.data)
    })

    // Return cleanup function
    return () => {
      notificationListener.remove()
      responseListener.remove()
      tokenListener.remove()
    }
  }

  // Clear notification badge
  static async clearBadge() {
    try {
      await Notifications.setBadgeCountAsync(0)
    } catch (error) {
      console.error('❌ Error clearing badge:', error)
    }
  }

  // Get current notification status
  static async getNotificationStatus() {
    try {
      const permissions = await Notifications.getPermissionsAsync()
      const token = await this.getExpoPushToken()
      
      return {
        granted: permissions.status === 'granted',
        token: token,
        isDevice: Device.isDevice,
      }
    } catch (error) {
      console.error('❌ Error getting notification status:', error)
      return null
    }
  }
}

export default NotificationService 