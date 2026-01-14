'use client';

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { Button } from '@/components/ui/button';
import { baseSepolia } from 'wagmi/chains';
import { useState } from 'react';

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [showDropdown, setShowDropdown] = useState(false);

  const isWrongNetwork = isConnected && chainId !== baseSepolia.id;

  const handleConnect = () => {
    const coinbaseConnector = connectors.find((c) => c.id === 'coinbaseWalletSDK');
    if (coinbaseConnector) {
      connect({ connector: coinbaseConnector });
    }
  };

  const handleSwitchNetwork = () => {
    switchChain({ chainId: baseSepolia.id });
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <Button
        onClick={handleConnect}
        disabled={isPending}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        {isPending ? (
          <>
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
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
            Connecting...
          </>
        ) : (
          <>
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
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Connect Wallet
          </>
        )}
      </Button>
    );
  }

  if (isWrongNetwork) {
    return (
      <Button
        onClick={handleSwitchNetwork}
        variant="destructive"
        size="sm"
        className="gap-2"
      >
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
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        Switch to Base Sepolia
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setShowDropdown(!showDropdown)}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <div className="w-2 h-2 rounded-full bg-green-500" />
        {formatAddress(address!)}
        <svg
          className={`w-3 h-3 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </Button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-popover border border-border rounded-lg shadow-lg z-50 py-1">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs text-muted-foreground">Connected to</p>
            <p className="text-sm font-medium">Base Sepolia</p>
          </div>
          <button
            onClick={() => {
              disconnect();
              setShowDropdown(false);
            }}
            className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-muted transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
