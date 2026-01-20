export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  projects: PathProject[];
  estimated_hours: number;
  difficulty: Difficulty;
}

export interface PathProject {
  id: string;
  name: string;
  description: string;
  project_type: string;
  estimated_minutes: number;
}

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: 'defi-developer',
    name: 'DeFi Developer',
    description: 'Master decentralized finance by building tokens, staking contracts, and DEX fundamentals. Learn the core building blocks of the DeFi ecosystem.',
    icon: '💰',
    color: 'from-green-500 to-emerald-600',
    difficulty: 'intermediate',
    estimated_hours: 12,
    projects: [
      {
        id: 'defi-token',
        name: 'Create Your ERC-20 Token',
        description: 'Build a fungible token with custom supply, minting, and burning capabilities.',
        project_type: 'token',
        estimated_minutes: 90,
      },
      {
        id: 'defi-staking',
        name: 'Staking Rewards Contract',
        description: 'Implement a staking mechanism with time-based rewards distribution.',
        project_type: 'token',
        estimated_minutes: 120,
      },
      {
        id: 'defi-dex-basics',
        name: 'Simple DEX Swap',
        description: 'Create a basic token swap contract with liquidity pools and pricing.',
        project_type: 'token',
        estimated_minutes: 150,
      },
    ],
  },
  {
    id: 'nft-creator',
    name: 'NFT Creator',
    description: 'From minting to marketplaces, learn everything about creating and selling NFTs. Build royalty systems that earn you passive income.',
    icon: '🎨',
    color: 'from-purple-500 to-pink-600',
    difficulty: 'beginner',
    estimated_hours: 10,
    projects: [
      {
        id: 'nft-collection',
        name: 'NFT Collection',
        description: 'Create an ERC-721 NFT collection with metadata and minting functions.',
        project_type: 'nft_marketplace',
        estimated_minutes: 90,
      },
      {
        id: 'nft-marketplace',
        name: 'NFT Marketplace',
        description: 'Build a marketplace where users can list, buy, and sell NFTs.',
        project_type: 'nft_marketplace',
        estimated_minutes: 150,
      },
      {
        id: 'nft-royalties',
        name: 'Royalty System',
        description: 'Implement ERC-2981 royalty standard for creator earnings on secondary sales.',
        project_type: 'nft_marketplace',
        estimated_minutes: 90,
      },
    ],
  },
  {
    id: 'dao-builder',
    name: 'DAO Builder',
    description: 'Learn to build decentralized autonomous organizations with voting, treasury management, and governance mechanisms.',
    icon: '🏛️',
    color: 'from-blue-500 to-indigo-600',
    difficulty: 'advanced',
    estimated_hours: 15,
    projects: [
      {
        id: 'dao-voting',
        name: 'Voting Contract',
        description: 'Create a proposal and voting system with different voting strategies.',
        project_type: 'dao',
        estimated_minutes: 120,
      },
      {
        id: 'dao-treasury',
        name: 'Treasury Management',
        description: 'Build a multi-sig treasury with spending proposals and approvals.',
        project_type: 'dao',
        estimated_minutes: 150,
      },
      {
        id: 'dao-governance',
        name: 'Full Governance System',
        description: 'Combine voting, treasury, and token-weighted governance into a complete DAO.',
        project_type: 'dao',
        estimated_minutes: 180,
      },
    ],
  },
  {
    id: 'game-dev',
    name: 'Game Dev',
    description: 'Build blockchain games with on-chain lottery, collectible items, and reward systems. Create engaging play-to-earn experiences.',
    icon: '🎮',
    color: 'from-orange-500 to-red-600',
    difficulty: 'intermediate',
    estimated_hours: 14,
    projects: [
      {
        id: 'game-lottery',
        name: 'On-Chain Lottery',
        description: 'Build a provably fair lottery using Chainlink VRF for randomness.',
        project_type: 'game',
        estimated_minutes: 120,
      },
      {
        id: 'game-items',
        name: 'Game Items & Inventory',
        description: 'Create ERC-1155 multi-token items for in-game assets and equipment.',
        project_type: 'game',
        estimated_minutes: 150,
      },
      {
        id: 'game-rewards',
        name: 'Play-to-Earn Rewards',
        description: 'Implement a reward system for player achievements and milestones.',
        project_type: 'game',
        estimated_minutes: 150,
      },
    ],
  },
];

export function getLearningPathById(id: string): LearningPath | undefined {
  return LEARNING_PATHS.find((path) => path.id === id);
}

export function getDifficultyColor(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-500/10 text-green-500';
    case 'intermediate':
      return 'bg-yellow-500/10 text-yellow-500';
    case 'advanced':
      return 'bg-red-500/10 text-red-500';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function formatEstimatedTime(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  }
  return `${hours} hrs`;
}
