'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useChainId, useWriteContract, useWaitForTransactionReceipt, useReadContract, useEstimateGas } from 'wagmi';
import { baseSepolia, base } from 'wagmi/chains';
import { formatEther } from 'viem';
import { Button } from '@/components/ui/button';
import { CERTIFICATE_NFT_ABI, getCertificateNFTAddress, getOpenSeaURL, getBaseScanURL, prepareMintTransaction } from '@/lib/certificate-nft';
import { ShareNFTModal } from '@/components/nft/ShareNFTModal';
import { NFTMintedToast } from '@/components/nft/NFTMintedToast';
import { getNFTImageUrl } from '@/lib/nft';
import { cn } from '@/lib/utils';
import Confetti from 'react-confetti';
import type { Address } from 'viem';

interface MintCertificateButtonProps {
  pathId: string;
  pathName: string;
  projectType?: string;
  score?: number;
  className?: string;
  onMintSuccess?: (tokenId: bigint) => void;
}

type MintState = 'idle' | 'checking' | 'estimating' | 'ready' | 'minting' | 'confirming' | 'success' | 'already-minted' | 'error';

export function MintCertificateButton({ 
  pathId, 
  pathName, 
  projectType = 'learning_path',
  score = 100,
  className,
  onMintSuccess 
}: MintCertificateButtonProps) {
  const [mintState, setMintState] = useState<MintState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<bigint | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending: isConnecting } = useConnect();

  const contractAddress = getCertificateNFTAddress(chainId);

  // Check if user has already minted
  const { data: hasMinted, isLoading: isCheckingMinted, refetch: refetchMinted } = useReadContract({
    address: contractAddress,
    abi: CERTIFICATE_NFT_ABI,
    functionName: 'hasMinted',
    args: address && pathId ? [address, pathId] : undefined,
    query: {
      enabled: !!address && !!contractAddress && !!pathId,
    },
  });

  // Get token ID if already minted
  const { data: existingTokenId } = useReadContract({
    address: contractAddress,
    abi: CERTIFICATE_NFT_ABI,
    functionName: 'getTokenForProject',
    args: address && pathId ? [address, pathId] : undefined,
    query: {
      enabled: !!address && !!contractAddress && !!pathId && hasMinted === true,
    },
  });

  // Estimate gas for minting
  const txData = address && contractAddress ? prepareMintTransaction(chainId, {
    to: address,
    projectId: pathId,
    projectName: pathName,
    projectType,
    score,
  }) : null;

  const { data: gasEstimateData, isLoading: isEstimatingGas } = useEstimateGas({
    to: txData?.to,
    data: txData?.data,
    query: {
      enabled: !!txData && isConnected && !hasMinted,
    },
  });

  // Write contract hook
  const { writeContract, data: txHash, isPending: isWritePending, error: writeError } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Update gas estimate display
  useEffect(() => {
    if (gasEstimateData) {
      // Rough gas price estimate (varies by network conditions)
      const gasPrice = BigInt(1000000000); // 1 gwei as base estimate
      const totalCost = gasEstimateData * gasPrice;
      const ethCost = formatEther(totalCost);
      const formattedCost = parseFloat(ethCost).toFixed(6);
      setGasEstimate(`~${formattedCost} ETH`);
    }
  }, [gasEstimateData]);

  // Update state based on conditions
  useEffect(() => {
    if (!isConnected) {
      setMintState('idle');
      return;
    }

    if (isCheckingMinted) {
      setMintState('checking');
      return;
    }

    if (hasMinted) {
      setMintState('already-minted');
      if (existingTokenId) {
        setTokenId(existingTokenId);
      }
      return;
    }

    if (isEstimatingGas) {
      setMintState('estimating');
      return;
    }

    if (isWritePending) {
      setMintState('minting');
      return;
    }

    if (isConfirming) {
      setMintState('confirming');
      return;
    }

    if (isConfirmed && receipt) {
      setMintState('success');
      setShowConfetti(true);
      
      // Extract token ID from logs (CertificateMinted event)
      for (const log of receipt.logs) {
        if (log.topics[1]) {
          try {
            const newTokenId = BigInt(log.topics[1]);
            setTokenId(newTokenId);
            setShowToast(true);
            onMintSuccess?.(newTokenId);
            break;
          } catch {}
        }
      }
      refetchMinted();
      
      // Hide confetti after 5 seconds
      setTimeout(() => setShowConfetti(false), 5000);
      return;
    }

    if (writeError) {
      setMintState('error');
      setError(writeError.message);
      return;
    }

    setMintState('ready');
  }, [isConnected, isCheckingMinted, hasMinted, existingTokenId, isEstimatingGas, isWritePending, isConfirming, isConfirmed, receipt, writeError, onMintSuccess, refetchMinted]);

  // Handle connect wallet
  const handleConnect = () => {
    const connector = connectors[0]; // Coinbase Smart Wallet
    if (connector) {
      connect({ connector });
    }
  };

  // Handle mint
  const handleMint = async () => {
    if (!address || !contractAddress) return;

    setError(null);
    
    try {
      writeContract({
        address: contractAddress,
        abi: CERTIFICATE_NFT_ABI,
        functionName: 'mintCertificate',
        args: [
          address,
          pathId,
          pathName,
          projectType,
          BigInt(score),
        ],
      });
    } catch (err) {
      setMintState('error');
      setError(err instanceof Error ? err.message : 'Failed to mint');
    }
  };

  // Get network name
  const networkName = chainId === base.id ? 'Base' : 'Base Sepolia';
  const openSeaUrl = tokenId ? getOpenSeaURL(chainId, tokenId) : null;
  const baseScanUrl = tokenId ? getBaseScanURL(chainId, tokenId) : null;

  // No contract deployed
  if (!contractAddress) {
    return (
      <div className={cn("text-center p-4 rounded-lg border border-border bg-card/50", className)}>
        <p className="text-sm text-muted-foreground">
          NFT minting coming soon on {networkName}
        </p>
      </div>
    );
  }

  // Not connected
  if (!isConnected) {
    return (
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        className={cn("gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700", className)}
        size="lg"
      >
        {isConnecting ? (
          <>
            <Spinner />
            Connecting...
          </>
        ) : (
          <>
            <WalletIcon />
            Connect Wallet to Mint
          </>
        )}
      </Button>
    );
  }

  // Already minted
  if (mintState === 'already-minted') {
    return (
      <div className={cn("flex flex-col items-center gap-3", className)}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
          <CheckIcon className="w-5 h-5 text-green-500" />
          <span className="font-medium text-green-600 dark:text-green-400">
            Certificate Already Minted ✓
          </span>
        </div>
        
        {tokenId && (
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Token #{tokenId.toString()}</span>
            {openSeaUrl && (
              <a
                href={openSeaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 hover:underline"
              >
                View on OpenSea ↗
              </a>
            )}
            {baseScanUrl && (
              <a
                href={baseScanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 hover:underline"
              >
                BaseScan ↗
              </a>
            )}
          </div>
        )}
      </div>
    );
  }

  // Success state with celebration
  if (mintState === 'success') {
    return (
      <>
        {showConfetti && (
          <Confetti
            width={typeof window !== 'undefined' ? window.innerWidth : 800}
            height={typeof window !== 'undefined' ? window.innerHeight : 600}
            recycle={false}
            numberOfPieces={200}
            colors={['#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6', '#10B981']}
          />
        )}
        
        <div className={cn("flex flex-col items-center gap-4", className)}>
          <div className="text-center">
            <div className="text-5xl mb-3">🎉</div>
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <CheckIcon className="w-6 h-6 text-green-500" />
              <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                Certificate Minted Successfully!
              </span>
            </div>
          </div>
          
          {tokenId && (
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <span className="text-muted-foreground">Token #{tokenId.toString()}</span>
              {openSeaUrl && (
                <a href={openSeaUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1">
                    <OpenSeaIcon className="w-4 h-4" />
                    OpenSea
                  </Button>
                </a>
              )}
              {baseScanUrl && (
                <a href={baseScanUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1">
                    <ExternalLinkIcon className="w-4 h-4" />
                    BaseScan
                  </Button>
                </a>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1"
                onClick={() => setShowShareModal(true)}
              >
                <ShareIcon className="w-4 h-4" />
                Share
              </Button>
            </div>
          )}
        </div>

        {/* Share Modal */}
        {tokenId && (
          <ShareNFTModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            tokenId={tokenId}
            projectName={pathName}
            projectType={projectType}
            openSeaUrl={openSeaUrl}
            imageUrl={getNFTImageUrl(chainId, tokenId)}
          />
        )}

        {/* Minted Toast */}
        {tokenId && (
          <NFTMintedToast
            isVisible={showToast}
            tokenId={tokenId}
            projectName={pathName}
            openSeaUrl={openSeaUrl}
            onViewNFT={() => {
              if (openSeaUrl) window.open(openSeaUrl, '_blank');
            }}
            onShare={() => {
              setShowToast(false);
              setShowShareModal(true);
            }}
            onDismiss={() => setShowToast(false)}
          />
        )}
      </>
    );
  }

  // Error state
  if (mintState === 'error') {
    return (
      <div className={cn("flex flex-col items-center gap-3", className)}>
        <div className="text-sm text-red-500 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20 max-w-md text-center">
          {error || 'Failed to mint certificate'}
        </div>
        <Button
          onClick={() => {
            setError(null);
            setMintState('ready');
          }}
          variant="outline"
          size="sm"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Loading states
  if (mintState === 'checking' || mintState === 'estimating') {
    return (
      <Button disabled className={cn("gap-2", className)} size="lg">
        <Spinner />
        {mintState === 'checking' ? 'Checking eligibility...' : 'Estimating gas...'}
      </Button>
    );
  }

  if (mintState === 'minting' || mintState === 'confirming') {
    return (
      <div className={cn("flex flex-col items-center gap-2", className)}>
        <Button disabled className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600" size="lg">
          <Spinner />
          {mintState === 'minting' ? 'Confirm in wallet...' : 'Confirming on chain...'}
        </Button>
        <p className="text-xs text-muted-foreground animate-pulse">
          {mintState === 'minting' 
            ? 'Please confirm the transaction in your wallet' 
            : 'Waiting for blockchain confirmation...'}
        </p>
      </div>
    );
  }

  // Ready to mint
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <Button
        onClick={handleMint}
        className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all"
        size="lg"
      >
        <NFTIcon />
        Mint Certificate as NFT
      </Button>
      
      <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
        <p>Connected: {address?.slice(0, 6)}...{address?.slice(-4)} on {networkName}</p>
        {gasEstimate && (
          <p className="flex items-center gap-1">
            <GasIcon className="w-3 h-3" />
            Estimated gas: {gasEstimate}
          </p>
        )}
        <p className="text-green-500">Free mint (gas only)</p>
      </div>
    </div>
  );
}

// Icons
function WalletIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );
}

function NFTIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
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
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function GasIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
    </svg>
  );
}

function OpenSeaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 90 90" fill="currentColor">
      <path d="M45 0C20.151 0 0 20.151 0 45c0 24.849 20.151 45 45 45 24.849 0 45-20.151 45-45C90 20.151 69.849 0 45 0ZM22.203 46.512l.252-.312 14.103-22.056c.192-.312.588-.264.732.072 2.016 4.536 3.756 10.188 2.94 13.716-.348 1.404-1.308 3.312-2.388 5.1-.156.276-.324.552-.492.816-.084.132-.216.216-.372.216H22.527c-.348 0-.552-.378-.324-.672Z" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
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

MintCertificateButton.displayName = 'MintCertificateButton';
