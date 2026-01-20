import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChallengeCard, ChallengeStats } from '@/components/challenges';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateWeeklyProgress, calculateChallengeStreak, getWeekBoundaries } from '@/lib/challenge-bonuses';

export const metadata = {
  title: 'Daily Challenges | Zero to Crypto Dev',
  description: 'Complete daily coding challenges to sharpen your smart contract skills',
};

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  points: number;
  challenge_date: string;
  category: string;
}

interface Completion {
  challenge_id: string;
  points_earned: number;
  bonus_points: number;
  challenge_date?: string;
}

export default async function ChallengesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get today's date in ISO format
  const today = new Date().toISOString().split('T')[0];

  // Fetch all challenges from the last 30 days for streak calculation
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  // Get last 7 days for display
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const { data: allChallenges } = await supabase
    .from('daily_challenges')
    .select('*')
    .gte('challenge_date', thirtyDaysAgoStr)
    .lte('challenge_date', today)
    .order('challenge_date', { ascending: false });

  // Fetch user's completions with challenge dates
  const { data: completions } = await supabase
    .from('challenge_completions')
    .select(`
      challenge_id,
      points_earned,
      bonus_points,
      daily_challenges!inner(challenge_date)
    `)
    .eq('user_id', user.id);

  // Fetch all-time completions for total points
  const { data: allTimeCompletions } = await supabase
    .from('challenge_completions')
    .select('points_earned, bonus_points')
    .eq('user_id', user.id);

  // Create a map of completions for easy lookup
  const completionMap = new Map<string, { points: number; bonus: number }>(
    (completions || []).map((c: any) => [
      c.challenge_id,
      { points: c.points_earned || 0, bonus: c.bonus_points || 0 },
    ])
  );

  // Get completed challenge dates for streak and weekly progress
  const completedChallengeDates = (completions || []).map(
    (c: any) => c.daily_challenges?.challenge_date
  ).filter(Boolean);

  // Calculate stats
  const totalCompleted = allTimeCompletions?.length || 0;
  const totalPoints = (allTimeCompletions || []).reduce(
    (sum: number, c: any) => sum + (c.points_earned || 0) + (c.bonus_points || 0),
    0
  );

  // Calculate streak properly
  const streak = calculateChallengeStreak(
    completedChallengeDates.map((d: string) => ({ challenge_date: d })),
    (allChallenges || []).map((c: Challenge) => ({ challenge_date: c.challenge_date }))
  );

  // Generate weekly progress
  const weeklyProgress = generateWeeklyProgress(completedChallengeDates);

  // Get longest streak from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('challenge_streak, longest_challenge_streak')
    .eq('id', user.id)
    .single();

  const longestStreak = profile?.longest_challenge_streak || streak;

  // Separate challenges for display (last 7 days)
  const recentChallenges = (allChallenges || []).filter(
    (c: Challenge) => c.challenge_date >= sevenDaysAgoStr
  );
  const todayChallenge = recentChallenges.find((c: Challenge) => c.challenge_date === today);
  const pastChallenges = recentChallenges.filter((c: Challenge) => c.challenge_date !== today);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Daily Challenges</h1>
          <p className="text-muted-foreground mt-1">
            Sharpen your smart contract skills with daily coding challenges
          </p>
        </div>
        <Link href="/challenges/leaderboard">
          <Button variant="outline" className="gap-2">
            <span>🏆</span>
            Leaderboard
          </Button>
        </Link>
      </div>

      {/* Stats Section */}
      <div className="mb-8">
        <ChallengeStats
          streak={streak}
          totalPoints={totalPoints}
          weeklyProgress={weeklyProgress}
          totalCompleted={totalCompleted}
          longestStreak={longestStreak}
        />
      </div>

      {/* Today's Challenge */}
      {todayChallenge ? (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="animate-pulse">🎯</span> Today&apos;s Challenge
          </h2>
          <div className="max-w-2xl">
            <ChallengeCard
              challenge={todayChallenge}
              isToday={true}
              isCompleted={completionMap.has(todayChallenge.id)}
              pointsEarned={
                completionMap.has(todayChallenge.id)
                  ? completionMap.get(todayChallenge.id)!.points +
                    completionMap.get(todayChallenge.id)!.bonus
                  : undefined
              }
            />
          </div>
        </div>
      ) : (
        <Card className="mb-8 bg-muted/50">
          <CardContent className="py-8 text-center">
            <div className="text-4xl mb-3">📅</div>
            <h3 className="text-lg font-semibold">No Challenge Today</h3>
            <p className="text-muted-foreground">Check back tomorrow for a new challenge!</p>
          </CardContent>
        </Card>
      )}

      {/* Bonus Points Info */}
      <Card className="mb-8 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 border-yellow-500/20">
        <CardContent className="py-4">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <span>🎁</span> Earn Bonus Points
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-lg">🌅</span>
              <div>
                <div className="font-medium">Early Bird</div>
                <div className="text-muted-foreground">+10 pts for completing within the first hour</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-lg">🎯</span>
              <div>
                <div className="font-medium">Perfect Week</div>
                <div className="text-muted-foreground">+50 pts for 7/7 challenges</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-lg">🏅</span>
              <div>
                <div className="font-medium">Streak Milestones</div>
                <div className="text-muted-foreground">+25/100/500 pts at 7/30/100 days</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Past Challenges */}
      {pastChallenges.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Past Challenges</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastChallenges.map((challenge: Challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                isCompleted={completionMap.has(challenge.id)}
                pointsEarned={
                  completionMap.has(challenge.id)
                    ? completionMap.get(challenge.id)!.points +
                      completionMap.get(challenge.id)!.bonus
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!allChallenges || allChallenges.length === 0) && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <span className="text-3xl">🚀</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Challenges Coming Soon</h3>
            <p className="text-muted-foreground">
              Daily challenges will be available soon. Check back later!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
