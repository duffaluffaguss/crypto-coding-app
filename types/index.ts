// User and Profile Types
export type ExperienceLevel = 'complete_beginner' | 'some_coding' | 'web3_curious';

export type ProjectType = 'nft_marketplace' | 'token' | 'dao' | 'game' | 'social';

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
