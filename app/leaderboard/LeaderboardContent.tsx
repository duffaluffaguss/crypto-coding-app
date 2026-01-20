'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Podium, LeaderboardTable, type LeaderboardUser } from '@/components/leaderboard';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  id: string;
  display_name: string;
  avatar_url: string | null;
  value: number;
  rank: number;
}

interface LeaderboardData {
  byPoints: LeaderboardEntry[];
  byStreak: LeaderboardEntry[];
  byLessons: LeaderboardEntry[];
  currentUserRanks: {
    points: number | null;
    streak: number | null;
    lessons: number | null;
  };
}

interface LeaderboardContentProps {
  data: LeaderboardData;
  currentUserId: string;
}

type TabKey = 'points' | 'streak' | 'lessons';

const tabs: { key: TabKey; label: string; icon: string; description: string }[] = [
  { key: 'points', label: 'Achievement Points', icon: '🏆', description: 'Total points earned from achievements' },
  { key: 'streak', label: 'Learning Streak', icon: '🔥', description: 'Consecutive days of learning' },
  { key: 'lessons', label: 'Lessons Completed', icon: '📚', description: 'Total lessons finished' },
];

export function LeaderboardContent({ data, currentUserId }: LeaderboardContentProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('points');

  const getDataForTab = (tab: TabKey): LeaderboardUser[] => {
    switch (tab) {
      case 'points':
        return data.byPoints;
      case 'streak':
        return data.byStreak;
      case 'lessons':
        return data.byLessons;
    }
  };

  const currentUsers = getDataForTab(activeTab);
  const top3 = currentUsers.slice(0, 3);
  const rest = currentUsers.slice(3);

  const currentRank = data.currentUserRanks[activeTab];
  const currentUserInTop50 = currentUsers.some((u) => u.id === currentUserId);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">
          See how you stack up against other learners in the community
        </p>
      </div>

      {/* Your Rank Summary */}
      {currentRank && (
        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <div>
                  <div className="text-sm text-muted-foreground">Points Rank</div>
                  <div className="font-bold text-lg">#{data.currentUserRanks.points || '—'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <div>
                  <div className="text-sm text-muted-foreground">Streak Rank</div>
                  <div className="font-bold text-lg">#{data.currentUserRanks.streak || '—'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">📚</span>
                <div>
                  <div className="text-sm text-muted-foreground">Lessons Rank</div>
                  <div className="font-bold text-lg">#{data.currentUserRanks.lessons || '—'}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              activeTab === tab.key
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Active Tab Description */}
      <p className="text-sm text-muted-foreground mb-6">
        {tabs.find((t) => t.key === activeTab)?.description}
      </p>

      {/* Podium for Top 3 */}
      {top3.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>👑</span>
              <span>Top 3</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Podium
              users={top3}
              metric={activeTab}
              currentUserId={currentUserId}
            />
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span>📊</span>
            <span>Rankings</span>
            {!currentUserInTop50 && currentRank && (
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                Your rank: #{currentRank}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rest.length > 0 ? (
            <LeaderboardTable
              users={rest}
              metric={activeTab}
              currentUserId={currentUserId}
              startRank={4}
            />
          ) : top3.length > 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Only top 3 users available. Keep learning to climb the ranks!
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No leaderboard data available yet. Be the first to top the charts!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Motivational Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          💡 Complete lessons, earn achievements, and maintain your streak to climb the leaderboard!
        </p>
      </div>
    </div>
  );
}
