'use client';

import { useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getPrimaryFaucet, getFaucetsForNetwork, openFaucet } from '@/lib/faucets';
import { ChevronDown, ExternalLink, Droplets } from 'lucide-react';

interface FaucetButtonProps {
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  showBalance?: boolean;
  showDropdown?: boolean;
}

export function FaucetButton({ 
  variant = 'outline',
  size = 'default',
  className = '',
  showBalance = true,
  showDropdown = true
}: FaucetButtonProps) {
  const { address, isConnected } = useAccount();
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address,
    chainId: baseSepolia.id,
  });

  const [isOpen, setIsOpen] = useState(false);

  // Get faucets for Base Sepolia
  const faucets = getFaucetsForNetwork('base-sepolia');
  const primaryFaucet = getPrimaryFaucet('base-sepolia');

  const formatBalance = (balanceData: typeof balance) => {
    if (!balanceData) return '0.0000';
    return parseFloat(balanceData.formatted).toFixed(4);
  };

  const isLowBalance = balance && balance.value < BigInt(1000000000000000); // 0.001 ETH

  const handlePrimaryFaucet = () => {
    if (primaryFaucet) {
      openFaucet(primaryFaucet.url, address);
    }
  };

  const handleFaucetSelect = (faucetUrl: string) => {
    openFaucet(faucetUrl, address);
    setIsOpen(false);
  };

  if (!isConnected) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size={size} 
              className={`${className} opacity-50 cursor-not-allowed`}
              disabled
            >
              <Droplets className="w-4 h-4 mr-2" />
              Get Test ETH
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Connect your wallet first</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (balanceLoading) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Droplets className="w-4 h-4 mr-2" />
        Loading...
      </Button>
    );
  }

  const balanceDisplay = showBalance && balance ? (
    <span className={`ml-2 text-xs ${isLowBalance ? 'text-yellow-500' : 'text-muted-foreground'}`}>
      ({formatBalance(balance)} ETH)
    </span>
  ) : null;

  if (!showDropdown || faucets.length <= 1) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={variant} 
              size={size} 
              className={`${className} ${isLowBalance ? 'border-yellow-500/50' : ''}`}
              onClick={handlePrimaryFaucet}
            >
              <Droplets className="w-4 h-4 mr-2" />
              Get Test ETH
              {balanceDisplay}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="max-w-xs space-y-2">
              <p className="font-medium">Get free testnet ETH</p>
              <p className="text-sm">
                Testnet ETH is free fake cryptocurrency for testing smart contracts. 
                No real value, but needed for gas fees on Base Sepolia.
              </p>
              {isLowBalance && (
                <p className="text-yellow-500 text-sm">
                  ⚠️ Your balance is low - you may need more ETH to deploy contracts.
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={variant} 
                size={size} 
                className={`${className} ${isLowBalance ? 'border-yellow-500/50' : ''}`}
              >
                <Droplets className="w-4 h-4 mr-2" />
                Get Test ETH
                {balanceDisplay}
                <ChevronDown className="w-3 h-3 ml-2" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <div className="max-w-xs space-y-2">
              <p className="font-medium">Choose a testnet faucet</p>
              <p className="text-sm">
                Multiple faucet options available. Click to see all options or 
                select the dropdown for specific faucets.
              </p>
              {isLowBalance && (
                <p className="text-yellow-500 text-sm">
                  ⚠️ Your balance is low - you may need more ETH to deploy contracts.
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
        
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Droplets className="w-4 h-4" />
            Base Sepolia Faucets
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {faucets.map((faucet) => (
            <DropdownMenuItem
              key={faucet.id}
              className="cursor-pointer"
              onClick={() => handleFaucetSelect(faucet.url)}
            >
              <div className="flex items-start gap-3 w-full">
                <span className="text-lg mt-0.5">{faucet.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{faucet.name}</span>
                    {faucet.recommendedFor && (
                      <span className="text-xs bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded">
                        {faucet.recommendedFor}
                      </span>
                    )}
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {faucet.description}
                  </p>
                  <div className="flex gap-3 mt-1">
                    {faucet.amount && (
                      <span className="text-xs text-green-600">{faucet.amount}</span>
                    )}
                    <span className="text-xs text-muted-foreground">{faucet.estimatedTime}</span>
                  </div>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            className="cursor-pointer text-blue-600 hover:text-blue-700"
            onClick={() => window.open('/faucet', '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Complete Faucet Guide
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}