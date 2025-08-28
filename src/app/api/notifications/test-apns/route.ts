import { NextRequest, NextResponse } from 'next/server';
import apn from 'apn';

// Initialize APNs Provider for testing
function initializeAPNProvider() {
  const apnsCertPath = process.env.APNS_CERT_PATH;
  const apnsCertData = process.env.APNS_CERT_DATA; // Base64 encoded .p12 file
  const apnsPassphrase = process.env.APNS_PASSPHRASE;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!apnsCertData && !apnsCertPath) {
    throw new Error('APNs certificate not configured (APNS_CERT_DATA or APNS_CERT_PATH required)');
  }

  if (!apnsPassphrase) {
    throw new Error('APNs passphrase not configured (APNS_PASSPHRASE required)');
  }

  let options: apn.ProviderOptions;

  if (apnsCertData) {
    // Use base64 encoded certificate data (recommended for Vercel)
    const certBuffer = Buffer.from(apnsCertData, 'base64');
    options = {
      pfx: certBuffer,
      passphrase: apnsPassphrase,
      production: isProduction
    };
  } else if (apnsCertPath) {
    // Use certificate file path (for local development)
    options = {
      pfx: apnsCertPath,
      passphrase: apnsPassphrase,
      production: isProduction
    };
  } else {
    throw new Error('No valid certificate configuration found');
  }

  return new apn.Provider(options);
}

export async function POST(request: NextRequest) {
  try {
    const { deviceToken, title = 'Test Notification', body = 'APNs Legacy Certificate Test' } = await request.json();

    if (!deviceToken) {
      return NextResponse.json(
        { error: 'Device token is required' },
        { status: 400 }
      );
    }

    console.log('🧪 Testing APNs notification...');
    console.log('📱 Device token:', deviceToken.substring(0, 20) + '...');
    console.log('🏷️ Environment:', process.env.NODE_ENV);

    // Initialize APNs provider
    const provider = initializeAPNProvider();
    console.log('✅ APNs provider initialized');

    // Create test notification
    const notification = new apn.Notification({
      alert: {
        title,
        body
      },
      sound: 'default',
      badge: 1,
      topic: 'com.behnan.coachingmobile', // Your app's bundle identifier
      payload: {
        type: 'test',
        timestamp: new Date().toISOString()
      },
      pushType: 'alert',
      priority: 10 // High priority for immediate delivery
    });

    console.log('📤 Sending test notification...');

    // Send notification
    const result = await provider.send(notification, deviceToken);
    
    console.log('📊 APNs Result:', {
      sent: result.sent.length,
      failed: result.failed.length
    });

    if (result.sent.length > 0) {
      console.log('✅ APNs notification sent successfully');
      console.log('📱 Sent to device:', result.sent[0].device);
      
      return NextResponse.json({
        success: true,
        message: 'APNs notification sent successfully',
        result: {
          sent: result.sent.length,
          failed: result.failed.length,
          device: result.sent[0].device,
          messageId: result.sent[0].response?.notificationId
        }
      });
    } else if (result.failed.length > 0) {
      const failure = result.failed[0];
      console.error('❌ APNs notification failed:', failure.error);
      
      return NextResponse.json({
        success: false,
        error: 'APNs notification failed',
        details: {
          device: failure.device,
          error: failure.error?.message || 'Unknown error',
          status: failure.status
        }
      }, { status: 400 });
    } else {
      console.error('❌ APNs notification: No sent or failed results');
      
      return NextResponse.json({
        success: false,
        error: 'No delivery result from APNs'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ APNs test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'APNs test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const config = {
      hasAPNSCertPath: !!process.env.APNS_CERT_PATH,
      hasAPNSCertData: !!process.env.APNS_CERT_DATA,
      hasAPNSPassphrase: !!process.env.APNS_PASSPHRASE,
      environment: process.env.NODE_ENV,
      bundleId: 'com.behnan.coachingmobile'
    };

    console.log('🔍 APNs Configuration Check:', config);

    if (!config.hasAPNSPassphrase) {
      return NextResponse.json({
        success: false,
        error: 'APNs passphrase not configured',
        config
      }, { status: 500 });
    }

    if (!config.hasAPNSCertData && !config.hasAPNSCertPath) {
      return NextResponse.json({
        success: false,
        error: 'APNs certificate not configured',
        config
      }, { status: 500 });
    }

    // Try to initialize provider
    try {
      const provider = initializeAPNProvider();
      provider.shutdown(); // Clean up test connection
      
      return NextResponse.json({
        success: true,
        message: 'APNs configuration is valid',
        config
      });
    } catch (initError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize APNs provider',
        details: initError instanceof Error ? initError.message : String(initError),
        config
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ APNs config check error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Configuration check failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
