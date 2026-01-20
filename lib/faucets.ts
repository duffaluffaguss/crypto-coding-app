export interface Faucet {
  id: string;
  name: string;
  url: string;
  description: string;
  features: string[];
  requirements?: string[];
  recommendedFor?: string;
  emoji: string;
  estimatedTime: string;
  amount?: string;
  status?: 'active' | 'limited' | 'down';
}

export interface NetworkFaucets {
  networkId: string;
  networkName: string;
  chainId: number;
  faucets: Faucet[];
}

export const BASE_SEPOLIA_FAUCETS: Faucet[] = [
  {
    id: 'coinbase',
    name: 'Coinbase Faucet',
    url: 'https://portal.cdp.coinbase.com/products/faucet',
    description: 'Official Coinbase faucet with reliable uptime and good daily limits.',
    features: ['High daily limits', 'Reliable uptime', 'No signup required'],
    recommendedFor: 'Most users',
    emoji: '🔵',
    estimatedTime: '1-2 minutes',
    amount: '0.05 ETH/day',
    status: 'active',
  },
  {
    id: 'alchemy',
    name: 'Alchemy Faucet',
    url: 'https://www.alchemy.com/faucets/base-sepolia',
    description: 'Alchemy\'s Base Sepolia faucet with no signup needed.',
    features: ['No signup required', 'Fast processing', 'Good for testing'],
    emoji: '⚗️',
    estimatedTime: '30 seconds',
    amount: '0.01 ETH/day',
    status: 'active',
  },
  {
    id: 'quicknode',
    name: 'QuickNode Faucet',
    url: 'https://faucet.quicknode.com/base/sepolia',
    description: 'Fast and reliable faucet from QuickNode.',
    features: ['Very fast', 'Good uptime', 'Simple interface'],
    emoji: '⚡',
    estimatedTime: '15 seconds',
    amount: '0.005 ETH/request',
    status: 'active',
  },
  {
    id: 'triangleplatform',
    name: 'Triangle Platform',
    url: 'https://faucet.triangleplatform.com/base/sepolia',
    description: 'Alternative faucet with social verification options.',
    features: ['Social verification', 'Higher limits with verification'],
    requirements: ['Twitter account (optional)'],
    emoji: '🔺',
    estimatedTime: '1-3 minutes',
    amount: '0.02 ETH/day',
    status: 'active',
  }
];

export const FAUCET_NETWORKS: NetworkFaucets[] = [
  {
    networkId: 'base-sepolia',
    networkName: 'Base Sepolia',
    chainId: 84532,
    faucets: BASE_SEPOLIA_FAUCETS,
  }
];

export function getFaucetsForNetwork(networkId: string): Faucet[] {
  const network = FAUCET_NETWORKS.find(n => n.networkId === networkId);
  return network?.faucets || [];
}

export function getPrimaryFaucet(networkId: string): Faucet | null {
  const faucets = getFaucetsForNetwork(networkId);
  return faucets.find(f => f.recommendedFor === 'Most users') || faucets[0] || null;
}

export function openFaucet(faucetUrl: string, walletAddress?: string): void {
  let url = faucetUrl;
  
  // Some faucets support pre-filling the address
  if (walletAddress && faucetUrl.includes('coinbase')) {
    // Coinbase faucet supports address parameter (if they add it in the future)
    url = `${faucetUrl}?address=${walletAddress}`;
  }
  
  window.open(url, '_blank', 'noopener,noreferrer');
}

// Optional: Faucet status checker (basic implementation)
export async function checkFaucetStatus(faucet: Faucet): Promise<'active' | 'limited' | 'down'> {
  try {
    // Simple HEAD request to check if faucet is accessible
    const response = await fetch(faucet.url, { method: 'HEAD', mode: 'no-cors' });
    return 'active';
  } catch (error) {
    console.warn(`Faucet ${faucet.name} may be down:`, error);
    return 'down';
  }
}

export const FAUCET_FAQ = [
  {
    question: "What is testnet ETH?",
    answer: "Testnet ETH is fake cryptocurrency used for testing smart contracts. It has no real value but allows you to test your applications without spending real money."
  },
  {
    question: "How much testnet ETH do I need?",
    answer: "Usually 0.01-0.05 ETH is enough for deploying and testing multiple smart contracts. Our platform often sponsors gas fees, so you might need even less."
  },
  {
    question: "How often can I get testnet ETH?",
    answer: "Most faucets allow you to get test ETH once per day. Each faucet has its own limits and cooldown periods."
  },
  {
    question: "Why do I need to connect my wallet?",
    answer: "Faucets need your wallet address to send the test ETH. Your address is like a bank account number for receiving cryptocurrency."
  },
  {
    question: "Is it safe to use my real wallet?",
    answer: "Yes! These are official testnet faucets. They only send test ETH which has no real value. Always use testnets before deploying to mainnet."
  },
  {
    question: "What if a faucet doesn't work?",
    answer: "Try a different faucet from our list. Sometimes faucets go down or have rate limits. You can also ask for help in our community."
  }
];