import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import admin from 'firebase-admin'

// POST /api/notifications/test-push-to-me - Send test push to current user
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title = 'Test Bildirimi', message = 'Bu bir test mesajıdır' } = body

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    console.log(`🧪 Testing push notification to ${profile?.full_name} (${user.id})`)

    // Initialize Firebase Admin
    let firebaseAdmin: typeof admin | null = null
    if (admin.apps.length === 0) {
      const serviceAccount = process.env.GOOGLE_SERVICES_JSON
      if (serviceAccount) {
        try {
          const serviceAccountKey = JSON.parse(serviceAccount)
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccountKey),
          })
          firebaseAdmin = admin
        } catch (error) {
          console.error('❌ Error initializing Firebase Admin:', error)
          return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 })
        }
      }
    } else {
      firebaseAdmin = admin
    }

    if (!firebaseAdmin) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 })
    }

    // Get user's tokens using admin client
    const adminSupabase = createAdminClient()
    const { data: tokens, error: tokenError } = await adminSupabase
      .from('notification_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (tokenError) {
      console.error('❌ Error fetching tokens:', tokenError)
      return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 })
    }

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ 
        error: 'No tokens found',
        message: 'Please open the mobile app to register your device'
      }, { status: 404 })
    }

    console.log(`📱 Found ${tokens.length} token(s)`)

    const results = []

    for (const tokenRecord of tokens) {
      try {
        console.log(`🔔 Sending to ${tokenRecord.platform} (${tokenRecord.token_type})`)

        const fcmMessage = {
          token: tokenRecord.token,
          notification: {
            title: `🧪 ${title}`,
            body: message,
          },
          data: {
            notification_type: 'test',
            title: title,
            message: message,
            test: 'true'
          },
          android: {
            priority: 'high' as const,
          },
          apns: {
            payload: {
              aps: {
                alert: { title: `🧪 ${title}`, body: message },
                sound: 'default',
                badge: 1,
              },
            },
          },
        }

        const result = await firebaseAdmin.messaging().send(fcmMessage)
        console.log(`✅ Push sent successfully: ${result}`)
        
        results.push({
          platform: tokenRecord.platform,
          token_type: tokenRecord.token_type,
          success: true,
          messageId: result
        })
      } catch (error: any) {
        console.error(`❌ Push failed:`, error)
        results.push({
          platform: tokenRecord.platform,
          token_type: tokenRecord.token_type,
          success: false,
          error: error.message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: successCount > 0,
      message: `Sent to ${successCount}/${tokens.length} devices`,
      results,
      stats: {
        total_tokens: tokens.length,
        successful: successCount,
        failed: failureCount
      }
    })

  } catch (error) {
    console.error('Error in test-push-to-me:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 })
  }
}
