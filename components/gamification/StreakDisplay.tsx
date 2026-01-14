'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
}

export function StreakDisplay() {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const updateAndFetchStreak = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Call the streak update function
      const { data, error } = await supabase.rpc('update_user_streak', {
        user_uuid: user.id,
      });

      if (error) {
        // If the function doesn't exist yet, just fetch current values
        const { data: profile } = await supabase
          .from('profiles')
          .select('current_streak, longest_streak, last_active_date')
          .eq('id', user.id)
          .single();

        if (profile) {
          setStreak({
            current_streak: profile.current_streak || 0,
            longest_streak: profile.longest_streak || 0,
            last_active_date: profile.last_active_date,
          });
        }
        return;
      }

      if (data) {
        setStreak(data);
      }
    };

    updateAndFetchStreak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!streak) {
    return null;
  }

  const getStreakEmoji = (days: number) => {
    if (days >= 30) return '🔥';
    if (days >= 14) return '⚡';
    if (days >= 7) return '✨';
    if (days >= 3) return '🌟';
    return '💪';
  };

  const getStreakMessage = (days: number) => {
    if (days >= 30) return "You're on fire! 30+ day streak!";
    if (days >= 14) return 'Amazing! 2 week streak going strong!';
    if (days >= 7) return 'Great work! A full week of learning!';
    if (days >= 3) return 'Nice streak! Keep it going!';
    if (days >= 1) return "You're building momentum!";
    return 'Start your streak today!';
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 text-orange-500 rounded-full text-sm font-medium cursor-default">
        <span className="text-base">{getStreakEmoji(streak.current_streak)}</span>
        <span>{streak.current_streak}</span>
        <span className="text-xs opacity-75">day{streak.current_streak !== 1 ? 's' : ''}</span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 w-48 p-3 bg-popover border border-border rounded-lg shadow-lg z-50">
          <div className="text-sm font-medium mb-2">
            {getStreakMessage(streak.current_streak)}
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Current streak:</span>
              <span className="font-medium text-foreground">{streak.current_streak} days</span>
            </div>
            <div className="flex justify-between">
              <span>Longest streak:</span>
              <span className="font-medium text-foreground">{streak.longest_streak} days</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
            Come back tomorrow to keep your streak!
          </div>
        </div>
      )}
    </div>
  );
}
