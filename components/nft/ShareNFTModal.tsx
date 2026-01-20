'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ShareNFTModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: bigint;
  projectName: string;
  projectType: string;
  openSeaUrl: string | null;
  imageUrl: string;
}

export function ShareNFTModal({
  isOpen,
  onClose,
  tokenId,
  projectName,
  projectType,
  openSeaUrl,
  imageUrl,
}: ShareNFTModalProps) {
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Show confetti when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Twitter share text
  const twitterText = encodeURIComponent(
    `🎓 Just earned my Zero to Crypto Dev NFT! Built ${projectName} and deployed to @base. #Web3 #LearnToCode`
  );
  const twitterUrl = openSeaUrl ? encodeURIComponent(openSeaUrl) : '';
  const twitterShareUrl = `https://x.com/intent/tweet?text=${twitterText}&url=${twitterUrl}`;

  // LinkedIn share
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${twitterUrl}`;

  // Copy OpenSea link
  const handleCopyLink = async () => {
    if (!openSeaUrl) return;
    try {
      await navigator.clipboard.writeText(openSeaUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        {/* Confetti Effect */}
        {showConfetti && <ConfettiEffect />}

        <DialogHeader className="text-center">
          <div className="text-5xl mb-2 animate-bounce">🎉</div>
          <DialogTitle className="text-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 bg-clip-text text-transparent">
            You Earned an NFT!
          </DialogTitle>
          <DialogDescription className="text-base">
            Congratulations! Your certificate is now on the blockchain forever.
          </DialogDescription>
        </DialogHeader>

        {/* NFT Preview */}
        <div className="relative mx-auto w-48 h-48 rounded-xl overflow-hidden border-4 border-amber-500/50 shadow-lg shadow-amber-500/25">
          <Image
            src={imageUrl}
            alt={`${projectName} NFT Certificate`}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-black/70 backdrop-blur-sm">
            <span className="text-xs text-white font-mono">#{tokenId.toString()}</span>
          </div>
        </div>

        {/* Project Info */}
        <div className="text-center">
          <h3 className="font-semibold">{projectName}</h3>
          <p className="text-sm text-muted-foreground capitalize">
            {projectType.replace(/_/g, ' ')}
          </p>
        </div>

        {/* Share Buttons */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-center">Share your achievement!</p>
          
          <div className="grid grid-cols-3 gap-3">
            {/* Twitter/X */}
            <a
              href={twitterShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-black hover:bg-black/80 transition-colors"
            >
              <XIcon className="w-5 h-5 text-white" />
              <span className="text-xs text-white">X / Twitter</span>
            </a>

            {/* LinkedIn */}
            <a
              href={linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#0A66C2] hover:bg-[#0A66C2]/80 transition-colors"
            >
              <LinkedInIcon className="w-5 h-5 text-white" />
              <span className="text-xs text-white">LinkedIn</span>
            </a>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              disabled={!openSeaUrl}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-lg transition-colors",
                copied 
                  ? "bg-green-500 hover:bg-green-600" 
                  : "bg-orange-500 hover:bg-orange-600",
                !openSeaUrl && "opacity-50 cursor-not-allowed"
              )}
            >
              {copied ? (
                <>
                  <CheckIcon className="w-5 h-5 text-white" />
                  <span className="text-xs text-white">Copied!</span>
                </>
              ) : (
                <>
                  <OpenSeaIcon className="w-5 h-5 text-white" />
                  <span className="text-xs text-white">OpenSea</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* View on OpenSea Button */}
        {openSeaUrl && (
          <a href={openSeaUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full gap-2">
              <OpenSeaIcon className="w-4 h-4" />
              View on OpenSea
            </Button>
          </a>
        )}

        {/* Close Button */}
        <Button onClick={onClose} className="w-full">
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// Confetti Effect Component
function ConfettiEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'][
              Math.floor(Math.random() * 8)
            ],
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${1 + Math.random() * 1}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(400px) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Icon Components
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function OpenSeaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 90 90" fill="currentColor">
      <path d="M45 0C20.151 0 0 20.151 0 45c0 24.849 20.151 45 45 45 24.849 0 45-20.151 45-45C90 20.151 69.849 0 45 0ZM22.203 46.512l.252-.312 14.103-22.056c.192-.312.588-.264.732.072 2.016 4.536 3.756 10.188 2.94 13.716-.348 1.404-1.308 3.312-2.388 5.1-.156.276-.324.552-.492.816-.084.132-.216.216-.372.216H22.527c-.348 0-.552-.378-.324-.672Zm55.545 8.172c0 .216-.132.408-.336.468a35.37 35.37 0 0 0-10.368 4.296c-2.604 1.716-5.112 4.128-7.152 7.044-5.208 7.392-9.18 17.94-18.072 17.94H28.044c-12.456 0-22.56-10.128-22.56-22.596v-.36c0-.228.18-.408.408-.408h15.648c.264 0 .456.24.432.504-.108.948.084 1.908.576 2.772.972 1.728 2.796 2.796 4.764 2.796h7.488v-5.544h-7.392c-.372 0-.576-.432-.348-.72.084-.12.18-.24.288-.372.816-1.032 2.004-2.64 3.168-4.488.792-1.26 1.56-2.604 2.208-3.972.132-.264.24-.54.348-.804.168-.432.336-.84.468-1.248.132-.348.24-.708.336-1.044.276-1.056.396-2.172.396-3.336 0-.456-.024-.936-.072-1.392-.024-.504-.084-.996-.156-1.5-.048-.456-.132-.912-.228-1.356-.132-.612-.288-1.224-.48-1.812l-.072-.252c-.132-.456-.252-.888-.408-1.344-.468-1.368-.996-2.712-1.56-3.96-.204-.468-.408-.912-.612-1.344-.324-.684-.648-1.308-.948-1.908-.156-.288-.288-.552-.42-.816-.156-.3-.312-.6-.456-.876-.108-.216-.24-.432-.336-.636l-.912-1.668c-.132-.24.06-.528.336-.456l5.712 1.548h.012l.756.204.828.24.312.084V23.64c0-1.596 1.284-2.892 2.88-2.892.792 0 1.512.324 2.028.852.516.528.852 1.248.852 2.04v6.36l.612.18c.048.012.096.036.144.072.156.12.384.3.672.528.228.18.468.396.756.636.576.48 1.26 1.08 2.016 1.788.204.18.396.372.588.564.996.96 2.112 2.1 3.18 3.396.3.36.6.732.888 1.104.288.384.588.768.864 1.152.36.504.744 1.032 1.08 1.584.168.264.348.54.504.816.456.744.864 1.512 1.236 2.292.156.324.3.672.42 1.008.36.912.648 1.848.828 2.784.06.204.096.42.12.624v.048c.072.324.096.672.12 1.008.072.804.036 1.608-.084 2.412-.06.372-.144.72-.24 1.08-.096.348-.204.708-.336 1.044-.264.696-.564 1.38-.924 2.04-.12.24-.264.48-.396.72-.156.252-.312.504-.468.732-.216.324-.456.648-.696.948-.192.276-.408.552-.624.804-.312.384-.624.744-.948 1.08-.18.216-.384.42-.576.624-.204.216-.408.408-.588.588-.3.288-.564.528-.792.732l-.504.456c-.096.084-.216.132-.336.132h-4.572v5.544h5.736c1.296 0 2.532-.456 3.528-1.296.348-.3 1.872-1.62 3.66-3.54.06-.072.144-.12.24-.144l15.456-4.476a.426.426 0 0 1 .54.408v3.156Z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

ShareNFTModal.displayName = 'ShareNFTModal';
