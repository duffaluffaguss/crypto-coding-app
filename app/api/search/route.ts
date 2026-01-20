import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface SearchResult {
  id: string;
  type: 'project' | 'lesson' | 'showcase' | 'help';
  title: string;
  description?: string;
  url: string;
}

// Static help content for search
const HELP_CONTENT = [
  {
    id: 'getting-started',
    title: 'How do I create my first project?',
    description: 'After signing up, click "New Project" on your dashboard.',
    keywords: ['create', 'project', 'start', 'new', 'begin', 'first'],
  },
  {
    id: 'coding-experience',
    title: 'Do I need any coding experience?',
    description: 'No prior coding experience is required!',
    keywords: ['experience', 'beginner', 'coding', 'code', 'learn'],
  },
  {
    id: 'smart-contract',
    title: 'What is a smart contract?',
    description: 'A self-executing program stored on the blockchain.',
    keywords: ['smart', 'contract', 'blockchain', 'program', 'solidity'],
  },
  {
    id: 'test-eth',
    title: 'How do I get test ETH?',
    description: 'Get free test ETH from faucets for Base Sepolia testnet.',
    keywords: ['test', 'eth', 'faucet', 'testnet', 'sepolia', 'free'],
  },
  {
    id: 'base-network',
    title: 'What is Base network?',
    description: 'A secure, low-cost Ethereum Layer 2 blockchain by Coinbase.',
    keywords: ['base', 'network', 'layer', 'coinbase', 'ethereum', 'l2'],
  },
  {
    id: 'connect-wallet',
    title: 'How do I connect my wallet?',
    description: 'Click "Connect Wallet" and use MetaMask or another browser wallet.',
    keywords: ['wallet', 'connect', 'metamask', 'browser', 'coinbase'],
  },
  {
    id: 'code-saved',
    title: 'Is my code saved automatically?',
    description: 'Yes! Your code is automatically saved as you type.',
    keywords: ['save', 'code', 'auto', 'automatic', 'backup'],
  },
  {
    id: 'deploy-mainnet',
    title: 'Can I deploy to mainnet?',
    description: 'Yes, once comfortable with testnet. Requires real ETH for gas.',
    keywords: ['deploy', 'mainnet', 'production', 'live', 'real'],
  },
  {
    id: 'achievements',
    title: 'How do achievements work?',
    description: 'Earn badges by completing milestones like deploying contracts.',
    keywords: ['achievement', 'badge', 'milestone', 'reward', 'progress'],
  },
  {
    id: 'solidity',
    title: 'What programming language are smart contracts written in?',
    description: 'Solidity - a language designed for blockchain development.',
    keywords: ['solidity', 'programming', 'language', 'smart', 'contract', 'code'],
  },
  {
    id: 'gas',
    title: 'What is gas and why do I need it?',
    description: 'Gas measures computational effort. Pay gas fees in ETH.',
    keywords: ['gas', 'fee', 'transaction', 'cost', 'eth'],
  },
  {
    id: 'streaks',
    title: 'How do streaks work?',
    description: 'Complete lessons daily to maintain your learning streak.',
    keywords: ['streak', 'daily', 'consecutive', 'learning', 'habit'],
  },
  {
    id: 'ai-tutor',
    title: 'What if I get stuck?',
    description: 'Use the AI Tutor to get personalized help with your code.',
    keywords: ['stuck', 'help', 'tutor', 'ai', 'assistant', 'question'],
  },
  {
    id: 'nft',
    title: 'What is an NFT?',
    description: 'Non-Fungible Token - unique digital assets on the blockchain.',
    keywords: ['nft', 'token', 'digital', 'art', 'collectible', 'unique'],
  },
  {
    id: 'web3',
    title: 'What is Web3?',
    description: 'Decentralized internet built on blockchain technology.',
    keywords: ['web3', 'decentralized', 'blockchain', 'internet', 'ownership'],
  },
];

