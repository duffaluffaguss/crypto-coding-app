'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NFTMintedToastProps {
  isVisible: boolean;
  tokenId: bigint;
  projectName: string;
  openSeaUrl: string | null;
  onViewNFT: () => void;
  onShare: () => void;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export function NFTMintedToast({
  isVisible,
  tokenId,
  projectName,
  openSeaUrl,
  onViewNFT,
  onShare,
  onDismiss,
  autoDismissMs = 10000,
}: NFTMintedToastProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      onDismiss();
      setIsAnimatingOut(false);
    }, 300);
  }, [onDismiss]);

  // Auto-dismiss timer
  useEffect(() => {
    if (isVisible && autoDismissMs > 0) {
      const timer = setTimeout(handleDismiss, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoDismissMs, handleDismiss]);

  // Trigger confetti on mount
  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Full-screen Confetti */}
      {showConfetti && <FullScreenConfetti />}

      {/* Toast Notification */}
      <div
        className={cn(
          'fixed bottom-4 right-4 z-[100] max-w-sm w-full',
          'animate-in slide-in-from-bottom-4 fade-in-0 duration-300',
          isAnimatingOut && 'animate-out slide-out-to-right-4 fade-out-0 duration-300'
        )}
      >
        <div className="relative overflow-hidden rounded-xl border bg-card shadow-2xl shadow-amber-500/20">
          {/* Gradient Border Effect */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 opacity-20" />
          
          {/* Content */}
          <div className="relative p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="text-4xl animate-bounce">🎉</div>
                <div>
                  <h3 className="font-bold text-lg bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                    NFT Minted!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Token #{tokenId.toString()}
                  </p>
                </div>
              </div>
              
              {/* Close Button */}
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Project Name */}
            <p className="text-sm">
              Congratulations! Your <span className="font-semibold">{projectName}</span> certificate is now on the blockchain!
            </p>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={onViewNFT}
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                disabled={!openSeaUrl}
              >
                <OpenSeaIcon className="w-4 h-4" />
                View NFT
              </Button>
              <Button
                onClick={onShare}
                size="sm"
                className="flex-1 gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                <ShareIcon className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>

          {/* Progress Bar for auto-dismiss */}
          <div className="h-1 bg-muted">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
              style={{
                animation: `shrink ${autoDismissMs}ms linear forwards`,
              }}
            />
          </div>
        </div>

        <style jsx>{`
          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}</style>
      </div>
    </>
  );
}

// Full-screen confetti effect
function FullScreenConfetti() {
  const [confettiPieces, setConfettiPieces] = useState<Array<{
    id: number;
    left: number;
    color: string;
    delay: number;
    duration: number;
    size: number;
    type: 'circle' | 'square' | 'triangle';
  }>>([]);

  useEffect(() => {
    const pieces = [...Array(100)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F39C12', '#E74C3C'][
        Math.floor(Math.random() * 10)
      ],
      delay: Math.random() * 0.8,
      duration: 1.5 + Math.random() * 1.5,
      size: 6 + Math.random() * 8,
      type: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)] as 'circle' | 'square' | 'triangle',
    }));
    setConfettiPieces(pieces);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        >
          <div
            className={cn(
              piece.type === 'circle' && 'rounded-full',
              piece.type === 'triangle' && 'triangle'
            )}
            style={{
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.type !== 'triangle' ? piece.color : 'transparent',
              borderLeft: piece.type === 'triangle' ? `${piece.size / 2}px solid transparent` : undefined,
              borderRight: piece.type === 'triangle' ? `${piece.size / 2}px solid transparent` : undefined,
              borderBottom: piece.type === 'triangle' ? `${piece.size}px solid ${piece.color}` : undefined,
            }}
          />
        </div>
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti-fall {
          animation: confetti-fall ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Icon Components
function OpenSeaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 90 90" fill="currentColor">
      <path d="M45 0C20.151 0 0 20.151 0 45c0 24.849 20.151 45 45 45 24.849 0 45-20.151 45-45C90 20.151 69.849 0 45 0ZM22.203 46.512l.252-.312 14.103-22.056c.192-.312.588-.264.732.072 2.016 4.536 3.756 10.188 2.94 13.716-.348 1.404-1.308 3.312-2.388 5.1-.156.276-.324.552-.492.816-.084.132-.216.216-.372.216H22.527c-.348 0-.552-.378-.324-.672Zm55.545 8.172c0 .216-.132.408-.336.468a35.37 35.37 0 0 0-10.368 4.296c-2.604 1.716-5.112 4.128-7.152 7.044-5.208 7.392-9.18 17.94-18.072 17.94H28.044c-12.456 0-22.56-10.128-22.56-22.596v-.36c0-.228.18-.408.408-.408h15.648c.264 0 .456.24.432.504-.108.948.084 1.908.576 2.772.972 1.728 2.796 2.796 4.764 2.796h7.488v-5.544h-7.392c-.372 0-.576-.432-.348-.72.084-.12.18-.24.288-.372.816-1.032 2.004-2.64 3.168-4.488.792-1.26 1.56-2.604 2.208-3.972.132-.264.24-.54.348-.804.168-.432.336-.84.468-1.248.132-.348.24-.708.336-1.044.276-1.056.396-2.172.396-3.336 0-.456-.024-.936-.072-1.392-.024-.504-.084-.996-.156-1.5-.048-.456-.132-.912-.228-1.356-.132-.612-.288-1.224-.48-1.812l-.072-.252c-.132-.456-.252-.888-.408-1.344-.468-1.368-.996-2.712-1.56-3.96-.204-.468-.408-.912-.612-1.344-.324-.684-.648-1.308-.948-1.908-.156-.288-.288-.552-.42-.816-.156-.3-.312-.6-.456-.876-.108-.216-.24-.432-.336-.636l-.912-1.668c-.132-.24.06-.528.336-.456l5.712 1.548h.012l.756.204.828.24.312.084V23.64c0-1.596 1.284-2.892 2.88-2.892.792 0 1.512.324 2.028.852.516.528.852 1.248.852 2.04v6.36l.612.18c.048.012.096.036.144.072.156.12.384.3.672.528.228.18.468.396.756.636.576.48 1.26 1.08 2.016 1.788.204.18.396.372.588.564.996.96 2.112 2.1 3.18 3.396.3.36.6.732.888 1.104.288.384.588.768.864 1.152.36.504.744 1.032 1.08 1.584.168.264.348.54.504.816.456.744.864 1.512 1.236 2.292.156.324.3.672.42 1.008.36.912.648 1.848.828 2.784.06.204.096.42.12.624v.048c.072.324.096.672.12 1.008.072.804.036 1.608-.084 2.412-.06.372-.144.72-.24 1.08-.096.348-.204.708-.336 1.044-.264.696-.564 1.38-.924 2.04-.12.24-.264.48-.396.72-.156.252-.312.504-.468.732-.216.324-.456.648-.696.948-.192.276-.408.552-.624.804-.312.384-.624.744-.948 1.08-.18.216-.384.42-.576.624-.204.216-.408.408-.588.588-.3.288-.564.528-.792.732l-.504.456c-.096.084-.216.132-.336.132h-4.572v5.544h5.736c1.296 0 2.532-.456 3.528-1.296.348-.3 1.872-1.62 3.66-3.54.06-.072.144-.12.24-.144l15.456-4.476a.426.426 0 0 1 .54.408v3.156Z" />
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

NFTMintedToast.displayName = 'NFTMintedToast';
