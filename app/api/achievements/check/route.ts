import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Achievement condition checking logic
interface CheckResult {
  conditionMet: boolean;
}

async function checkAchievementCondition(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  userId: string,
  conditionKey: string,
  threshold: number
): Promise<CheckResult> {
  switch (conditionKey) {
    // Learning achievements
    case 'first_lesson': {
      const { count } = await supabase
        .from('learning_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed');
      return { conditionMet: (count || 0) >= 1 };
    }

    case 'lessons_completed':
    case 'lessons_completed_25': {
      const { count } = await supabase
        .from('learning_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed');
      return { conditionMet: (count || 0) >= threshold };
    }

    case 'lessons_in_day': {
      // Check lessons completed in the last 24 hours
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('learning_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', today.toISOString());
      return { conditionMet: (count || 0) >= threshold };
    }

    case 'streak_7':
    case 'streak_30': {
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_streak')
        .eq('id', userId)
        .single();
      return { conditionMet: (profile?.current_streak || 0) >= threshold };
    }

    case 'night_owl': {
      // Check if user completed a lesson after midnight (00:00-05:59)
      const { data: completions } = await supabase
        .from('learning_progress')
        .select('completed_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .not('completed_at', 'is', null);
      
      const hasNightCompletion = completions?.some((c) => {
        if (!c.completed_at) return false;
        const hour = new Date(c.completed_at).getHours();
        return hour >= 0 && hour < 6;
      });
      return { conditionMet: hasNightCompletion || false };
    }

    case 'early_bird': {
      // Check if user completed a lesson before 6 AM (same as night_owl essentially)
      const { data: completions } = await supabase
        .from('learning_progress')
        .select('completed_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .not('completed_at', 'is', null);
      
      const hasEarlyCompletion = completions?.some((c) => {
        if (!c.completed_at) return false;
        const hour = new Date(c.completed_at).getHours();
        return hour >= 4 && hour < 6; // Early bird: 4-6 AM
      });
      return { conditionMet: hasEarlyCompletion || false };
    }

    // Building achievements
    case 'first_deploy': {
      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('contract_address', 'is', null);
      return { conditionMet: (count || 0) >= 1 };
    }

    case 'deploys_5':
    case 'deploys_10': {
      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('contract_address', 'is', null);
      return { conditionMet: (count || 0) >= threshold };
    }

    case 'first_project': {
      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return { conditionMet: (count || 0) >= 1 };
    }

    case 'projects_5': {
      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return { conditionMet: (count || 0) >= threshold };
    }

    // Social achievements
    case 'first_showcase': {
      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_public', true);
      return { conditionMet: (count || 0) >= 1 };
    }

    case 'likes_5':
    case 'likes_10': {
      const { data: projects } = await supabase
        .from('projects')
        .select('likes_count')
        .eq('user_id', userId)
        .eq('is_public', true);
      
      const maxLikes = Math.max(...(projects?.map((p) => p.likes_count || 0) || [0]));
      return { conditionMet: maxLikes >= threshold };
    }

    case 'total_likes_50': {
      const { data: projects } = await supabase
        .from('projects')
        .select('likes_count')
        .eq('user_id', userId)
        .eq('is_public', true);
      
      const totalLikes = projects?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0;
      return { conditionMet: totalLikes >= threshold };
    }

    default:
      return { conditionMet: false };
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { trigger } = body; // Optional: specific trigger to check

    // Get all achievements
    const { data: achievements, error: achError } = await supabase
      .from('achievements')
      .select('*');

    if (achError) {
      console.error('Error fetching achievements:', achError);
      return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
    }

    // Get user's existing achievements
    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', user.id);

    const earnedIds = new Set(userAchievements?.map((ua) => ua.achievement_id) || []);
    
    // Filter to unearned achievements
    const unearnedAchievements = achievements?.filter((a) => !earnedIds.has(a.id)) || [];
    
    // If a specific trigger was provided, only check relevant achievements
    const achievementsToCheck = trigger
      ? unearnedAchievements.filter((a) => a.condition_key.includes(trigger))
      : unearnedAchievements;

    const newlyEarned: Array<{
      id: string;
      name: string;
      icon: string;
      points: number;
      description: string;
    }> = [];

    // Check each unearned achievement
    for (const achievement of achievementsToCheck) {
      const { conditionMet } = await checkAchievementCondition(
        supabase,
        user.id,
        achievement.condition_key,
        achievement.threshold || 1
      );

      if (conditionMet) {
        // Award the achievement
        const { error: insertError } = await supabase
          .from('user_achievements')
          .insert({
            user_id: user.id,
            achievement_id: achievement.id,
          });

        if (!insertError) {
          newlyEarned.push({
            id: achievement.id,
            name: achievement.name,
            icon: achievement.icon,
            points: achievement.points,
            description: achievement.description,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      newAchievements: newlyEarned,
      totalChecked: achievementsToCheck.length,
    });
  } catch (error) {
    console.error('Achievement check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch user's achievements
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all achievements
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*')
      .order('category')
      .order('points', { ascending: false });

    // Get user's earned achievements
    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id);

    // Calculate total points
    const totalPoints = userAchievements?.reduce((sum, ua) => {
      const achievement = achievements?.find((a) => a.id === ua.achievement_id);
      return sum + (achievement?.points || 0);
    }, 0) || 0;

    return NextResponse.json({
      achievements: achievements || [],
      userAchievements: userAchievements || [],
      totalPoints,
      earnedCount: userAchievements?.length || 0,
      totalCount: achievements?.length || 0,
    });
  } catch (error) {
    console.error('Achievement fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
