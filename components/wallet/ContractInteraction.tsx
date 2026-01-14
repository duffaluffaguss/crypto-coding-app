'use client';

import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseAbi, formatEther, parseEther } from 'viem';

interface ContractInteractionProps {
  contractAddress: string;
  abi: any[];
}

interface FunctionInput {
  name: string;
  type: string;
  value: string;
}

export function ContractInteraction({ contractAddress, abi }: ContractInteractionProps) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [inputs, setInputs] = useState<FunctionInput[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter to get readable functions (view/pure)
  const readFunctions = abi.filter(
    (item) => item.type === 'function' && (item.stateMutability === 'view' || item.stateMutability === 'pure')
  );

  // Filter to get write functions
  const writeFunctions = abi.filter(
    (item) => item.type === 'function' && item.stateMutability !== 'view' && item.stateMutability !== 'pure'
  );

  const selectFunction = (funcName: string) => {
    const func = abi.find((item) => item.type === 'function' && item.name === funcName);
    if (!func) return;

    setSelectedFunction(funcName);
    setInputs(
      func.inputs.map((input: any) => ({
        name: input.name,
        type: input.type,
        value: '',
      }))
    );
    setResult(null);
    setError(null);
  };

  const updateInput = (index: number, value: string) => {
    const newInputs = [...inputs];
    newInputs[index].value = value;
    setInputs(newInputs);
  };

  const executeRead = async () => {
    if (!publicClient || !selectedFunction) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const args = inputs.map((input) => {
        if (input.type.includes('uint') || input.type.includes('int')) {
          return BigInt(input.value);
        }
        if (input.type === 'bool') {
          return input.value.toLowerCase() === 'true';
        }
        return input.value;
      });

      const data = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi,
        functionName: selectedFunction,
        args: args.length > 0 ? args : undefined,
      });

      // Format the result
      if (typeof data === 'bigint') {
        setResult(data.toString());
      } else if (typeof data === 'boolean') {
        setResult(data ? 'true' : 'false');
      } else {
        setResult(String(data));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to read contract');
    } finally {
      setLoading(false);
    }
  };

  const executeWrite = async () => {
    if (!walletClient || !publicClient || !selectedFunction || !address) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const func = abi.find((item) => item.name === selectedFunction);
      const args = inputs.map((input) => {
        if (input.type.includes('uint') || input.type.includes('int')) {
          return BigInt(input.value);
        }
        if (input.type === 'bool') {
          return input.value.toLowerCase() === 'true';
        }
        return input.value;
      });

      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi,
        functionName: selectedFunction,
        args: args.length > 0 ? args : undefined,
        account: address,
        value: func?.stateMutability === 'payable' ? parseEther('0') : undefined,
      });

      // Wait for transaction
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'success') {
        setResult(`Transaction successful! Hash: ${hash}`);
      } else {
        setError('Transaction failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to execute transaction');
    } finally {
      setLoading(false);
    }
  };

  const isReadFunction = readFunctions.some((f) => f.name === selectedFunction);

  return (
    <div className="p-4 border-t border-border bg-card">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <svg
          className="w-4 h-4 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        Interact with Contract
      </h3>

      {/* Function Selector */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Read Functions */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Read (View)</p>
          <div className="space-y-1">
            {readFunctions.map((func) => (
              <button
                key={func.name}
                onClick={() => selectFunction(func.name)}
                className={`w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                  selectedFunction === func.name
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                }`}
              >
                {func.name}()
              </button>
            ))}
            {readFunctions.length === 0 && (
              <p className="text-xs text-muted-foreground">No read functions</p>
            )}
          </div>
        </div>

        {/* Write Functions */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Write</p>
          <div className="space-y-1">
            {writeFunctions.map((func) => (
              <button
                key={func.name}
                onClick={() => selectFunction(func.name)}
                className={`w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                  selectedFunction === func.name
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                }`}
              >
                {func.name}()
              </button>
            ))}
            {writeFunctions.length === 0 && (
              <p className="text-xs text-muted-foreground">No write functions</p>
            )}
          </div>
        </div>
      </div>

      {/* Selected Function */}
      {selectedFunction && (
        <div className="border-t border-border pt-4">
          <p className="text-sm font-medium mb-2">{selectedFunction}()</p>

          {/* Inputs */}
          {inputs.length > 0 && (
            <div className="space-y-2 mb-3">
              {inputs.map((input, index) => (
                <div key={index}>
                  <label className="text-xs text-muted-foreground">
                    {input.name} ({input.type})
                  </label>
                  <Input
                    value={input.value}
                    onChange={(e) => updateInput(index, e.target.value)}
                    placeholder={`Enter ${input.type}`}
                    className="h-8 text-xs"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Execute Button */}
          <Button
            onClick={isReadFunction ? executeRead : executeWrite}
            disabled={loading || (!isConnected && !isReadFunction)}
            size="sm"
            variant={isReadFunction ? 'outline' : 'default'}
            className="w-full"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {isReadFunction ? 'Reading...' : 'Executing...'}
              </>
            ) : isReadFunction ? (
              'Read'
            ) : (
              'Write'
            )}
          </Button>

          {/* Result */}
          {result && (
            <div className="mt-3 p-2 bg-green-500/10 text-green-500 rounded text-xs break-all">
              {result}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-3 p-2 bg-destructive/10 text-destructive rounded text-xs break-all">
              {error}
            </div>
          )}
        </div>
      )}

      {!isConnected && (
        <p className="text-xs text-muted-foreground mt-2">
          Connect wallet to execute write functions
        </p>
      )}
    </div>
  );
}
