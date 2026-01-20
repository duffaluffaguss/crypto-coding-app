import { SupabaseClient } from '@supabase/supabase-js';

export type ActivityType =
  | 'project_created'
  | 'lesson_completed'
  | 'contract_deployed'
  | 'achievement_earned'
  | 'user_followed'
  | 'joined_showcase';

export interface Activity {
  id: string;
  user_id: string;
  type: ActivityType;
  data: Record<string, unknown>;
  created_at: string;
  display_name?: string;
  avatar_url?: string | null;
  // Legacy support
  metadata?: Record<string, unknown>;
}

export interface LogActivityParams {
  userId: string;
  type: ActivityType;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>; // Legacy support
}

/**
 * Log an activity to the activity feed
 */
export async function logActivity(
  supabase: SupabaseClient,
  params: LogActivityParams
): Promise<{ success: boolean; activityId?: string; error?: string }> {
  const { userId, type, data = {}, metadata = {} } = params;
  
  // Use data field for new schema, fall back to metadata for legacy support
  const activityData = Object.keys(data).length > 0 ? data : metadata;

  const { data: insertData, error } = await supabase
    .from('activities')
    .insert({
      user_id: userId,
      type,
      data: activityData,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error logging activity:', error);
    return { success: false, error: error.message };
  }

  return { success: true, activityId: insertData.id };
}

/**
 * Log a project created activity
 */
export async function logProjectCreated(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  projectName: string
): Promise<{ success: boolean; error?: string }> {
  return logActivity(supabase, {
    userId,
    type: 'project_created',
    data: { projectId, projectName },
  });
}

/**
 * Log a lesson completed activity
 */
export async function logLessonCompleted(
  supabase: SupabaseClient,
  userId: string,
  lessonId: string,
  lessonTitle: string,
  tutorialTitle?: string
): Promise<{ success: boolean; error?: string }> {
  return logActivity(supabase, {
    userId,
    type: 'lesson_completed',
    data: { lessonId, lessonTitle, tutorialTitle },
  });
}

/**
 * Log a contract deployed activity
 */
export async function logContractDeployed(
  supabase: SupabaseClient,
  userId: string,
  contractAddress: string,
  contractName: string,
  network: string
): Promise<{ success: boolean; error?: string }> {
  return logActivity(supabase, {
    userId,
    type: 'contract_deployed',
    data: { contractAddress, contractName, network },
  });
}

/**
 * Log an achievement earned activity
 */
export async function logAchievementEarned(
  supabase: SupabaseClient,
  userId: string,
  achievementName: string,
  achievementIcon: string,
  points: number
): Promise<{ success: boolean; error?: string }> {
  return logActivity(supabase, {
    userId,
    type: 'achievement_earned',
    data: { achievementName, achievementIcon, points },
  });
}

/**
 * Log a user followed activity
 */
export async function logUserFollowed(
  supabase: SupabaseClient,
  userId: string,
  followedUserId: string,
  followedUsername: string,
  followedDisplayName?: string
): Promise<{ success: boolean; error?: string }> {
  return logActivity(supabase, {
    userId,
    type: 'user_followed',
    data: { followedUserId, followedUsername, followedDisplayName },
  });
}

/**
 * Log a joined showcase activity
 */
export async function logJoinedShowcase(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  projectName: string
): Promise<{ success: boolean; error?: string }> {
  return logActivity(supabase, {
    userId,
    type: 'joined_showcase',
    data: { projectId, projectName },
  });
}

/**
 * Get activity icon and color based on type
 */
export function getActivityMeta(type: ActivityType): { icon: string; color: string; bgColor: string; label: string } {
  switch (type) {
    case 'project_created':
      return {
        icon: '💡',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        label: 'Project Created',
      };
    case 'lesson_completed':
      return {
        icon: '📚',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        label: 'Lesson Completed',
      };
    case 'contract_deployed':
      return {
        icon: '🚀',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        label: 'Contract Deployed',
      };
    case 'achievement_earned':
      return {
        icon: '🏆',
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        label: 'Achievement Earned',
      };
    case 'user_followed':
      return {
        icon: '👥',
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-500/10',
        label: 'User Followed',
      };
    case 'joined_showcase':
      return {
        icon: '🌟',
        color: 'text-pink-500',
        bgColor: 'bg-pink-500/10',
        label: 'Joined Showcase',
      };
    default:
      return {
        icon: '📌',
        color: 'text-gray-500',
        bgColor: 'bg-gray-500/10',
        label: 'Activity',
      };
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

/**
 * Get activity description based on type and data/metadata
 */
export function getActivityDescription(type: ActivityType, data: Record<string, unknown>, metadata?: Record<string, unknown>): string {
  // Use data field first, fall back to metadata for legacy support
  const activityData = Object.keys(data).length > 0 ? data : (metadata || {});
  
  switch (type) {
    case 'project_created':
      return `created a new project "${activityData.projectName || 'Untitled'}"`;
    case 'lesson_completed':
      return `completed the lesson "${activityData.lessonTitle || 'Unknown'}"${activityData.tutorialTitle ? ` in ${activityData.tutorialTitle}` : ''}`;
    case 'contract_deployed':
      return `deployed a contract "${activityData.contractName || 'Contract'}" on ${activityData.network || 'testnet'}`;
    case 'achievement_earned':
      return `earned the achievement "${activityData.achievementName || 'Unknown'}" ${activityData.achievementIcon || '🏆'}`;
    case 'user_followed':
      return `started following ${activityData.followedDisplayName || activityData.followedUsername || 'someone'}`;
    case 'joined_showcase':
      return `shared "${activityData.projectName || 'a project'}" to the showcase`;
    default:
      return 'performed an action';
  }
}

/**
 * Get link for activity based on type and data/metadata
 */
export function getActivityLink(type: ActivityType, data: Record<string, unknown>, metadata?: Record<string, unknown>): string | null {
  // Use data field first, fall back to metadata for legacy support
  const activityData = Object.keys(data).length > 0 ? data : (metadata || {});
  
  switch (type) {
    case 'project_created':
      return activityData.projectId ? `/projects/${activityData.projectId}` : null;
    case 'lesson_completed':
      return activityData.lessonId ? `/learn?lesson=${activityData.lessonId}` : '/learn';
    case 'contract_deployed':
      return activityData.contractAddress ? `/projects?address=${activityData.contractAddress}` : null;
    case 'achievement_earned':
      return '/achievements';
    case 'user_followed':
      return activityData.followedUserId ? `/profile/${activityData.followedUserId}` : null;
    case 'joined_showcase':
      return activityData.projectId ? `/showcase/${activityData.projectId}` : '/showcase';
    default:
      return null;
  }
}
