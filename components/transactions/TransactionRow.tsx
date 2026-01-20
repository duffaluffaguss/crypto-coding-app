'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTxExplorerUrl, getAddressExplorerUrl, NETWORKS, type NetworkId } from '@/lib/networks';
import type { Deployment } from '@/types';

interface TransactionRowProps {
  deployment: Deployment;
  onExpand: (id: string) => void;
  isExpanded: boolean;
}

type TransactionStatus = 'success' | 'pending' | 'failed';

export function TransactionRow({ deployment, onExpand, isExpanded }: TransactionRowProps) {
  const [copied, setCopied] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatGas = (gas: number | null) => {
    if (!gas) return '-';
    return gas.toLocaleString();
  };

  // Determine transaction status based on available data
  // In a real app, you'd query the blockchain or store status in DB
  const getStatus = (): TransactionStatus => {
    // If we have a contract address and tx_hash, it's successful
    if (deployment.contract_address && deployment.tx_hash) {
      return 'success';
    }
    // If we only have tx_hash but no contract address, might be pending
    if (deployment.tx_hash && !deployment.contract_address) {
      return 'pending';
    }
    return 'failed';
  };

  const status = getStatus();

  const getStatusBadge = () => {
    switch (status) {
      case 'success':
        return (
          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Success
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
            <svg className="w-3 h-3 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Failed
          </Badge>
        );
    }
  };

  const getNetworkBadge = (network: NetworkId) => {
    const config = NETWORKS[network];
    const isTestnet = config?.isTestnet ?? true;
    
    return (
      <Badge 
        variant={isTestnet ? 'secondary' : 'default'}
        className={isTestnet ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}
      >
        {config?.name || network}
      </Badge>
    );
  };

  const copyTxHash = async () => {
    try {
      await navigator.clipboard.writeText(deployment.tx_hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <tr 
      className={`hover:bg-muted/30 transition-colors cursor-pointer ${isExpanded ? 'bg-muted/20' : ''}`}
      onClick={() => onExpand(deployment.id)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono text-primary">
            {formatAddress(deployment.tx_hash)}
          </code>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              copyTxHash();
            }}
            title="Copy transaction hash"
          >
            {copied ? (
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
      </td>
      <td className="px-4 py-3">
        <a
          href={getAddressExplorerUrl(deployment.network, deployment.contract_address)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center gap-1 font-mono text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          {formatAddress(deployment.contract_address)}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </td>
      <td className="px-4 py-3">
        {getNetworkBadge(deployment.network)}
      </td>
      <td className="px-4 py-3">
        {getStatusBadge()}
      </td>
      <td className="px-4 py-3 font-mono text-muted-foreground text-sm">
        {formatGas(deployment.gas_used)}
      </td>
      <td className="px-4 py-3 text-muted-foreground text-sm">
        {formatDate(deployment.created_at)}
      </td>
      <td className="px-4 py-3">
        <a
          href={getTxExplorerUrl(deployment.network, deployment.tx_hash)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center gap-1 text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          Explorer
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </td>
    </tr>
  );
}
