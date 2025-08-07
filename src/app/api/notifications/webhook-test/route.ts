import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = Object.fromEntries(request.headers.entries());
    
    console.log('🔍 Webhook Test - Headers:', headers);
    console.log('🔍 Webhook Test - Body:', body);
    
    // Parse the body if it's JSON
    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
    } catch (e) {
      parsedBody = body;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Webhook test received successfully',
      receivedHeaders: headers,
      receivedBody: parsedBody,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Webhook test error:', error);
    return NextResponse.json(
      { error: 'Webhook test failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Webhook test endpoint is active',
    timestamp: new Date().toISOString()
  });
}
