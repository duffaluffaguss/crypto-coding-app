export type ChangeCategory = 'feature' | 'improvement' | 'fix';

export interface ChangelogItem {
  text: string;
  category: ChangeCategory;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description?: string;
  changes: ChangelogItem[];
}

export const CURRENT_VERSION = '1.4.0';

export const changelog: ChangelogEntry[] = [
  {
    version: '1.4.0',
    date: '2026-01-19',
    title: 'Achievements, Profiles & Social Features',
    description: 'Major update bringing gamification, user profiles, and improved social features to the platform.',
    changes: [
      { text: 'Achievement system with 15+ badges to earn', category: 'feature' },
      { text: 'Public user profiles with customizable avatars', category: 'feature' },
      { text: 'Profile showcase with deployed projects', category: 'feature' },
      { text: 'Learning streaks with visual display', category: 'feature' },
      { text: 'Referral program with tracking dashboard', category: 'feature' },
      { text: 'Achievement toast notifications', category: 'feature' },
      { text: 'Leaderboard with weekly/monthly/all-time views', category: 'feature' },
      { text: 'Project showcase gallery', category: 'feature' },
      { text: 'Shareable certificates for completed projects', category: 'feature' },
      { text: 'This changelog page!', category: 'feature' },
      { text: 'Improved dashboard layout and navigation', category: 'improvement' },
      { text: 'Better mobile responsiveness across all pages', category: 'improvement' },
      { text: 'Faster page load times', category: 'improvement' },
    ],
  },
  {
    version: '1.3.0',
    date: '2026-01-12',
    title: 'AI Tutor & Code Editor Enhancements',
    description: 'Enhanced AI tutor capabilities and improved code editing experience.',
    changes: [
      { text: 'Context-aware AI tutor that understands your project', category: 'feature' },
      { text: 'Code snippets library with common patterns', category: 'feature' },
      { text: 'Export project code as ZIP', category: 'feature' },
      { text: 'Improved syntax highlighting for Solidity', category: 'improvement' },
      { text: 'Better error messages from compiler', category: 'improvement' },
      { text: 'Fixed code editor freezing on large files', category: 'fix' },
      { text: 'Fixed AI tutor response formatting', category: 'fix' },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-01-05',
    title: 'Challenges & Learning Paths',
    description: 'New challenge system and structured learning paths.',
    changes: [
      { text: 'Weekly coding challenges with rewards', category: 'feature' },
      { text: 'Structured learning paths for beginners', category: 'feature' },
      { text: 'Progress tracking across lessons', category: 'feature' },
      { text: 'Hints system for stuck moments', category: 'feature' },
      { text: 'Improved onboarding flow', category: 'improvement' },
      { text: 'Fixed wallet connection issues on mobile', category: 'fix' },
    ],
  },
  {
    version: '1.1.0',
    date: '2025-12-28',
    title: 'Deployment & Sharing',
    description: 'One-click deployment and project sharing features.',
    changes: [
      { text: 'One-click deployment to Base Sepolia testnet', category: 'feature' },
      { text: 'One-click deployment to Base mainnet', category: 'feature' },
      { text: 'Project sharing with unique links', category: 'feature' },
      { text: 'Transaction history viewer', category: 'feature' },
      { text: 'Gas estimation before deployment', category: 'improvement' },
      { text: 'Better deployment error handling', category: 'improvement' },
      { text: 'Fixed contract verification issues', category: 'fix' },
    ],
  },
  {
    version: '1.0.0',
    date: '2025-12-15',
    title: 'Initial Launch',
    description: 'The beginning of Zero to Crypto Dev!',
    changes: [
      { text: 'AI-powered project idea generation', category: 'feature' },
      { text: 'Fill-in-the-blank code exercises', category: 'feature' },
      { text: 'In-browser Solidity editor', category: 'feature' },
      { text: 'Real-time code compilation', category: 'feature' },
      { text: 'MetaMask wallet integration', category: 'feature' },
      { text: 'User authentication with email', category: 'feature' },
      { text: 'Project autosave', category: 'feature' },
      { text: 'Dark mode support', category: 'feature' },
    ],
  },
];

export function getLatestVersion(): string {
  return CURRENT_VERSION;
}

export function getCategoryLabel(category: ChangeCategory): string {
  switch (category) {
    case 'feature':
      return 'New Feature';
    case 'improvement':
      return 'Improvement';
    case 'fix':
      return 'Bug Fix';
    default:
      return category;
  }
}

export function getCategoryColor(category: ChangeCategory): string {
  switch (category) {
    case 'feature':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'improvement':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'fix':
      return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
}
