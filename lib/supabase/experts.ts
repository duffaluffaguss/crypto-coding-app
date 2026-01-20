/**
 * Expert Data Fetching - Server-side Supabase queries
 * 
 * Fetches user expertise data for community features
 */

import { createClient } from './server';
import type { ProjectType } from '@/types';
import { calculateExpertLevel, type ExpertLevel } from '@/lib/experts';

export interface UserExpertData {
  userId: string;
  expertLevel: ExpertLevel | null;
  completedLessons: number;
  totalLessons: number;
  deployedProjectsCount: number;
  reputationScore: number;
  completedLessonIds: string[];
}

/**
 * Get expert data for a single user in a specific topic
 */
export async function getUserExpertData(
  userId: string,
  projectType: ProjectType
): Promise<UserExpertData | null> {
  const supabase = await createClient();

  // Get total lessons for this project type
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id')
    .eq('project_type', projectType);

  const totalLessons = lessons?.length || 0;

  // Get user's completed lessons for this project type
  const { data: progress } = await supabase
    .from('learning_progress')
    .select(`
      lesson_id,
      status,
      lessons!inner(project_type)
    `)
    .eq('user_id', userId)
    .eq('lessons.project_type', projectType)
    .eq('status', 'completed');

  const completedLessons = progress?.length || 0;
  const completedLessonIds = progress?.map((p) => p.lesson_id) || [];

  // Get deployed projects count for this type
  const { count: deployedCount } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('project_type', projectType)
    .eq('status', 'deployed');

  // Get user's reputation score from profile stats
  const { data: stats } = await supabase
    .from('profiles')
    .select('reputation_score')
    .eq('id', userId)
    .single();

  const deployedProjectsCount = deployedCount || 0;
  const reputationScore = (stats as any)?.reputation_score || 0;

  const expertLevel = calculateExpertLevel(
    completedLessons,
    totalLessons,
    deployedProjectsCount
  );

  return {
    userId,
    expertLevel,
    completedLessons,
    totalLessons,
    deployedProjectsCount,
    reputationScore,
    completedLessonIds,
  };
}

/**
 * Check if a user completed a specific lesson
 */
export async function hasUserCompletedLesson(
  userId: string,
  lessonId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('learning_progress')
    .select('id')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .eq('status', 'completed')
    .single();

  return !!data;
}

/**
 * Get expert data for multiple users (batch query for replies)
 */
export async function getBatchUserExpertData(
  userIds: string[],
  projectType: ProjectType
): Promise<Map<string, UserExpertData>> {
  if (userIds.length === 0) return new Map();

  const supabase = await createClient();

  // Get total lessons for this project type
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id')
    .eq('project_type', projectType);

  const totalLessons = lessons?.length || 0;

  // Get all users' completed lessons for this project type
  const { data: progress } = await supabase
    .from('learning_progress')
    .select(`
      user_id,
      lesson_id,
      status,
      lessons!inner(project_type)
    `)
    .in('user_id', userIds)
    .eq('lessons.project_type', projectType)
    .eq('status', 'completed');

  // Get deployed projects counts for all users
  const { data: projects } = await supabase
    .from('projects')
    .select('user_id')
    .in('user_id', userIds)
    .eq('project_type', projectType)
    .eq('status', 'deployed');

  // Get reputation scores
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, reputation_score')
    .in('id', userIds);

  // Build result map
  const result = new Map<string, UserExpertData>();

  for (const userId of userIds) {
    const userProgress = progress?.filter((p) => p.user_id === userId) || [];
    const completedLessons = userProgress.length;
    const completedLessonIds = userProgress.map((p) => p.lesson_id);
    
    const deployedProjectsCount =
      projects?.filter((p) => p.user_id === userId).length || 0;
    
    const profile = profiles?.find((p) => p.id === userId);
    const reputationScore = (profile as any)?.reputation_score || 0;

    const expertLevel = calculateExpertLevel(
      completedLessons,
      totalLessons,
      deployedProjectsCount
    );

    result.set(userId, {
      userId,
      expertLevel,
      completedLessons,
      totalLessons,
      deployedProjectsCount,
      reputationScore,
      completedLessonIds,
    });
  }

  return result;
}

/**
 * Get expert data for community members
 */
export async function getCommunityMembersWithExpertData(
  communityId: string,
  projectType: ProjectType | null,
  limit = 10
): Promise<Array<{
  user_id: string;
  role: 'member' | 'moderator' | 'admin';
  joined_at: string;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
  expertInfo: { level: ExpertLevel | null; deployedProjects: number } | null;
}>> {
  const supabase = await createClient();

  // Get members
  const { data: members } = await supabase
    .from('community_members')
    .select(`
      user_id,
      role,
      joined_at,
      profiles:user_id(display_name, avatar_url)
    `)
    .eq('community_id', communityId)
    .order('joined_at', { ascending: false })
    .limit(limit);

  if (!members || members.length === 0) return [];

  // If no project type, return without expert data
  if (!projectType) {
    return members.map((m) => ({
      ...m,
      profiles: m.profiles as any,
      expertInfo: null,
    }));
  }

  // Get expert data for all members
  const userIds = members.map((m) => m.user_id);
  const expertData = await getBatchUserExpertData(userIds, projectType);

  return members.map((m) => ({
    ...m,
    profiles: m.profiles as any,
    expertInfo: {
      level: expertData.get(m.user_id)?.expertLevel || null,
      deployedProjects: expertData.get(m.user_id)?.deployedProjectsCount || 0,
    },
  }));
}

/**
 * Get replies with expert data enrichment
 */
export async function getRepliesWithExpertData(
  postId: string,
  projectType: ProjectType | null,
  relatedLessonId?: string
) {
  const supabase = await createClient();

  // Get replies
  const { data: replies } = await supabase
    .from('community_replies')
    .select(`
      id,
      content,
      upvotes,
      is_accepted,
      created_at,
      author_id,
      profiles:author_id(display_name, avatar_url)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (!replies || replies.length === 0) return [];

  // If no project type, return without expert data
  if (!projectType) {
    return replies.map((r) => ({
      ...r,
      profiles: r.profiles as any,
      expertLevel: null as ExpertLevel | null,
      completedThisLesson: false,
      deployedProjectsCount: 0,
      reputationScore: 0,
    }));
  }

  // Get expert data for all reply authors
  const authorIds = [...new Set(replies.map((r) => r.author_id))];
  const expertData = await getBatchUserExpertData(authorIds, projectType);

  return replies.map((r) => {
    const data = expertData.get(r.author_id);
    return {
      ...r,
      profiles: r.profiles as any,
      expertLevel: data?.expertLevel || null,
      completedThisLesson: relatedLessonId
        ? data?.completedLessonIds.includes(relatedLessonId) || false
        : false,
      deployedProjectsCount: data?.deployedProjectsCount || 0,
      reputationScore: data?.reputationScore || 0,
    };
  });
}
