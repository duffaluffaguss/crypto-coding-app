import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/profile/UserAvatar';
import { FollowButtonCompact } from '@/components/social/FollowButton';
import { ArrowLeft, Users } from 'lucide-react';
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
    title: `${displayName}'s Followers | Zero to Crypto Dev`,
    description: `See who follows ${displayName} on Zero to Crypto Dev`,
  };
}

interface FollowersPageProps {
  params: Promise<{ userId: string }>;
}

export default async function FollowersPage({ params }: FollowersPageProps) {
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

  // Fetch followers using the RPC function
  const { data: followers, error: followersError } = await supabase.rpc('get_followers', {
    p_user_id: userId,
    p_limit: 50,
    p_offset: 0,
  });

  if (followersError) {
    console.error('Error fetching followers:', followersError);
  }

  // Get total count
  const { data: followerCount } = await supabase.rpc('get_follower_count', {
    p_user_id: userId,
  });

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
              <Users className="w-5 h-5" />
              Followers
              <span className="text-muted-foreground font-normal text-base ml-1">
                ({followerCount || 0})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {followers && followers.length > 0 ? (
              <div className="space-y-3">
                {followers.map((follower: any) => (
                  <div
                    key={follower.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <Link
                      href={`/profile/${follower.user_id}`}
                      className="flex items-center gap-3 min-w-0 flex-1"
                    >
                      <UserAvatar
                        displayName={follower.display_name}
                        avatarUrl={follower.avatar_url}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="font-medium truncate hover:text-primary transition-colors">
                          {follower.display_name || 'Anonymous'}
                        </p>
                        {follower.bio && (
                          <p className="text-sm text-muted-foreground truncate max-w-[250px]">
                            {follower.bio}
                          </p>
                        )}
                      </div>
                    </Link>
                    <div className="flex items-center gap-2 ml-2">
                      {follower.is_following_back && (
                        <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full">
                          Follows you
                        </span>
                      )}
                      <FollowButtonCompact
                        targetUserId={follower.user_id}
                        currentUserId={currentUser?.id}
                        initialIsFollowing={follower.is_following_back}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No followers yet</h3>
                <p className="text-muted-foreground">
                  Be the first to follow {profile.display_name || 'this user'}!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
