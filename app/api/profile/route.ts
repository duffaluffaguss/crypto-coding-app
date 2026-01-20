import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate the fields that are being updated
    const validFields = [
      'display_name',
      'bio',
      'website_url',
      'twitter_handle',
      'github_username',
      'discord_username',
      'avatar_url'
    ];

    // Filter out any invalid fields
    const updateData: Record<string, any> = {};
    for (const [key, value] of Object.entries(body)) {
      if (validFields.includes(key)) {
        updateData[key] = value;
      }
    }

    // Validate display_name is not empty if provided
    if ('display_name' in updateData && (!updateData.display_name?.trim())) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      );
    }

    // Validate bio length
    if ('bio' in updateData && updateData.bio && updateData.bio.length > 500) {
      return NextResponse.json(
        { error: 'Bio must be 500 characters or less' },
        { status: 400 }
      );
    }

    // Validate URL format for website_url
    if ('website_url' in updateData && updateData.website_url) {
      try {
        new URL(updateData.website_url);
      } catch {
        return NextResponse.json(
          { error: 'Invalid website URL' },
          { status: 400 }
        );
      }
    }

    // Validate Twitter handle format
    if ('twitter_handle' in updateData && updateData.twitter_handle) {
      if (!/^[a-zA-Z0-9_]{1,15}$/.test(updateData.twitter_handle)) {
        return NextResponse.json(
          { error: 'Invalid Twitter handle' },
          { status: 400 }
        );
      }
    }

    // Validate GitHub username format
    if ('github_username' in updateData && updateData.github_username) {
      if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(updateData.github_username)) {
        return NextResponse.json(
          { error: 'Invalid GitHub username' },
          { status: 400 }
        );
      }
    }

    // Validate Discord username format
    if ('discord_username' in updateData && updateData.discord_username) {
      if (!/^[a-zA-Z0-9._-]{2,32}$/.test(updateData.discord_username)) {
        return NextResponse.json(
          { error: 'Invalid Discord username' },
          { status: 400 }
        );
      }
    }

    // Update the profile
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        display_name,
        bio,
        website_url,
        twitter_handle,
        github_username,
        discord_username,
        avatar_url
      `)
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });

  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}