// Lesson definitions for search
const LESSON_CONTENT = [
  {
    id: 'nft-basics',
    title: 'NFT Basics',
    description: 'Learn the fundamentals of non-fungible tokens',
    project_type: 'nft_marketplace',
    keywords: ['nft', 'basics', 'fundamentals', 'token', 'erc721'],
  },
  {
    id: 'token-creation',
    title: 'Creating Your First Token',
    description: 'Build an ERC-20 token from scratch',
    project_type: 'token',
    keywords: ['token', 'erc20', 'create', 'mint', 'supply'],
  },
  {
    id: 'dao-governance',
    title: 'DAO Governance',
    description: 'Implement voting and proposals for decentralized organizations',
    project_type: 'dao',
    keywords: ['dao', 'governance', 'voting', 'proposal', 'decentralized'],
  },
  {
    id: 'game-mechanics',
    title: 'Blockchain Game Mechanics',
    description: 'Add game logic to your smart contracts',
    project_type: 'game',
    keywords: ['game', 'mechanics', 'play', 'earn', 'gaming'],
  },
  {
    id: 'social-features',
    title: 'Social Features',
    description: 'Build social interactions on the blockchain',
    project_type: 'social',
    keywords: ['social', 'profile', 'follow', 'community', 'interaction'],
  },
  {
    id: 'creator-economy',
    title: 'Creator Economy Tools',
    description: 'Build tools for creators and monetization',
    project_type: 'creator',
    keywords: ['creator', 'monetization', 'royalty', 'content', 'earn'],
  },
  {
    id: 'deployment',
    title: 'Deploying Your Contract',
    description: 'Deploy smart contracts to testnet and mainnet',
    project_type: 'all',
    keywords: ['deploy', 'testnet', 'mainnet', 'publish', 'launch'],
  },
  {
    id: 'wallet-integration',
    title: 'Wallet Integration',
    description: 'Connect wallets and handle transactions',
    project_type: 'all',
    keywords: ['wallet', 'metamask', 'connect', 'transaction', 'sign'],
  },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q')?.toLowerCase().trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results: SearchResult[] = [];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Search user's projects (if authenticated)
  if (user) {
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, description, project_type')
      .eq('user_id', user.id)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(5);

    if (projects) {
      results.push(
        ...projects.map((project) => ({
          id: project.id,
          type: 'project' as const,
          title: project.name,
          description: project.description,
          url: `/projects/${project.id}`,
        }))
      );
    }
  }

  // Search showcase projects (public)
  const { data: showcaseProjects } = await supabase
    .from('projects')
    .select('id, name, description, showcase_description, profiles(display_name)')
    .eq('is_public', true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,showcase_description.ilike.%${query}%`)
    .limit(5);

  if (showcaseProjects) {
    results.push(
      ...showcaseProjects.map((project) => ({
        id: project.id,
        type: 'showcase' as const,
        title: project.name,
        description: project.showcase_description || project.description,
        url: `/showcase/${project.id}`,
      }))
    );
  }

  // Search lessons
  const matchingLessons = LESSON_CONTENT.filter(
    (lesson) =>
      lesson.title.toLowerCase().includes(query) ||
      lesson.description.toLowerCase().includes(query) ||
      lesson.keywords.some((kw) => kw.includes(query))
  ).slice(0, 4);

  results.push(
    ...matchingLessons.map((lesson) => ({
      id: lesson.id,
      type: 'lesson' as const,
      title: lesson.title,
      description: lesson.description,
      url: `/help#lessons`,
    }))
  );

  // Search help content
  const matchingHelp = HELP_CONTENT.filter(
    (help) =>
      help.title.toLowerCase().includes(query) ||
      help.description.toLowerCase().includes(query) ||
      help.keywords.some((kw) => kw.includes(query))
  ).slice(0, 4);

  results.push(
    ...matchingHelp.map((help) => ({
      id: help.id,
      type: 'help' as const,
      title: help.title,
      description: help.description,
      url: `/help#${help.id}`,
    }))
  );

  // Remove duplicates by id+type and limit total results
  const uniqueResults = results.reduce((acc, result) => {
    const key = `${result.type}-${result.id}`;
    if (!acc.some((r) => `${r.type}-${r.id}` === key)) {
      acc.push(result);
    }
    return acc;
  }, [] as SearchResult[]);

  return NextResponse.json({ results: uniqueResults.slice(0, 15) });
}
