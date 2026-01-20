import { SupabaseClient } from '@supabase/supabase-js';

export type ActivityType =
  | 'project_created'
  | 'lesson_completed'
  | 'contract_deployed'
  | 'achievement_earned'
  | 'joined_showcase';

export interface Activity {
  id: string;
  user_id: string;
  type: ActivityType;
  metadata: Record<string, unknown>;
  created_at: string;
  display_name?: string;
  avatar_url?: string | null;
}

export interface LogActivityParams {
  userId: string;
  type: ActivityType;
  metadata?: Record<string, unknown>;
}

/**
 * Log an activity to the activity feed
 */
export async function logActivity(
  supabase: SupabaseClient,
  params: LogActivityParams
): Promise<{ success: boolean; activityId?: string; error?: string }> {
  const { userId, type, metadata = {} } = params;

  const { data, error } = await supabase
    .from('activities')
    .insert({
      user_id: userId,
      type,
      metadata,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error logging activity:', error);
    return { success: false, error: error.message };
  }

  return { success: true, activityId: data.id };
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
    metadata: { projectId, projectName },
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
    metadata: { lessonId, lessonTitle, tutorialTitle },
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
    metadata: { contractAddress, contractName, network },
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
    metadata: { achievementName, achievementIcon, points },
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
    metadata: { projectId, projectName },
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
 * Get activity description based on type and metadata
 */
export function getActivityDescription(type: ActivityType, metadata: Record<string, unknown>): string {
  switch (type) {
    case 'project_created':
      return `created a new project "${metadata.projectName || 'Untitled'}"`;
    case 'lesson_completed':
      return `completed the lesson "${metadata.lessonTitle || 'Unknown'}"${metadata.tutorialTitle ? ` in ${metadata.tutorialTitle}` : ''}`;
    case 'contract_deployed':
      return `deployed a contract "${metadata.contractName || 'Contract'}" on ${metadata.network || 'testnet'}`;
    case 'achievement_earned':
      return `earned the achievement "${metadata.achievementName || 'Unknown'}" ${metadata.achievementIcon || '🏆'}`;
    case 'joined_showcase':
      return `shared "${metadata.projectName || 'a project'}" to the showcase`;
    default:
      return 'performed an action';
  }
}

/**
 * Get link for activity based on type and metadata
 */
export function getActivityLink(type: ActivityType, metadata: Record<string, unknown>): string | null {
  switch (type) {
    case 'project_created':
      return metadata.projectId ? `/projects/${metadata.projectId}` : null;
    case 'lesson_completed':
      return metadata.lessonId ? `/learn?lesson=${metadata.lessonId}` : '/learn';
    case 'contract_deployed':
      return metadata.contractAddress ? `/projects?address=${metadata.contractAddress}` : null;
    case 'achievement_earned':
      return '/achievements';
    case 'joined_showcase':
      return metadata.projectId ? `/showcase/${metadata.projectId}` : '/showcase';
    default:
      return null;
  }
}
