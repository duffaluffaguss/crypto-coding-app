'use client';

import { cn } from '@/lib/utils';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'learning' | 'building' | 'social';
  points: number;
  condition_key: string;
  threshold?: number;
}

export interface UserAchievement {
  id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

interface AchievementBadgeProps {
  achievement: Achievement;
  earned?: boolean;
  earnedAt?: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  onClick?: () => void;
}

const categoryColors = {
  learning: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
  building: 'from-green-500/20 to-green-600/20 border-green-500/30',
  social: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
};

const categoryLabels = {
  learning: '📖 Learning',
  building: '🔧 Building',
  social: '👥 Social',
};

const sizeClasses = {
  sm: 'w-12 h-12 text-xl',
  md: 'w-16 h-16 text-2xl',
  lg: 'w-20 h-20 text-3xl',
};

export function AchievementBadge({
  achievement,
  earned = false,
  earnedAt,
  size = 'md',
  showTooltip = true,
  onClick,
}: AchievementBadgeProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="group relative">
      <button
        onClick={onClick}
        disabled={!onClick}
        className={cn(
          'relative flex items-center justify-center rounded-full border-2 transition-all duration-300',
          'bg-gradient-to-br',
          sizeClasses[size],
          earned
            ? categoryColors[achievement.category]
            : 'from-gray-500/10 to-gray-600/10 border-gray-500/20',
          !earned && 'grayscale opacity-50',
          onClick && 'cursor-pointer hover:scale-110 hover:shadow-lg',
          !onClick && 'cursor-default'
        )}
      >
        <span className={cn('select-none', !earned && 'filter grayscale')}>
          {achievement.icon}
        </span>
        
        {/* Points badge */}
        {earned && (
          <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
            {achievement.points}
          </div>
        )}
        
        {/* Lock icon for unearned */}
        {!earned && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
            <span className="text-white/70 text-sm">🔒</span>
          </div>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
          <div className="bg-popover border border-border rounded-lg shadow-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{achievement.icon}</span>
              <span className="font-semibold text-sm">{achievement.name}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {achievement.description}
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {categoryLabels[achievement.category]}
              </span>
              <span className="font-medium text-amber-500">
                +{achievement.points} pts
              </span>
            </div>
            {earned && earnedAt && (
              <div className="mt-2 pt-2 border-t border-border text-xs text-green-500">
                ✓ Earned {formatDate(earnedAt)}
              </div>
            )}
            {!earned && (
              <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                🔒 Not yet earned
              </div>
            )}
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-border" />
          </div>
        </div>
      )}
    </div>
  );
}

// Grid display for multiple badges
interface AchievementGridProps {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  size?: 'sm' | 'md' | 'lg';
  category?: 'learning' | 'building' | 'social' | 'all';
}

export function AchievementGrid({
  achievements,
  userAchievements,
  size = 'md',
  category = 'all',
}: AchievementGridProps) {
  const earnedMap = new Map(
    userAchievements.map((ua) => [ua.achievement_id, ua.earned_at])
  );

  const filteredAchievements =
    category === 'all'
      ? achievements
      : achievements.filter((a) => a.category === category);

  // Sort: earned first, then by points
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    const aEarned = earnedMap.has(a.id);
    const bEarned = earnedMap.has(b.id);
    if (aEarned !== bEarned) return bEarned ? 1 : -1;
    return b.points - a.points;
  });

  return (
    <div className="flex flex-wrap gap-4">
      {sortedAchievements.map((achievement) => (
        <AchievementBadge
          key={achievement.id}
          achievement={achievement}
          earned={earnedMap.has(achievement.id)}
          earnedAt={earnedMap.get(achievement.id)}
          size={size}
        />
      ))}
    </div>
  );
}
