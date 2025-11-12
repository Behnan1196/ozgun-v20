import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from 'expo-server-sdk'

// Create Expo SDK client
const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN, // Optional: for higher rate limits
  useFcmV1: false // Use legacy FCM for compatibility
})

export interface ExpoNotificationData {
  title: string
  body: string
  data?: Record<string, any>
  sound?: 'default' | null
  badge?: number
  priority?: 'default' | 'normal' | 'high'
  channelId?: string
}

/**
 * Send push notifications via Expo Push API
 */
export async function sendExpoPushNotifications(
  tokens: string[],
  notification: ExpoNotificationData
): Promise<{
  success: boolean
  successCount: number
  failureCount: number
  tickets: ExpoPushTicket[]
  errors: string[]
}> {
  try {
    // Validate tokens
    const validTokens = tokens.filter(token => Expo.isExpoPushToken(token))
    const invalidTokens = tokens.filter(token => !Expo.isExpoPushToken(token))
    
    if (invalidTokens.length > 0) {
      console.log('⚠️ Invalid Expo push tokens found:', invalidTokens.length)
    }

    if (validTokens.length === 0) {
      return {
        success: false,
        successCount: 0,
        failureCount: tokens.length,
        tickets: [],
        errors: ['No valid Expo push tokens found']
      }
    }

    // Prepare messages
    const messages: ExpoPushMessage[] = validTokens.map(token => ({
      to: token,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      sound: notification.sound || 'default',
      badge: notification.badge,
      priority: notification.priority || 'high',
      channelId: notification.channelId || 'default'
    }))

    console.log(`📱 Sending ${messages.length} Expo push notifications`)

    // Send notifications in chunks (Expo recommends max 100 per request)
    const chunks = expo.chunkPushNotifications(messages)
    const allTickets: ExpoPushTicket[] = []
    const errors: string[] = []

    for (const chunk of chunks) {
      try {
        const tickets = await expo.sendPushNotificationsAsync(chunk)
        allTickets.push(...tickets)
        console.log(`✅ Sent chunk of ${chunk.length} notifications`)
      } catch (error) {
        console.error('❌ Error sending chunk:', error)
        errors.push(`Chunk error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // Count successes and failures
    let successCount = 0
    let failureCount = 0

    allTickets.forEach((ticket, index) => {
      if (ticket.status === 'ok') {
        successCount++
      } else {
        failureCount++
        console.error(`❌ Notification ${index} failed:`, ticket.message)
        if (ticket.message) {
          errors.push(ticket.message)
        }
      }
    })

    // Add invalid token count to failures
    failureCount += invalidTokens.length

    console.log(`📊 Expo Push Results: ${successCount} success, ${failureCount} failures`)

    return {
      success: successCount > 0,
      successCount,
      failureCount,
      tickets: allTickets,
      errors
    }

  } catch (error) {
    console.error('❌ Error in sendExpoPushNotifications:', error)
    return {
      success: false,
      successCount: 0,
      failureCount: tokens.length,
      tickets: [],
      errors: [error instanceof Error ? error.message : String(error)]
    }
  }
}

/**
 * Check delivery receipts for sent notifications
 */
export async function checkExpoDeliveryReceipts(
  receiptIds: string[]
): Promise<{
  success: boolean
  receipts: ExpoPushReceipt[]
  errors: string[]
}> {
  try {
    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds)
    const allReceipts: ExpoPushReceipt[] = []
    const errors: string[] = []

    for (const chunk of receiptIdChunks) {
      try {
        const receipts = await expo.getPushNotificationReceiptsAsync(chunk)
        
        // Convert receipts object to array
        Object.entries(receipts).forEach(([id, receipt]) => {
          allReceipts.push(receipt)
          
          if (receipt.status === 'error') {
            console.error(`❌ Receipt error for ${id}:`, receipt.message)
            if (receipt.message) {
              errors.push(`${id}: ${receipt.message}`)
            }
          }
        })
      } catch (error) {
        console.error('❌ Error getting receipts:', error)
        errors.push(`Receipt error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    return {
      success: errors.length === 0,
      receipts: allReceipts,
      errors
    }
  } catch (error) {
    console.error('❌ Error in checkExpoDeliveryReceipts:', error)
    return {
      success: false,
      receipts: [],
      errors: [error instanceof Error ? error.message : String(error)]
    }
  }
}

export default expo