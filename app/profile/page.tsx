import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { RestartTourButton } from '@/components/tour/RestartTourButton';
import { AchievementGrid, type Achievement, type UserAchievement } from '@/components/achievements/AchievementBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Project, ProjectType } from '@/types';

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

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch projects count
  const { count: projectsCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Fetch completed lessons count
  const { count: lessonsCount } = await supabase
    .from('learning_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'completed');

  // Fetch all achievements
  const { data: allAchievements } = await supabase
    .from('achievements')
    .select('*')
    .order('category', { ascending: true })
    .order('points', { ascending: true });

  // Fetch user's achievements with points calculation
  const { data: userAchievements } = await supabase
    .from('user_achievements')
    .select('*, achievements(*)')
    .eq('user_id', user.id);

  // Calculate achievement points
  const achievementPoints = userAchievements?.reduce((total, ua) => {
    return total + ((ua.achievements as any)?.points || 0);
  }, 0) || 0;

  // Fetch public showcase projects
  const { data: showcaseProjects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_public', true)
    .order('likes_count', { ascending: false })
    .limit(6);

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
            <Link href="/dashboard" className="text-xl font-bold text-primary">
              Zero to Crypto Dev
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Projects
            </Link>
            <Link
              href="/showcase"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Showcase
            </Link>
            <span className="text-sm font-medium text-foreground">
              Profile
            </span>
          </div>
          <div className="flex items-center gap-4">
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* Profile Card with Edit Button */}
        <div className="relative">
          <ProfileCard
            displayName={profile?.display_name}
            email={user.email}
            memberSince={profile?.created_at || user.created_at}
            stats={stats}
            isOwnProfile={true}
          />
          <div className="absolute top-4 right-4">
            <EditProfileModal
              currentDisplayName={profile?.display_name}
              userId={user.id}
            />
          </div>
        </div>

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
                  {userAchievements?.length || 0}/{allAchievements?.length || 0} earned
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {allAchievements && allAchievements.length > 0 ? (
                <AchievementGrid
                  achievements={allAchievements as Achievement[]}
                  userAchievements={(userAchievements || []).map(ua => ({
                    id: ua.id,
                    achievement_id: ua.achievement_id,
                    earned_at: ua.earned_at,
                  })) as UserAchievement[]}
                  size="sm"
                />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Complete lessons and projects to earn achievements!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Public Showcase Projects */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span>🌟</span>
                  Showcase Projects
                </CardTitle>
                <Link href="/showcase" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
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
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    Share your projects with the community!
                  </p>
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm">
                      Go to Projects
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Summary */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📊</span>
              Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <ActivityItem
                icon="🔥"
                label="Current Streak"
                value={stats.currentStreak}
                sublabel={stats.currentStreak === 1 ? 'day' : 'days'}
                highlight={stats.currentStreak >= 7}
              />
              <ActivityItem
                icon="⚡"
                label="Longest Streak"
                value={stats.longestStreak}
                sublabel={stats.longestStreak === 1 ? 'day' : 'days'}
              />
              <ActivityItem
                icon="📚"
                label="Lessons Completed"
                value={stats.lessonsCompleted}
                sublabel="total"
              />
              <ActivityItem
                icon="🏆"
                label="Achievement Points"
                value={stats.achievementPoints}
                sublabel="earned"
              />
            </div>
          </CardContent>
        </Card>

        {/* Help & Settings */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>⚙️</span>
              Help & Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">IDE Onboarding Tour</h4>
                  <p className="text-xs text-muted-foreground">
                    Reset the guided tour to see it again when you open a project
                  </p>
                </div>
                <RestartTourButton />
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

interface ActivityItemProps {
  icon: string;
  label: string;
  value: number;
  sublabel: string;
  highlight?: boolean;
}

function ActivityItem({ icon, label, value, sublabel, highlight }: ActivityItemProps) {
  return (
    <div className="text-center p-4 rounded-lg bg-muted/30">
      <div className={`text-3xl mb-2 ${highlight ? 'animate-pulse' : ''}`}>{icon}</div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-xs text-muted-foreground/70">{sublabel}</div>
    </div>
  );
}
