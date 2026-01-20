'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, UserMinus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  targetUserId: string;
  currentUserId?: string | null;
  initialIsFollowing?: boolean;
  initialFollowerCount?: number;
  showCount?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  onFollowChange?: (isFollowing: boolean, newCount: number) => void;
}

export function FollowButton({
  targetUserId,
  currentUserId,
  initialIsFollowing = false,
  initialFollowerCount = 0,
  showCount = false,
  size = 'default',
  variant = 'default',
  className,
  onFollowChange,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const supabase = createClient();

  // Load initial state if not provided
  useEffect(() => {
    if (!currentUserId || currentUserId === targetUserId) return;

    const loadFollowState = async () => {
      const [followCheck, countResult] = await Promise.all([
        supabase.rpc('is_following', {
          p_follower_id: currentUserId,
          p_following_id: targetUserId,
        }),
        supabase.rpc('get_follower_count', { p_user_id: targetUserId }),
      ]);

      if (followCheck.data !== null) {
        setIsFollowing(followCheck.data);
      }
      if (countResult.data !== null) {
        setFollowerCount(countResult.data);
      }
    };

    loadFollowState();
  }, [currentUserId, targetUserId, supabase]);

  const handleFollow = useCallback(async () => {
    if (!currentUserId || isLoading) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId);

        if (error) throw error;

        setIsFollowing(false);
        setFollowerCount((prev) => Math.max(0, prev - 1));
        onFollowChange?.(false, followerCount - 1);
      } else {
        // Follow
        const { error } = await supabase.from('follows').insert({
          follower_id: currentUserId,
          following_id: targetUserId,
        });

        if (error) throw error;

        setIsFollowing(true);
        setFollowerCount((prev) => prev + 1);
        onFollowChange?.(true, followerCount + 1);
      }
    } catch (error) {
      console.error('Follow action failed:', error);
      // Revert optimistic update would go here if needed
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, targetUserId, isFollowing, isLoading, supabase, followerCount, onFollowChange]);

  // Don't show button if user is viewing own profile or not logged in
  if (!currentUserId || currentUserId === targetUserId) {
    if (showCount) {
      return (
        <div className={cn('flex items-center gap-1.5 text-muted-foreground', className)}>
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium">{followerCount}</span>
          <span className="text-sm">followers</span>
        </div>
      );
    }
    return null;
  }

  const buttonVariant = isFollowing
    ? isHovering
      ? 'destructive'
      : 'outline'
    : variant;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant={buttonVariant as 'default' | 'outline' | 'ghost' | 'destructive'}
        size={size}
        onClick={handleFollow}
        disabled={isLoading}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={cn(
          'transition-all duration-200',
          isFollowing && !isHovering && 'text-primary border-primary/50'
        )}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isFollowing ? (
          isHovering ? (
            <>
              <UserMinus className="h-4 w-4 mr-1.5" />
              Unfollow
            </>
          ) : (
            <>
              <Users className="h-4 w-4 mr-1.5" />
              Following
            </>
          )
        ) : (
          <>
            <UserPlus className="h-4 w-4 mr-1.5" />
            Follow
          </>
        )}
      </Button>
      {showCount && (
        <span className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{followerCount}</span> followers
        </span>
      )}
    </div>
  );
}

// Compact version for lists
interface FollowButtonCompactProps {
  targetUserId: string;
  currentUserId?: string | null;
  initialIsFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButtonCompact({
  targetUserId,
  currentUserId,
  initialIsFollowing = false,
  onFollowChange,
}: FollowButtonCompactProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleFollow = async () => {
    if (!currentUserId || isLoading) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId);

        if (error) throw error;
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        const { error } = await supabase.from('follows').insert({
          follower_id: currentUserId,
          following_id: targetUserId,
        });

        if (error) throw error;
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    } catch (error) {
      console.error('Follow action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUserId || currentUserId === targetUserId) {
    return null;
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : 'default'}
      size="sm"
      onClick={handleFollow}
      disabled={isLoading}
      className="h-8 px-3"
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : isFollowing ? (
        'Following'
      ) : (
        'Follow'
      )}
    </Button>
  );
}

// Stats display component for profiles
interface FollowStatsProps {
  userId: string;
  followerCount: number;
  followingCount: number;
  className?: string;
}

export function FollowStats({ userId, followerCount, followingCount, className }: FollowStatsProps) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <a
        href={`/profile/${userId}/followers`}
        className="hover:text-primary transition-colors"
      >
        <span className="font-bold">{followerCount}</span>{' '}
        <span className="text-muted-foreground">followers</span>
      </a>
      <a
        href={`/profile/${userId}/following`}
        className="hover:text-primary transition-colors"
      >
        <span className="font-bold">{followingCount}</span>{' '}
        <span className="text-muted-foreground">following</span>
      </a>
    </div>
  );
}
