import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChallengeCard } from '@/components/challenges';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
}

export default async function ChallengesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get today's date in ISO format
  const today = new Date().toISOString().split('T')[0];

  // Fetch all challenges from the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const { data: challenges } = await supabase
    .from('daily_challenges')
    .select('*')
    .gte('challenge_date', sevenDaysAgoStr)
    .lte('challenge_date', today)
    .order('challenge_date', { ascending: false });

  // Fetch user's completions
  const { data: completions } = await supabase
    .from('challenge_completions')
    .select('challenge_id, points_earned')
    .eq('user_id', user.id);

  // Create a map of completions for easy lookup
  const completionMap = new Map<string, number>(
    (completions || []).map((c: Completion) => [c.challenge_id, c.points_earned])
  );

  // Calculate stats
  const totalCompleted = completions?.length || 0;
  const totalPoints = (completions || []).reduce((sum: number, c: Completion) => sum + c.points_earned, 0);

  // Separate today's challenge from past challenges
  const todayChallenge = (challenges || []).find((c: Challenge) => c.challenge_date === today);
  const pastChallenges = (challenges || []).filter((c: Challenge) => c.challenge_date !== today);

  // Calculate streak
  let streak = 0;
  const sortedChallenges = [...(challenges || [])].sort(
    (a: Challenge, b: Challenge) => new Date(b.challenge_date).getTime() - new Date(a.challenge_date).getTime()
  );
  for (const challenge of sortedChallenges) {
    if (completionMap.has(challenge.id)) {
      streak++;
    } else {
      break;
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Daily Challenges</h1>
        <p className="text-muted-foreground mt-1">
          Sharpen your smart contract skills with daily coding challenges
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Challenges Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCompleted}</div>
            <p className="text-xs text-muted-foreground mt-1">this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Points Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{totalPoints}</div>
            <p className="text-xs text-muted-foreground mt-1">from challenges</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">
              {streak} 🔥
            </div>
            <p className="text-xs text-muted-foreground mt-1">consecutive days</p>
          </CardContent>
        </Card>
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
              pointsEarned={completionMap.get(todayChallenge.id)}
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
                pointsEarned={completionMap.get(challenge.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!challenges || challenges.length === 0) && (
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
