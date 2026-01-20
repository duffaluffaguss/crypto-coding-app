import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isAdminEmail } from '@/lib/admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckCircle, XCircle, Code } from 'lucide-react';
import { ChallengeReviewCard } from './ChallengeReviewCard';

export const metadata = {
  title: 'Challenge Review | Admin',
  description: 'Review and approve community challenges',
};

interface UserChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  starter_code: string;
  test_cases: { description: string; expectedOutput: string }[];
  solution_hint: string | null;
  points: number;
  category: string;
  is_approved: boolean;
  is_rejected: boolean;
  rejection_reason: string | null;
  created_at: string;
  creator: {
    id: string;
    display_name: string | null;
    email: string | null;
  };
}

export default async function AdminChallengesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    redirect('/dashboard');
  }

  const serviceClient = await createServiceClient();

  // Fetch all challenges with creator info
  const { data: challenges } = await serviceClient
    .from('user_challenges')
    .select(`
      *,
      creator:profiles!user_challenges_creator_id_fkey(id, display_name, email)
    `)
    .order('created_at', { ascending: false });

  const pendingChallenges = (challenges || []).filter(
    (c: UserChallenge) => !c.is_approved && !c.is_rejected
  );
  const approvedChallenges = (challenges || []).filter(
    (c: UserChallenge) => c.is_approved
  );
  const rejectedChallenges = (challenges || []).filter(
    (c: UserChallenge) => c.is_rejected
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Challenge Review</h1>
        <p className="text-muted-foreground mt-1">
          Review and approve community-created challenges
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{pendingChallenges.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{approvedChallenges.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-500/10">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{rejectedChallenges.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            Pending ({pendingChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            Approved ({approvedChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="w-4 h-4" />
            Rejected ({rejectedChallenges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingChallenges.length > 0 ? (
            pendingChallenges.map((challenge: UserChallenge) => (
              <ChallengeReviewCard
                key={challenge.id}
                challenge={challenge}
                reviewerId={user.id}
              />
            ))
          ) : (
            <Card className="bg-muted/30">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold">All Caught Up!</h3>
                <p className="text-muted-foreground">
                  No challenges pending review
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedChallenges.length > 0 ? (
            approvedChallenges.map((challenge: UserChallenge) => (
              <ChallengeReviewCard
                key={challenge.id}
                challenge={challenge}
                reviewerId={user.id}
                isReadOnly
              />
            ))
          ) : (
            <Card className="bg-muted/30">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No approved challenges yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedChallenges.length > 0 ? (
            rejectedChallenges.map((challenge: UserChallenge) => (
              <ChallengeReviewCard
                key={challenge.id}
                challenge={challenge}
                reviewerId={user.id}
                isReadOnly
              />
            ))
          ) : (
            <Card className="bg-muted/30">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No rejected challenges</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
