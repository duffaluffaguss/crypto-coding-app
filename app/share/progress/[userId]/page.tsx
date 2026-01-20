import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, bio')
    .eq('id', userId)
    .single();

  if (!profile) {
    return {
      title: 'User not found - Zero to Crypto Dev',
    };
  }

  const displayName = profile.display_name || 'Anonymous Developer';
  
  return {
    title: `${displayName}'s Web3 Learning Journey - Zero to Crypto Dev`,
    description: `Check out ${displayName}'s progress on Zero to Crypto Dev - the best platform to learn Web3 development from zero to hero.`,
    openGraph: {
      title: `${displayName}'s Web3 Learning Journey`,
      description: `Check out ${displayName}'s progress on Zero to Crypto Dev`,
      images: [`/api/og/progress?userId=${userId}`],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName}'s Web3 Learning Journey`,
      description: `Check out ${displayName}'s progress on Zero to Crypto Dev`,
      images: [`/api/og/progress?userId=${userId}`],
    },
  };
}

export default async function ShareProgressPage({ params }: PageProps) {
  const { userId } = await params;
  const supabase = await createClient();

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!profile) {
    notFound();
  }

  // Fetch user stats
  const [
    { count: projectsCount },
    { count: lessonsCount },
    { data: userAchievements },
    { data: challengeCompletions },
    { data: publicProjects }
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('learning_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed'),
    supabase
      .from('user_achievements')
      .select('*, achievements(*)')
      .eq('user_id', userId),
    supabase
      .from('challenge_completions')
      .select('points_earned, bonus_points')
      .eq('user_id', userId),
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .eq('is_public', true)
      .order('likes_count', { ascending: false })
      .limit(3)
  ]);

  // Calculate stats
  const achievementPoints = userAchievements?.reduce((total, ua) => {
    return total + ((ua.achievements as any)?.points || 0);
  }, 0) || 0;

  const challengeStats = {
    totalCompleted: challengeCompletions?.length || 0,
    totalPoints: (challengeCompletions || []).reduce(
      (sum, c) => sum + (c.points_earned || 0) + (c.bonus_points || 0),
      0
    ),
  };

  const stats = {
    projectsCreated: projectsCount || 0,
    lessonsCompleted: lessonsCount || 0,
    currentStreak: profile.current_streak || 0,
    longestStreak: profile.longest_streak || 0,
    achievementPoints,
    challengePoints: challengeStats.totalPoints,
    totalAchievements: userAchievements?.length || 0,
    challengesCompleted: challengeStats.totalCompleted,
  };

  const displayName = profile.display_name || 'Anonymous Developer';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Header */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">
            Zero to Crypto Dev
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Start Learning</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-primary/10 to-secondary/10 text-primary rounded-full text-sm mb-4">
              <span>🌟</span>
              Web3 Learning Journey
            </div>
            <h1 className="text-4xl font-bold mb-2">{displayName}</h1>
            {profile.bio && (
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {profile.bio}
              </p>
            )}
            
            {/* Member Since */}
            <p className="text-sm text-muted-foreground mt-4">
              Building since{' '}
              {new Date(profile.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
              })}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon="📚"
              value={stats.lessonsCompleted}
              label="Lessons Completed"
              color="from-green-500/10 to-emerald-500/10"
              textColor="text-green-600"
            />
            <StatCard
              icon="🔥"
              value={stats.currentStreak}
              label={`Day Streak ${stats.longestStreak > stats.currentStreak ? `(Best: ${stats.longestStreak})` : ''}`}
              color="from-orange-500/10 to-red-500/10"
              textColor="text-orange-600"
              highlight={stats.currentStreak >= 7}
            />
            <StatCard
              icon="🚀"
              value={stats.projectsCreated}
              label="Projects Built"
              color="from-purple-500/10 to-violet-500/10"
              textColor="text-purple-600"
            />
            <StatCard
              icon="🏆"
              value={stats.achievementPoints}
              label="Achievement Points"
              color="from-yellow-500/10 to-amber-500/10"
              textColor="text-yellow-600"
            />
          </div>

          {/* Additional Stats */}
          {(stats.totalAchievements > 0 || stats.challengesCompleted > 0) && (
            <div className="flex justify-center gap-8 mb-8">
              {stats.totalAchievements > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xl">🏅</span>
                  <span>{stats.totalAchievements} Achievements Earned</span>
                </div>
              )}
              {stats.challengesCompleted > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xl">🎯</span>
                  <span>{stats.challengesCompleted} Challenges Completed</span>
                </div>
              )}
            </div>
          )}

          <Separator className="my-8" />

          {/* Public Projects */}
          {publicProjects && publicProjects.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🌟</span>
                  Featured Projects
                </CardTitle>
                <CardDescription>
                  Check out some of {displayName.split(' ')[0]}'s Web3 creations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {publicProjects.map((project) => (
                    <div
                      key={project.id}
                      className="p-4 bg-muted/50 rounded-lg border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="capitalize">
                          {project.project_type.replace('_', ' ')}
                        </Badge>
                        {project.likes_count > 0 && (
                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                            {project.likes_count}
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold mb-2">{project.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                      {project.status === 'deployed' && (
                        <div className="mt-2">
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-1" />
                            Deployed
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* CTA Section */}
          <div className="text-center py-12 px-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border">
            <h2 className="text-2xl font-bold mb-4">Ready to Start Your Web3 Journey?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join {displayName} and thousands of other developers learning Web3 development 
              from zero to hero. Build real projects, earn achievements, and become a blockchain developer.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Learning for Free
                  <svg
                    className="ml-2 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Button>
              </Link>
              <Link href="/showcase">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Explore Projects
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground text-sm space-y-2">
            <p>Built with Zero to Crypto Dev - The #1 Web3 learning platform</p>
            <div className="flex justify-center items-center gap-4 text-xs">
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/help" className="hover:text-foreground transition-colors">Help</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface StatCardProps {
  icon: string;
  value: number;
  label: string;
  color: string;
  textColor: string;
  highlight?: boolean;
}

function StatCard({ icon, value, label, color, textColor, highlight }: StatCardProps) {
  return (
    <Card className={`${highlight ? 'ring-2 ring-primary/50' : ''}`}>
      <CardContent className="p-6">
        <div className={`p-4 rounded-lg bg-gradient-to-br ${color} mb-4`}>
          <div className="text-center">
            <div className="text-3xl mb-2">{icon}</div>
            <div className={`text-3xl font-bold ${textColor} ${highlight ? 'animate-pulse' : ''}`}>
              {value}
            </div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground text-center">{label}</div>
      </CardContent>
    </Card>
  );
}