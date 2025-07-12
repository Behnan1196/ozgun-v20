import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'userId parameter is required' 
      }, { status: 400 });
    }

    // Create admin Supabase client
    const supabase = createAdminClient();
    
    // Get mobile device tokens
    const { data: mobileTokens, error: mobileError } = await supabase
      .from('device_tokens')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    // Get user profile
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role')
      .eq('id', userId)
      .single();

    return NextResponse.json({
      success: true,
      debug: {
        userId,
        userProfile,
        userError: userError?.message,
        mobileTokens: mobileTokens?.map(token => ({
          id: token.id,
          platform: token.platform,
          tokenPreview: token.token ? `${token.token.substring(0, 20)}...` : null,
          created_at: token.created_at,
          updated_at: token.updated_at
        })),
        mobileTokenCount: mobileTokens?.length || 0,
        mobileError: mobileError?.message,
        hasTokens: mobileTokens && mobileTokens.length > 0,
        platforms: mobileTokens?.map(t => t.platform).filter((p, i, arr) => arr.indexOf(p) === i) || []
      }
    });
    
  } catch (error) {
    console.error('❌ Error in notification debug:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 