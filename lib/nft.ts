import { type Address } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { 
  CERTIFICATE_NFT_ABI, 
  getCertificateNFTAddress, 
  getPublicClient,
  formatCompletionDate,
  type Certificate
} from './certificate-nft';

// ============ Types ============

export interface UserNFT {
  tokenId: bigint;
  projectId: string;
  projectName: string;
  projectType: string;
  completionDate: string;
  imageUrl: string;
  openSeaUrl: string | null;
  baseScanUrl: string | null;
}

// ============ Fetch User's NFTs ============

/**
 * Fetch all NFT certificates owned by a user
 */
export async function fetchUserNFTs(
  userAddress: Address,
  chainId: number = baseSepolia.id
): Promise<UserNFT[]> {
  const contractAddress = getCertificateNFTAddress(chainId);
  if (!contractAddress) {
    return [];
  }

  const client = getPublicClient(chainId);
  
  try {
    // Get user's balance
    const balance = await client.readContract({
      address: contractAddress,
      abi: CERTIFICATE_NFT_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
    });

    if (balance === 0n) {
      return [];
    }

    // Get total supply to iterate through tokens
    const totalSupply = await client.readContract({
      address: contractAddress,
      abi: CERTIFICATE_NFT_ABI,
      functionName: 'totalSupply',
    });

    const userNFTs: UserNFT[] = [];

    // Check each token to find user's tokens
    // In production, you might want to use events or an indexer for better performance
    for (let tokenId = 1n; tokenId <= totalSupply; tokenId++) {
      try {
        const owner = await client.readContract({
          address: contractAddress,
          abi: CERTIFICATE_NFT_ABI,
          functionName: 'ownerOf',
          args: [tokenId],
        });

        if (owner.toLowerCase() === userAddress.toLowerCase()) {
          const certificate = await client.readContract({
            address: contractAddress,
            abi: CERTIFICATE_NFT_ABI,
            functionName: 'getCertificate',
            args: [tokenId],
          }) as Certificate;

          userNFTs.push({
            tokenId,
            projectId: certificate.projectId,
            projectName: certificate.projectName,
            projectType: certificate.projectType,
            completionDate: formatCompletionDate(certificate.completionDate),
            imageUrl: getNFTImageUrl(chainId, tokenId),
            openSeaUrl: getOpenSeaUrl(chainId, tokenId),
            baseScanUrl: getBaseScanUrl(chainId, tokenId),
          });
        }
      } catch {
        // Token might not exist or other error, skip
        continue;
      }
    }

    return userNFTs;
  } catch (error) {
    console.error('Error fetching user NFTs:', error);
    return [];
  }
}

// ============ URL Helpers ============

/**
 * Get the NFT image URL for a given token
 */
export function getNFTImageUrl(chainId: number, tokenId: bigint): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zerotocryptodev.com';
  return `${baseUrl}/api/nft/image/${tokenId.toString()}?chainId=${chainId}`;
}

/**
 * Get the OpenSea URL for a certificate NFT
 */
export function getOpenSeaUrl(chainId: number, tokenId: bigint): string | null {
  const contractAddress = getCertificateNFTAddress(chainId);
  if (!contractAddress) return null;

  if (chainId === base.id) {
    return `https://opensea.io/assets/base/${contractAddress}/${tokenId.toString()}`;
  } else if (chainId === baseSepolia.id) {
    return `https://testnets.opensea.io/assets/base-sepolia/${contractAddress}/${tokenId.toString()}`;
  }
  
  return null;
}

/**
 * Get the BaseScan URL for a certificate NFT
 */
export function getBaseScanUrl(chainId: number, tokenId: bigint): string | null {
  const contractAddress = getCertificateNFTAddress(chainId);
  if (!contractAddress) return null;

  if (chainId === base.id) {
    return `https://basescan.org/nft/${contractAddress}/${tokenId.toString()}`;
  } else if (chainId === baseSepolia.id) {
    return `https://sepolia.basescan.org/nft/${contractAddress}/${tokenId.toString()}`;
  }
  
  return null;
}

/**
 * Get share text for a certificate NFT
 */
export function getShareText(nft: UserNFT): string {
  return `I just earned my "${nft.projectName}" certificate NFT on Zero to Crypto Dev! 🎉🏆`;
}

/**
 * Get share URL for Twitter/X
 */
export function getTwitterShareUrl(nft: UserNFT): string {
  const text = encodeURIComponent(getShareText(nft));
  const url = encodeURIComponent(nft.openSeaUrl || 'https://zerotocryptodev.com');
  return `https://x.com/intent/tweet?text=${text}&url=${url}`;
}

/**
 * Copy share link to clipboard
 */
export async function copyShareLink(nft: UserNFT): Promise<boolean> {
  try {
    const shareUrl = nft.openSeaUrl || 'https://zerotocryptodev.com';
    await navigator.clipboard.writeText(shareUrl);
    return true;
  } catch {
    return false;
  }
}

// ============ Project Type Helpers ============

export const PROJECT_TYPE_COLORS: Record<string, string> = {
  nft_marketplace: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  token: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
  dao: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
  game: 'from-green-500/20 to-green-600/10 border-green-500/30',
  social: 'from-pink-500/20 to-pink-600/10 border-pink-500/30',
  creator: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
};

export const PROJECT_TYPE_GLOW: Record<string, string> = {
  nft_marketplace: 'hover:shadow-purple-500/25',
  token: 'hover:shadow-yellow-500/25',
  dao: 'hover:shadow-blue-500/25',
  game: 'hover:shadow-green-500/25',
  social: 'hover:shadow-pink-500/25',
  creator: 'hover:shadow-orange-500/25',
};
