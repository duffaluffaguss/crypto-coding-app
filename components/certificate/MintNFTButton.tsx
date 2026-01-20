'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId } from 'wagmi';
import { baseSepolia, base } from 'wagmi/chains';
import { Button } from '@/components/ui/button';
import { CERTIFICATE_NFT_ABI, getCertificateNFTAddress, getOpenSeaURL, getBaseScanURL } from '@/lib/certificate-nft';
import { ShareNFTModal } from '@/components/nft/ShareNFTModal';
import { NFTMintedToast } from '@/components/nft/NFTMintedToast';
import { getNFTImageUrl } from '@/lib/nft';
import type { CertificateData } from './Certificate';
import type { Address } from 'viem';

interface MintNFTButtonProps {
  certificateData: CertificateData;
  projectId: string;
  isOwner: boolean;
  onMintSuccess?: (tokenId: bigint) => void;
}

type MintState = 'idle' | 'checking' | 'ready' | 'minting' | 'confirming' | 'success' | 'already-minted' | 'error';

export function MintNFTButton({ certificateData, projectId, isOwner, onMintSuccess }: MintNFTButtonProps) {
  const [mintState, setMintState] = useState<MintState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<bigint | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  const contractAddress = getCertificateNFTAddress(chainId);

  // Check if user has already minted
  const { data: hasMinted, isLoading: isCheckingMinted, refetch: refetchMinted } = useReadContract({
    address: contractAddress,
    abi: CERTIFICATE_NFT_ABI,
    functionName: 'hasMinted',
    args: address && projectId ? [address, projectId] : undefined,
    query: {
      enabled: !!address && !!contractAddress && !!projectId,
    },
  });

  // Get token ID if already minted
  const { data: existingTokenId } = useReadContract({
    address: contractAddress,
    abi: CERTIFICATE_NFT_ABI,
    functionName: 'getTokenForProject',
    args: address && projectId ? [address, projectId] : undefined,
    query: {
      enabled: !!address && !!contractAddress && !!projectId && hasMinted === true,
    },
  });

  // Write contract hook
  const { writeContract, data: txHash, isPending: isWritePending, error: writeError } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({
    hash: txHash,
  });

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
      // Extract token ID from logs
      const mintLog = receipt.logs.find(log => {
        // CertificateMinted event signature
        return log.topics[0] === '0x' + 'CertificateMinted'.padEnd(64, '0');
      });
      if (mintLog && mintLog.topics[1]) {
        const newTokenId = BigInt(mintLog.topics[1]);
        setTokenId(newTokenId);
        setShowToast(true);
        onMintSuccess?.(newTokenId);
      }
      refetchMinted();
      return;
    }

    if (writeError) {
      setMintState('error');
      setError(writeError.message);
      return;
    }

    setMintState('ready');
  }, [isConnected, isCheckingMinted, hasMinted, existingTokenId, isWritePending, isConfirming, isConfirmed, receipt, writeError, onMintSuccess, refetchMinted]);

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
          projectId,
          certificateData.projectName,
          certificateData.projectType,
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

  // Only show to owner
  if (!isOwner) {
    return null;
  }

  // No contract deployed
  if (!contractAddress) {
    return (
      <div className="text-center p-4 rounded-lg border border-border bg-card/50">
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
        className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
      >
        {isConnecting ? (
          <>
            <Spinner />
            Connecting...
          </>
        ) : (
          <>
            <WalletIcon />
            Mint as NFT
          </>
        )}
      </Button>
    );
  }

  // Already minted
  if (mintState === 'already-minted') {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
          <CheckIcon className="w-5 h-5 text-green-500" />
          <span className="font-medium text-green-600 dark:text-green-400">
            Already Minted ✓
          </span>
        </div>
        
        {tokenId && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
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

  // Success state
  if (mintState === 'success') {
    return (
      <>
        <div className="flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <CheckIcon className="w-5 h-5 text-green-500" />
            <span className="font-medium text-green-600 dark:text-green-400">
              Successfully Minted! 🎉
            </span>
          </div>
          
          {tokenId && (
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <span className="text-muted-foreground">Token #{tokenId.toString()}</span>
              {openSeaUrl && (
                <a
                  href={openSeaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="gap-1">
                    <OpenSeaIcon className="w-4 h-4" />
                    OpenSea
                  </Button>
                </a>
              )}
              {baseScanUrl && (
                <a
                  href={baseScanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
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
            projectName={certificateData.projectName}
            projectType={certificateData.projectType}
            openSeaUrl={openSeaUrl}
            imageUrl={getNFTImageUrl(chainId, tokenId)}
          />
        )}

        {/* Minted Toast */}
        {tokenId && (
          <NFTMintedToast
            isVisible={showToast}
            tokenId={tokenId}
            projectName={certificateData.projectName}
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
      <div className="flex flex-col items-center gap-3">
        <div className="text-sm text-red-500 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
          {error || 'Failed to mint NFT'}
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
  if (mintState === 'checking') {
    return (
      <Button disabled className="gap-2">
        <Spinner />
        Checking...
      </Button>
    );
  }

  if (mintState === 'minting' || mintState === 'confirming') {
    return (
      <Button disabled className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600">
        <Spinner />
        {mintState === 'minting' ? 'Confirm in wallet...' : 'Confirming...'}
      </Button>
    );
  }

  // Ready to mint
  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        onClick={handleMint}
        className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
      >
        <WalletIcon />
        Mint as NFT
      </Button>
      <p className="text-xs text-muted-foreground">
        Connected: {address?.slice(0, 6)}...{address?.slice(-4)} on {networkName}
      </p>
    </div>
  );
}

// Icons
function WalletIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
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
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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

function OpenSeaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 90 90" fill="currentColor">
      <path d="M45 0C20.151 0 0 20.151 0 45c0 24.849 20.151 45 45 45 24.849 0 45-20.151 45-45C90 20.151 69.849 0 45 0ZM22.203 46.512l.252-.312 14.103-22.056c.192-.312.588-.264.732.072 2.016 4.536 3.756 10.188 2.94 13.716-.348 1.404-1.308 3.312-2.388 5.1-.156.276-.324.552-.492.816-.084.132-.216.216-.372.216H22.527c-.348 0-.552-.378-.324-.672Zm55.545 8.172c0 .216-.132.408-.336.468a35.37 35.37 0 0 0-10.368 4.296c-2.604 1.716-5.112 4.128-7.152 7.044-5.208 7.392-9.18 17.94-18.072 17.94H28.044c-12.456 0-22.56-10.128-22.56-22.596v-.36c0-.228.18-.408.408-.408h15.648c.264 0 .456.24.432.504-.108.948.084 1.908.576 2.772.972 1.728 2.796 2.796 4.764 2.796h7.488v-5.544h-7.392c-.372 0-.576-.432-.348-.72.084-.12.18-.24.288-.372.816-1.032 2.004-2.64 3.168-4.488 0.792-1.26 1.56-2.604 2.208-3.972 0.132-.264.24-.54.348-.804.168-.432.336-.84.468-1.248.132-.348.24-.708.336-1.044.276-1.056.396-2.172.396-3.336 0-.456-.024-.936-.072-1.392-.024-.504-.084-.996-.156-1.5-.048-.456-.132-.912-.228-1.356-.132-.612-.288-1.224-.48-1.812l-.072-.252c-.132-.456-.252-.888-.408-1.344-0.468-1.368-0.996-2.712-1.56-3.96-.204-.468-.408-.912-.612-1.344-.324-.684-.648-1.308-.948-1.908-.156-.288-.288-.552-.42-.816-.156-.3-.312-.6-.456-.876-.108-.216-.24-.432-.336-.636l-.912-1.668c-.132-.24.06-.528.336-.456l5.712 1.548h.012c.012 0 .012 0 .024.012l.756.204.828.24.312.084V23.64c0-1.596 1.284-2.892 2.88-2.892 0.792 0 1.512.324 2.028.852.516.528.852 1.248.852 2.04v6.36l.612.18c.048.012.096.036.144.072.156.12.384.3.672.528.228.18.468.396.756.636.576.48 1.26 1.08 2.016 1.788.204.18.396.372.588.564 0.996.96 2.112 2.1 3.18 3.396 0.3.36.6.732.888 1.104.288.384.588.768.864 1.152.36.504.744 1.032 1.08 1.584.168.264.348.54.504.816.456.744.864 1.512 1.236 2.292.156.324.3.672.42 1.008.36.912.648 1.848.828 2.784.06.204.096.42.12.624v.048c.072.324.096.672.12 1.008.072.804.036 1.608-.084 2.412-.06.372-.144.72-.24 1.08-.096.348-.204.708-.336 1.044-.264.696-.564 1.38-.924 2.04-.12.24-.264.48-.396.72-.156.252-.312.504-.468.732-.216.324-.456.648-.696.948-.192.276-.408.552-.624.804-.312.384-.624.744-.948 1.08-.18.216-.384.42-.576.624-.204.216-.408.408-.588.588-.3.288-.564.528-.792.732l-.504.456c-.096.084-.216.132-.336.132h-4.572v5.544h5.736c1.296 0 2.532-.456 3.528-1.296.348-.3 1.872-1.62 3.66-3.54.06-.072.144-.12.24-.144l15.456-4.476a.426.426 0 0 1 .54.408v3.156Z" />
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

MintNFTButton.displayName = 'MintNFTButton';
