import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, CheckCircle, Lightbulb, Trophy } from 'lucide-react';
import { CommunityChallengeEditor } from './CommunityChallengeEditor';

interface Props {
  params: Promise<{ id: string }>;
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

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: challenge } = await supabase
    .from('user_challenges')
    .select('title')
    .eq('id', id)
    .eq('is_approved', true)
    .single();

  return {
    title: challenge?.title ? `${challenge.title} | Community Challenge` : 'Community Challenge',
  };
}

export default async function CommunityChallengePageWrapper({ params }: Props) {
  const { id } = await params;
  return <CommunityChallengePage id={id} />;
}

async function CommunityChallengePage({ id }: { id: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/challenges/community/${id}`);
  }

  // Fetch the challenge with creator info
  const { data: challenge, error } = await supabase
    .from('user_challenges')
    .select(`
      *,
      creator:profiles!user_challenges_creator_id_fkey(display_name)
    `)
    .eq('id', id)
    .eq('is_approved', true)
    .single();

  if (error || !challenge) {
    notFound();
  }

  // Check if user has completed this challenge
  const { data: completion } = await supabase
    .from('user_challenge_completions')
    .select('*')
    .eq('user_id', user.id)
    .eq('challenge_id', id)
    .single();

  // Get completion count
  const { count: completionCount } = await supabase
    .from('user_challenge_completions')
    .select('*', { count: 'exact', head: true })
    .eq('challenge_id', id);

  const isCompleted = !!completion;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link href="/challenges">
        <Button variant="ghost" size="sm" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Challenges
        </Button>
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Challenge Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                  <Users className="w-3 h-3 mr-1" />
                  Community
                </Badge>
                {isCompleted && (
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl">{challenge.title}</CardTitle>
              <CardDescription>
                Created by {challenge.creator?.display_name || 'Anonymous'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className={difficultyColors[challenge.difficulty as keyof typeof difficultyColors]}>
                  {difficultyLabels[challenge.difficulty as keyof typeof difficultyLabels]}
                </Badge>
                <Badge variant="outline">{challenge.category}</Badge>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span className="font-semibold">{challenge.points} pts</span>
                </div>
                {completionCount !== null && completionCount > 0 && (
                  <div className="text-muted-foreground">
                    {completionCount} completion{completionCount !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {challenge.description}
              </p>
            </CardContent>
          </Card>

          {/* Test Cases */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Requirements</CardTitle>
              <CardDescription>Your code should pass these test cases</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(challenge.test_cases || []).map((tc: { description: string; expectedOutput: string }, idx: number) => (
                <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">#{idx + 1}: {tc.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Expected: {tc.expectedOutput}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Hint */}
          {challenge.solution_hint && (
            <Card className="bg-yellow-500/5 border-yellow-500/20">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Hint</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {challenge.solution_hint}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Code Editor */}
        <div className="lg:col-span-2">
          <CommunityChallengeEditor
            challengeId={challenge.id}
            userId={user.id}
            starterCode={challenge.starter_code}
            points={challenge.points}
            isCompleted={isCompleted}
            previousCode={completion?.code_submitted}
          />
        </div>
      </div>
    </div>
  );
}
