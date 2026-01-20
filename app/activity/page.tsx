import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ActivityFeed } from '@/components/activity';
import { Activity, Users, TrendingUp } from 'lucide-react';

export const metadata = {
  title: 'Activity Feed | Zero to Crypto Dev',
  description: 'See what the community is building and learning',
};

async function getActivityStats() {
  const supabase = await createClient();

  // Get activity counts for the last 24 hours
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const { count: todayCount } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneDayAgo.toISOString());

  // Get unique active users in last 24 hours
  const { data: activeUsers } = await supabase
    .from('activities')
    .select('user_id')
    .gte('created_at', oneDayAgo.toISOString());

  const uniqueActiveUsers = new Set(activeUsers?.map((a) => a.user_id)).size;

  // Get total activities
  const { count: totalCount } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true });

  return {
    todayCount: todayCount || 0,
    activeUsers: uniqueActiveUsers,
    totalCount: totalCount || 0,
  };
}

export default async function ActivityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const stats = await getActivityStats();

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Community Activity</h1>
        </div>
        <p className="text-muted-foreground">
          See what everyone in the community is building and learning
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-500/10">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.todayCount}</p>
              <p className="text-sm text-muted-foreground">Activities today</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-500/10">
              <Users className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
              <p className="text-sm text-muted-foreground">Active users today</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-purple-500/10">
              <Activity className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalCount.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total activities</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <ActivityFeed showFilters={true} />
    </div>
  );
}
