// User and Profile Types
export type ExperienceLevel = 'complete_beginner' | 'some_coding' | 'web3_curious';

export type ProjectType = 'nft_marketplace' | 'token' | 'dao' | 'game' | 'social' | 'creator';

export type ProjectStatus = 'draft' | 'learning' | 'deployed' | 'published';

export type LessonStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export type FileType = 'solidity' | 'javascript' | 'json';

export type Network = 'base-sepolia' | 'base-mainnet';

// Database Types
export interface Profile {
  id: string;
  display_name: string | null;
  interests: string[];
  experience_level: ExperienceLevel | null;
  created_at: string;
  onboarding_completed: boolean;
  // Profile customization fields
  bio: string | null;
  website_url: string | null;
  twitter_handle: string | null;
  github_username: string | null;
  avatar_url: string | null;
  // Builder directory fields
  looking_for_collaborators: boolean;
  skills: string[];
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  project_type: ProjectType;
  status: ProjectStatus;
  created_at: string;
  deployed_at: string | null;
  contract_address: string | null;
  network: Network | null;
  contract_abi: any[] | null;
  generated_frontend: string | null;
  is_public?: boolean;
  showcase_description?: string | null;
  likes_count?: number;
  comments_count?: number;
  // Collaboration fields
  collaborators?: ProjectCollaborator[];
  user_role?: 'owner' | 'editor' | 'viewer';
}

export interface ProjectComment {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  filename: string;
  content: string;
  file_type: FileType;
  is_template: boolean;
  updated_at: string;
}

export interface CodeVersion {
  id: string;
  file_id: string;
  content: string;
  message: string | null;
  created_at: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  project_type: ProjectType;
  order: number;
  prerequisite_lesson_id: string | null;
  code_template: string;
  concepts: string[];
}

export interface LearningProgress {
  id: string;
  user_id: string;
  project_id: string;
  lesson_id: string;
  status: LessonStatus;
  completed_at: string | null;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  project_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// Lesson Help Types
export type HelpNotificationType = 'new_question' | 'new_answer' | 'question_answered' | 'answer_accepted';

export interface LessonQuestion {
  id: string;
  lesson_id: string;
  user_id: string;
  title: string;
  content: string;
  is_answered: boolean;
  is_pinned: boolean;
  helpful_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  user_profile?: Profile;
  answers_count?: number;
  user_has_voted?: boolean;
  user_vote_helpful?: boolean;
}

export interface LessonQuestionAnswer {
  id: string;
  question_id: string;
  user_id: string;
  content: string;
  helpful_count: number;
  is_accepted: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  user_profile?: Profile;
  user_has_voted?: boolean;
  user_vote_helpful?: boolean;
}

export interface LessonHelpVote {
  id: string;
  user_id: string;
  question_id: string | null;
  answer_id: string | null;
  is_helpful: boolean;
  created_at: string;
}

export interface LessonHelpNotification {
  id: string;
  recipient_id: string;
  sender_id: string;
  lesson_id: string;
  question_id: string | null;
  answer_id: string | null;
  notification_type: HelpNotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  // Joined fields
  sender_profile?: Profile;
}

// AI Types
export interface GeneratedProject {
  name: string;
  type: ProjectType;
  description: string;
  realWorldUse: string;
  monetizationPath: string;
}

export interface LessonDefinition {
  id: string;
  title: string;
  goal: string;
  concepts: string[];
  blanks: string[];
}

// Onboarding Types
export const INTERESTS = [
  { id: 'art', label: 'Art & Design', icon: 'Palette' },
  { id: 'photography', label: 'Photography', icon: 'Camera' },
  { id: 'gaming', label: 'Gaming', icon: 'Gamepad2' },
  { id: 'music', label: 'Music', icon: 'Music' },
  { id: 'sports', label: 'Sports', icon: 'Trophy' },
  { id: 'fashion', label: 'Fashion', icon: 'Shirt' },
  { id: 'education', label: 'Education', icon: 'GraduationCap' },
  { id: 'environment', label: 'Environment', icon: 'Leaf' },
  { id: 'food', label: 'Food & Dining', icon: 'UtensilsCrossed' },
  { id: 'travel', label: 'Travel', icon: 'Plane' },
  { id: 'fitness', label: 'Fitness', icon: 'Dumbbell' },
  { id: 'technology', label: 'Technology', icon: 'Cpu' },
] as const;

export type InterestId = typeof INTERESTS[number]['id'];

export const EXPERIENCE_LEVELS = [
  {
    id: 'complete_beginner' as const,
    label: 'Complete Beginner',
    description: "I've never written code before",
  },
  {
    id: 'some_coding' as const,
    label: 'Some Coding Experience',
    description: 'I know basics like HTML, CSS, or JavaScript',
  },
  {
    id: 'web3_curious' as const,
    label: 'Experienced Developer',
    description: "I'm a developer, new to Web3/blockchain",
  },
] as const;

// Compiler Types
export interface CompilationResult {
  success: boolean;
  errors?: CompilerError[];
  warnings?: CompilerWarning[];
  bytecode?: string;
  abi?: any[];
}

export interface CompilerError {
  message: string;
  severity: 'error';
  line?: number;
  column?: number;
}

export interface CompilerWarning {
  message: string;
  severity: 'warning';
  line?: number;
  column?: number;
}

// Deployment Types
export interface DeploymentResult {
  success: boolean;
  contractAddress?: string;
  transactionHash?: string;
  error?: string;
}

export interface Deployment {
  id: string;
  project_id: string;
  user_id: string;
  contract_address: string;
  tx_hash: string;
  network: Network;
  gas_used: number | null;
  contract_name: string | null;
  created_at: string;
  // Joined fields
  project_name?: string;
  project_type?: ProjectType;
}

// Builder Directory Types
export interface BuilderProfile extends Profile {
  // Computed fields from queries
  projects_count?: number;
  followers_count?: number;
  following_count?: number;
  reputation_score?: number;
  recent_activity?: string; // ISO date string of last activity
  is_looking_for_collaborators?: boolean;
  skills?: string[];
  
