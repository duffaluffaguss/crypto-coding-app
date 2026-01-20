'use client';

import { FollowButton, FollowStats } from '@/components/social/FollowButton';
import { cn } from '@/lib/utils';

interface ProfileFollowSectionProps {
  userId: string;
  currentUserId?: string | null;
  followerCount: number;
  followingCount: number;
  initialIsFollowing?: boolean;
  className?: string;
}

export function ProfileFollowSection({
  userId,
  currentUserId,
  followerCount,
  followingCount,
  initialIsFollowing = false,
  className,
}: ProfileFollowSectionProps) {
  const isOwnProfile = currentUserId === userId;

  return (
    <div className={cn('flex flex-col sm:flex-row items-start sm:items-center gap-4', className)}>
      {/* Follow Stats - Always visible */}
      <FollowStats
        userId={userId}
        followerCount={followerCount}
        followingCount={followingCount}
      />

      {/* Follow Button - Only for other profiles when logged in */}
      {!isOwnProfile && currentUserId && (
        <FollowButton
          targetUserId={userId}
          currentUserId={currentUserId}
          initialIsFollowing={initialIsFollowing}
          initialFollowerCount={followerCount}
          showCount={false}
          size="default"
          variant="default"
        />
      )}
    </div>
  );
}
