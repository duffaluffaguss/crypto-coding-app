'use client';

import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { CompilationResult } from '@/types';

interface DeployButtonProps {
  projectId: string;
  code: string;
  contractName: string;
  compilationResult: CompilationResult | null;
  onCompile: () => Promise<void>;
  onDeploySuccess: (address: string, txHash: string) => void;
}

type DeployStatus = 'idle' | 'compiling' | 'awaiting_confirmation' | 'deploying' | 'success' | 'error';

export function DeployButton({
  projectId,
  code,
  contractName,
  compilationResult,
  onCompile,
  onDeploySuccess,
}: DeployButtonProps) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const supabase = createClient();

  const [status, setStatus] = useState<DeployStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);

  const handleDeploy = async () => {
    if (!isConnected || !walletClient || !publicClient) {
      setError('Please connect your wallet first');
      return;
    }

    setError(null);
    setTxHash(null);
    setDeployedAddress(null);

    try {
      // Step 1: Compile if needed
      if (!compilationResult?.success || !compilationResult?.bytecode) {
        setStatus('compiling');
        await onCompile();

        // Wait a moment for the compilation result to update
        await new Promise(resolve => setTimeout(resolve, 500));

        // Re-check compilation result by fetching it
        const compileResponse = await fetch('/api/compile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceCode: code, contractName }),
        });
        const compileResult = await compileResponse.json();

        if (!compileResult.success || !compileResult.bytecode) {
          setStatus('error');
          setError('Compilation failed. Fix errors before deploying.');
          return;
        }

        // Use the fresh compilation result
        await deployContract(compileResult.bytecode, compileResult.abi || []);
      } else {
        await deployContract(compilationResult.bytecode!, compilationResult.abi || []);
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Deployment failed');
    }
  };

  const deployContract = async (bytecode: string, abi: any[]) => {
    if (!walletClient || !publicClient || !address) return;

    setStatus('awaiting_confirmation');

    try {
      // Deploy the contract
      const hash = await walletClient.deployContract({
        abi,
        bytecode: `0x${bytecode}` as `0x${string}`,
        account: address,
      });

      setTxHash(hash);
      setStatus('deploying');

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'success' && receipt.contractAddress) {
        setDeployedAddress(receipt.contractAddress);
        setStatus('success');

        // Save to database
        await saveDeployment(receipt.contractAddress, hash);
        onDeploySuccess(receipt.contractAddress, hash);
      } else {
        setStatus('error');
        setError('Transaction failed');
      }
    } catch (err: any) {
      setStatus('error');
      if (err.message?.includes('User rejected')) {
        setError('Transaction rejected by user');
      } else {
        setError(err.message || 'Deployment failed');
      }
    }
  };

  const saveDeployment = async (contractAddress: string, transactionHash: string) => {
    try {
      await supabase
        .from('projects')
        .update({
          contract_address: contractAddress,
          network: 'base-sepolia',
          status: 'deployed',
          deployed_at: new Date().toISOString(),
        })
        .eq('id', projectId);
    } catch (err) {
      console.error('Failed to save deployment:', err);
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case 'compiling':
        return (
          <>
            <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Compiling...
          </>
        );
      case 'awaiting_confirmation':
        return (
          <>
            <svg className="w-4 h-4 mr-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Confirm in Wallet...
          </>
        );
      case 'deploying':
        return (
          <>
            <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Deploying...
          </>
        );
      case 'success':
        return (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Deployed!
          </>
        );
      default:
        return (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Deploy to Base
          </>
        );
    }
  };

  const isDisabled = status === 'compiling' || status === 'awaiting_confirmation' || status === 'deploying';

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleDeploy}
        disabled={isDisabled || !isConnected}
        variant={status === 'success' ? 'outline' : 'default'}
        size="sm"
        className={status === 'success' ? 'text-green-500 border-green-500' : ''}
      >
        {getButtonContent()}
      </Button>

      {/* Transaction Status */}
      {txHash && (
        <div className="text-xs">
          <a
            href={`https://sepolia.basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1"
          >
            View on BaseScan
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}

      {/* Deployed Address */}
      {deployedAddress && (
        <div className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">
          Contract: {deployedAddress.slice(0, 10)}...{deployedAddress.slice(-8)}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
          {error}
        </div>
      )}

      {/* Connect Wallet Hint */}
      {!isConnected && (
        <p className="text-xs text-muted-foreground">
          Connect wallet to deploy
        </p>
      )}
    </div>
  );
}
