'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const FAUCET_URLS = {
  coinbase: 'https://portal.cdp.coinbase.com/products/faucet',
  alchemy: 'https://www.alchemy.com/faucets/base-sepolia',
  quicknode: 'https://faucet.quicknode.com/base/sepolia',
};

export function TestTokensPrompt() {
  const { address, isConnected } = useAccount();
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address,
    chainId: baseSepolia.id,
  });
  
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasShownPrompt, setHasShownPrompt] = useState(false);

  // Check if user needs test tokens (connected but has 0 or very low balance)
  useEffect(() => {
    if (
      isConnected && 
      address && 
      !balanceLoading && 
      balance && 
      !hasShownPrompt
    ) {
      // Show prompt if balance is less than 0.001 ETH
      const lowBalance = balance.value < BigInt(1000000000000000); // 0.001 ETH in wei
      if (lowBalance) {
        setShowPrompt(true);
        setHasShownPrompt(true);
      }
    }
  }, [isConnected, address, balance, balanceLoading, hasShownPrompt]);

  const handleFaucetClick = (faucet: keyof typeof FAUCET_URLS) => {
    window.open(FAUCET_URLS[faucet], '_blank');
  };

  if (!showPrompt) return null;

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🚰</span>
            Get Free Test Tokens
          </DialogTitle>
          <DialogDescription>
            You need test ETH to deploy contracts on Base Sepolia. Don&apos;t worry - it&apos;s free!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">Your wallet address:</p>
            <code className="text-xs bg-background px-2 py-1 rounded block truncate">
              {address}
            </code>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Choose a faucet to get test ETH:</p>
            
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => handleFaucetClick('coinbase')}
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">🔵</span>
                Coinbase Faucet
              </span>
              <span className="text-xs text-muted-foreground">Recommended</span>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => handleFaucetClick('alchemy')}
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">⚗️</span>
                Alchemy Faucet
              </span>
              <span className="text-xs text-muted-foreground">No signup needed</span>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => handleFaucetClick('quicknode')}
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                QuickNode Faucet
              </span>
              <span className="text-xs text-muted-foreground">Fast</span>
            </Button>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-sm">
              <strong>💡 Tip:</strong> Copy your wallet address above, paste it in the faucet, 
              and you&apos;ll receive test ETH in a few seconds. You only need ~0.01 ETH to deploy contracts.
            </p>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <p className="text-sm">
              <strong>✨ Good news:</strong> Our Smart Wallet often sponsors gas fees, 
              so you might not even need test ETH for basic transactions!
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowPrompt(false)}>
            I&apos;ll do this later
          </Button>
          <Button onClick={() => setShowPrompt(false)}>
            Got my tokens!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Small inline component to show balance in toolbar
export function WalletBalance() {
  const { address, isConnected } = useAccount();
  const { data: balance, isLoading } = useBalance({
    address,
    chainId: baseSepolia.id,
  });

  if (!isConnected || isLoading || !balance) return null;

  const formattedBalance = parseFloat(balance.formatted).toFixed(4);
  const isLow = balance.value < BigInt(1000000000000000); // 0.001 ETH

  return (
    <span className={`text-xs ${isLow ? 'text-yellow-500' : 'text-muted-foreground'}`}>
      {formattedBalance} ETH
      {isLow && (
        <span className="ml-1 text-yellow-500" title="Low balance - get test tokens">
          ⚠️
        </span>
      )}
    </span>
  );
}
