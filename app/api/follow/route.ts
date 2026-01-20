import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/follow - Follow a user
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { targetUserId } = await request.json();

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      );
    }

    // Can't follow yourself
    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    // Check if target user exists
    const { data: targetUser, error: targetError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', targetUserId)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create follow
    const { error: followError } = await supabase.from('follows').insert({
      follower_id: user.id,
      following_id: targetUserId,
    });

    if (followError) {
      // Check for unique constraint violation (already following)
      if (followError.code === '23505') {
        return NextResponse.json(
          { error: 'Already following this user' },
          { status: 409 }
        );
      }
      throw followError;
    }

    // Optionally create an activity for the follow
    await supabase.from('activities').insert({
      user_id: user.id,
      type: 'user_followed',
      data: {
        followed_user_id: targetUserId,
      },
    });

    // Get updated follower count
    const { data: count } = await supabase.rpc('get_follower_count', {
      p_user_id: targetUserId,
    });

    return NextResponse.json({
      success: true,
      followerCount: count || 0,
    });
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json(
      { error: 'Failed to follow user' },
      { status: 500 }
    );
  }
}

// DELETE /api/follow - Unfollow a user
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('targetUserId');

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      );
    }

    // Delete follow
    const { error: unfollowError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId);

    if (unfollowError) {
      throw unfollowError;
    }

    // Get updated follower count
    const { data: count } = await supabase.rpc('get_follower_count', {
      p_user_id: targetUserId,
    });

    return NextResponse.json({
      success: true,
      followerCount: count || 0,
    });
  } catch (error) {
    console.error('Unfollow error:', error);
    return NextResponse.json(
      { error: 'Failed to unfollow user' },
      { status: 500 }
    );
  }
}

// GET /api/follow - Check follow status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('targetUserId');

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      );
    }

    // Get follow counts
    const [followerCount, followingCount, isFollowing] = await Promise.all([
      supabase.rpc('get_follower_count', { p_user_id: targetUserId }),
      supabase.rpc('get_following_count', { p_user_id: targetUserId }),
      user
        ? supabase.rpc('is_following', {
            p_follower_id: user.id,
            p_following_id: targetUserId,
          })
        : Promise.resolve({ data: false }),
    ]);

    return NextResponse.json({
      followerCount: followerCount.data || 0,
      followingCount: followingCount.data || 0,
      isFollowing: isFollowing.data || false,
    });
  } catch (error) {
    console.error('Get follow status error:', error);
    return NextResponse.json(
      { error: 'Failed to get follow status' },
      { status: 500 }
    );
  }
}
