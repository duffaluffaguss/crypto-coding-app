'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Step = 'intro' | 'history' | 'security' | 'recovery' | 'ready';

interface WalletEducationProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function WalletEducation({ isOpen, onClose, onComplete }: WalletEducationProps) {
  const [step, setStep] = useState<Step>('intro');

  const steps: Step[] = ['intro', 'history', 'security', 'recovery', 'ready'];
  const currentIndex = steps.indexOf(step);

  const nextStep = () => {
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const content: Record<Step, React.ReactNode> = {
    intro: (
      <div className="space-y-4">
        <div className="text-5xl text-center py-4">👛</div>
        <h3 className="text-xl font-bold text-center">Your Crypto Wallet</h3>
        <p className="text-muted-foreground">
          Before you can deploy your smart contracts to the blockchain, you need a <strong>wallet</strong>.
        </p>
        <p className="text-muted-foreground">
          Think of it like a digital keychain that:
        </p>
        <div className="grid gap-2">
          <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
            <span className="text-xl">🔑</span>
            <span><strong>Proves it&apos;s you</strong> - Like a digital signature</span>
          </div>
          <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
            <span className="text-xl">💰</span>
            <span><strong>Holds your crypto</strong> - Tokens, NFTs, everything</span>
          </div>
          <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
            <span className="text-xl">📝</span>
            <span><strong>Signs transactions</strong> - Approves what you want to do</span>
          </div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-sm">
            <strong>Good news:</strong> We use a &quot;Smart Wallet&quot; that&apos;s easier and safer than 
            traditional wallets. No browser extensions needed!
          </p>
        </div>
      </div>
    ),

    history: (
      <div className="space-y-4">
        <div className="text-5xl text-center py-4">📜</div>
        <h3 className="text-xl font-bold text-center">A Brief History of Wallets</h3>
        
        <div className="space-y-4">
          <div className="border-l-2 border-muted-foreground/30 pl-4">
            <p className="text-sm text-muted-foreground">2009 - The Beginning</p>
            <p className="font-medium">Command Line Wallets</p>
            <p className="text-sm text-muted-foreground">
              Early Bitcoin users ran software on their computers. Lose your computer = lose your coins. 😬
            </p>
          </div>

          <div className="border-l-2 border-muted-foreground/30 pl-4">
            <p className="text-sm text-muted-foreground">2014-2016</p>
            <p className="font-medium">Browser Extensions</p>
            <p className="text-sm text-muted-foreground">
              MetaMask made it easier. But you still needed to manage a 12-word &quot;seed phrase&quot; 
              and hope you never lost it.
            </p>
          </div>

          <div className="border-l-2 border-muted-foreground/30 pl-4">
            <p className="text-sm text-muted-foreground">2020-2022</p>
            <p className="font-medium">Hardware Wallets</p>
            <p className="text-sm text-muted-foreground">
              Physical devices like Ledger for extra security. Great for holding, but clunky for daily use.
            </p>
          </div>

          <div className="border-l-2 border-primary pl-4 bg-primary/5 py-2 rounded-r-lg">
            <p className="text-sm text-primary font-medium">Now - Smart Wallets</p>
            <p className="font-medium">The Best of All Worlds</p>
            <p className="text-sm text-muted-foreground">
              Account abstraction lets you use email/social login, recover access, and set spending limits. 
              <strong> This is what we use!</strong>
            </p>
          </div>
        </div>
      </div>
    ),

    security: (
      <div className="space-y-4">
        <div className="text-5xl text-center py-4">🔒</div>
        <h3 className="text-xl font-bold text-center">Wallet Security Basics</h3>
        
        <p className="text-muted-foreground">
          Your wallet is only as secure as you make it. Here&apos;s what you need to know:
        </p>

        <div className="space-y-3">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <p className="font-medium text-green-600 flex items-center gap-2">
              <span>✅</span> DO
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Use a strong, unique password</li>
              <li>• Enable 2FA (two-factor authentication) when available</li>
              <li>• Only connect your wallet to sites you trust</li>
              <li>• Start with small amounts while learning</li>
              <li>• Double-check addresses before sending</li>
            </ul>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="font-medium text-red-600 flex items-center gap-2">
              <span>❌</span> DON&apos;T
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Never share your private key or seed phrase</li>
              <li>• Never click links from DMs promising free crypto</li>
              <li>• Never approve transactions you don&apos;t understand</li>
              <li>• Never store seed phrases digitally (screenshots, notes apps)</li>
            </ul>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-sm">
            <strong>💡 Smart Wallet Advantage:</strong> With our Smart Wallet, you get built-in 
            protections. No seed phrase to lose, and you can set transaction limits!
          </p>
        </div>
      </div>
    ),

    recovery: (
      <div className="space-y-4">
        <div className="text-5xl text-center py-4">🔄</div>
        <h3 className="text-xl font-bold text-center">Wallet Recovery</h3>
        
        <p className="text-muted-foreground">
          What happens if you lose access? Here&apos;s how recovery works:
        </p>

        <div className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="font-medium flex items-center gap-2">
              <span>🔑</span> Traditional Wallets
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Use a 12-24 word &quot;seed phrase.&quot; If you lose it, your funds are gone forever. 
              Millions of dollars in crypto have been lost this way.
            </p>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <p className="font-medium flex items-center gap-2 text-primary">
              <span>✨</span> Smart Wallets (What We Use)
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Recovery through email, social login, or trusted contacts. Much harder to lose access!
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• <strong>Passkeys</strong> - Backed up to your iCloud/Google account</li>
              <li>• <strong>Social Recovery</strong> - Trusted friends can help recover</li>
              <li>• <strong>Time-locked Recovery</strong> - Backup methods after a waiting period</li>
            </ul>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-sm">
            <strong>⚠️ Important:</strong> Even with Smart Wallets, keep your email account secure. 
            Use a strong password and 2FA!
          </p>
        </div>
      </div>
    ),

    ready: (
      <div className="space-y-4">
        <div className="text-5xl text-center py-4">🚀</div>
        <h3 className="text-xl font-bold text-center">You&apos;re Ready!</h3>
        
        <p className="text-muted-foreground text-center">
          Now you understand the basics of crypto wallets. Time to connect yours!
        </p>

        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 text-center">
          <p className="font-medium mb-2">What happens next:</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1️⃣ Click &quot;Connect Wallet&quot; below</p>
            <p>2️⃣ Create your Smart Wallet (takes 30 seconds)</p>
            <p>3️⃣ Get free test tokens to practice with</p>
            <p>4️⃣ Start building and deploying! 🎉</p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-center text-muted-foreground">
            <strong>Remember:</strong> We&apos;re using a test network (Base Sepolia) with free test tokens. 
            No real money involved while you learn!
          </p>
        </div>
      </div>
    ),
  };

  const stepTitles: Record<Step, string> = {
    intro: 'What is a Wallet?',
    history: 'Wallet History',
    security: 'Security',
    recovery: 'Recovery',
    ready: 'Ready!',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Wallet Setup</span>
            <div className="flex items-center gap-1">
              {steps.map((s, i) => (
                <div
                  key={s}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i <= currentIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Progress bar */}
        <div className="flex gap-1 text-xs text-muted-foreground mb-2">
          {steps.map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`flex-1 py-1 rounded transition-colors ${
                i === currentIndex
                  ? 'bg-primary/20 text-primary font-medium'
                  : i < currentIndex
                  ? 'bg-muted/50 text-muted-foreground'
                  : 'text-muted-foreground/50'
              }`}
            >
              {stepTitles[s]}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-2">
          {content[step]}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentIndex === 0}
          >
            ← Back
          </Button>
          <Button onClick={nextStep}>
            {step === 'ready' ? (
              <>Connect Wallet →</>
            ) : (
              <>Next →</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
