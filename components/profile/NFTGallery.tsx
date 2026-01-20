'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { NFTCard } from './NFTCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchUserNFTs, type UserNFT } from '@/lib/nft';
import { baseSepolia } from 'viem/chains';
import type { Address } from 'viem';

interface NFTGalleryProps {
  walletAddress?: Address | null;
  chainId?: number;
}

export function NFTGallery({ 
  walletAddress, 
  chainId = baseSepolia.id 
}: NFTGalleryProps) {
  const [nfts, setNfts] = useState<UserNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadNFTs() {
      if (!walletAddress) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const userNFTs = await fetchUserNFTs(walletAddress, chainId);
        setNfts(userNFTs);
      } catch (err) {
        console.error('Failed to load NFTs:', err);
        setError('Failed to load your NFT certificates');
      } finally {
        setLoading(false);
      }
    }

    loadNFTs();
  }, [walletAddress, chainId]);

  const handleViewCertificate = (nft: UserNFT) => {
    // Open certificate page in new tab
    window.open(`/certificate/${nft.projectId}`, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>🎨</span>
            My NFT Certificates
          </CardTitle>
          {nfts.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {nfts.length} {nfts.length === 1 ? 'certificate' : 'certificates'}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <NFTCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* No Wallet Connected State */}
        {!walletAddress && !loading && (
          <EmptyState
            icon="🔗"
            title="Connect Your Wallet"
            description="Connect your wallet to view your NFT certificates."
            ctaText="Connect Wallet"
            ctaHref="/settings"
          />
        )}

        {/* Empty State - No NFTs */}
        {walletAddress && !loading && !error && nfts.length === 0 && (
          <EmptyState
            icon="🏆"
            title="No NFT Certificates Yet"
            description="Complete a project and mint your certificate as an NFT to see it here!"
            ctaText="Earn Your First NFT"
            ctaHref="/dashboard"
          />
        )}

        {/* NFT Grid */}
        {!loading && !error && nfts.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {nfts.map((nft) => (
              <NFTCard
                key={nft.tokenId.toString()}
                nft={nft}
                onViewCertificate={handleViewCertificate}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
}

function EmptyState({ icon, title, description, ctaText, ctaHref }: EmptyStateProps) {
  return (
    <div className="text-center py-10">
      <div className="text-6xl mb-4 animate-bounce">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
        {description}
      </p>
      <Link href={ctaHref}>
        <Button className="gap-2">
          <span>✨</span>
          {ctaText}
        </Button>
      </Link>
    </div>
  );
}

// Loading Skeleton
function NFTCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-muted/30 border border-border animate-pulse">
      {/* Image Placeholder */}
      <div className="aspect-square bg-muted flex items-center justify-center">
        <div className="text-4xl opacity-30">🎨</div>
      </div>
      
      {/* Content Placeholder */}
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="flex gap-2 pt-2">
          <div className="h-8 bg-muted rounded flex-1" />
          <div className="h-8 w-8 bg-muted rounded" />
          <div className="h-8 w-8 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

NFTGallery.displayName = 'NFTGallery';
