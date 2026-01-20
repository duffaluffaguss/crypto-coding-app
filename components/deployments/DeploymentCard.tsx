'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAddressExplorerUrl, getTxExplorerUrl, NETWORKS } from '@/lib/networks';
import type { Deployment, NetworkId } from '@/types';

interface DeploymentCardProps {
  deployment: Deployment;
  showProjectName?: boolean;
}

export function DeploymentCard({ deployment, showProjectName = false }: DeploymentCardProps) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedTxHash, setCopiedTxHash] = useState(false);

  const network = NETWORKS[deployment.network as NetworkId];
  const isTestnet = network?.isTestnet ?? true;

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatGas = (gas: number | null) => {
    if (!gas) return 'Unknown';
    return gas.toLocaleString();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const copyToClipboard = async (text: string, type: 'address' | 'txHash') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'address') {
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
      } else {
        setCopiedTxHash(true);
        setTimeout(() => setCopiedTxHash(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getNetworkBadge = () => {
    return (
      <Badge 
        variant={isTestnet ? 'secondary' : 'default'}
        className={
          isTestnet 
            ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20' 
            : 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20'
        }
      >
        <div className={`w-2 h-2 rounded-full mr-2 ${isTestnet ? 'bg-blue-500' : 'bg-green-500'}`} />
        {network?.name || deployment.network}
      </Badge>
    );
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header with project name if shown */}
          {showProjectName && deployment.project_name && (
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="font-medium text-sm">{deployment.project_name}</span>
              <Badge variant="outline" className="text-xs capitalize">
                {deployment.project_type?.replace('_', ' ') || 'Project'}
              </Badge>
            </div>
          )}

          {/* Main deployment info */}
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              {/* Contract Address */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <span className="text-sm font-medium">Contract Address</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                    {formatAddress(deployment.contract_address)}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(deployment.contract_address, 'address')}
                  >
                    {copiedAddress ? (
                      <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </Button>
                  <a
                    href={getAddressExplorerUrl(deployment.network as NetworkId, deployment.contract_address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-xs"
                  >
                    View on Explorer
                  </a>
                </div>
              </div>

              {/* Network and Gas */}
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Network</span>
                  <div className="mt-1">
                    {getNetworkBadge()}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Gas Used</span>
                  <p className="text-sm font-mono mt-1">{formatGas(deployment.gas_used)}</p>
                </div>
              </div>

              {/* Contract Name if available */}
              {deployment.contract_name && (
                <div>
                  <span className="text-xs text-muted-foreground">Contract Name</span>
                  <p className="text-sm font-medium">{deployment.contract_name}</p>
                </div>
              )}
            </div>

            {/* Date and Actions */}
            <div className="text-right space-y-2">
              <div>
                <span className="text-xs text-muted-foreground">Deployed</span>
                <p className="text-sm">{formatDate(deployment.created_at)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(deployment.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Transaction Hash */}
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Transaction</span>
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  {formatAddress(deployment.tx_hash)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(deployment.tx_hash, 'txHash')}
                >
                  {copiedTxHash ? (
                    <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </Button>
              </div>
              <a
                href={getTxExplorerUrl(deployment.network as NetworkId, deployment.tx_hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-xs"
              >
                View Transaction
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}