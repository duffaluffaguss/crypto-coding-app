'use client';

import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient, useSwitchChain } from 'wagmi';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { NETWORKS, DEFAULT_NETWORK, getTxExplorerUrl, type NetworkId } from '@/lib/networks';
import { logContractDeployed } from '@/lib/activity';
import type { CompilationResult } from '@/types';

interface DeployButtonProps {
  projectId: string;
  code: string;
  contractName: string;
  compilationResult: CompilationResult | null;
  onCompile: () => Promise<void>;
  onDeploySuccess: (address: string, txHash: string) => void;
}

type DeployStatus = 'idle' | 'compiling' | 'switching_network' | 'awaiting_confirmation' | 'deploying' | 'success' | 'error';

export function DeployButton({
  projectId,
  code,
  contractName,
  compilationResult,
  onCompile,
  onDeploySuccess,
}: DeployButtonProps) {
  const { address, isConnected, chain } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const supabase = createClient();

  const [status, setStatus] = useState<DeployStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>(DEFAULT_NETWORK);
  const [showMainnetWarning, setShowMainnetWarning] = useState(false);

  const networkConfig = NETWORKS[selectedNetwork];

  const handleNetworkChange = (networkId: NetworkId) => {
    setSelectedNetwork(networkId);
    setError(null);
    setStatus('idle');
  };

  const handleDeploy = async () => {
    if (!isConnected || !walletClient || !publicClient) {
      setError('Please connect your wallet first');
      return;
    }

    // Show mainnet warning if deploying to mainnet
    if (!networkConfig.isTestnet && !showMainnetWarning) {
      setShowMainnetWarning(true);
      return;
    }

    setShowMainnetWarning(false);
    setError(null);
    setTxHash(null);
    setDeployedAddress(null);

    try {
      // Switch chain if needed
      if (chain?.id !== networkConfig.chainId) {
        setStatus('switching_network');
        try {
          await switchChainAsync({ chainId: networkConfig.chainId });
        } catch (err: any) {
          setStatus('error');
          setError(`Failed to switch to ${networkConfig.name}. Please switch manually in your wallet.`);
          return;
        }
      }

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

        // Save to database including ABI for frontend generation
        await saveDeployment(receipt.contractAddress, hash, abi, receipt.gasUsed);
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

  const saveDeployment = async (contractAddress: string, transactionHash: string, abi: any[], gasUsed?: bigint) => {
    try {
      // Get user for activity logging
      const { data: { user } } = await supabase.auth.getUser();

      await supabase
        .from('projects')
        .update({
          contract_address: contractAddress,
          network: selectedNetwork,
          status: 'deployed',
          deployed_at: new Date().toISOString(),
          contract_abi: abi,
        })
        .eq('id', projectId);

      // Save to deployments history table
      if (user) {
        await supabase
          .from('deployments')
          .insert({
            project_id: projectId,
            user_id: user.id,
            contract_address: contractAddress,
            tx_hash: transactionHash,
            network: selectedNetwork,
            gas_used: gasUsed ? Number(gasUsed) : null,
            contract_name: contractName,
          });

        // Log activity
        await logContractDeployed(
          supabase,
          user.id,
          contractAddress,
          contractName,
          networkConfig.name
        );
      }
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
      case 'switching_network':
        return (
          <>
            <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Switching Network...
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
            Deploy to {networkConfig.name}
          </>
        );
    }
  };

  const isDisabled = status === 'compiling' || status === 'switching_network' || status === 'awaiting_confirmation' || status === 'deploying';

  return (
    <div className="flex flex-col gap-2">
      {/* Network Selector */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">Network:</label>
        <select
          value={selectedNetwork}
          onChange={(e) => handleNetworkChange(e.target.value as NetworkId)}
          disabled={isDisabled}
          className="text-xs bg-background border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="base-sepolia">Base Sepolia (Testnet)</option>
          <option value="base-mainnet">Base Mainnet</option>
        </select>
      </div>

      {/* Mainnet Warning */}
      {showMainnetWarning && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded p-2 text-xs">
          <div className="flex items-center gap-2 text-yellow-500 font-medium mb-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Mainnet Deployment
          </div>
          <p className="text-yellow-500/80 mb-2">
            This will use real ETH! Make sure your contract is tested and ready for production.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowMainnetWarning(false)}
              className="text-xs h-7"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleDeploy}
              className="text-xs h-7 bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              Deploy Anyway
            </Button>
          </div>
        </div>
      )}

      {/* Deploy Button */}
      {!showMainnetWarning && (
        <Button
          onClick={handleDeploy}
          disabled={isDisabled || !isConnected}
          variant={status === 'success' ? 'outline' : 'default'}
          size="sm"
          className={status === 'success' ? 'text-green-500 border-green-500' : ''}
        >
          {getButtonContent()}
        </Button>
      )}

      {/* Transaction Status */}
      {txHash && (
        <div className="text-xs">
          <a
            href={getTxExplorerUrl(selectedNetwork, txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1"
          >
            View on {networkConfig.explorerName}
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
