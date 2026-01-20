'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  type UserNFT, 
  PROJECT_TYPE_COLORS, 
  PROJECT_TYPE_GLOW,
  getTwitterShareUrl,
  copyShareLink
} from '@/lib/nft';
import { cn } from '@/lib/utils';

interface NFTCardProps {
  nft: UserNFT;
  onViewCertificate?: (nft: UserNFT) => void;
}

export function NFTCard({ nft, onViewCertificate }: NFTCardProps) {
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const gradientClass = PROJECT_TYPE_COLORS[nft.projectType] || PROJECT_TYPE_COLORS.nft_marketplace;
  const glowClass = PROJECT_TYPE_GLOW[nft.projectType] || PROJECT_TYPE_GLOW.nft_marketplace;

  const handleShare = async () => {
    const success = await copyShareLink(nft);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleViewCertificate = () => {
    if (onViewCertificate) {
      onViewCertificate(nft);
    }
  };

  return (
    <div
      className={cn(
        'group relative rounded-xl overflow-hidden',
        'bg-gradient-to-br border',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-2 hover:shadow-2xl',
        gradientClass,
        glowClass
      )}
    >
      {/* NFT Image */}
      <div 
        className="relative aspect-square cursor-pointer overflow-hidden"
        onClick={handleViewCertificate}
      >
        {/* Loading Skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
            <div className="text-4xl">🎨</div>
          </div>
        )}
        
        <Image
          src={nft.imageUrl}
          alt={`${nft.projectName} Certificate NFT`}
          fill
          className={cn(
            'object-cover transition-all duration-300',
            'group-hover:scale-105',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImageLoaded(true)}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        
        {/* Hover Overlay */}
        <div className={cn(
          'absolute inset-0 bg-black/60 flex items-center justify-center',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-300'
        )}>
          <span className="text-white font-medium">View Certificate</span>
        </div>

        {/* Token ID Badge */}
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
          <span className="text-xs text-white font-mono">#{nft.tokenId.toString()}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-3">
        {/* Project Name */}
        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {nft.projectName}
        </h3>

        {/* Date */}
        <p className="text-xs text-muted-foreground">
          {nft.completionDate}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {/* OpenSea Button */}
          {nft.openSeaUrl && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-8"
              asChild
            >
              <a 
                href={nft.openSeaUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5"
              >
                <OpenSeaIcon className="w-3.5 h-3.5" />
                OpenSea
              </a>
            </Button>
          )}

          {/* Share Button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={handleShare}
            title="Copy share link"
          >
            {copied ? (
              <CheckIcon className="w-4 h-4 text-green-500" />
            ) : (
              <ShareIcon className="w-4 h-4" />
            )}
          </Button>

          {/* Twitter/X Share */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2"
            asChild
            title="Share on X"
          >
            <a 
              href={getTwitterShareUrl(nft)} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <XIcon className="w-4 h-4" />
            </a>
          </Button>
        </div>

        {/* BaseScan Link */}
        {nft.baseScanUrl && (
          <a
            href={nft.baseScanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-muted-foreground hover:text-primary transition-colors text-center"
          >
            View on BaseScan →
          </a>
        )}
      </div>
    </div>
  );
}

// Icon Components
function OpenSeaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 90 90" fill="currentColor">
      <path d="M45 0C20.151 0 0 20.151 0 45C0 69.849 20.151 90 45 90C69.849 90 90 69.849 90 45C90 20.151 69.858 0 45 0ZM22.203 46.512L22.392 46.206L34.101 27.891C34.272 27.63 34.677 27.657 34.803 27.945C36.756 32.328 38.448 37.782 37.656 41.175C37.323 42.57 36.396 44.46 35.352 46.206C35.217 46.458 35.073 46.701 34.911 46.935C34.839 47.043 34.713 47.106 34.578 47.106H22.545C22.221 47.106 22.032 46.756 22.203 46.512ZM74.376 52.812C74.376 52.983 74.277 53.127 74.133 53.19C73.224 53.577 70.119 55.008 68.832 56.799C65.538 61.38 63.027 67.932 57.402 67.932H33.948C25.632 67.932 18.9 61.173 18.9 52.83V52.56C18.9 52.344 19.08 52.164 19.305 52.164H32.373C32.634 52.164 32.823 52.398 32.805 52.659C32.706 53.505 32.868 54.378 33.273 55.17C34.047 56.745 35.658 57.726 37.395 57.726H43.866V52.677H37.467C37.134 52.677 36.936 52.299 37.134 52.029C37.206 51.921 37.287 51.804 37.368 51.669C37.971 50.769 38.835 49.401 39.699 47.835C40.302 46.746 40.878 45.576 41.337 44.397C41.454 44.145 41.553 43.884 41.652 43.632C41.805 43.263 41.967 42.885 42.084 42.516C42.201 42.228 42.3 41.922 42.408 41.634C42.723 40.545 42.858 39.393 42.858 38.205C42.858 37.737 42.831 37.251 42.786 36.792C42.759 36.288 42.687 35.793 42.615 35.289C42.57 34.893 42.489 34.506 42.408 34.101C42.3 33.588 42.156 33.084 42.012 32.58L41.967 32.391C41.859 32.022 41.769 31.671 41.652 31.302C41.337 30.249 40.986 29.232 40.617 28.278C40.473 27.864 40.302 27.468 40.131 27.063C39.879 26.442 39.618 25.884 39.384 25.35C39.267 25.116 39.168 24.9 39.069 24.684C38.961 24.441 38.844 24.198 38.727 23.964C38.637 23.784 38.529 23.613 38.466 23.442L37.728 22.122C37.611 21.915 37.8 21.663 38.025 21.726L42.489 22.932H42.507C42.516 22.932 42.52 22.932 42.525 22.932L43.101 23.094L43.731 23.274L43.866 23.31V20.79C43.866 19.287 45.063 18.063 46.539 18.063C47.277 18.063 47.943 18.378 48.42 18.882C48.897 19.386 49.212 20.061 49.212 20.79V24.633L49.671 24.768C49.707 24.777 49.743 24.795 49.779 24.822C49.896 24.912 50.067 25.047 50.283 25.218C50.454 25.362 50.634 25.533 50.859 25.722C51.291 26.082 51.822 26.559 52.398 27.099C52.56 27.243 52.713 27.396 52.857 27.549C53.595 28.26 54.423 29.088 55.206 30.006C55.44 30.285 55.665 30.573 55.899 30.87C56.133 31.176 56.385 31.473 56.601 31.779C56.889 32.175 57.204 32.598 57.474 33.03C57.609 33.246 57.771 33.471 57.906 33.696C58.302 34.344 58.644 35.01 58.968 35.676C59.103 35.964 59.238 36.288 59.346 36.603C59.652 37.404 59.895 38.214 60.012 39.024C60.057 39.195 60.084 39.384 60.093 39.555V39.627C60.129 39.897 60.111 40.176 60.093 40.464C60.03 40.977 59.922 41.481 59.76 41.994C59.652 42.378 59.517 42.771 59.346 43.164C59.013 43.959 58.617 44.754 58.149 45.504C58.005 45.774 57.834 46.053 57.663 46.323C57.474 46.611 57.285 46.881 57.114 47.142C56.88 47.484 56.628 47.835 56.367 48.159C56.142 48.501 55.908 48.843 55.647 49.149C55.278 49.617 54.927 50.058 54.558 50.49C54.387 50.706 54.198 50.931 54 51.138C53.811 51.363 53.613 51.57 53.433 51.768C53.136 52.092 52.893 52.353 52.677 52.569L52.182 53.037C52.065 53.145 51.903 53.208 51.741 53.208H49.212V57.717H53.937C55.044 57.717 56.088 57.303 56.934 56.538C57.195 56.304 58.554 55.107 60.147 53.433C60.201 53.379 60.264 53.334 60.336 53.307L73.998 49.239C74.25 49.158 74.376 49.356 74.376 49.554V52.812Z" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" 
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M5 13l4 4L19 7" 
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

NFTCard.displayName = 'NFTCard';
