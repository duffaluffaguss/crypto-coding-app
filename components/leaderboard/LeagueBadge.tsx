'use client';

import { cn } from '@/lib/utils';
import { type LeagueInfo, type LeagueRank, LEAGUES, getLeagueFromRank } from '@/lib/leaderboard';

interface LeagueBadgeProps {
  rank: number | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: {
    container: 'px-2 py-0.5 text-xs gap-1',
    icon: 'text-sm',
  },
  md: {
    container: 'px-3 py-1 text-sm gap-1.5',
    icon: 'text-base',
  },
  lg: {
    container: 'px-4 py-2 text-base gap-2',
    icon: 'text-xl',
  },
};

export function LeagueBadge({ rank, size = 'md', showLabel = true, className }: LeagueBadgeProps) {
  const league = getLeagueFromRank(rank);
  const sizeClass = sizeClasses[size];

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        league.bgColor,
        league.borderColor,
        league.color,
        sizeClass.container,
        className
      )}
    >
      <span className={sizeClass.icon}>{league.icon}</span>
      {showLabel && <span>{league.label}</span>}
    </div>
  );
}

interface LeagueBadgeWithTooltipProps extends LeagueBadgeProps {
  currentRank: number | null;
}

export function LeagueBadgeWithProgress({ rank, currentRank, size = 'md', className }: LeagueBadgeWithTooltipProps) {
  const league = getLeagueFromRank(rank);
  const sizeClass = sizeClasses[size];
  
  // Calculate progress to next league
  const getNextLeagueInfo = (): { nextLeague: LeagueInfo | null; usersAway: number } | null => {
    if (rank === null || rank <= 10) return null; // Already Diamond or no rank
    
    if (rank <= 50) {
      return { nextLeague: LEAGUES.diamond, usersAway: rank - 10 };
    } else if (rank <= 100) {
      return { nextLeague: LEAGUES.gold, usersAway: rank - 50 };
    } else {
      return { nextLeague: LEAGUES.silver, usersAway: rank - 100 };
    }
  };

  const nextInfo = getNextLeagueInfo();

  return (
    <div className="flex flex-col items-center gap-1">
      <LeagueBadge rank={rank} size={size} className={className} />
      {nextInfo && currentRank && (
        <span className="text-xs text-muted-foreground">
          {nextInfo.usersAway} away from {nextInfo.nextLeague?.label}
        </span>
      )}
    </div>
  );
}

// Display all leagues for reference
export function LeagueLegend({ className }: { className?: string }) {
  const leagues: LeagueRank[] = ['diamond', 'gold', 'silver', 'bronze'];
  
  return (
    <div className={cn('flex flex-wrap gap-4 justify-center', className)}>
      {leagues.map((leagueKey) => {
        const league = LEAGUES[leagueKey];
        return (
          <div key={leagueKey} className="flex items-center gap-2 text-sm">
            <span className="text-lg">{league.icon}</span>
            <span className={league.color}>{league.label}</span>
            <span className="text-muted-foreground text-xs">
              {league.maxPosition 
                ? `Top ${league.maxPosition}` 
                : `${league.minPosition}+`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
