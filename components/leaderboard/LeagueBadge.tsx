'use client';

import { cn } from '@/lib/utils';
import { type LeagueInfo, type LeagueRank, LEAGUES, getLeagueFromPoints, getLeagueFromRank } from '@/lib/leaderboard';

interface LeagueBadgeProps {
  points?: number | null;
  rank?: number | null;
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

export function LeagueBadge({ points, rank, size = 'md', showLabel = true, className }: LeagueBadgeProps) {
  const league = points !== undefined ? getLeagueFromPoints(points) : getLeagueFromRank(rank);
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

interface LeagueBadgeWithProgressProps extends LeagueBadgeProps {
  currentPoints?: number | null;
}

export function LeagueBadgeWithProgress({ points, rank, currentPoints, size = 'md', className }: LeagueBadgeWithProgressProps) {
  const league = points !== undefined ? getLeagueFromPoints(points) : getLeagueFromRank(rank);
  const userPoints = currentPoints || points || 0;
  
  // Calculate progress to next league based on points
  const getNextLeagueInfo = (): { nextLeague: LeagueInfo | null; pointsNeeded: number } | null => {
    if (userPoints >= 1001) return null; // Already Diamond
    
    if (userPoints >= 501) {
      return { nextLeague: LEAGUES.diamond, pointsNeeded: 1001 - userPoints };
    } else if (userPoints >= 101) {
      return { nextLeague: LEAGUES.gold, pointsNeeded: 501 - userPoints };
    } else {
      return { nextLeague: LEAGUES.silver, pointsNeeded: 101 - userPoints };
    }
  };

  const nextInfo = getNextLeagueInfo();

  return (
    <div className="flex flex-col items-center gap-1">
      <LeagueBadge points={points} rank={rank} size={size} className={className} />
      {nextInfo && (
        <span className="text-xs text-muted-foreground">
          {nextInfo.pointsNeeded} pts to {nextInfo.nextLeague?.label}
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
        const pointRange = league.maxPoints 
          ? `${league.minPoints}-${league.maxPoints} pts` 
          : `${league.minPoints}+ pts`;
        
        return (
          <div key={leagueKey} className="flex items-center gap-2 text-sm">
            <span className="text-lg">{league.icon}</span>
            <span className={league.color}>{league.label}</span>
            <span className="text-muted-foreground text-xs">
              {pointRange}
            </span>
          </div>
        );
      })}
    </div>
  );
}
