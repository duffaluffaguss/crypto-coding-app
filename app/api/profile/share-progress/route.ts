import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { platform, userId } = await request.json();
    
    if (!platform || !userId) {
      return NextResponse.json(
        { error: 'Platform and userId are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Get current user for auth (optional - we allow tracking without auth)
    const { data: { user } } = await supabase.auth.getUser();

    // Record the share event
    const { error } = await supabase
      .from('user_shares')
      .insert({
        user_id: userId,
        platform,
        shared_by: user?.id || null, // null if not authenticated
        shared_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error recording share:', error);
      // Don't fail the request if we can't record the share
    }

    // Update the user's share count (optimistic increment)
    const { error: updateError } = await supabase.rpc('increment_share_count', {
      target_user_id: userId,
      share_platform: platform,
    });

    if (updateError) {
      console.error('Error updating share count:', updateError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Share tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track share' },
      { status: 500 }
    );
  }
}