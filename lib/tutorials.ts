export type TutorialCategory = 'getting-started' | 'solidity-basics' | 'deploying' | 'advanced';
export type TutorialDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  duration: string;
  category: TutorialCategory;
  difficulty: TutorialDifficulty;
  thumbnail?: string;
}

export const tutorials: Tutorial[] = [
  // Getting Started
  {
    id: 'intro-to-web3',
    title: 'Introduction to Web3 Development',
    description: 'Learn the fundamentals of Web3 and understand how blockchain technology works. Perfect starting point for beginners.',
    youtubeId: 'gyMwXuJrbJQ',
    duration: '12:34',
    category: 'getting-started',
    difficulty: 'beginner',
  },
  {
    id: 'setup-dev-environment',
    title: 'Setting Up Your Development Environment',
    description: 'Install and configure all the tools you need: Node.js, VS Code, MetaMask, and more.',
    youtubeId: 'M576WGiDBdQ',
    duration: '18:45',
    category: 'getting-started',
    difficulty: 'beginner',
  },

  // Solidity Basics
  {
    id: 'solidity-fundamentals',
    title: 'Solidity Fundamentals',
    description: 'Master the basics of Solidity: variables, data types, functions, and control structures.',
    youtubeId: 'RQzuQb0dfBM',
    duration: '25:30',
    category: 'solidity-basics',
    difficulty: 'beginner',
  },
  {
    id: 'smart-contract-structure',
    title: 'Smart Contract Structure',
    description: 'Understand how smart contracts are organized with constructors, state variables, and modifiers.',
    youtubeId: 'sngKPYfUgkc',
    duration: '20:15',
    category: 'solidity-basics',
    difficulty: 'beginner',
  },
  {
    id: 'mappings-and-structs',
    title: 'Working with Mappings and Structs',
    description: 'Learn how to use complex data structures in Solidity for real-world applications.',
    youtubeId: 'wJnXuCFVGFA',
    duration: '22:40',
    category: 'solidity-basics',
    difficulty: 'intermediate',
  },

  // Deploying
  {
    id: 'deploy-first-contract',
    title: 'Deploy Your First Smart Contract',
    description: 'Step-by-step guide to deploying your first contract on the Base Sepolia testnet.',
    youtubeId: 'p3C7jljTXaA',
    duration: '15:20',
    category: 'deploying',
    difficulty: 'beginner',
  },
  {
    id: 'hardhat-deployment',
    title: 'Professional Deployment with Hardhat',
    description: 'Learn to use Hardhat for testing, compiling, and deploying smart contracts like a pro.',
    youtubeId: '9Qpi80dQsGU',
    duration: '28:50',
    category: 'deploying',
    difficulty: 'intermediate',
  },

  // Advanced
  {
    id: 'erc20-token',
    title: 'Building an ERC-20 Token',
    description: 'Create your own cryptocurrency token following the ERC-20 standard.',
    youtubeId: '8N0lLN5bhqA',
    duration: '35:15',
    category: 'advanced',
    difficulty: 'intermediate',
  },
  {
    id: 'nft-collection',
    title: 'Creating an NFT Collection',
    description: 'Build and deploy a full ERC-721 NFT collection with metadata and minting functionality.',
    youtubeId: 'GjRvB5I-u08',
    duration: '42:30',
    category: 'advanced',
    difficulty: 'advanced',
  },
  {
    id: 'defi-basics',
    title: 'DeFi Smart Contract Patterns',
    description: 'Explore common DeFi patterns including staking, liquidity pools, and yield farming concepts.',
    youtubeId: 'EhPY7oQvV0Y',
    duration: '48:20',
    category: 'advanced',
    difficulty: 'advanced',
  },
];

export const categoryLabels: Record<TutorialCategory, string> = {
  'getting-started': 'Getting Started',
  'solidity-basics': 'Solidity Basics',
  'deploying': 'Deploying',
  'advanced': 'Advanced',
};

export const categoryColors: Record<TutorialCategory, string> = {
  'getting-started': 'bg-green-500/10 text-green-500',
  'solidity-basics': 'bg-blue-500/10 text-blue-500',
  'deploying': 'bg-purple-500/10 text-purple-500',
  'advanced': 'bg-orange-500/10 text-orange-500',
};

export const difficultyColors: Record<TutorialDifficulty, string> = {
  beginner: 'bg-emerald-500/10 text-emerald-500',
  intermediate: 'bg-amber-500/10 text-amber-500',
  advanced: 'bg-red-500/10 text-red-500',
};

export function getTutorialById(id: string): Tutorial | undefined {
  return tutorials.find((t) => t.id === id);
}

export function getTutorialsByCategory(category: TutorialCategory): Tutorial[] {
  return tutorials.filter((t) => t.category === category);
}

export function getRelatedTutorials(currentId: string, limit: number = 3): Tutorial[] {
  const current = getTutorialById(currentId);
  if (!current) return [];
  
  return tutorials
    .filter((t) => t.id !== currentId && t.category === current.category)
    .slice(0, limit);
}
