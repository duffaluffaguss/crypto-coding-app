import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/profile/UserAvatar';
import { FollowButtonCompact } from '@/components/social/FollowButton';
import { ArrowLeft, UserPlus } from 'lucide-react';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .single();

  const displayName = profile?.display_name || 'User';

  return {
    title: `People ${displayName} Follows | Zero to Crypto Dev`,
    description: `See who ${displayName} follows on Zero to Crypto Dev`,
  };
}

interface FollowingPageProps {
  params: Promise<{ userId: string }>;
}

export default async function FollowingPage({ params }: FollowingPageProps) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    notFound();
  }

  // Fetch following using the RPC function
  const { data: following, error: followingError } = await supabase.rpc('get_following', {
    p_user_id: userId,
    p_limit: 50,
    p_offset: 0,
  });

  if (followingError) {
    console.error('Error fetching following:', followingError);
  }

  // Get total count
  const { data: followingCount } = await supabase.rpc('get_following_count', {
    p_user_id: userId,
  });

  // Check which users the current user follows (if logged in)
  let currentUserFollowing: Set<string> = new Set();
  if (currentUser && following) {
    const { data: myFollows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUser.id)
      .in('following_id', following.map((f: any) => f.user_id));
    
    if (myFollows) {
      currentUserFollowing = new Set(myFollows.map(f => f.following_id));
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">
            Zero to Crypto Dev
          </Link>
          <div className="flex items-center gap-4">
            {currentUser ? (
              <Link href="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back link */}
        <Link
          href={`/profile/${userId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {profile.display_name || 'profile'}
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Following
              <span className="text-muted-foreground font-normal text-base ml-1">
                ({followingCount || 0})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {following && following.length > 0 ? (
              <div className="space-y-3">
                {following.map((user: any) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <Link
                      href={`/profile/${user.user_id}`}
                      className="flex items-center gap-3 min-w-0 flex-1"
                    >
                      <UserAvatar
                        displayName={user.display_name}
                        avatarUrl={user.avatar_url}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="font-medium truncate hover:text-primary transition-colors">
                          {user.display_name || 'Anonymous'}
                        </p>
                        {user.bio && (
                          <p className="text-sm text-muted-foreground truncate max-w-[250px]">
                            {user.bio}
                          </p>
                        )}
                      </div>
                    </Link>
                    <FollowButtonCompact
                      targetUserId={user.user_id}
                      currentUserId={currentUser?.id}
                      initialIsFollowing={currentUserFollowing.has(user.user_id)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Not following anyone</h3>
                <p className="text-muted-foreground">
                  {currentUser?.id === userId
                    ? 'Start following other developers to see their activity!'
                    : `${profile.display_name || 'This user'} isn't following anyone yet.`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
