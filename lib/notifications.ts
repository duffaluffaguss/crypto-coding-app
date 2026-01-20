import { SupabaseClient } from '@supabase/supabase-js';

export type NotificationType = 'achievement' | 'streak' | 'showcase_like' | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a notification for a user
 */
export async function createNotification(
  supabase: SupabaseClient,
  params: CreateNotificationParams
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  const { userId, type, title, message, metadata = {} } = params;

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      metadata,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }

  return { success: true, notificationId: data.id };
}

/**
 * Create an achievement notification
 */
export async function notifyAchievement(
  supabase: SupabaseClient,
  userId: string,
  achievementName: string,
  achievementIcon: string,
  points: number
): Promise<{ success: boolean; error?: string }> {
  return createNotification(supabase, {
    userId,
    type: 'achievement',
    title: `🏆 Achievement Unlocked!`,
    message: `${achievementIcon} You earned "${achievementName}" (+${points} points)`,
    metadata: { achievementName, achievementIcon, points },
  });
}

/**
 * Create a streak milestone notification
 */
export async function notifyStreakMilestone(
  supabase: SupabaseClient,
  userId: string,
  streakDays: number
): Promise<{ success: boolean; error?: string }> {
  let title = '🔥 Streak Milestone!';
  let message = '';

  if (streakDays >= 30) {
    message = `Incredible! You've maintained a ${streakDays}-day learning streak! 🏆`;
  } else if (streakDays >= 14) {
    message = `Amazing! You've hit a ${streakDays}-day streak! Keep it going! 🌟`;
  } else if (streakDays >= 7) {
    message = `Awesome! One week streak achieved! (${streakDays} days) ⚡`;
  } else if (streakDays >= 3) {
    message = `Nice! You're on a ${streakDays}-day streak! 💪`;
  } else {
    return { success: true }; // Don't notify for streaks < 3
  }

  return createNotification(supabase, {
    userId,
    type: 'streak',
    title,
    message,
    metadata: { streakDays },
  });
}

/**
 * Create a showcase like notification
 */
export async function notifyShowcaseLike(
  supabase: SupabaseClient,
  userId: string,
  projectName: string,
  projectId: string,
  likerName: string
): Promise<{ success: boolean; error?: string }> {
  return createNotification(supabase, {
    userId,
    type: 'showcase_like',
    title: '❤️ Someone liked your project!',
    message: `${likerName} liked your project "${projectName}"`,
    metadata: { projectId, projectName, likerName },
  });
}

/**
 * Create a system notification
 */
export async function notifySystem(
  supabase: SupabaseClient,
  userId: string,
  title: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  return createNotification(supabase, {
    userId,
    type: 'system',
    title: `📢 ${title}`,
    message,
  });
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'achievement':
      return '🏆';
    case 'streak':
      return '🔥';
    case 'showcase_like':
      return '❤️';
    case 'system':
      return '📢';
    default:
      return '🔔';
  }
}

/**
 * Get time ago string from date
 */
export function getTimeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString();
}
