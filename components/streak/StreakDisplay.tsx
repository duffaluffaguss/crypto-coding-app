'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface StreakDisplayProps {
  compact?: boolean;
}

export function StreakDisplay({ compact = false }: StreakDisplayProps) {
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchStreak = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setStreak(data.current_streak);
      }
      setLoading(false);
    };

    fetchStreak();
  }, [supabase]);

  if (loading) {
    return compact ? (
      <div className="h-6 w-12 animate-pulse bg-muted rounded" />
    ) : (
      <div className="h-16 w-32 animate-pulse bg-muted rounded-lg" />
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-sm" title={`${streak} day streak`}>
        <span className="text-orange-500">🔥</span>
        <span className="font-medium">{streak}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
      <div className="text-3xl">🔥</div>
      <div>
        <div className="text-2xl font-bold text-orange-500">{streak}</div>
        <div className="text-xs text-muted-foreground">
          {streak === 1 ? 'day streak' : 'day streak'}
        </div>
      </div>
      {streak >= 7 && (
        <div className="ml-auto">
          <span className="text-xs bg-orange-500/20 text-orange-500 px-2 py-1 rounded-full">
            {streak >= 30 ? '🏆 Legend' : streak >= 14 ? '⭐ On Fire' : '✨ Hot'}
          </span>
        </div>
      )}
    </div>
  );
}

export function StreakCalendar() {
  const [activity, setActivity] = useState<Record<string, boolean>>({});
  const supabase = createClient();

  useEffect(() => {
    const fetchActivity = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get last 30 days of activity from learning_progress
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data } = await supabase
        .from('learning_progress')
        .select('completed_at')
        .eq('user_id', user.id)
        .gte('completed_at', thirtyDaysAgo.toISOString());

      if (data) {
        const activityMap: Record<string, boolean> = {};
        data.forEach((item) => {
          if (item.completed_at) {
            const date = new Date(item.completed_at).toDateString();
            activityMap[date] = true;
          }
        });
        setActivity(activityMap);
      }
    };

    fetchActivity();
  }, [supabase]);

  // Generate last 30 days
  const days = [...Array(30)].map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date;
  });

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground">Last 30 Days</div>
      <div className="flex gap-1 flex-wrap">
        {days.map((date, i) => {
          const isActive = activity[date.toDateString()];
          const isToday = date.toDateString() === new Date().toDateString();
          return (
            <div
              key={i}
              className={`w-3 h-3 rounded-sm ${
                isActive
                  ? 'bg-green-500'
                  : isToday
                  ? 'bg-muted-foreground/30 ring-1 ring-primary'
                  : 'bg-muted'
              }`}
              title={`${date.toLocaleDateString()}${isActive ? ' - Active' : ''}`}
            />
          );
        })}
      </div>
    </div>
  );
}
