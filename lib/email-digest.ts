/**
 * Weekly Email Digest Generation
 * Analyzes user activity and generates stats for weekly digest emails
 */

import { createClient } from '@/lib/supabase/server';

export interface WeeklyStats {
  lessonsCompleted: number;
  pointsEarned: number;
  currentStreak: number;
  achievementsUnlocked: number;
  rank?: number;
  rankChange?: number;
  totalUsers?: number;
}

export interface WeeklyDigestData {
  userId: string;
  displayName: string;
  email: string;
  stats: WeeklyStats;
}

/**
 * Get the start and end dates for the previous week (Monday to Sunday)
 */
export function getPreviousWeekDates(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  // Calculate last Monday
  const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday is 0
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - daysToLastMonday - 7);
  lastMonday.setHours(0, 0, 0, 0);
  
  // Calculate last Sunday
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);
  lastSunday.setHours(23, 59, 59, 999);
  
  return { start: lastMonday, end: lastSunday };
}

/**
 * Get current week dates (Monday to current day)
 */
export function getCurrentWeekDates(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  // Calculate this Monday
  const daysToThisMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - daysToThisMonday);
  thisMonday.setHours(0, 0, 0, 0);
  
  return { start: thisMonday, end: now };
}

/**
 * Count lessons completed in a date range
 */
export async function countLessonsCompleted(
  supabase: any,
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'lesson_completed')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());
    
  if (error) {
    console.error('Error fetching lessons completed:', error);
    return 0;
  }
  
  return data?.length || 0;
}

/**
 * Count achievements unlocked in a date range
 */
export async function countAchievementsUnlocked(
  supabase: any,
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId)
    .gte('earned_at', startDate.toISOString())
    .lte('earned_at', endDate.toISOString());
    
  if (error) {
    console.error('Error fetching achievements unlocked:', error);
    return 0;
  }
  
  return data?.length || 0;
}

/**
 * Calculate points earned from activities in a date range
 */
export async function calculatePointsEarned(
  supabase: any,
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  // Get lesson completions (10 points each typically)
  const lessonsCompleted = await countLessonsCompleted(supabase, userId, startDate, endDate);
  
  // Get achievement points earned
  const { data: achievements, error } = await supabase
    .from('user_achievements')
    .select('achievements(points)')
    .eq('user_id', userId)
    .gte('earned_at', startDate.toISOString())
    .lte('earned_at', endDate.toISOString());
    
  if (error) {
    console.error('Error fetching achievement points:', error);
    return lessonsCompleted * 10; // Fallback to just lesson points
  }
  
  const achievementPoints = achievements?.reduce(
    (total, item) => total + (item.achievements?.points || 0), 
    0
  ) || 0;
  
  return (lessonsCompleted * 10) + achievementPoints;
}

/**
 * Get user's current leaderboard position
 */
export async function getUserRank(supabase: any, userId: string): Promise<{ rank: number; total: number } | null> {
  // Get all users ordered by total points
  const { data: allUsers, error } = await supabase
    .from('profiles')
    .select('id, total_points')
    .order('total_points', { ascending: false });
    
  if (error || !allUsers) {
    console.error('Error fetching leaderboard:', error);
    return null;
  }
  
  const userIndex = allUsers.findIndex(user => user.id === userId);
  if (userIndex === -1) return null;
  
  return {
    rank: userIndex + 1,
    total: allUsers.length
  };
}

/**
 * Get user's rank from previous week for comparison
 */
export async function getUserPreviousRank(
  supabase: any,
  userId: string,
  weekEndDate: Date
): Promise<number | null> {
  // This is a simplified approach - in a real system you'd want to store
  // historical rankings or calculate based on points at that time
  // For now, we'll estimate based on current ranking
  const currentRank = await getUserRank(supabase, userId);
  return currentRank?.rank || null;
}

/**
 * Generate weekly stats for a user
 */
export async function generateWeeklyStats(
  userId: string,
  useCurrentWeek: boolean = false
): Promise<WeeklyStats | null> {
  const supabase = await createClient();
  
  // Get date range
  const { start, end } = useCurrentWeek ? getCurrentWeekDates() : getPreviousWeekDates();
  
  try {
    // Get user's current profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('current_streak, total_points')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }
    
    // Get weekly stats in parallel
    const [
      lessonsCompleted,
      achievementsUnlocked,
      pointsEarned,
      rankData,
    ] = await Promise.all([
      countLessonsCompleted(supabase, userId, start, end),
      countAchievementsUnlocked(supabase, userId, start, end),
      calculatePointsEarned(supabase, userId, start, end),
      getUserRank(supabase, userId),
    ]);
    
    // Calculate rank change (simplified for now)
    const previousRank = await getUserPreviousRank(supabase, userId, end);
    const rankChange = previousRank && rankData?.rank 
      ? previousRank - rankData.rank  // Positive means rank improved (lower number)
      : undefined;
    
    return {
      lessonsCompleted,
      pointsEarned,
      currentStreak: profile?.current_streak || 0,
      achievementsUnlocked,
      rank: rankData?.rank,
      rankChange,
      totalUsers: rankData?.total,
    };
    
  } catch (error) {
    console.error('Error generating weekly stats:', error);
    return null;
  }
}

/**
 * Generate weekly digest data for a user
 */
export async function generateUserWeeklyDigest(
  userId: string,
  useCurrentWeek: boolean = false
): Promise<WeeklyDigestData | null> {
  const supabase = await createClient();
  
  try {
    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('id', userId)
      .single();
      
    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }
    
    // Generate stats
    const stats = await generateWeeklyStats(userId, useCurrentWeek);
    if (!stats) return null;
    
    return {
      userId,
      displayName: profile.display_name || 'Anonymous',
      email: profile.email || '',
      stats,
    };
    
  } catch (error) {
    console.error('Error generating user weekly digest:', error);
    return null;
  }
}

/**
 * Get all users who should receive weekly digest emails
 */
export async function getUsersForWeeklyDigest(): Promise<string[]> {
  const supabase = await createClient();
  
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, email_preferences')
      .not('email', 'is', null); // Has email
      
    if (error) {
      console.error('Error fetching users for digest:', error);
      return [];
    }
    
    // Filter users who have weekly digest enabled (default: true)
    return users?.filter(user => {
      const prefs = user.email_preferences || {};
      return prefs.weekly_digest !== false; // Default to enabled
    }).map(user => user.id) || [];
    
  } catch (error) {
    console.error('Error filtering users for digest:', error);
    return [];
  }
}

/**
 * Check if user has weekly digest enabled
 */
export async function isWeeklyDigestEnabled(userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('email_preferences')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error checking digest preference:', error);
      return true; // Default to enabled
    }
    
    const prefs = profile?.email_preferences || {};
    return prefs.weekly_digest !== false; // Default to enabled
    
  } catch (error) {
    console.error('Error checking digest preference:', error);
    return true; // Default to enabled
  }
}