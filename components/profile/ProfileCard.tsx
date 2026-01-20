'use client';

import { UserAvatar } from './UserAvatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn, formatDate } from '@/lib/utils';

interface ProfileStats {
  projectsCreated: number;
  lessonsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  achievementPoints: number;
}

interface ProfileCardProps {
  displayName?: string | null;
  email?: string | null;
  memberSince: string;
  stats: ProfileStats;
  isOwnProfile?: boolean;
  className?: string;
}

export function ProfileCard({
  displayName,
  email,
  memberSince,
  stats,
  isOwnProfile = false,
  className,
}: ProfileCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header with gradient background */}
      <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-background" />
      
      <CardHeader className="relative pb-0 -mt-12">
        <div className="flex items-end gap-4">
          <UserAvatar
            displayName={displayName}
            email={email}
            size="xl"
            className="ring-4 ring-background"
          />
          <div className="flex-1 min-w-0 pb-2">
            <h2 className="text-2xl font-bold truncate">
              {displayName || 'Anonymous'}
            </h2>
            {isOwnProfile && email && (
              <p className="text-sm text-muted-foreground truncate">{email}</p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon="📁"
            label="Projects"
            value={stats.projectsCreated}
          />
          <StatCard
            icon="📚"
            label="Lessons"
            value={stats.lessonsCompleted}
          />
          <StatCard
            icon="🔥"
            label="Current Streak"
            value={stats.currentStreak}
            suffix="days"
          />
          <StatCard
            icon="🏆"
            label="Points"
            value={stats.achievementPoints}
          />
        </div>

        {/* Additional Info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-border pt-4">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Member since {formatDate(memberSince)}</span>
          </div>
          {stats.longestStreak > 0 && (
            <div className="flex items-center gap-1.5">
              <span>⚡</span>
              <span>Best streak: {stats.longestStreak} days</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  suffix?: string;
}

function StatCard({ icon, label, value, suffix }: StatCardProps) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">
        {label}
        {suffix && <span className="ml-1">{suffix}</span>}
      </div>
    </div>
  );
}
