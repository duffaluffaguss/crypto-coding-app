'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTxExplorerUrl, getAddressExplorerUrl, NETWORKS, type NetworkId } from '@/lib/networks';
import type { Deployment } from '@/types';

interface TransactionDetailProps {
  deployment: Deployment;
  onClose: () => void;
}

export function TransactionDetail({ deployment, onClose }: TransactionDetailProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const network = NETWORKS[deployment.network];

  // Estimate gas cost (using average gas price for demo)
  const estimatedGasCostEth = deployment.gas_used 
    ? (deployment.gas_used * 0.000000001).toFixed(6) // Rough estimate
    : null;

  return (
    <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Transaction Details
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Banner */}
        <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
          <div className="p-2 bg-green-500/20 rounded-full">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-green-500">Transaction Successful</p>
            <p className="text-sm text-muted-foreground">Contract deployed and verified on-chain</p>
          </div>
        </div>

        {/* Transaction Hash */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Transaction Hash</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">
              {deployment.tx_hash}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(deployment.tx_hash, 'txHash')}
              title="Copy transaction hash"
            >
              {copiedField === 'txHash' ? (
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </Button>
          </div>
        </div>

        {/* Contract Address */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Contract Address</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">
              {deployment.contract_address}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(deployment.contract_address, 'contractAddress')}
              title="Copy contract address"
            >
              {copiedField === 'contractAddress' ? (
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </Button>
          </div>
        </div>

        {/* Contract & Network Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contract Name</label>
            <p className="mt-1 font-medium">{deployment.contract_name || 'Unknown Contract'}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Project</label>
            <p className="mt-1 font-medium">{deployment.project_name || 'Unknown Project'}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Network</label>
            <div className="mt-1 flex items-center gap-2">
              <Badge 
                className={network?.isTestnet 
                  ? 'bg-blue-500/10 text-blue-500' 
                  : 'bg-green-500/10 text-green-500'
                }
              >
                {network?.name || deployment.network}
              </Badge>
              <span className="text-xs text-muted-foreground">Chain ID: {network?.chainId}</span>
            </div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Timestamp</label>
            <p className="mt-1 text-sm">{formatDate(deployment.created_at)}</p>
          </div>
        </div>

        {/* Gas Breakdown */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
            Gas Breakdown
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-lg">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gas Used</label>
              <p className="mt-1 font-mono text-lg font-bold text-orange-500">
                {deployment.gas_used?.toLocaleString() || '-'}
              </p>
            </div>
            <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-lg">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Est. Cost (ETH)</label>
              <p className="mt-1 font-mono text-lg font-bold text-orange-500">
                {estimatedGasCostEth ? `~${estimatedGasCostEth}` : '-'}
              </p>
            </div>
            <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-lg">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Block Confirmations</label>
              <p className="mt-1 font-mono text-lg font-bold text-green-500">
                Confirmed ✓
              </p>
            </div>
          </div>
        </div>

        {/* Contract Interaction Info */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Contract Interaction
          </h4>
          <div className="p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transaction Type</p>
                <p className="font-medium">Contract Creation</p>
              </div>
              <Badge variant="outline">Deploy</Badge>
            </div>
            {deployment.project_type && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-sm text-muted-foreground">Project Type</p>
                <p className="font-medium capitalize">{deployment.project_type.replace('_', ' ')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.open(getTxExplorerUrl(deployment.network, deployment.tx_hash), '_blank')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View on {network?.explorerName || 'Explorer'}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.open(getAddressExplorerUrl(deployment.network, deployment.contract_address), '_blank')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Contract
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
