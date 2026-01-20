'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Activity,
  ActivityType,
  getActivityMeta,
  getActivityDescription,
  getActivityLink,
  getTimeAgo,
} from '@/lib/activity';
import { cn } from '@/lib/utils';

interface ActivityCardProps {
  activity: Activity;
  showUser?: boolean;
}

export function ActivityCard({ activity, showUser = true }: ActivityCardProps) {
  const meta = getActivityMeta(activity.type);
  // Handle both new 'data' and legacy 'metadata' fields
  const activityData = activity.data || activity.metadata || {};
  const description = getActivityDescription(activity.type, activityData, activity.metadata);
  const link = getActivityLink(activity.type, activityData, activity.metadata);
  const timeAgo = getTimeAgo(activity.created_at);

  const initials = activity.display_name
    ? activity.display_name.slice(0, 2).toUpperCase()
    : 'AN';

  const content = (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card/50',
        'hover:bg-card/80 hover:border-border transition-colors',
        link && 'cursor-pointer'
      )}
    >
      {/* Icon or Avatar */}
      <div className={cn('flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center', meta.bgColor)}>
        {showUser && activity.avatar_url ? (
          <Avatar className="h-10 w-10">
            <AvatarImage src={activity.avatar_url} alt={activity.display_name || 'User'} />
            <AvatarFallback className={cn(meta.bgColor, meta.color)}>
              {initials}
            </AvatarFallback>
          </Avatar>
        ) : (
          <span className="text-xl">{meta.icon}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {showUser && (
            <span className="font-semibold text-foreground">
              {activity.display_name || 'Anonymous'}
            </span>
          )}
          <span className="text-muted-foreground text-sm">
            {description}
          </span>
        </div>

        {/* Activity type badge and time */}
        <div className="flex items-center gap-2 mt-1">
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
              meta.bgColor,
              meta.color
            )}
          >
            {meta.icon} {meta.label}
          </span>
          <span className="text-xs text-muted-foreground">
            {timeAgo}
          </span>
        </div>

        {/* Extra data display based on activity type */}
        {activity.type === 'contract_deployed' && activityData.contractAddress && (
          <div className="mt-2 text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded inline-block">
            {String(activityData.contractAddress).slice(0, 10)}...
            {String(activityData.contractAddress).slice(-8)}
          </div>
        )}

        {activity.type === 'achievement_earned' && activityData.points && (
          <div className="mt-2 text-xs text-purple-500 font-medium">
            +{activityData.points as number} points
          </div>
        )}

        {activity.type === 'user_followed' && activityData.followedUsername && (
          <div className="mt-2 text-xs text-indigo-500 font-medium">
            @{activityData.followedUsername as string}
          </div>
        )}
      </div>

      {/* Arrow indicator for links */}
      {link && (
        <div className="flex-shrink-0 text-muted-foreground">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      )}
    </div>
  );

  if (link) {
    return <Link href={link}>{content}</Link>;
  }

  return content;
}

// Skeleton for loading state
export function ActivityCardSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card/50 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="flex items-center gap-2">
          <div className="h-5 bg-muted rounded w-24" />
          <div className="h-3 bg-muted rounded w-16" />
        </div>
      </div>
    </div>
  );
}