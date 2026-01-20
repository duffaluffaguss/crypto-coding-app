'use client';

import { cn } from '@/lib/utils';
import { VerificationBadges } from '@/components/verification/VerificationBadges';
import type { LeaderboardUser } from './Podium';

interface LeaderboardTableProps {
  users: LeaderboardUser[];
  metric: 'points' | 'streak' | 'lessons';
  currentUserId?: string;
  startRank?: number;
}

const metricLabels = {
  points: 'Points',
  streak: 'Days',
  lessons: 'Completed',
};

export function LeaderboardTable({
  users,
  metric,
  currentUserId,
  startRank = 1,
}: LeaderboardTableProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No users to display
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-16">
              Rank
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              User
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
              {metricLabels[metric]}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((user, index) => {
            const rank = startRank + index;
            const isCurrentUser = user.id === currentUserId;

            return (
              <tr
                key={user.id}
                className={cn(
                  'transition-colors',
                  isCurrentUser
                    ? 'bg-primary/10 hover:bg-primary/15'
                    : 'hover:bg-muted/50'
                )}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={cn(
                      'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold',
                      rank === 1 && 'bg-yellow-500/20 text-yellow-600',
                      rank === 2 && 'bg-gray-300/30 text-gray-600',
                      rank === 3 && 'bg-orange-400/20 text-orange-600',
                      rank > 3 && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {rank}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2',
                        isCurrentUser ? 'border-primary' : 'border-transparent'
                      )}
                    >
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-sm font-bold">
                          {user.display_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {/* Name */}
                    <div className="flex flex-col">
                      <span
                        className={cn(
                          'font-medium',
                          isCurrentUser && 'text-primary'
                        )}
                      >
                        {user.display_name}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-primary">(You)</span>
                        )}
                      </span>
                      <VerificationBadges userId={user.id} size="xs" maxBadges={2} />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={cn(
                      'font-semibold text-lg',
                      rank <= 3 ? 'text-amber-500' : 'text-foreground'
                    )}
                  >
                    {user.value.toLocaleString()}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
