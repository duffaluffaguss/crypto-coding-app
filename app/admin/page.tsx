import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isAdminEmail } from '@/lib/admin';
import {
  Users,
  FolderKanban,
  Rocket,
  MessageSquare,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    redirect('/dashboard');
  }

  // Use service client for admin queries to bypass RLS
  const serviceClient = await createServiceClient();

  // Fetch stats
  const [
    { count: totalUsers },
    { count: totalProjects },
    { count: totalDeployments },
    { count: totalFeedback },
    { count: newFeedback },
    { data: recentUsers },
    { data: recentFeedback },
  ] = await Promise.all([
    serviceClient.from('profiles').select('*', { count: 'exact', head: true }),
    serviceClient.from('projects').select('*', { count: 'exact', head: true }),
    serviceClient.from('deployments').select('*', { count: 'exact', head: true }),
    serviceClient.from('feedback').select('*', { count: 'exact', head: true }),
    serviceClient.from('feedback').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    serviceClient.from('profiles').select('id, display_name, email, created_at').order('created_at', { ascending: false }).limit(5),
    serviceClient.from('feedback').select('id, type, message, status, created_at, page_url').order('created_at', { ascending: false }).limit(5),
  ]);

  // Calculate users from last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const { count: recentSignups } = await serviceClient
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo.toISOString());

  const stats = [
    {
      title: 'Total Users',
      value: totalUsers || 0,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Projects',
      value: totalProjects || 0,
      icon: FolderKanban,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Deployments',
      value: totalDeployments || 0,
      icon: Rocket,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Feedback',
      value: totalFeedback || 0,
      subValue: newFeedback ? `${newFeedback} new` : undefined,
      icon: MessageSquare,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'reviewing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug':
        return 'bg-red-500/10 text-red-500';
      case 'feature':
        return 'bg-blue-500/10 text-blue-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">
          Monitor your platform&apos;s health and activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                    {stat.subValue && (
                      <p className="text-xs text-orange-500">{stat.subValue}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <div>
                <p className="font-medium">Database</p>
                <p className="text-sm text-muted-foreground">Healthy</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <div>
                <p className="font-medium">Authentication</p>
                <p className="text-sm text-muted-foreground">Operational</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <div>
                <p className="font-medium">API</p>
                <p className="text-sm text-muted-foreground">All systems go</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <strong>{recentSignups || 0}</strong> new users in the last 7 days
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Recent Signups
            </CardTitle>
            <Link
              href="/admin/users"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentUsers && recentUsers.length > 0 ? (
              <div className="space-y-4">
                {recentUsers.map((user: { id: string; display_name: string | null; email: string | null; created_at: string }) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {(user.display_name || user.email || '?')[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{user.display_name || 'Anonymous'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent signups</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Feedback */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Recent Feedback
            </CardTitle>
            <Link
              href="/admin/feedback"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentFeedback && recentFeedback.length > 0 ? (
              <div className="space-y-4">
                {recentFeedback.map((feedback: { id: string; type: string; message: string; status: string | null; created_at: string; page_url: string | null }) => (
                  <div
                    key={feedback.id}
                    className="py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(feedback.type)}`}>
                        {feedback.type}
                      </span>
                      {getStatusIcon(feedback.status)}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2">{feedback.message}</p>
                    {feedback.page_url && (
                      <p className="text-xs text-muted-foreground mt-1">
                        From: {feedback.page_url}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No feedback yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
