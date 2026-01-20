'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ShareData {
  title: string;
  text: string;
  url: string;
}

interface ShareButtonsProps {
  shareData: ShareData;
  variant?: 'default' | 'compact' | 'icon-only';
  className?: string;
  onShare?: (platform: string) => void;
}

// Icons as separate components for cleaner code
const TwitterIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ShareIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
    />
  </svg>
);

export function ShareButtons({
  shareData,
  variant = 'default',
  className,
  onShare,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [supportsNativeShare] = useState(() => 
    typeof navigator !== 'undefined' && !!navigator.share
  );

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      onShare?.('copy');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [shareData.url, onShare]);

  const handleTwitterShare = useCallback(() => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareData.text
    )}&url=${encodeURIComponent(shareData.url)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
    onShare?.('twitter');
  }, [shareData, onShare]);

  const handleLinkedInShare = useCallback(() => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      shareData.url
    )}`;
    window.open(linkedInUrl, '_blank', 'noopener,noreferrer,width=600,height=600');
    onShare?.('linkedin');
  }, [shareData.url, onShare]);

  const handleNativeShare = useCallback(async () => {
    if (!navigator.share) return;
    
    try {
      await navigator.share({
        title: shareData.title,
        text: shareData.text,
        url: shareData.url,
      });
      onShare?.('native');
    } catch (err) {
      // User cancelled or share failed
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  }, [shareData, onShare]);

  const isCompact = variant === 'compact';
  const isIconOnly = variant === 'icon-only';

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Twitter/X Share */}
      <Button
        onClick={handleTwitterShare}
        variant="outline"
        size={isCompact ? 'sm' : 'default'}
        className={cn(
          'gap-2 bg-black hover:bg-zinc-800 text-white border-black',
          isIconOnly && 'px-3'
        )}
        title="Share on X (Twitter)"
      >
        <TwitterIcon />
        {!isIconOnly && <span>Share on X</span>}
      </Button>

      {/* LinkedIn Share */}
      <Button
        onClick={handleLinkedInShare}
        variant="outline"
        size={isCompact ? 'sm' : 'default'}
        className={cn(
          'gap-2 bg-[#0A66C2] hover:bg-[#004182] text-white border-[#0A66C2]',
          isIconOnly && 'px-3'
        )}
        title="Share on LinkedIn"
      >
        <LinkedInIcon />
        {!isIconOnly && <span>Share on LinkedIn</span>}
      </Button>

      {/* Copy Link */}
      <Button
        onClick={handleCopyLink}
        variant="outline"
        size={isCompact ? 'sm' : 'default'}
        className={cn('gap-2', isIconOnly && 'px-3')}
        title="Copy link"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        {!isIconOnly && <span>{copied ? 'Copied!' : 'Copy Link'}</span>}
      </Button>

      {/* Native Share (mobile) */}
      {supportsNativeShare && (
        <Button
          onClick={handleNativeShare}
          variant="outline"
          size={isCompact ? 'sm' : 'default'}
          className={cn('gap-2 md:hidden', isIconOnly && 'px-3')}
          title="Share"
        >
          <ShareIcon />
          {!isIconOnly && <span>Share</span>}
        </Button>
      )}
    </div>
  );
}

// Export individual share functions for use elsewhere
export const shareToTwitter = (text: string, url: string) => {
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    text
  )}&url=${encodeURIComponent(url)}`;
  window.open(twitterUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
};

export const shareToLinkedIn = (url: string) => {
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    url
  )}`;
  window.open(linkedInUrl, '_blank', 'noopener,noreferrer,width=600,height=600');
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export const nativeShare = async (data: ShareData): Promise<boolean> => {
  if (!navigator.share) return false;
  
  try {
    await navigator.share(data);
    return true;
  } catch {
    return false;
  }
};
