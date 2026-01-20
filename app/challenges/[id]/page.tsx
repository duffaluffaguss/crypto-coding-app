'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import {
  calculateBonuses,
  getWeekBoundaries,
  type BonusPoints,
  getTotalBonusPoints,
} from '@/lib/challenge-bonuses';

// Dynamically import Monaco to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[400px] bg-muted rounded-lg">
      <div className="text-muted-foreground">Loading editor...</div>
    </div>
  ),
});

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  starter_code: string;
  solution_hint: string | null;
  points: number;
  challenge_date: string;
  category: string;
}

interface Completion {
  id: string;
  code_submitted: string;
  points_earned: number;
  bonus_points: number;
  completed_at: string;
}

const difficultyColors = {
  beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const difficultyLabels = {
  beginner: '🌱 Beginner',
  intermediate: '🔥 Intermediate',
  advanced: '⚡ Advanced',
};

export default function ChallengePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [completion, setCompletion] = useState<Completion | null>(null);
  const [code, setCode] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [earnedBonuses, setEarnedBonuses] = useState<BonusPoints[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch challenge and completion data
  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      // Fetch challenge
      const { data: challengeData, error: challengeError } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('id', params.id)
        .single();

      if (challengeError || !challengeData) {
        setError('Challenge not found');
        setLoading(false);
        return;
      }

      setChallenge(challengeData);
      
      // Fetch existing completion
      const { data: completionData } = await supabase
        .from('challenge_completions')
        .select('*')
        .eq('challenge_id', params.id)
        .eq('user_id', user.id)
        .single();

      if (completionData) {
        setCompletion(completionData);
        setCode(completionData.code_submitted);
      } else {
        setCode(challengeData.starter_code);
      }

      setLoading(false);
    }

    fetchData();
  }, [params.id, router, supabase]);

  // Submit solution
  async function handleSubmit() {
    if (!challenge || !userId || !code.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      // Check if already completed
      if (completion) {
        // Update existing completion
        const { error: updateError } = await supabase
          .from('challenge_completions')
          .update({
            code_submitted: code,
            completed_at: new Date().toISOString(),
          })
          .eq('id', completion.id);

        if (updateError) throw updateError;
      } else {
        // Calculate challenge streak and bonuses
        const now = new Date();
        const { start: weekStart, end: weekEnd } = getWeekBoundaries(now);
        
        // Get current week's completions count
        const { count: weekCompletions } = await supabase
          .from('challenge_completions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('completed_at', weekStart.toISOString())
          .lte('completed_at', weekEnd.toISOString());
        
        // Get all challenges and completions for streak calculation
        const { data: allChallenges } = await supabase
          .from('daily_challenges')
          .select('id, challenge_date')
          .lte('challenge_date', challenge.challenge_date)
          .order('challenge_date', { ascending: false })
          .limit(100);
        
        const { data: userCompletions } = await supabase
          .from('challenge_completions')
          .select('challenge_id, daily_challenges!inner(challenge_date)')
          .eq('user_id', userId);
        
        // Calculate new streak
        const completedDates = new Set(
          (userCompletions || []).map((c: any) => c.daily_challenges?.challenge_date)
        );
        completedDates.add(challenge.challenge_date); // Add current
        
        let newStreak = 0;
        for (const ch of allChallenges || []) {
          if (completedDates.has(ch.challenge_date)) {
            newStreak++;
          } else {
            break;
          }
        }
        
        // Calculate bonuses
        const bonuses = calculateBonuses({
          completedAt: now,
          challengeDate: challenge.challenge_date,
          newStreak,
          weekCompletions: (weekCompletions || 0) + 1,
        });
        
        const bonusPoints = getTotalBonusPoints(bonuses);
        const totalPoints = challenge.points + bonusPoints;
        
        // Create new completion
        const { error: insertError } = await supabase
          .from('challenge_completions')
          .insert({
            user_id: userId,
            challenge_id: challenge.id,
            code_submitted: code,
            points_earned: challenge.points,
            bonus_points: bonusPoints,
          });

        if (insertError) throw insertError;

        // Update user's achievement points
        await supabase.rpc('increment_achievement_points', {
          user_uuid: userId,
          points_to_add: totalPoints,
        });
        
        // Update user's challenge streak
        const { data: profile } = await supabase
          .from('profiles')
          .select('challenge_streak, longest_challenge_streak')
          .eq('id', userId)
          .single();
        
        const longestStreak = Math.max(newStreak, profile?.longest_challenge_streak || 0);
        
        await supabase
          .from('profiles')
          .update({
            challenge_streak: newStreak,
            longest_challenge_streak: longestStreak,
          })
          .eq('id', userId);
        
        setEarnedBonuses(bonuses);
      }

      setSubmitSuccess(true);
      
      // Refetch completion data
      const { data: newCompletion } = await supabase
        .from('challenge_completions')
        .select('*')
        .eq('challenge_id', challenge.id)
        .eq('user_id', userId)
        .single();

      if (newCompletion) {
        setCompletion(newCompletion);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to submit solution. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Reset code to starter
  function handleReset() {
    if (challenge && confirm('Reset code to starter template? Your changes will be lost.')) {
      setCode(challenge.starter_code);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="h-[400px] bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error && !challenge) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="py-8">
            <div className="text-4xl mb-4">😕</div>
            <h2 className="text-xl font-semibold mb-2">Challenge Not Found</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Link href="/challenges">
              <Button>Back to Challenges</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!challenge) return null;

  const formattedDate = new Date(challenge.challenge_date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link
        href="/challenges"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Challenges
      </Link>

      {/* Challenge Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {completion && (
                <Badge variant="outline" className="border-green-500 text-green-500">
                  ✓ Completed
                </Badge>
              )}
              <Badge variant="outline" className={difficultyColors[challenge.difficulty]}>
                {difficultyLabels[challenge.difficulty]}
              </Badge>
              <Badge variant="secondary">
                {challenge.points} points
              </Badge>
            </div>
            <h1 className="text-3xl font-bold">{challenge.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{formattedDate}</p>
          </div>
        </div>
        <p className="text-muted-foreground max-w-3xl">{challenge.description}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Code Editor - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="py-3 px-4 border-b flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Solution.sol</span>
                <Badge variant="secondary" className="text-xs">
                  Solidity
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={submitting}
                >
                  Reset
                </Button>
              </div>
            </CardHeader>
            <div className="h-[450px]">
              <MonacoEditor
                height="100%"
                defaultLanguage="sol"
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  automaticLayout: true,
                  tabSize: 4,
                  insertSpaces: true,
                }}
              />
            </div>
          </Card>

          {/* Submit Section */}
          <div className="flex items-center justify-between">
            <div>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              {submitSuccess && !error && (
                <div className="text-sm text-green-500">
                  <p className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {completion ? 'Solution updated!' : `Challenge completed! +${challenge.points} pts`}
                  </p>
                  {earnedBonuses.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {earnedBonuses.map((bonus, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 text-xs"
                        >
                          {bonus.type === 'early_bird' && '🌅'}
                          {bonus.type === 'perfect_week' && '🎯'}
                          {bonus.type === 'streak_milestone' && '🏅'}
                          +{bonus.points} {bonus.description}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={submitting || !code.trim()}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : completion ? (
                'Update Solution'
              ) : (
                'Submit Solution'
              )}
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Hint Card */}
          {challenge.solution_hint && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  💡 Need a Hint?
                </CardTitle>
                <CardDescription>
                  Stuck? Reveal a hint to help you along.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {showHint ? (
                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    {challenge.solution_hint}
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowHint(true)}
                  >
                    Reveal Hint
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Completion Info */}
          {completion && (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-green-500 flex items-center gap-2">
                  ✓ Challenge Completed
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Points:</span>
                  <span className="font-semibold">{completion.points_earned}</span>
                </div>
                {completion.bonus_points > 0 && (
                  <div className="flex justify-between text-yellow-600">
                    <span>Bonus Points:</span>
                    <span className="font-semibold">+{completion.bonus_points}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold text-primary">
                    {completion.points_earned + (completion.bonus_points || 0)} pts
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed:</span>
                  <span className="font-semibold">
                    {new Date(completion.completed_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">📝 Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Read the TODOs in the starter code carefully</p>
              <p>• Use proper Solidity syntax and best practices</p>
              <p>• Don&apos;t forget visibility modifiers (public, private)</p>
              <p>• Test your logic mentally before submitting</p>
            </CardContent>
          </Card>

          {/* Category Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base capitalize">
                📁 {challenge.category}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>This challenge focuses on {challenge.category} development skills.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
