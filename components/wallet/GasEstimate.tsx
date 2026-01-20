'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { NetworkId } from '@/lib/networks';
import { NETWORKS } from '@/lib/networks';
import { getGasWarningLevel, estimateConfirmationTime } from '@/lib/gas';

interface GasEstimateData {
  gasLimit: string;
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  totalCostWei: string;
  totalCostEth: string;
  totalCostUsd: string;
  gasPriceGwei: string;
  isHighGas: boolean;
}

interface GasBreakdown {
  baseFee: string;
  priorityFee: string;
  maxFee: string;
  estimatedGas: string;
}

interface GasEstimateProps {
  bytecode: string | null;
  network: NetworkId;
  onEstimateComplete?: (estimate: GasEstimateData) => void;
  compact?: boolean;
}

export function GasEstimate({ 
  bytecode, 
  network, 
  onEstimateComplete,
  compact = false 
}: GasEstimateProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<GasEstimateData | null>(null);
  const [breakdown, setBreakdown] = useState<GasBreakdown | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const networkConfig = NETWORKS[network];

  const handleEstimate = async () => {
    if (!bytecode) {
      setError('Compile your contract first to estimate gas');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/estimate-gas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bytecode, network }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to estimate gas');
      }

      setEstimate(data.estimate);
      setBreakdown(data.breakdown);
      onEstimateComplete?.(data.estimate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Estimation failed');
    } finally {
      setLoading(false);
    }
  };

  const getWarningStyles = () => {
    if (!estimate) return {};
    
    const level = getGasWarningLevel({
      gasLimit: BigInt(estimate.gasLimit),
      gasPrice: BigInt(estimate.gasPrice),
      totalCostWei: BigInt(estimate.totalCostWei),
      totalCostEth: estimate.totalCostEth,
      totalCostUsd: estimate.totalCostUsd,
      gasPriceGwei: estimate.gasPriceGwei,
      isHighGas: estimate.isHighGas,
    });

    switch (level) {
      case 'very-high':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/50',
          text: 'text-red-500',
          icon: '🔥',
          label: 'Very High Gas',
        };
      case 'high':
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/50',
          text: 'text-yellow-500',
          icon: '⚠️',
          label: 'High Gas',
        };
      case 'low':
        return {
          bg: 'bg-green-500/10',
          border: 'border-green-500/50',
          text: 'text-green-500',
          icon: '✓',
          label: 'Low Gas',
        };
      default:
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/50',
          text: 'text-blue-500',
          icon: '⛽',
          label: 'Normal Gas',
        };
    }
  };

  const warningStyles = estimate ? getWarningStyles() : null;

  if (compact && estimate) {
    return (
      <div className={`rounded px-2 py-1 text-xs ${warningStyles?.bg} ${warningStyles?.border} border`}>
        <span className={warningStyles?.text}>
          {warningStyles?.icon} ~{parseFloat(estimate.totalCostEth).toFixed(5)} ETH (${estimate.totalCostUsd})
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Estimate Button */}
      <Button
        onClick={handleEstimate}
        disabled={loading || !bytecode}
        variant="outline"
        size="sm"
        className="w-full"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Estimating...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Estimate Gas Cost
          </>
        )}
      </Button>

      {/* No Bytecode Warning */}
      {!bytecode && !error && (
        <p className="text-xs text-muted-foreground">
          Compile your contract to estimate deployment cost
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
          {error}
        </div>
      )}

      {/* Estimate Results */}
      {estimate && (
        <div className={`rounded-lg border p-3 ${warningStyles?.bg} ${warningStyles?.border}`}>
          {/* Main Cost Display */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Estimated Cost</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${warningStyles?.bg} ${warningStyles?.text}`}>
              {warningStyles?.icon} {warningStyles?.label}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-2xl font-bold">
              ${estimate.totalCostUsd}
            </span>
            <span className="text-sm text-muted-foreground">
              ({parseFloat(estimate.totalCostEth).toFixed(6)} ETH)
            </span>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-background/50 rounded px-2 py-1">
              <span className="text-muted-foreground">Gas Price:</span>
              <span className="ml-1 font-medium">{parseFloat(estimate.gasPriceGwei).toFixed(2)} Gwei</span>
            </div>
            <div className="bg-background/50 rounded px-2 py-1">
              <span className="text-muted-foreground">Est. Time:</span>
              <span className="ml-1 font-medium">{estimateConfirmationTime(parseFloat(estimate.gasPriceGwei))}</span>
            </div>
          </div>

          {/* Breakdown Toggle */}
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="text-xs text-primary hover:underline mt-2 flex items-center gap-1"
          >
            {showBreakdown ? 'Hide' : 'Show'} breakdown
            <svg
              className={`w-3 h-3 transition-transform ${showBreakdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Detailed Breakdown */}
          {showBreakdown && breakdown && (
            <div className="mt-2 pt-2 border-t border-border/50 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network</span>
                <span>{networkConfig.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Gas</span>
                <span>{parseInt(breakdown.estimatedGas).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Fee</span>
                <span>{breakdown.baseFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority Fee</span>
                <span>{breakdown.priorityFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Fee</span>
                <span>{breakdown.maxFee}</span>
              </div>
            </div>
          )}

          {/* High Gas Warning */}
          {estimate.isHighGas && (
            <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-600 dark:text-yellow-400">
              <div className="flex items-center gap-1 font-medium mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Gas prices are high
              </div>
              <p>Consider waiting for lower network congestion to save on fees.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Export a simple inline version for the deploy button
export function GasEstimateInline({ 
  estimate 
}: { 
  estimate: { totalCostEth: string; totalCostUsd: string; isHighGas: boolean } | null 
}) {
  if (!estimate) return null;

  return (
    <div className={`text-xs flex items-center gap-1 ${estimate.isHighGas ? 'text-yellow-500' : 'text-muted-foreground'}`}>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      ~{parseFloat(estimate.totalCostEth).toFixed(5)} ETH (${estimate.totalCostUsd})
      {estimate.isHighGas && <span className="text-yellow-500">⚠️</span>}
    </div>
  );
}
