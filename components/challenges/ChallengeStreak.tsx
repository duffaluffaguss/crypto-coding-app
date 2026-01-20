'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ChallengeStreakProps {
  compact?: boolean;
  showCalendar?: boolean;
}

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_challenge_date?: string;
}

const MILESTONE_POINTS = {
  3: 10,   // 3 day milestone
  7: 25,   // 1 week milestone
  14: 50,  // 2 week milestone
  30: 100, // 1 month milestone
  60: 200, // 2 month milestone
  100: 500 // 100 day milestone
};

const MILESTONES = Object.keys(MILESTONE_POINTS).map(Number).sort((a, b) => a - b);

export function ChallengeStreak({ compact = false, showCalendar = false }: ChallengeStreakProps) {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchStreakData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('challenge_streak, longest_challenge_streak')
        .eq('id', user.id)
        .single();

      if (data) {
        setStreakData({
          current_streak: data.challenge_streak || 0,
          longest_streak: data.longest_challenge_streak || 0,
        });
      }
      setLoading(false);
    };

    fetchStreakData();
  }, [supabase]);

  const getNextMilestone = (currentStreak: number) => {
    return MILESTONES.find(milestone => milestone > currentStreak) || null;
  };

  const getMilestoneProgress = (currentStreak: number) => {
    const nextMilestone = getNextMilestone(currentStreak);
    if (!nextMilestone) return { progress: 100, text: 'All milestones reached!' };
    
    const previousMilestone = MILESTONES.filter(m => m <= currentStreak).pop() || 0;
    const progressRange = nextMilestone - previousMilestone;
    const currentProgress = currentStreak - previousMilestone;
    const percentage = Math.round((currentProgress / progressRange) * 100);
    
    return {
      progress: percentage,
      text: `${currentStreak}/${nextMilestone} days to next milestone`,
      nextReward: MILESTONE_POINTS[nextMilestone],
      daysLeft: nextMilestone - currentStreak
    };
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 100) return '🌟';
    if (streak >= 60) return '💎';
    if (streak >= 30) return '🏆';
    if (streak >= 14) return '⚡';
    if (streak >= 7) return '🔥';
    if (streak >= 3) return '✨';
    return '🔥';
  };

  const getStreakLabel = (streak: number) => {
    if (streak >= 100) return 'Legend';
    if (streak >= 60) return 'Diamond';
    if (streak >= 30) return 'Champion';
    if (streak >= 14) return 'On Fire';
    if (streak >= 7) return 'Hot Streak';
    if (streak >= 3) return 'Getting Hot';
    return 'Building';
  };

  if (loading) {
    return compact ? (
      <div className="h-6 w-20 animate-pulse bg-muted rounded" />
    ) : (
      <div className="h-32 w-full animate-pulse bg-muted rounded-lg" />
    );
  }

  if (!streakData) {
    return compact ? (
      <div className="flex items-center gap-1 text-sm">
        <span>🔥</span>
        <span>0</span>
      </div>
    ) : null;
  }

  const { current_streak, longest_streak } = streakData;
  const milestoneInfo = getMilestoneProgress(current_streak);

  if (compact) {
    return (
      <div className="flex items-center gap-2" title={`${current_streak} day challenge streak`}>
        <div className="flex items-center gap-1">
          <span className="text-lg">{getStreakEmoji(current_streak)}</span>
          <span className="font-bold text-orange-500">{current_streak}</span>
        </div>
        {current_streak >= 3 && (
          <Badge variant="secondary" className="text-xs">
            {getStreakLabel(current_streak)}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="text-2xl">{getStreakEmoji(current_streak)}</span>
          Challenge Streak
        </CardTitle>
        <CardDescription>Daily coding challenge consistency</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-500">{current_streak}</div>
            <div className="text-xs text-muted-foreground">Current</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-muted-foreground">{longest_streak}</div>
            <div className="text-xs text-muted-foreground">Best Ever</div>
          </div>
          <div className="text-center">
            <Badge variant="outline" className="border-orange-500 text-orange-500">
              {getStreakLabel(current_streak)}
            </Badge>
          </div>
        </div>

        {/* Milestone Progress */}
        {milestoneInfo.text !== 'All milestones reached!' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{milestoneInfo.text}</span>
              <span className="text-primary font-medium">
                +{milestoneInfo.nextReward} pts
              </span>
            </div>
            <Progress value={milestoneInfo.progress} className="h-2" />
            <div className="text-xs text-muted-foreground text-center">
              {milestoneInfo.daysLeft} {milestoneInfo.daysLeft === 1 ? 'day' : 'days'} to milestone bonus
            </div>
          </div>
        )}

        {/* Milestone Badges */}
        <div className="flex flex-wrap gap-1">
          {MILESTONES.map((milestone) => {
            const achieved = current_streak >= milestone;
            return (
              <Badge
                key={milestone}
                variant={achieved ? 'default' : 'secondary'}
                className={`text-xs ${
                  achieved 
                    ? 'bg-orange-500 text-white' 
                    : 'opacity-50'
                }`}
              >
                {milestone}d
              </Badge>
            );
          })}
        </div>

        {current_streak === 0 && (
          <div className="text-center text-sm text-muted-foreground bg-muted/50 rounded p-3">
            💡 Complete today's challenge to start your streak!
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ChallengeStreakCompact({ streak }: { streak: number }) {
  return (
    <div className="flex items-center gap-1 text-sm">
      <span className="text-orange-500">{getStreakEmoji(streak)}</span>
      <span className="font-medium text-orange-500">{streak}</span>
      <span className="text-muted-foreground">day streak</span>
    </div>
  );
}

// Utility function for external use
export const getStreakEmoji = (streak: number) => {
  if (streak >= 100) return '🌟';
  if (streak >= 60) return '💎';
  if (streak >= 30) return '🏆';
  if (streak >= 14) return '⚡';
  if (streak >= 7) return '🔥';
  if (streak >= 3) return '✨';
  return '🔥';
};

export const getStreakBonusPoints = (streakDay: number) => {
  return MILESTONE_POINTS[streakDay] || 0;
};