import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Mobile connection test:', new Date().toISOString());
    const body = await request.json();
    console.log('📋 Test data received:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Mobile connection test successful',
      receivedData: body,
      timestamp: new Date().toISOString(),
      server: 'Vercel',
      endpoint: '/api/notifications/test-mobile-connection'
    });
  } catch (error) {
    console.error('❌ Mobile connection test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Mobile connection endpoint is accessible',
    timestamp: new Date().toISOString(),
    methods: ['GET', 'POST']
  });
}
