import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apnsCertData = process.env.APNS_CERT_DATA;
    const apnsPassphrase = process.env.APNS_PASSPHRASE;
    
    if (!apnsCertData) {
      return NextResponse.json({
        error: 'APNS_CERT_DATA not found',
        hasData: false
      });
    }

    if (!apnsPassphrase) {
      return NextResponse.json({
        error: 'APNS_PASSPHRASE not found',
        hasData: true,
        hasPassphrase: false
      });
    }

    // Basic certificate analysis
    const certLength = apnsCertData.length;
    const isBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(apnsCertData);
    
    let bufferAnalysis = null;
    try {
      const certBuffer = Buffer.from(apnsCertData, 'base64');
      bufferAnalysis = {
        bufferLength: certBuffer.length,
        firstBytes: Array.from(certBuffer.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' '),
        isPKCS12: certBuffer[0] === 0x30 && certBuffer[1] === 0x82, // PKCS#12 typically starts with 0x30 0x82
      };
    } catch (bufferError) {
      bufferAnalysis = {
        error: bufferError instanceof Error ? bufferError.message : String(bufferError)
      };
    }

    return NextResponse.json({
      success: true,
      analysis: {
        certLength,
        isValidBase64: isBase64,
        hasPassphrase: true,
        bufferAnalysis,
        environment: process.env.NODE_ENV,
        preview: apnsCertData.substring(0, 50) + '...'
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Certificate analysis failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
