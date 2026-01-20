import { createPublicClient, createWalletClient, http, type Address, type Hex } from 'viem';
import { mainnet, sepolia } from 'viem/chains';

// ============ Contract ABI ============

export const CERTIFICATE_NFT_ABI = [
  // Events
  {
    type: 'event',
    name: 'CertificateMinted',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'user', type: 'address', indexed: true },
      { name: 'projectId', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'MinterUpdated',
    inputs: [
      { name: 'minter', type: 'address', indexed: true },
      { name: 'authorized', type: 'bool', indexed: false },
    ],
  },
  
  // Read Functions
  {
    type: 'function',
    name: 'hasMinted',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'projectId', type: 'string' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'getTokenForProject',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'projectId', type: 'string' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getCertificate',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'projectId', type: 'string' },
          { name: 'projectName', type: 'string' },
          { name: 'projectType', type: 'string' },
          { name: 'recipient', type: 'address' },
          { name: 'completionDate', type: 'uint256' },
          { name: 'tokenId', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'authorizedMinters',
    stateMutability: 'view',
    inputs: [{ name: 'minter', type: 'address' }],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'ownerOf',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'tokenURI',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'string' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  
  // Write Functions
  {
    type: 'function',
    name: 'mintCertificate',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'projectId', type: 'string' },
      { name: 'projectName', type: 'string' },
      { name: 'projectType', type: 'string' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'setMinter',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'minter', type: 'address' },
      { name: 'authorized', type: 'bool' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'setBaseURI',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'baseURI', type: 'string' }],
    outputs: [],
  },
] as const;

// ============ Types ============

export interface Certificate {
  projectId: string;
  projectName: string;
  projectType: string;
  recipient: Address;
  completionDate: bigint;
  tokenId: bigint;
}

export interface MintCertificateParams {
  to: Address;
  projectId: string;
  projectName: string;
  projectType: string;
}

// ============ Contract Addresses ============

export const CERTIFICATE_NFT_ADDRESSES: Record<number, Address | undefined> = {
  1: process.env.NEXT_PUBLIC_CERTIFICATE_NFT_MAINNET as Address | undefined,
  11155111: process.env.NEXT_PUBLIC_CERTIFICATE_NFT_SEPOLIA as Address | undefined,
};

/**
 * Get the contract address for a given chain ID
 */
export function getCertificateNFTAddress(chainId: number): Address | undefined {
  return CERTIFICATE_NFT_ADDRESSES[chainId];
}

// ============ Client Helpers ============

/**
 * Create a public client for reading contract state
 */
export function getPublicClient(chainId: number) {
  const chain = chainId === 1 ? mainnet : sepolia;
  return createPublicClient({
    chain,
    transport: http(),
  });
}

// ============ Read Functions ============

/**
 * Check if a user has already minted a certificate for a specific project
 */
export async function checkHasMinted(
  chainId: number,
  userAddress: Address,
  projectId: string
): Promise<boolean> {
  const contractAddress = getCertificateNFTAddress(chainId);
  if (!contractAddress) {
    throw new Error(`No contract address for chain ${chainId}`);
  }

  const client = getPublicClient(chainId);
  
  const hasMinted = await client.readContract({
    address: contractAddress,
    abi: CERTIFICATE_NFT_ABI,
    functionName: 'hasMinted',
    args: [userAddress, projectId],
  });

  return hasMinted;
}

/**
 * Get the token ID for a user's project certificate
 */
export async function getTokenForProject(
  chainId: number,
  userAddress: Address,
  projectId: string
): Promise<bigint> {
  const contractAddress = getCertificateNFTAddress(chainId);
  if (!contractAddress) {
    throw new Error(`No contract address for chain ${chainId}`);
  }

  const client = getPublicClient(chainId);
  
  const tokenId = await client.readContract({
    address: contractAddress,
    abi: CERTIFICATE_NFT_ABI,
    functionName: 'getTokenForProject',
    args: [userAddress, projectId],
  });

  return tokenId;
}

/**
 * Get certificate data for a token
 */
export async function getCertificate(
  chainId: number,
  tokenId: bigint
): Promise<Certificate> {
  const contractAddress = getCertificateNFTAddress(chainId);
  if (!contractAddress) {
    throw new Error(`No contract address for chain ${chainId}`);
  }

  const client = getPublicClient(chainId);
  
  const certificate = await client.readContract({
    address: contractAddress,
    abi: CERTIFICATE_NFT_ABI,
    functionName: 'getCertificate',
    args: [tokenId],
  });

  return certificate as Certificate;
}

/**
 * Get the total number of certificates minted
 */
export async function getTotalSupply(chainId: number): Promise<bigint> {
  const contractAddress = getCertificateNFTAddress(chainId);
  if (!contractAddress) {
    throw new Error(`No contract address for chain ${chainId}`);
  }

  const client = getPublicClient(chainId);
  
  const totalSupply = await client.readContract({
    address: contractAddress,
    abi: CERTIFICATE_NFT_ABI,
    functionName: 'totalSupply',
  });

  return totalSupply;
}

/**
 * Get the token URI for a certificate
 */
export async function getTokenURI(
  chainId: number,
  tokenId: bigint
): Promise<string> {
  const contractAddress = getCertificateNFTAddress(chainId);
  if (!contractAddress) {
    throw new Error(`No contract address for chain ${chainId}`);
  }

  const client = getPublicClient(chainId);
  
  const uri = await client.readContract({
    address: contractAddress,
    abi: CERTIFICATE_NFT_ABI,
    functionName: 'tokenURI',
    args: [tokenId],
  });

  return uri;
}

// ============ Transaction Preparation ============

/**
 * Prepare the transaction data for minting a certificate
 * This is used by the frontend to submit transactions via the user's wallet
 */
export function prepareMintTransaction(
  chainId: number,
  params: MintCertificateParams
): { to: Address; data: Hex } | null {
  const contractAddress = getCertificateNFTAddress(chainId);
  if (!contractAddress) {
    return null;
  }

  // Encode the function call
  const { encodeFunctionData } = require('viem');
  
  const data = encodeFunctionData({
    abi: CERTIFICATE_NFT_ABI,
    functionName: 'mintCertificate',
    args: [params.to, params.projectId, params.projectName, params.projectType],
  });

  return {
    to: contractAddress,
    data,
  };
}

// ============ Utility Functions ============

/**
 * Format a completion date from timestamp
 */
export function formatCompletionDate(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get OpenSea URL for a certificate
 */
export function getOpenSeaURL(chainId: number, tokenId: bigint): string | null {
  const contractAddress = getCertificateNFTAddress(chainId);
  if (!contractAddress) return null;

  if (chainId === 1) {
    return `https://opensea.io/assets/ethereum/${contractAddress}/${tokenId}`;
  } else if (chainId === 11155111) {
    return `https://testnets.opensea.io/assets/sepolia/${contractAddress}/${tokenId}`;
  }
  
  return null;
}

/**
 * Get Etherscan URL for a certificate
 */
export function getEtherscanURL(chainId: number, tokenId: bigint): string | null {
  const contractAddress = getCertificateNFTAddress(chainId);
  if (!contractAddress) return null;

  if (chainId === 1) {
    return `https://etherscan.io/nft/${contractAddress}/${tokenId}`;
  } else if (chainId === 11155111) {
    return `https://sepolia.etherscan.io/nft/${contractAddress}/${tokenId}`;
  }
  
  return null;
}
