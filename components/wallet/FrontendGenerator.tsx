'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createClient } from '@/lib/supabase/client';

interface FrontendGeneratorProps {
  projectId: string;
  projectName: string;
  contractAddress: string | null;
  contractAbi: any[] | null;
  network: string | null;
}

type GenerateStatus = 'idle' | 'generating' | 'success' | 'error';

export function FrontendGenerator({
  projectId,
  projectName,
  contractAddress,
  contractAbi,
  network,
}: FrontendGeneratorProps) {
  const [status, setStatus] = useState<GenerateStatus>('idle');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const supabase = createClient();

  const handleGenerate = async () => {
    if (!contractAbi || !contractAddress) {
      setError('Contract must be deployed first');
      return;
    }

    setStatus('generating');
    setError(null);

    try {
      const response = await fetch('/api/generate-frontend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName,
          contractAddress,
          abi: contractAbi,
          network,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      setGeneratedCode(data.code);
      setStatus('success');

      // Save to database
      await supabase
        .from('projects')
        .update({ generated_frontend: data.code })
        .eq('id', projectId);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Generation failed');
    }
  };

  const handleCopy = async () => {
    if (generatedCode) {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (generatedCode) {
      const blob = new Blob([generatedCode], { type: 'text/typescript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.replace(/\s+/g, '')}.tsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const canGenerate = contractAddress && contractAbi && contractAbi.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={!canGenerate}
          className="gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Generate Frontend
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Generate Frontend Component</DialogTitle>
          <DialogDescription>
            AI will create a React component to interact with your deployed contract
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contract Info */}
          <div className="bg-secondary/50 p-3 rounded-lg text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contract:</span>
              <span className="font-mono">{contractAddress?.slice(0, 10)}...{contractAddress?.slice(-8)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">Functions:</span>
              <span>{contractAbi?.filter(f => f.type === 'function').length || 0} functions</span>
            </div>
          </div>

          {/* Generate Button */}
          {status === 'idle' && (
            <Button onClick={handleGenerate} className="w-full">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate React Component
            </Button>
          )}

          {/* Loading State */}
          {status === 'generating' && (
            <div className="text-center py-8">
              <svg className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-muted-foreground">Generating your frontend...</p>
              <p className="text-xs text-muted-foreground mt-1">This may take 10-20 seconds</p>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                {error}
              </div>
              <Button onClick={handleGenerate} variant="outline" className="w-full">
                Try Again
              </Button>
            </div>
          )}

          {/* Success State - Code Preview */}
          {status === 'success' && generatedCode && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={handleCopy} variant="outline" size="sm" className="gap-2">
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy Code
                    </>
                  )}
                </Button>
                <Button onClick={handleDownload} variant="outline" size="sm" className="gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download .tsx
                </Button>
                <Button onClick={() => { setStatus('idle'); setGeneratedCode(null); }} variant="ghost" size="sm">
                  Regenerate
                </Button>
              </div>

              <ScrollArea className="h-[400px] border rounded-lg">
                <pre className="p-4 text-xs font-mono whitespace-pre-wrap bg-secondary/30">
                  {generatedCode}
                </pre>
              </ScrollArea>

              <div className="bg-primary/10 p-3 rounded-lg text-sm">
                <p className="font-medium mb-1">How to use:</p>
                <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                  <li>Download or copy the component</li>
                  <li>Add to your Next.js project (requires wagmi v2)</li>
                  <li>Import and use: <code className="bg-secondary px-1 rounded">&lt;{projectName.replace(/\s+/g, '')} /&gt;</code></li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
