'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MintNFTButton } from '@/components/certificate/MintNFTButton';
import { NFTPreview } from '@/components/certificate/NFTPreview';
import { Button } from '@/components/ui/button';
import type { CertificateData } from '@/components/certificate/Certificate';

interface MintNFTSectionProps {
  certificateData: CertificateData;
  projectId: string;
  isOwner: boolean;
}

export function MintNFTSection({ certificateData, projectId, isOwner }: MintNFTSectionProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [mintedTokenId, setMintedTokenId] = useState<bigint | null>(null);

  // Only show to project owner
  if (!isOwner) {
    return null;
  }

  return (
    <div className="pt-6 border-t border-border">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold mb-2">
          🎨 Mint as NFT
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Turn your certificate into a permanent, verifiable NFT on the Base network
        </p>
      </div>

      <div className="flex flex-col items-center gap-6">
        {/* Customize & Preview Row */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {/* Customize Button */}
          <Link href={`/certificate/${projectId}/customize`}>
            <Button variant="outline" className="gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
              Customize Design
            </Button>
          </Link>

          {/* NFT Preview Toggle */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-1"
          >
            {showPreview ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                Hide Preview
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview NFT
              </>
            )}
          </button>
        </div>

        {/* NFT Preview */}
        {showPreview && (
          <div className="w-full max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-300">
            <NFTPreview data={certificateData} />
          </div>
        )}

        {/* Mint Button */}
        <MintNFTButton
          certificateData={certificateData}
          projectId={projectId}
          isOwner={isOwner}
          onMintSuccess={(tokenId) => {
            setMintedTokenId(tokenId);
            setShowPreview(true);
          }}
        />

        {/* Info text */}
        <p className="text-xs text-muted-foreground text-center max-w-sm">
          Minting is free! You only pay the network gas fee (~$0.01 on Base).
          The NFT metadata is stored on-chain for permanence.
        </p>
      </div>
    </div>
  );
}

MintNFTSection.displayName = 'MintNFTSection';
