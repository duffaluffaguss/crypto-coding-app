'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AchievementBadge, type Achievement, type UserAchievement } from './AchievementBadge';
import { AchievementToast, useAchievementToasts, AchievementToastContainer } from './AchievementToast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AchievementData {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  totalPoints: number;
  earnedCount: number;
  totalCount: number;
}

type CategoryFilter = 'all' | 'learning' | 'building' | 'social';

export function AchievementsSection() {
  const [data, setData] = useState<AchievementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [checking, setChecking] = useState(false);
  const { toasts, showAchievement, dismissToast } = useAchievementToasts();
  const supabase = createClient();

  const fetchAchievements = useCallback(async () => {
    try {
      const response = await fetch('/api/achievements/check');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkForNewAchievements = useCallback(async () => {
    setChecking(true);
    try {
      const response = await fetch('/api/achievements/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Show toast for each new achievement
        if (result.newAchievements?.length > 0) {
          for (const achievement of result.newAchievements) {
            showAchievement(achievement);
          }
          // Refresh the data
          await fetchAchievements();
        }
      }
    } catch (error) {
      console.error('Failed to check achievements:', error);
    } finally {
      setChecking(false);
    }
  }, [showAchievement, fetchAchievements]);

  useEffect(() => {
    fetchAchievements();
    // Check for new achievements on mount
    checkForNewAchievements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const earnedMap = new Map(
    data?.userAchievements.map((ua) => [ua.achievement_id, ua.earned_at]) || []
  );

  const filteredAchievements = data?.achievements.filter(
    (a) => selectedCategory === 'all' || a.category === selectedCategory
  ) || [];

  // Sort: earned first, then by points
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    const aEarned = earnedMap.has(a.id);
    const bEarned = earnedMap.has(b.id);
    if (aEarned !== bEarned) return aEarned ? -1 : 1;
    return b.points - a.points;
  });

  const categories: { id: CategoryFilter; label: string; icon: string }[] = [
    { id: 'all', label: 'All', icon: '🏆' },
    { id: 'learning', label: 'Learning', icon: '📖' },
    { id: 'building', label: 'Building', icon: '🔧' },
    { id: 'social', label: 'Social', icon: '👥' },
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🏆</span>
            <span>Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <AchievementToastContainer toasts={toasts} onDismiss={dismissToast} />
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span>🏆</span>
              <span>Achievements</span>
            </CardTitle>
            
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full">
                <span className="text-amber-500 font-bold">{data?.totalPoints || 0}</span>
                <span className="text-muted-foreground">points</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 rounded-full">
                <span className="text-green-500 font-bold">
                  {data?.earnedCount || 0}/{data?.totalCount || 0}
                </span>
                <span className="text-muted-foreground">earned</span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Category filter */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                  transition-colors whitespace-nowrap
                  ${selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }
                `}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
            
            <button
              onClick={checkForNewAchievements}
              disabled={checking}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={checking ? 'animate-spin' : ''}>🔄</span>
              <span>{checking ? 'Checking...' : 'Check Progress'}</span>
            </button>
          </div>

          {/* Achievement badges grid */}
          {sortedAchievements.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
              {sortedAchievements.map((achievement) => (
                <div key={achievement.id} className="flex justify-center">
                  <AchievementBadge
                    achievement={achievement}
                    earned={earnedMap.has(achievement.id)}
                    earnedAt={earnedMap.get(achievement.id)}
                    size="md"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No achievements in this category
            </div>
          )}

          {/* Progress hint */}
          {data && data.earnedCount < data.totalCount && (
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                💡 Complete lessons, deploy contracts, and share projects to unlock more achievements!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// Compact version for sidebar or header
export function AchievementsSummary() {
  const [data, setData] = useState<AchievementData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/achievements/check');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch achievements:', error);
      }
    };
    fetchData();
  }, []);

  if (!data) return null;

  // Show last 3 earned achievements
  const recentEarned = data.userAchievements
    .sort((a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime())
    .slice(0, 3)
    .map((ua) => data.achievements.find((a) => a.id === ua.achievement_id))
    .filter(Boolean) as Achievement[];

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
      <span className="text-amber-500 font-bold">{data.totalPoints}</span>
      <span className="text-xs text-muted-foreground">pts</span>
      <div className="flex -space-x-1 ml-2">
        {recentEarned.map((a) => (
          <span key={a.id} className="text-sm" title={a.name}>
            {a.icon}
          </span>
        ))}
      </div>
    </div>
  );
}
