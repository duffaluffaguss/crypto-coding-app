'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { formatConstructorArgs } from '@/lib/basescan';
import type { CompilationResult } from '@/types';

interface VerifyButtonProps {
  contractAddress: string;
  contractName: string;
  sourceCode: string;
  compilationResult: CompilationResult | null;
  constructorArgs?: any[];
  className?: string;
}

type VerifyStatus = 'idle' | 'verifying' | 'success' | 'error' | 'pending';

interface VerificationResult {
  success: boolean;
  status: string;
  message: string;
  guid?: string;
  contractUrl?: string;
}

export function VerifyButton({
  contractAddress,
  contractName,
  sourceCode,
  compilationResult,
  constructorArgs = [],
  className = '',
}: VerifyButtonProps) {
  const [status, setStatus] = useState<VerifyStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const handleVerify = async () => {
    if (!compilationResult) {
      setError('No compilation result available');
      return;
    }

    setStatus('verifying');
    setError(null);

    try {
      // Extract compiler version from compilation result
      // Format: "0.8.19+commit.7dd6d404.Emscripten.clang" -> "v0.8.19+commit.7dd6d404"
      const compilerVersion = `v${compilationResult.version}`;
      
      // Format constructor arguments for verification
      const formattedConstructorArgs = formatConstructorArgs(constructorArgs);

      const response = await fetch('/api/verify-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: contractAddress,
          sourceCode: sourceCode,
          compilerVersion: compilerVersion,
          contractName: contractName,
          constructorArgs: formattedConstructorArgs,
          optimizationUsed: compilationResult.settings?.optimizer?.enabled || false,
          runs: compilationResult.settings?.optimizer?.runs || 200,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Verification failed');
      }

      setVerificationResult(result);

      // Set status based on result
      if (result.status === '1') {
        setStatus('success');
      } else if (result.status === 'pending') {
        setStatus('pending');
      } else {
        setStatus('error');
        setError(result.message || 'Verification failed');
      }

    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Verifying on Basescan...
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
            Verified Successfully
          </>
        );
      case 'pending':
        return (
          <>
            <AlertCircle className="w-4 h-4 mr-2 text-yellow-600" />
            Verification Pending
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
            Verification Failed
          </>
        );
      default:
        return (
          <>
            <ExternalLink className="w-4 h-4 mr-2" />
            Verify on Basescan
          </>
        );
    }
  };

  const getButtonVariant = () => {
    switch (status) {
      case 'success':
        return 'outline';
      case 'error':
        return 'outline';
      default:
        return 'default';
    }
  };

  const isDisabled = status === 'verifying' || !compilationResult;

  return (
    <div className={`space-y-3 ${className}`}>
      <Button
        onClick={handleVerify}
        disabled={isDisabled}
        variant={getButtonVariant()}
        className="w-full"
      >
        {getButtonContent()}
      </Button>

      {/* Status Messages */}
      {error && status === 'error' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Verification Failed</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {verificationResult && (status === 'success' || status === 'pending') && (
        <div className={`p-3 border rounded-lg ${
          status === 'success' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-start">
            {status === 'success' ? (
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
            )}
            <div className="flex-grow">
              <p className={`text-sm font-medium ${
                status === 'success' ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {status === 'success' ? 'Contract Verified!' : 'Verification Pending'}
              </p>
              <p className={`text-sm mt-1 ${
                status === 'success' ? 'text-green-700' : 'text-yellow-700'
              }`}>
                {verificationResult.message}
              </p>
              {verificationResult.contractUrl && (
                <a
                  href={verificationResult.contractUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center text-sm mt-2 hover:underline ${
                    status === 'success' ? 'text-green-700' : 'text-yellow-700'
                  }`}
                >
                  View on Basescan
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {!compilationResult && (
        <p className="text-sm text-gray-600">
          Contract must be compiled before verification
        </p>
      )}
    </div>
  );
}