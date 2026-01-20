import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PATCH /api/profile/preferences
 * 
 * Update user's profile preferences (including email preferences)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email_preferences } = body;

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (email_preferences !== undefined) {
      // Validate email preferences structure
      const validKeys = ['achievements', 'streak_reminders', 'weekly_digest', 'welcome'];
      const sanitizedPrefs: Record<string, boolean> = {};
      
      for (const [key, value] of Object.entries(email_preferences)) {
        if (validKeys.includes(key) && typeof value === 'boolean') {
          sanitizedPrefs[key] = value;
        }
      }
      
      updateData.email_preferences = sanitizedPrefs;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid preferences provided' },
        { status: 400 }
      );
    }

    // Update profile
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select('email_preferences')
      .single();

    if (error) {
      console.error('Error updating preferences:', error);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      email_preferences: data?.email_preferences,
    });
  } catch (error) {
    console.error('Preferences update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/profile/preferences
 * 
 * Get user's profile preferences
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('email_preferences')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching preferences:', error);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      email_preferences: data?.email_preferences || {
        achievements: true,
        streak_reminders: true,
        weekly_digest: true,
      },
    });
  } catch (error) {
    console.error('Preferences fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
