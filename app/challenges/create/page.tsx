import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChallengeForm } from '@/components/challenges/ChallengeForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Lightbulb, CheckCircle, Clock, Users } from 'lucide-react';

export const metadata = {
  title: 'Create Challenge | Zero to Crypto Dev',
  description: 'Create a coding challenge for the community',
};

export default async function CreateChallengePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/challenges/create');
  }

  // Get user's challenge stats
  const { data: stats } = await supabase.rpc('get_user_created_challenges_count', {
    user_uuid: user.id
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/challenges">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Challenges
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create a Challenge</h1>
        <p className="text-muted-foreground mt-1">
          Share your knowledge by creating a coding challenge for the community
        </p>
      </div>

      {/* User Stats */}
      {stats && (stats.total_created > 0) && (
        <Card className="mb-8 bg-muted/30">
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span><strong>{stats.total_created}</strong> challenges created</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span><strong>{stats.approved_count}</strong> approved</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span><strong>{stats.pending_count}</strong> pending review</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guidelines */}
      <Card className="mb-8 bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-blue-500/20">
        <CardContent className="py-4">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            Guidelines for a Great Challenge
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              Clear, concise title and description
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              Well-structured starter code with TODOs
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              Specific test cases with expected behavior
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              Appropriate difficulty level
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              Helpful hint without giving away the solution
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              Focus on teaching a specific concept
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Form */}
      <ChallengeForm userId={user.id} />
    </div>
  );
}
