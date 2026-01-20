import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is admin
    const cookieStore = cookies();
    const authToken = cookieStore.get('sb-access-token')?.value;
    
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role (simplified check)
    const { data: { user } } = await supabase.auth.getUser(authToken);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Users by signup date aggregation
    const { data: usersBySignupDate } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', oneMonthAgo.toISOString())
      .order('created_at', { ascending: true });

    // Aggregate users by signup date
    const usersByDate = usersBySignupDate?.reduce((acc: Record<string, number>, user) => {
      const date = new Date(user.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {}) || {};

    // Lessons by completion rate
    const { data: allLessons } = await supabase
      .from('lessons')
      .select('id, title');

    const { data: completedLessons } = await supabase
      .from('user_progress')
      .select('lesson_id')
      .eq('completed', true);

    const lessonCompletionStats = allLessons?.map(lesson => {
      const completions = completedLessons?.filter(cp => cp.lesson_id === lesson.id).length || 0;
      const { data: totalAttempts } = supabase
        .from('user_progress')
        .select('id', { count: 'exact' })
        .eq('lesson_id', lesson.id);
      
      return {
        id: lesson.id,
        title: lesson.title,
        completions,
        attempts: totalAttempts || 0,
        completionRate: totalAttempts && totalAttempts > 0 ? (completions / totalAttempts) * 100 : 0,
      };
    }) || [];

    // Most deployed contracts
    const { data: deploymentStats } = await supabase
      .from('deployments')
      .select('contract_name, status')
      .eq('status', 'success');

    const contractDeploymentCounts = deploymentStats?.reduce((acc: Record<string, number>, deployment) => {
      const contractName = deployment.contract_name || 'Unknown';
      acc[contractName] = (acc[contractName] || 0) + 1;
      return acc;
    }, {}) || {};

    const mostDeployedContracts = Object.entries(contractDeploymentCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ contractName: name, deployments: count }));

    // Weekly user activity trend
    const { data: weeklyActivity } = await supabase
      .from('user_progress')
      .select('user_id, updated_at')
      .gte('updated_at', oneWeekAgo.toISOString());

    const weeklyActiveUsers = weeklyActivity?.reduce((acc: Record<string, Set<string>>, activity) => {
      const date = new Date(activity.updated_at).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = new Set();
      acc[date].add(activity.user_id);
      return acc;
    }, {}) || {};

    const weeklyTrend = Object.entries(weeklyActiveUsers).map(([date, users]) => ({
      date,
      activeUsers: users.size,
    }));

    // Platform health metrics
    const { data: errorLogs } = await supabase
      .from('error_logs')
      .select('created_at, error_type')
      .gte('created_at', oneWeekAgo.toISOString());

    const errorRate = errorLogs?.length || 0;

    // API usage stats
    const { data: apiLogs } = await supabase
      .from('api_logs')
      .select('endpoint, created_at, response_time')
      .gte('created_at', oneWeekAgo.toISOString());

    const apiUsage = {
      totalRequests: apiLogs?.length || 0,
      avgResponseTime: apiLogs?.length 
        ? apiLogs.reduce((sum, log) => sum + (log.response_time || 0), 0) / apiLogs.length 
        : 0,
      errorRate: errorRate / (apiLogs?.length || 1) * 100,
    };

    // Engagement metrics
    const { data: projectViews } = await supabase
      .from('project_views')
      .select('created_at')
      .gte('created_at', oneWeekAgo.toISOString());

    const { data: lessonViews } = await supabase
      .from('lesson_views')
      .select('lesson_id, created_at')
      .gte('created_at', oneWeekAgo.toISOString());

    // Popular lessons
    const lessonViewCounts = lessonViews?.reduce((acc: Record<string, number>, view) => {
      acc[view.lesson_id] = (acc[view.lesson_id] || 0) + 1;
      return acc;
    }, {}) || {};

    const popularLessons = await Promise.all(
      Object.entries(lessonViewCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(async ([lessonId, views]) => {
          const { data: lesson } = await supabase
            .from('lessons')
            .select('title')
            .eq('id', lessonId)
            .single();
          
          return {
            lessonId,
            title: lesson?.title || 'Unknown',
            views,
          };
        })
    );

    const response = {
      usersBySignupDate: Object.entries(usersByDate).map(([date, count]) => ({
        date,
        users: count,
      })),
      lessonCompletionRates: lessonCompletionStats
        .sort((a, b) => b.completionRate - a.completionRate)
        .slice(0, 10),
      mostDeployedContracts,
      weeklyTrend,
      platformHealth: {
        errorRate: errorRate / 7, // errors per day
        apiUsage,
      },
      engagement: {
        weeklyProjectViews: projectViews?.length || 0,
        weeklyLessonViews: lessonViews?.length || 0,
        popularLessons,
      },
      meta: {
        generatedAt: now.toISOString(),
        periodDays: 30,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}