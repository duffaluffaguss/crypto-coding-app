'use client';

import { cn } from '@/lib/utils';
import { VerificationBadges } from '@/components/verification/VerificationBadges';

export interface LeaderboardUser {
  id: string;
  display_name: string;
  avatar_url?: string | null;
  value: number;
  rank: number;
}

interface PodiumProps {
  users: LeaderboardUser[];
  metric: 'points' | 'streak' | 'lessons';
  currentUserId?: string;
}

const metricLabels = {
  points: 'pts',
  streak: 'days',
  lessons: 'lessons',
};

const podiumColors = {
  1: 'from-yellow-400 to-amber-500', // Gold
  2: 'from-gray-300 to-slate-400',   // Silver
  3: 'from-orange-400 to-amber-600', // Bronze
};

const podiumHeights = {
  1: 'h-32',
  2: 'h-24',
  3: 'h-20',
};

const rankEmoji = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

export function Podium({ users, metric, currentUserId }: PodiumProps) {
  // Need at least 1 user for podium
  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No users to display
      </div>
    );
  }

  // Reorder for podium display: [2nd, 1st, 3rd]
  const podiumOrder = [users[1], users[0], users[2]].filter(Boolean);

  return (
    <div className="flex items-end justify-center gap-4 py-6 px-4">
      {podiumOrder.map((user, index) => {
        if (!user) return null;
        const position = user.rank;
        const isCurrentUser = user.id === currentUserId;

        return (
          <div
            key={user.id}
            className={cn(
              'flex flex-col items-center transition-transform hover:scale-105',
              index === 1 && 'order-2', // 1st place in center
              index === 0 && 'order-1', // 2nd place on left
              index === 2 && 'order-3', // 3rd place on right
            )}
          >
            {/* User info above podium */}
            <div className="flex flex-col items-center mb-3">
              {/* Avatar */}
              <div
                className={cn(
                  'relative rounded-full border-4 overflow-hidden',
                  position === 1 ? 'w-20 h-20 border-yellow-400' :
                  position === 2 ? 'w-16 h-16 border-gray-300' :
                  'w-14 h-14 border-orange-400',
                  isCurrentUser && 'ring-4 ring-primary ring-offset-2'
                )}
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-lg font-bold">
                    {user.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Crown for 1st place */}
                {position === 1 && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xl">
                    👑
                  </div>
                )}
              </div>

              {/* Name */}
              <span
                className={cn(
                  'font-medium text-sm mt-2 max-w-[100px] truncate text-center',
                  isCurrentUser && 'text-primary font-bold'
                )}
              >
                {user.display_name}
              </span>

              {/* Verification badges */}
              <VerificationBadges userId={user.id} size="xs" maxBadges={2} className="mt-1" />

              {/* Value */}
              <span className="text-xs text-muted-foreground">
                {user.value.toLocaleString()} {metricLabels[metric]}
              </span>
            </div>

            {/* Podium block */}
            <div
              className={cn(
                'w-24 rounded-t-lg bg-gradient-to-b flex items-start justify-center pt-2',
                podiumColors[position as 1 | 2 | 3],
                podiumHeights[position as 1 | 2 | 3]
              )}
            >
              <span className="text-2xl">{rankEmoji[position as 1 | 2 | 3]}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
