import { baseSepolia, base } from 'wagmi/chains';

export type NetworkId = 'base-sepolia' | 'base-mainnet';

export interface NetworkConfig {
  id: NetworkId;
  name: string;
  chain: typeof baseSepolia | typeof base;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  explorerName: string;
  isTestnet: boolean;
}

export const NETWORKS: Record<NetworkId, NetworkConfig> = {
  'base-sepolia': {
    id: 'base-sepolia',
    name: 'Base Sepolia',
    chain: baseSepolia,
    chainId: 84532,
    rpcUrl: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    explorerName: 'BaseScan (Sepolia)',
    isTestnet: true,
  },
  'base-mainnet': {
    id: 'base-mainnet',
    name: 'Base Mainnet',
    chain: base,
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    explorerName: 'BaseScan',
    isTestnet: false,
  },
};

export const DEFAULT_NETWORK: NetworkId = 'base-sepolia';

export function getNetworkConfig(networkId: NetworkId): NetworkConfig {
  return NETWORKS[networkId];
}

export function getTxExplorerUrl(networkId: NetworkId, txHash: string): string {
  const network = NETWORKS[networkId];
  return `${network.explorerUrl}/tx/${txHash}`;
}

export function getAddressExplorerUrl(networkId: NetworkId, address: string): string {
  const network = NETWORKS[networkId];
  return `${network.explorerUrl}/address/${address}`;
}