  // Following relationship for current user
  is_following?: boolean;
  is_follower?: boolean;
}

export type ReputationLevel = 'newcomer' | 'contributor' | 'veteran' | 'expert';

export interface BuilderFilters {
  search?: string;
  interests?: string[];
  skills?: string[];
  reputation_min?: number;
  reputation_max?: number;
  experience_level?: ExperienceLevel[];
  looking_for_collaborators?: boolean;
  has_projects?: boolean;
}

export interface BuilderSortOption {
  value: 'reputation' | 'recent_activity' | 'projects_count' | 'followers_count' | 'created_at';
  label: string;
  direction: 'asc' | 'desc';
}

export const BUILDER_SORT_OPTIONS: BuilderSortOption[] = [
  { value: 'reputation', label: 'Reputation', direction: 'desc' },
  { value: 'recent_activity', label: 'Recent Activity', direction: 'desc' },
  { value: 'projects_count', label: 'Most Projects', direction: 'desc' },
  { value: 'followers_count', label: 'Most Followers', direction: 'desc' },
  { value: 'created_at', label: 'Newest Members', direction: 'desc' },
] as const;

export const SKILL_OPTIONS = [
  'Solidity',
  'React',
  'TypeScript',
  'JavaScript',
  'Node.js',
  'Python',
  'Rust',
  'Go',
  'Web3.js',
  'Ethers.js',
  'Hardhat',
  'Foundry',
  'Smart Contracts',
  'DeFi',
  'NFTs',
  'DAOs',
  'Frontend',
  'Backend',
  'Full Stack',
  'UI/UX Design',
  'DevOps',
  'Security',
  'Testing',
  'Documentation',
] as const;

export type SkillOption = typeof SKILL_OPTIONS[number];

// Utility function to calculate reputation level
export function getReputationLevel(score: number): ReputationLevel {
  if (score >= 1000) return 'expert';
  if (score >= 500) return 'veteran';
  if (score >= 100) return 'contributor';
  return 'newcomer';
}

// Utility function to get reputation badge color
export function getReputationColor(level: ReputationLevel): string {
  switch (level) {
    case 'expert': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    case 'veteran': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
    case 'contributor': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    case 'newcomer': return 'text-green-500 bg-green-500/10 border-green-500/20';
  }
}

// Project Collaboration Types
export type CollaboratorRole = 'owner' | 'editor' | 'viewer';

export interface ProjectCollaborator {
  id: string;
  project_id: string;
  user_id: string;
  role: CollaboratorRole;
  invited_by: string;
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  user_profile?: Profile;
  inviter_profile?: Profile;
  is_pending?: boolean; // accepted_at is null
}

export interface CollaboratorInvite {
  project_id: string;
  user_email?: string;
  user_id?: string;
  role: Exclude<CollaboratorRole, 'owner'>;
}

// Utility functions for collaboration
export function getRoleColor(role: CollaboratorRole): string {
  switch (role) {
    case 'owner': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    case 'editor': return 'text-blue-600 bg-blue-100 border-blue-200';
    case 'viewer': return 'text-gray-600 bg-gray-100 border-gray-200';
  }
}

export function getRoleDisplayName(role: CollaboratorRole): string {
  switch (role) {
    case 'owner': return 'Owner';
    case 'editor': return 'Editor';
    case 'viewer': return 'Viewer';
  }
}

export function canUserEditProject(userRole?: CollaboratorRole): boolean {
  return userRole === 'owner' || userRole === 'editor';
}

export function canUserManageCollaborators(userRole?: CollaboratorRole): boolean {
  return userRole === 'owner';
}
