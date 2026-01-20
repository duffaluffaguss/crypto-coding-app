'use client';

import { useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  getFaucetsForNetwork, 
  openFaucet, 
  FAUCET_FAQ,
  type Faucet 
} from '@/lib/faucets';
import { 
  Droplets, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Play,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function FaucetPage() {
  const { address, isConnected } = useAccount();
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address,
    chainId: baseSepolia.id,
  });

  const [copiedAddress, setCopiedAddress] = useState(false);
  
  const faucets = getFaucetsForNetwork('base-sepolia');
  const isLowBalance = balance && balance.value < BigInt(1000000000000000); // 0.001 ETH

  const copyAddress = async () => {
    if (!address) return;
    
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      toast.success('Address copied to clipboard!');
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  const handleFaucetClick = (faucet: Faucet) => {
    openFaucet(faucet.url, address);
    toast.info(`Opening ${faucet.name}...`);
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Droplets className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold">Testnet Faucets</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Get free testnet ETH to deploy and test your smart contracts on Base Sepolia
        </p>
      </div>

      {/* Connection Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isConnected ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            )}
            Wallet Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Please connect your wallet to see your balance and get testnet ETH.
              </p>
              <Button variant="outline">Connect Wallet</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Your wallet address:</p>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <code className="text-sm font-mono flex-1 truncate">{address}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyAddress}
                    className="flex-shrink-0"
                  >
                    {copiedAddress ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Current balance:</p>
                <div className="flex items-center gap-2">
                  {balanceLoading ? (
                    <span className="text-sm">Loading...</span>
                  ) : (
                    <>
                      <span className="font-mono text-lg">
                        {balance ? parseFloat(balance.formatted).toFixed(4) : '0.0000'} ETH
                      </span>
                      {isLowBalance && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          Low Balance
                        </Badge>
                      )}
                    </>
                  )}
                </div>
                {isLowBalance && (
                  <p className="text-sm text-yellow-600 mt-1">
                    ⚠️ You may need more ETH to deploy contracts
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Start Guide */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-500" />
            Quick Start
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </span>
                <div>
                  <h3 className="font-semibold">Copy Address</h3>
                  <p className="text-sm text-muted-foreground">
                    Copy your wallet address above
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </span>
                <div>
                  <h3 className="font-semibold">Choose Faucet</h3>
                  <p className="text-sm text-muted-foreground">
                    Click any faucet below
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </span>
                <div>
                  <h3 className="font-semibold">Get ETH</h3>
                  <p className="text-sm text-muted-foreground">
                    Paste address and claim
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Faucets */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Available Faucets</h2>
        <div className="grid gap-4">
          {faucets.map((faucet) => (
            <Card key={faucet.id} className="transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <span className="text-3xl">{faucet.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{faucet.name}</h3>
                        {faucet.recommendedFor && (
                          <Badge variant="secondary">
                            {faucet.recommendedFor}
                          </Badge>
                        )}
                        {faucet.status === 'active' && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-3">{faucet.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {faucet.amount && (
                          <div>
                            <p className="text-xs text-muted-foreground">Amount</p>
                            <p className="font-semibold text-green-600">{faucet.amount}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground">Speed</p>
                          <p className="font-semibold">{faucet.estimatedTime}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs text-muted-foreground">Features</p>
                          <p className="text-sm">{faucet.features.join(', ')}</p>
                        </div>
                      </div>
                      
                      {faucet.requirements && (
                        <div className="mb-4">
                          <p className="text-xs text-muted-foreground mb-1">Requirements</p>
                          <div className="flex flex-wrap gap-1">
                            {faucet.requirements.map((req, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {req}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleFaucetClick(faucet)}
                    className="flex-shrink-0"
                    disabled={!isConnected}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Use Faucet
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Tutorial Video Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-green-500" />
            Video Tutorial
          </CardTitle>
          <CardDescription>
            Watch this step-by-step guide on getting testnet ETH
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Play className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                Tutorial video coming soon
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                For now, follow the quick start guide above
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-semibold">Frequently Asked Questions</h2>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <Accordion type="single" collapsible>
              {FAUCET_FAQ.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>

      {/* Tips Section */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Pro Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm">
                <strong>Use multiple faucets:</strong> Different faucets have different limits. 
                Use several to get more testnet ETH faster.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm">
                <strong>Save testnet ETH:</strong> Our platform sponsors most gas fees, 
                so you might not need much. Start with small amounts.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm">
                <strong>Check rate limits:</strong> Most faucets allow one request per day. 
                Plan accordingly for your testing schedule.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm">
                <strong>Bookmark this page:</strong> You'll likely need more testnet ETH as you develop. 
                Keep this page handy for quick access.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}