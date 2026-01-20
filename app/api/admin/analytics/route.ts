import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    // User growth - signups over time
    const { data: userSignups, error: userError } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Previous period for comparison
    const { data: previousUserSignups } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    // Total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Active users (users who have activity in the period)
    const { data: activeUsersData } = await supabase
      .from('user_progress')
      .select('user_id')
      .gte('updated_at', startDate.toISOString());
    
    const activeUsers = new Set(activeUsersData?.map(u => u.user_id) || []).size;

    // DAU (last 24 hours)
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const { data: dauData } = await supabase
      .from('user_progress')
      .select('user_id')
      .gte('updated_at', dayAgo.toISOString());
    const dau = new Set(dauData?.map(u => u.user_id) || []).size;

    // WAU (last 7 days)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const { data: wauData } = await supabase
      .from('user_progress')
      .select('user_id')
      .gte('updated_at', weekAgo.toISOString());
    const wau = new Set(wauData?.map(u => u.user_id) || []).size;

    // MAU (last 30 days)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const { data: mauData } = await supabase
      .from('user_progress')
      .select('user_id')
      .gte('updated_at', monthAgo.toISOString());
    const mau = new Set(mauData?.map(u => u.user_id) || []).size;

    // Projects created
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('created_at, view_count, title, id')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    const { data: previousProjects } = await supabase
      .from('projects')
      .select('id')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    const { count: totalProjects } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    // Top projects by views
    const { data: topProjects } = await supabase
      .from('projects')
      .select('id, title, view_count, user_id')
      .order('view_count', { ascending: false })
      .limit(5);

    // Lessons completed
    const { data: lessonsCompleted } = await supabase
      .from('user_progress')
      .select('lesson_id, completed_at')
      .eq('completed', true)
      .gte('completed_at', startDate.toISOString())
      .order('completed_at', { ascending: true });

    const { data: previousLessons } = await supabase
      .from('user_progress')
      .select('lesson_id')
      .eq('completed', true)
      .gte('completed_at', previousStartDate.toISOString())
      .lt('completed_at', startDate.toISOString());

    const { count: totalLessonsCompleted } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('completed', true);

    // Deployments
    const { data: deploymentsData } = await supabase
      .from('deployments')
      .select('created_at, status')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    const { data: previousDeployments } = await supabase
      .from('deployments')
      .select('status')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    const totalDeployments = deploymentsData?.length || 0;
    const successfulDeployments = deploymentsData?.filter(d => d.status === 'success').length || 0;
    const deploymentSuccessRate = totalDeployments > 0 
      ? Math.round((successfulDeployments / totalDeployments) * 100) 
      : 0;

    const prevTotalDeployments = previousDeployments?.length || 0;
    const prevSuccessfulDeployments = previousDeployments?.filter(d => d.status === 'success').length || 0;
    const prevDeploymentSuccessRate = prevTotalDeployments > 0 
      ? Math.round((prevSuccessfulDeployments / prevTotalDeployments) * 100) 
      : 0;

    // Aggregate daily data for charts
    const aggregateByDay = (data: any[], dateField: string) => {
      const grouped: Record<string, number> = {};
      data?.forEach(item => {
        const date = new Date(item[dateField]).toISOString().split('T')[0];
        grouped[date] = (grouped[date] || 0) + 1;
      });
      
      // Fill in missing days
      const result = [];
      for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        result.push({
          date: dateStr,
          count: grouped[dateStr] || 0,
        });
      }
      return result;
    };

    const userGrowthChart = aggregateByDay(userSignups || [], 'created_at');
    const projectsChart = aggregateByDay(projectsData || [], 'created_at');
    const lessonsChart = aggregateByDay(lessonsCompleted || [], 'completed_at');
    const deploymentsChart = aggregateByDay(deploymentsData || [], 'created_at');

    // Calculate percentage changes
    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const response = {
      stats: {
        totalUsers: totalUsers || 0,
        newUsers: userSignups?.length || 0,
        newUsersChange: calcChange(userSignups?.length || 0, previousUserSignups?.length || 0),
        dau,
        wau,
        mau,
        totalProjects: totalProjects || 0,
        newProjects: projectsData?.length || 0,
        newProjectsChange: calcChange(projectsData?.length || 0, previousProjects?.length || 0),
        totalLessonsCompleted: totalLessonsCompleted || 0,
        lessonsCompletedPeriod: lessonsCompleted?.length || 0,
        lessonsChange: calcChange(lessonsCompleted?.length || 0, previousLessons?.length || 0),
        deploymentSuccessRate,
        deploymentSuccessRateChange: deploymentSuccessRate - prevDeploymentSuccessRate,
        totalDeployments,
      },
      charts: {
        userGrowth: userGrowthChart,
        projects: projectsChart,
        lessons: lessonsChart,
        deployments: deploymentsChart,
      },
      topProjects: topProjects || [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
