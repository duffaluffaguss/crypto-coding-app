import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/profile/UserAvatar';
import { getWeekBoundaries } from '@/lib/challenge-bonuses';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Challenge Leaderboard | Zero to Crypto Dev',
  description: 'See the top challenge completers in the community',
};

interface LeaderboardEntry {
  id: string;
  display_name: string;
  avatar_url: string | null;
  points: number;
  streak: number;
  completions: number;
  rank: number;
}

async function getChallengeLeaderboard(supabase: any, userId: string) {
  const { start: weekStart, end: weekEnd } = getWeekBoundaries();

  // Get all-time challenge stats by aggregating completions
  const { data: allTimeData } = await supabase
    .from('challenge_completions')
    .select(`
      user_id,
      points_earned,
      bonus_points
    `);

  // Aggregate by user
  const userStatsMap = new Map<string, { points: number; completions: number }>();
  
  allTimeData?.forEach((c: any) => {
    const current = userStatsMap.get(c.user_id) || { points: 0, completions: 0 };
    userStatsMap.set(c.user_id, {
      points: current.points + (c.points_earned || 0) + (c.bonus_points || 0),
      completions: current.completions + 1,
    });
  });

  // Get profiles for users with completions
  const userIds = Array.from(userStatsMap.keys());
  let profilesMap = new Map<string, { display_name: string; avatar_url: string | null; challenge_streak: number }>();
  
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, challenge_streak')
      .in('id', userIds);
    
    profiles?.forEach((p: any) => {
      profilesMap.set(p.id, {
        display_name: p.display_name || 'Anonymous',
        avatar_url: p.avatar_url,
        challenge_streak: p.challenge_streak || 0,
      });
    });
  }

  // Build all-time leaderboard
  const allTimeLeaderboard: LeaderboardEntry[] = Array.from(userStatsMap.entries())
    .map(([id, stats]) => ({
      id,
      display_name: profilesMap.get(id)?.display_name || 'Anonymous',
      avatar_url: profilesMap.get(id)?.avatar_url || null,
      points: stats.points,
      streak: profilesMap.get(id)?.challenge_streak || 0,
      completions: stats.completions,
      rank: 0,
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 50)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  // Get weekly challenge completions
  const { data: weeklyData } = await supabase
    .from('challenge_completions')
    .select(`
      user_id,
      points_earned,
      bonus_points,
      completed_at
    `)
    .gte('completed_at', weekStart.toISOString())
    .lte('completed_at', weekEnd.toISOString());

  // Aggregate weekly by user
  const weeklyStatsMap = new Map<string, { points: number; completions: number }>();
  
  weeklyData?.forEach((c: any) => {
    const current = weeklyStatsMap.get(c.user_id) || { points: 0, completions: 0 };
    weeklyStatsMap.set(c.user_id, {
      points: current.points + (c.points_earned || 0) + (c.bonus_points || 0),
      completions: current.completions + 1,
    });
  });

  // Get profiles for weekly users
  const weeklyUserIds = Array.from(weeklyStatsMap.keys());
  if (weeklyUserIds.length > 0) {
    const { data: weeklyProfiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, challenge_streak')
      .in('id', weeklyUserIds);
    
    weeklyProfiles?.forEach((p: any) => {
      if (!profilesMap.has(p.id)) {
        profilesMap.set(p.id, {
          display_name: p.display_name || 'Anonymous',
          avatar_url: p.avatar_url,
          challenge_streak: p.challenge_streak || 0,
        });
      }
    });
  }

  // Build weekly leaderboard
  const weeklyLeaderboard: LeaderboardEntry[] = Array.from(weeklyStatsMap.entries())
    .map(([id, stats]) => ({
      id,
      display_name: profilesMap.get(id)?.display_name || 'Anonymous',
      avatar_url: profilesMap.get(id)?.avatar_url || null,
      points: stats.points,
      streak: profilesMap.get(id)?.challenge_streak || 0,
      completions: stats.completions,
      rank: 0,
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 50)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  // Find current user's ranks
  const allTimeRank = allTimeLeaderboard.findIndex(e => e.id === userId);
  const weeklyRank = weeklyLeaderboard.findIndex(e => e.id === userId);

  // Get current user stats if not in top 50
  let currentUserAllTime: LeaderboardEntry | null = null;
  let currentUserWeekly: LeaderboardEntry | null = null;

  if (allTimeRank === -1 && userStatsMap.has(userId)) {
    const stats = userStatsMap.get(userId)!;
    const profile = profilesMap.get(userId);
    // Count how many users have more points
    const higherCount = Array.from(userStatsMap.values()).filter(s => s.points > stats.points).length;
    currentUserAllTime = {
      id: userId,
      display_name: profile?.display_name || 'You',
      avatar_url: profile?.avatar_url || null,
      points: stats.points,
      streak: profile?.challenge_streak || 0,
      completions: stats.completions,
      rank: higherCount + 1,
    };
  }

  if (weeklyRank === -1 && weeklyStatsMap.has(userId)) {
    const stats = weeklyStatsMap.get(userId)!;
    const profile = profilesMap.get(userId);
    const higherCount = Array.from(weeklyStatsMap.values()).filter(s => s.points > stats.points).length;
    currentUserWeekly = {
      id: userId,
      display_name: profile?.display_name || 'You',
      avatar_url: profile?.avatar_url || null,
      points: stats.points,
      streak: profile?.challenge_streak || 0,
      completions: stats.completions,
      rank: higherCount + 1,
    };
  }

  return {
    allTime: allTimeLeaderboard,
    weekly: weeklyLeaderboard,
    currentUserAllTimeRank: allTimeRank !== -1 ? allTimeRank + 1 : currentUserAllTime?.rank || null,
    currentUserWeeklyRank: weeklyRank !== -1 ? weeklyRank + 1 : currentUserWeekly?.rank || null,
    currentUserAllTime: allTimeRank !== -1 ? allTimeLeaderboard[allTimeRank] : currentUserAllTime,
    currentUserWeekly: weeklyRank !== -1 ? weeklyLeaderboard[weeklyRank] : currentUserWeekly,
  };
}

export default async function ChallengeLeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { 
    allTime, 
    weekly, 
    currentUserAllTimeRank, 
    currentUserWeeklyRank,
    currentUserAllTime,
    currentUserWeekly,
  } = await getChallengeLeaderboard(supabase, user.id);

  const rankBadges = ['🥇', '🥈', '🥉'];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/challenges"
            className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1"
          >
            ← Back to Challenges
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span>🏆</span>
            Challenge Leaderboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Top challengers in the Zero to Crypto Dev community
          </p>
        </div>
      </div>

      {/* Your Stats Summary */}
      {(currentUserAllTime || currentUserWeekly) && (
        <Card className="mb-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="py-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span>📊</span> Your Challenge Rankings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                  #{currentUserWeeklyRank || '-'}
                </div>
                <div>
                  <div className="font-medium">This Week</div>
                  <div className="text-sm text-muted-foreground">
                    {currentUserWeekly ? `${currentUserWeekly.points} pts • ${currentUserWeekly.completions} completed` : 'No completions yet'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-2xl font-bold text-yellow-500">
                  #{currentUserAllTimeRank || '-'}
                </div>
                <div>
                  <div className="font-medium">All Time</div>
                  <div className="text-sm text-muted-foreground">
                    {currentUserAllTime ? `${currentUserAllTime.points} pts • ${currentUserAllTime.completions} completed` : 'No completions yet'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* This Week */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📅</span>
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weekly.length > 0 ? (
              <div className="space-y-3">
                {weekly.slice(0, 10).map((entry, index) => (
                  <LeaderboardRow
                    key={entry.id}
                    entry={entry}
                    isCurrentUser={entry.id === user.id}
                    badge={index < 3 ? rankBadges[index] : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-3">🏁</div>
                <p>No completions this week yet.</p>
                <p className="text-sm">Be the first to complete a challenge!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>👑</span>
              All Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allTime.length > 0 ? (
              <div className="space-y-3">
                {allTime.slice(0, 10).map((entry, index) => (
                  <LeaderboardRow
                    key={entry.id}
                    entry={entry}
                    isCurrentUser={entry.id === user.id}
                    badge={index < 3 ? rankBadges[index] : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-3">🏁</div>
                <p>No completions yet.</p>
                <p className="text-sm">Be the first to complete a challenge!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Streaks Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🔥</span>
            Longest Streaks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allTime.filter(e => e.streak > 0).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...allTime]
                .sort((a, b) => b.streak - a.streak)
                .slice(0, 6)
                .map((entry, index) => (
                  <div
                    key={entry.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg bg-muted/50',
                      entry.id === user.id && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                    )}
                  >
                    <div className="text-xl">{index < 3 ? rankBadges[index] : `#${index + 1}`}</div>
                    <UserAvatar
                      displayName={entry.display_name}
                      avatarUrl={entry.avatar_url}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{entry.display_name}</div>
                      <div className="text-sm text-orange-500 font-semibold">
                        {entry.streak} day streak 🔥
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No active streaks yet. Start your streak today!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="mt-8 text-center">
        <Link href="/challenges">
          <Button size="lg" className="gap-2">
            <span>🎯</span>
            Start Today&apos;s Challenge
          </Button>
        </Link>
      </div>
    </div>
  );
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  badge?: string;
}

function LeaderboardRow({ entry, isCurrentUser, badge }: LeaderboardRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-colors',
        isCurrentUser
          ? 'bg-primary/10 ring-1 ring-primary/30'
          : 'bg-muted/50 hover:bg-muted'
      )}
    >
      <div className="w-8 text-center">
        {badge ? (
          <span className="text-xl">{badge}</span>
        ) : (
          <span className="text-sm font-medium text-muted-foreground">#{entry.rank}</span>
        )}
      </div>
      <UserAvatar
        displayName={entry.display_name}
        avatarUrl={entry.avatar_url}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">
          {entry.display_name}
          {isCurrentUser && <span className="ml-2 text-xs text-primary">(You)</span>}
        </div>
        <div className="text-xs text-muted-foreground">
          {entry.completions} completed
          {entry.streak > 0 && <span className="ml-2">• {entry.streak} day streak 🔥</span>}
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold text-primary">{entry.points}</div>
        <div className="text-xs text-muted-foreground">points</div>
      </div>
    </div>
  );
}
