'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Podium, LeaderboardTable, type LeaderboardUser } from '@/components/leaderboard';
import { LeagueBadge, LeagueLegend } from '@/components/leaderboard/LeagueBadge';
import { cn } from '@/lib/utils';
import { type TimePeriod, type RisingStarUser, getLeagueFromRank } from '@/lib/leaderboard';

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
  risingStars: RisingStarUser[];
}

interface LeaderboardContentProps {
  allTimeData: LeaderboardData;
  weekData: LeaderboardData;
  monthData: LeaderboardData;
  currentUserId: string;
  initialPeriod: TimePeriod;
}

type TabKey = 'points' | 'streak' | 'lessons';

const metricTabs: { key: TabKey; label: string; icon: string; description: string }[] = [
  { key: 'points', label: 'Achievement Points', icon: '🏆', description: 'Total points earned from achievements' },
  { key: 'streak', label: 'Learning Streak', icon: '🔥', description: 'Consecutive days of learning' },
  { key: 'lessons', label: 'Lessons Completed', icon: '📚', description: 'Total lessons finished' },
];

const periodTabs: { key: TimePeriod; label: string; description: string }[] = [
  { key: 'all', label: 'All Time', description: 'Overall rankings' },
  { key: 'week', label: 'This Week', description: 'Rankings since Monday' },
  { key: 'month', label: 'This Month', description: 'Rankings this month' },
];

export function LeaderboardContent({
  allTimeData,
  weekData,
  monthData,
  currentUserId,
  initialPeriod,
}: LeaderboardContentProps) {
  const router = useRouter();
  const [activeMetric, setActiveMetric] = useState<TabKey>('points');
  const [activePeriod, setActivePeriod] = useState<TimePeriod>(initialPeriod);

  const getDataForPeriod = (period: TimePeriod): LeaderboardData => {
    switch (period) {
      case 'week':
        return weekData;
      case 'month':
        return monthData;
      case 'all':
      default:
        return allTimeData;
    }
  };

  const currentData = getDataForPeriod(activePeriod);

  const getDataForMetric = (metric: TabKey): LeaderboardUser[] => {
    switch (metric) {
      case 'points':
        return currentData.byPoints;
      case 'streak':
        return currentData.byStreak;
      case 'lessons':
        return currentData.byLessons;
    }
  };

  const currentUsers = getDataForMetric(activeMetric);
  const top3 = currentUsers.slice(0, 3);
  const rest = currentUsers.slice(3);

  const currentRank = currentData.currentUserRanks[activeMetric];
  const currentUserInTop50 = currentUsers.some((u) => u.id === currentUserId);

  // Get user's league based on all-time points rank
  const userAllTimePointsRank = allTimeData.currentUserRanks.points;
  const userLeague = getLeagueFromRank(userAllTimePointsRank);

  const handlePeriodChange = (period: TimePeriod) => {
    setActivePeriod(period);
    router.push(`/leaderboard?period=${period}`, { scroll: false });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">
          See how you stack up against other learners in the community
        </p>
      </div>

      {/* Your Rank Summary with League Badge */}
      <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex flex-col items-center gap-4">
            {/* League Badge */}
            {userAllTimePointsRank && (
              <div className="flex flex-col items-center gap-2">
                <LeagueBadge rank={userAllTimePointsRank} size="lg" />
                <span className="text-sm text-muted-foreground">
                  Your League (All-Time Rank #{userAllTimePointsRank})
                </span>
              </div>
            )}
            
            {/* Ranks */}
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <div>
                  <div className="text-sm text-muted-foreground">Points Rank</div>
                  <div className="font-bold text-lg">#{allTimeData.currentUserRanks.points || '—'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <div>
                  <div className="text-sm text-muted-foreground">Streak Rank</div>
                  <div className="font-bold text-lg">#{allTimeData.currentUserRanks.streak || '—'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">📚</span>
                <div>
                  <div className="text-sm text-muted-foreground">Lessons Rank</div>
                  <div className="font-bold text-lg">#{allTimeData.currentUserRanks.lessons || '—'}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* League Legend */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <span>🏅</span>
            <span>Leagues</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LeagueLegend />
        </CardContent>
      </Card>

      {/* Time Period Tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {periodTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handlePeriodChange(tab.key)}
              className={cn(
                'px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap border',
                activePeriod === tab.key
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border-border'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {periodTabs.find((t) => t.key === activePeriod)?.description}
        </p>
      </div>

      {/* Rising Stars Section (only show for all-time or if there's data) */}
      {allTimeData.risingStars.length > 0 && (
        <Card className="mb-6 bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span>🚀</span>
              <span>Rising Stars</span>
              <span className="text-sm font-normal text-muted-foreground ml-2">
                Biggest improvement this week
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {allTimeData.risingStars.map((star, index) => (
                <Link
                  key={star.id}
                  href={`/profile/${star.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background transition-colors min-w-[200px] flex-1 max-w-[300px]"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    {star.avatar_url ? (
                      <img
                        src={star.avatar_url}
                        alt={star.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-bold">
                        {star.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{star.display_name}</div>
                    <div className="text-sm text-green-500 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      +{star.improvement} pts
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metric Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {metricTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveMetric(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              activeMetric === tab.key
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
        {metricTabs.find((t) => t.key === activeMetric)?.description}
        {activePeriod !== 'all' && activeMetric === 'streak' && (
          <span className="ml-1 text-amber-500">
            (Showing days active this {activePeriod === 'week' ? 'week' : 'month'})
          </span>
        )}
      </p>

      {/* No Data Message for filtered periods */}
      {currentUsers.length === 0 && activePeriod !== 'all' && (
        <Card className="mb-6">
          <CardContent className="py-8 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">No activity yet this {activePeriod === 'week' ? 'week' : 'month'}</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to climb the {periodTabs.find((t) => t.key === activePeriod)?.label.toLowerCase()} leaderboard!
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Start Learning
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Podium for Top 3 */}
      {top3.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>👑</span>
              <span>Top 3</span>
              {activePeriod !== 'all' && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({periodTabs.find((t) => t.key === activePeriod)?.label})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Podium
              users={top3}
              metric={activeMetric}
              currentUserId={currentUserId}
            />
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Table */}
      {currentUsers.length > 0 && (
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
                metric={activeMetric}
                currentUserId={currentUserId}
                startRank={4}
              />
            ) : top3.length > 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Only top 3 users available. Keep learning to climb the ranks!
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Motivational Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          💡 Complete lessons, earn achievements, and maintain your streak to climb the leaderboard!
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Leagues are based on your all-time points rank. Keep earning to reach Diamond! 💎
        </p>
      </div>
    </div>
  );
}
