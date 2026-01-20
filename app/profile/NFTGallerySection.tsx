'use client';

import { useAccount, useChainId } from 'wagmi';
import { NFTGallery } from '@/components/profile/NFTGallery';

export function NFTGallerySection() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  return (
    <NFTGallery
      walletAddress={isConnected ? address : null}
      chainId={chainId}
    />
  );
}

NFTGallerySection.displayName = 'NFTGallerySection';
