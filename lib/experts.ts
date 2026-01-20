/**
 * Expert Badges System
 * 
 * Provides utilities for checking user expertise based on:
 * - Completed lessons for specific topics
 * - Project types deployed
 * - Overall experience level
 */

import type { ProjectType } from '@/types';

// Expert levels based on topic completion
export type ExpertLevel = 'verified' | 'intermediate' | 'expert' | 'master';

export interface ExpertStatus {
  isExpert: boolean;
  level: ExpertLevel | null;
  completedLessons: number;
  totalLessons: number;
  deployedProjects: number;
  badge: ExpertBadgeInfo | null;
}

export interface ExpertBadgeInfo {
  label: string;
  icon: string;
  color: string;
  description: string;
}

// Map project types to their topic names
export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  nft_marketplace: 'NFT',
  token: 'Token',
  dao: 'DAO',
  game: 'Gaming',
  social: 'Social',
  creator: 'Creator',
};

// Expert level thresholds based on percentage of lessons completed
const EXPERT_THRESHOLDS = {
  verified: 1,      // Completed at least 1 lesson
  intermediate: 50, // 50% of lessons
  expert: 80,       // 80% of lessons
  master: 100,      // 100% of lessons
};

/**
 * Calculate expert level based on lesson completion percentage
 */
export function calculateExpertLevel(
  completedLessons: number,
  totalLessons: number,
  deployedProjects: number
): ExpertLevel | null {
  if (totalLessons === 0 || completedLessons === 0) return null;
  
  const percentage = (completedLessons / totalLessons) * 100;
  
  // Master requires 100% completion AND at least one deployed project
  if (percentage >= EXPERT_THRESHOLDS.master && deployedProjects > 0) {
    return 'master';
  }
  
  if (percentage >= EXPERT_THRESHOLDS.expert) {
    return 'expert';
  }
  
  if (percentage >= EXPERT_THRESHOLDS.intermediate) {
    return 'intermediate';
  }
  
  if (completedLessons >= EXPERT_THRESHOLDS.verified) {
    return 'verified';
  }
  
  return null;
}

/**
 * Get badge info for an expert level and topic
 */
export function getExpertBadgeInfo(
  level: ExpertLevel,
  projectType?: ProjectType
): ExpertBadgeInfo {
  const topicLabel = projectType ? PROJECT_TYPE_LABELS[projectType] : 'Web3';
  
  switch (level) {
    case 'master':
      return {
        label: `🎓 ${topicLabel} Master`,
        icon: '🎓',
        color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
        description: `Completed all ${topicLabel} lessons and deployed projects`,
      };
    case 'expert':
      return {
        label: `⭐ ${topicLabel} Expert`,
        icon: '⭐',
        color: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
        description: `Completed 80%+ of ${topicLabel} lessons`,
      };
    case 'intermediate':
      return {
        label: `📚 ${topicLabel} Learner`,
        icon: '📚',
        color: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
        description: `Completed 50%+ of ${topicLabel} lessons`,
      };
    case 'verified':
      return {
        label: `✓ Completed this lesson`,
        icon: '✓',
        color: 'bg-green-500/10 text-green-500 border-green-500/30',
        description: 'Has completed lessons in this topic',
      };
    default:
      return {
        label: 'Learner',
        icon: '📖',
        color: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
        description: 'Learning in progress',
      };
  }
}

/**
 * Get "Verified Completer" badge for a specific lesson
 */
export function getVerifiedCompleterBadge(): ExpertBadgeInfo {
  return {
    label: '✓ Completed this lesson',
    icon: '✓',
    color: 'bg-green-500/10 text-green-500 border-green-500/30',
    description: 'This user has completed the lesson being discussed',
  };
}

/**
 * Check if user completed a specific lesson
 */
export function checkLessonCompletion(
  userProgress: { lesson_id: string; status: string }[],
  lessonId: string
): boolean {
  return userProgress.some(
    (p) => p.lesson_id === lessonId && p.status === 'completed'
  );
}

/**
 * Calculate expert status for a user on a specific project type
 */
export function calculateExpertStatus(
  userProgress: { lesson_id: string; status: string; project_type?: string }[],
  projectType: ProjectType,
  totalLessonsForType: number,
  deployedProjectsCount: number
): ExpertStatus {
  const completedLessons = userProgress.filter(
    (p) => p.status === 'completed'
  ).length;
  
  const level = calculateExpertLevel(
    completedLessons,
    totalLessonsForType,
    deployedProjectsCount
  );
  
  return {
    isExpert: level !== null && level !== 'verified',
    level,
    completedLessons,
    totalLessons: totalLessonsForType,
    deployedProjects: deployedProjectsCount,
    badge: level ? getExpertBadgeInfo(level, projectType) : null,
  };
}

/**
 * Get overall expert level across all topics
 */
export function getOverallExpertLevel(
  totalCompletedLessons: number,
  totalLessons: number,
  totalDeployedProjects: number
): ExpertLevel | null {
  return calculateExpertLevel(
    totalCompletedLessons,
    totalLessons,
    totalDeployedProjects
  );
}

/**
 * Expert sorting comparator for sorting replies by expertise
 */
export function sortByExpertise<T extends { expertLevel: ExpertLevel | null }>(
  a: T,
  b: T
): number {
  const levelOrder: Record<ExpertLevel, number> = {
    master: 4,
    expert: 3,
    intermediate: 2,
    verified: 1,
  };
  
  const aScore = a.expertLevel ? levelOrder[a.expertLevel] : 0;
  const bScore = b.expertLevel ? levelOrder[b.expertLevel] : 0;
  
  return bScore - aScore;
}

/**
 * Type for reply with expert info
 */
export interface ReplyWithExpertInfo {
  id: string;
  author_id: string;
  content: string;
  upvotes: number;
  is_accepted: boolean;
  created_at: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  // Expert fields
  expertLevel: ExpertLevel | null;
  completedThisLesson: boolean;
  deployedProjectsCount: number;
  reputationScore: number;
}

/**
 * Sort options for replies
 */
export type ReplySortOption = 'votes' | 'experts' | 'newest';

export function sortReplies(
  replies: ReplyWithExpertInfo[],
  sortBy: ReplySortOption
): ReplyWithExpertInfo[] {
  const sorted = [...replies];
  
  switch (sortBy) {
    case 'votes':
      return sorted.sort((a, b) => b.upvotes - a.upvotes);
    case 'experts':
      return sorted.sort((a, b) => {
        // First sort by expertise, then by votes
        const expertDiff = sortByExpertise(a, b);
        if (expertDiff !== 0) return expertDiff;
        return b.upvotes - a.upvotes;
      });
    case 'newest':
      return sorted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    default:
      return sorted;
  }
}

/**
 * Filter replies to show only from experts
 */
export function filterExpertReplies(
  replies: ReplyWithExpertInfo[]
): ReplyWithExpertInfo[] {
  return replies.filter(
    (r) => r.expertLevel !== null && r.expertLevel !== 'verified'
  );
}
