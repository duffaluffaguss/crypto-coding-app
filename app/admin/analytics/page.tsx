'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  FolderGit2,
  GraduationCap,
  Rocket,
  TrendingUp,
  Activity,
  Eye,
  Calendar,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { StatCard } from '@/components/admin/StatCard';
import { Chart } from '@/components/admin/Chart';

interface AnalyticsData {
  stats: {
    totalUsers: number;
    newUsers: number;
    newUsersChange: number;
    dau: number;
    wau: number;
    mau: number;
    totalProjects: number;
    newProjects: number;
    newProjectsChange: number;
    totalLessonsCompleted: number;
    lessonsCompletedPeriod: number;
    lessonsChange: number;
    deploymentSuccessRate: number;
    deploymentSuccessRateChange: number;
    totalDeployments: number;
  };
  charts: {
    userGrowth: Array<{ date: string; count: number }>;
    projects: Array<{ date: string; count: number }>;
    lessons: Array<{ date: string; count: number }>;
    deployments: Array<{ date: string; count: number }>;
  };
  topProjects: Array<{
    id: string;
    title: string;
    view_count: number;
    user_id: string;
  }>;
}

const CHART_COLORS = {
  primary: '#8b5cf6',
  secondary: '#06b6d4',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?days=${dateRange}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-24 mb-4"></div>
              <div className="h-8 bg-muted rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'No data available'}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const activeUsersData = [
    { name: 'DAU', value: data.stats.dau, color: CHART_COLORS.primary },
    { name: 'WAU', value: data.stats.wau, color: CHART_COLORS.secondary },
    { name: 'MAU', value: data.stats.mau, color: CHART_COLORS.success },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Platform performance and user engagement metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="New Users"
          value={data.stats.newUsers}
          change={data.stats.newUsersChange}
          icon={Users}
          iconColor="text-violet-500"
        />
        <StatCard
          title="Projects Created"
          value={data.stats.newProjects}
          change={data.stats.newProjectsChange}
          icon={FolderGit2}
          iconColor="text-cyan-500"
        />
        <StatCard
          title="Lessons Completed"
          value={data.stats.lessonsCompletedPeriod}
          change={data.stats.lessonsChange}
          icon={GraduationCap}
          iconColor="text-green-500"
        />
        <StatCard
          title="Deployment Success"
          value={`${data.stats.deploymentSuccessRate}%`}
          change={data.stats.deploymentSuccessRateChange}
          icon={Rocket}
          iconColor="text-orange-500"
        />
      </div>

      {/* Active Users Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-sm font-medium">Daily Active Users</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{data.stats.dau}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-sm font-medium">Weekly Active Users</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{data.stats.wau}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-sm font-medium">Monthly Active Users</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{data.stats.mau}</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart title="User Growth" subtitle="New signups over time">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.charts.userGrowth}>
              <defs>
                <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#666"
                fontSize={12}
              />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                }}
                labelFormatter={formatDate}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={CHART_COLORS.primary}
                fill="url(#userGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Chart>

        <Chart title="Projects Created" subtitle="New projects over time">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.charts.projects}>
              <defs>
                <linearGradient id="projectGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#666"
                fontSize={12}
              />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                }}
                labelFormatter={formatDate}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={CHART_COLORS.secondary}
                fill="url(#projectGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Chart>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart title="Lessons Completed" subtitle="Learning progress over time">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.charts.lessons}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#666"
                fontSize={12}
              />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                }}
                labelFormatter={formatDate}
              />
              <Bar dataKey="count" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Chart>

        <Chart title="Deployments" subtitle="Deployment activity over time">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.charts.deployments}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#666"
                fontSize={12}
              />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                }}
                labelFormatter={formatDate}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke={CHART_COLORS.warning}
                strokeWidth={2}
                dot={{ fill: CHART_COLORS.warning, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Chart>
      </div>

      {/* Top Projects */}
      <Chart title="Top Projects by Views" subtitle="Most viewed projects on the platform">
        <div className="space-y-4">
          {data.topProjects.length > 0 ? (
            data.topProjects.map((project, index) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-muted-foreground">
                    #{index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{project.title}</p>
                    <p className="text-sm text-muted-foreground">
                      ID: {project.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  <span className="font-semibold">{project.view_count.toLocaleString()}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No project data available
            </p>
          )}
        </div>
      </Chart>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20 rounded-xl p-6">
          <p className="text-sm text-violet-400 font-medium">Total Users</p>
          <p className="text-3xl font-bold text-foreground mt-2">
            {data.stats.totalUsers.toLocaleString()}
          </p>
        </div>
        <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-xl p-6">
          <p className="text-sm text-cyan-400 font-medium">Total Projects</p>
          <p className="text-3xl font-bold text-foreground mt-2">
            {data.stats.totalProjects.toLocaleString()}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl p-6">
          <p className="text-sm text-green-400 font-medium">Lessons Completed</p>
          <p className="text-3xl font-bold text-foreground mt-2">
            {data.stats.totalLessonsCompleted.toLocaleString()}
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-xl p-6">
          <p className="text-sm text-orange-400 font-medium">Total Deployments</p>
          <p className="text-3xl font-bold text-foreground mt-2">
            {data.stats.totalDeployments.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
