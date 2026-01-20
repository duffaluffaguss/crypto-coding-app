import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { ProfileFollowSection } from '@/components/profile/ProfileFollowSection';
import { AchievementGrid, type Achievement, type UserAchievement } from '@/components/achievements/AchievementBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShareButton } from '@/components/social';
import type { ProjectType } from '@/types';
import type { Metadata } from 'next';

const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  nft_marketplace: 'NFT',
  token: 'Token',
  dao: 'DAO',
  game: 'Game',
  social: 'Social',
  creator: 'Creator',
};

const PROJECT_TYPE_COLORS: Record<ProjectType, string> = {
  nft_marketplace: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  token: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  dao: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  game: 'bg-green-500/10 text-green-500 border-green-500/20',
  social: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  creator: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
};

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://zerotocryptodev.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!profile) {
    return {
      title: 'Profile Not Found | Zero to Crypto Dev',
    };
  }

  // Get some stats for the OG image
  const { count: projectsCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_public', true);

  const { data: userAchievements } = await supabase
    .from('user_achievements')
    .select('id')
    .eq('user_id', userId);

  const displayName = profile.display_name || 'Web3 Developer';
  const title = `${displayName} | Zero to Crypto Dev`;
  const description = `Check out ${displayName}'s Web3 development journey on Zero to Crypto Dev. ${projectsCount || 0} projects built, ${userAchievements?.length || 0} achievements earned.`;

  const stats = JSON.stringify({
    projects: projectsCount || 0,
    achievements: userAchievements?.length || 0,
    streak: profile.current_streak || 0,
  });

  const ogImageUrl = new URL('/api/og', BASE_URL);
  ogImageUrl.searchParams.set('type', 'profile');
  ogImageUrl.searchParams.set('title', displayName);
  ogImageUrl.searchParams.set('stats', stats);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `${BASE_URL}/profile/${userId}`,
      images: [
        {
          url: ogImageUrl.toString(),
          width: 1200,
          height: 630,
          alt: `${displayName}'s Profile`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl.toString()],
    },
  };
}

interface PublicProfilePageProps {
  params: Promise<{ userId: string }>;
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // If viewing own profile, could redirect to /profile, but we'll show it here for flexibility
  const isOwnProfile = currentUser?.id === userId;

  // Fetch profile data
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    notFound();
  }

  // Fetch projects count (only public projects visible to others)
  const { count: projectsCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_public', true);

  // Fetch completed lessons count
  const { count: lessonsCount } = await supabase
    .from('learning_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed');

  // Fetch all achievements (for display)
  const { data: allAchievements } = await supabase
    .from('achievements')
    .select('*')
    .order('category', { ascending: true })
    .order('points', { ascending: true });

  // Fetch user's achievements with points calculation
  const { data: userAchievements } = await supabase
    .from('user_achievements')
    .select('*, achievements(*)')
    .eq('user_id', userId);

  // Calculate achievement points
  const achievementPoints = userAchievements?.reduce((total, ua) => {
    return total + ((ua.achievements as any)?.points || 0);
  }, 0) || 0;

  // Fetch public showcase projects
  const { data: showcaseProjects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .eq('is_public', true)
    .order('likes_count', { ascending: false })
    .limit(6);

  // Calculate user's points rank for league badge
  const { count: pointsRankCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gt('achievement_points', achievementPoints);
  
  const pointsRank = (pointsRankCount ?? 0) + 1;

  // Fetch follow data
  const [followerCountResult, followingCountResult, isFollowingResult] = await Promise.all([
    supabase.rpc('get_follower_count', { p_user_id: userId }),
    supabase.rpc('get_following_count', { p_user_id: userId }),
    currentUser
      ? supabase.rpc('is_following', {
          p_follower_id: currentUser.id,
          p_following_id: userId,
        })
      : Promise.resolve({ data: false }),
  ]);

  const followerCount = followerCountResult.data || 0;
  const followingCount = followingCountResult.data || 0;
  const isFollowing = isFollowingResult.data || false;

  const stats = {
    projectsCreated: projectsCount || 0,
    lessonsCompleted: lessonsCount || 0,
    currentStreak: profile?.current_streak || 0,
    longestStreak: profile?.longest_streak || 0,
    achievementPoints,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-primary">
              Zero to Crypto Dev
            </Link>
            <Link
              href="/showcase"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Showcase
            </Link>
            {currentUser && (
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                My Projects
              </Link>
            )}
          </div>
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

      <main className="container mx-auto px-4 py-8">
        {/* Header with back link and share */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/showcase"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Showcase
          </Link>
          <ShareButton
            shareData={{
              title: `${profile.display_name || 'Web3 Developer'} on Zero to Crypto Dev`,
              text: `Check out ${profile.display_name || 'this developer'}'s Web3 projects on Zero to Crypto Dev! 🚀`,
              url: `${BASE_URL}/profile/${userId}`,
            }}
            previewTitle={profile.display_name || 'Web3 Developer'}
            previewDescription={`${stats.projectsCreated} projects built • ${userAchievements?.length || 0} achievements earned`}
            variant="outline"
            size="sm"
          />
        </div>

        {/* Profile Card */}
        <ProfileCard
          userId={userId}
          displayName={profile.display_name}
          bio={profile.bio}
          avatarUrl={profile.avatar_url}
          socialLinks={{
            websiteUrl: profile.website_url,
            twitterHandle: profile.twitter_handle,
            githubUsername: profile.github_username,
            discordUsername: profile.discord_username,
          }}
          memberSince={profile.created_at}
          stats={stats}
          isOwnProfile={isOwnProfile}
          pointsRank={pointsRank}
        />

        {/* Follow Section */}
        <ProfileFollowSection
          userId={userId}
          currentUserId={currentUser?.id}
          followerCount={followerCount}
          followingCount={followingCount}
          initialIsFollowing={isFollowing}
          className="mt-4"
        />

        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          {/* Achievements Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span>🏆</span>
                  Achievements
                </CardTitle>
                <span className="text-sm text-muted-foreground">
                  {userAchievements?.length || 0} earned
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {userAchievements && userAchievements.length > 0 ? (
                <AchievementGrid
                  achievements={(allAchievements || []).filter(a => 
                    userAchievements.some(ua => ua.achievement_id === a.id)
                  ) as Achievement[]}
                  userAchievements={(userAchievements || []).map(ua => ({
                    id: ua.id,
                    achievement_id: ua.achievement_id,
                    earned_at: ua.earned_at,
                  })) as UserAchievement[]}
                  size="sm"
                />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No achievements earned yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Public Showcase Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🌟</span>
                Showcase Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showcaseProjects && showcaseProjects.length > 0 ? (
                <div className="space-y-3">
                  {showcaseProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/showcase/${project.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full border ${
                            PROJECT_TYPE_COLORS[project.project_type as ProjectType]
                          }`}
                        >
                          {PROJECT_TYPE_LABELS[project.project_type as ProjectType]}
                        </span>
                        <span className="font-medium truncate group-hover:text-primary transition-colors">
                          {project.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        <span className="text-sm">{project.likes_count || 0}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No public projects yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
