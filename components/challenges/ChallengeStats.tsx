'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WeeklyProgress {
  date: string;
  completed: boolean;
  isToday: boolean;
}

interface ChallengeStatsProps {
  streak: number;
  totalPoints: number;
  weeklyProgress: WeeklyProgress[];
  totalCompleted: number;
  longestStreak?: number;
}

export function ChallengeStats({
  streak,
  totalPoints,
  weeklyProgress,
  totalCompleted,
  longestStreak = 0,
}: ChallengeStatsProps) {
  // Get streak milestone info
  const getStreakMilestone = (s: number) => {
    if (s >= 100) return { label: '🏆 Legend', color: 'text-purple-500', bgColor: 'bg-purple-500/10' };
    if (s >= 30) return { label: '⭐ Master', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' };
    if (s >= 7) return { label: '🔥 On Fire', color: 'text-orange-500', bgColor: 'bg-orange-500/10' };
    return null;
  };

  const milestone = getStreakMilestone(streak);
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-4">
      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Streak Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10" />
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span className="text-lg">🔥</span>
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-orange-500">{streak}</span>
              <span className="text-muted-foreground">days</span>
            </div>
            {milestone && (
              <span className={cn('text-xs px-2 py-1 rounded-full mt-2 inline-block', milestone.bgColor, milestone.color)}>
                {milestone.label}
              </span>
            )}
            {longestStreak > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Best: {longestStreak} days
              </p>
            )}
          </CardContent>
        </Card>

        {/* Points Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-blue-500/10" />
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span className="text-lg">⭐</span>
              Challenge Points
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-primary">{totalPoints}</span>
              <span className="text-muted-foreground">pts</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {totalCompleted} challenges completed
            </p>
          </CardContent>
        </Card>

        {/* Weekly Progress Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span className="text-lg">📊</span>
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-1">
              {weeklyProgress.map((day, i) => (
                <div key={day.date} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">{weekDays[i]}</span>
                  <div
                    className={cn(
                      'w-8 h-8 rounded-md flex items-center justify-center transition-all',
                      day.completed
                        ? 'bg-green-500 text-white'
                        : day.isToday
                        ? 'bg-muted ring-2 ring-primary ring-offset-2 ring-offset-background'
                        : 'bg-muted'
                    )}
                    title={`${day.date}${day.completed ? ' - Completed!' : day.isToday ? ' - Today' : ''}`}
                  >
                    {day.completed ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : day.isToday ? (
                      <span className="text-xs font-medium">?</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {weeklyProgress.filter(d => d.completed).length}/7 this week
              </span>
              {weeklyProgress.filter(d => d.completed).length === 7 && (
                <span className="text-green-500 font-medium">🎉 Perfect Week!</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Bonus points display component
interface BonusPointsProps {
  bonuses: {
    type: 'early_bird' | 'perfect_week' | 'streak_milestone';
    points: number;
    description: string;
  }[];
}

export function BonusPointsDisplay({ bonuses }: BonusPointsProps) {
  if (bonuses.length === 0) return null;

  const bonusIcons = {
    early_bird: '🌅',
    perfect_week: '🎯',
    streak_milestone: '🏅',
  };

  return (
    <div className="flex flex-wrap gap-2">
      {bonuses.map((bonus, i) => (
        <div
          key={i}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600 text-xs font-medium"
          title={bonus.description}
        >
          <span>{bonusIcons[bonus.type]}</span>
          <span>+{bonus.points}</span>
        </div>
      ))}
    </div>
  );
}
