'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type TabId = 'welcome' | 'blockchain' | 'history' | 'possibilities';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  {
    id: 'welcome',
    label: 'Welcome',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  {
    id: 'blockchain',
    label: 'What is Blockchain?',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'The Story So Far',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'possibilities',
    label: 'What You Can Build',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

const content: Record<TabId, React.ReactNode> = {
  welcome: (
    <div className="space-y-4">
      <div className="text-4xl text-center py-4">🚀</div>
      <h3 className="text-xl font-bold text-center">Welcome to the Future of Building</h3>
      <p className="text-muted-foreground">
        You&apos;re about to learn one of the most valuable skills of our time: <strong>building on the blockchain</strong>.
      </p>
      <p className="text-muted-foreground">
        This isn&apos;t just about cryptocurrency or making money (though that&apos;s possible too). It&apos;s about a 
        new way of creating things on the internet where <strong>you own what you build</strong>.
      </p>
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <p className="text-sm font-medium">💡 Think about it:</p>
        <ul className="text-sm text-muted-foreground mt-2 space-y-1">
          <li>• Your social media posts? The platform owns them.</li>
          <li>• Your digital purchases? They can be revoked.</li>
          <li>• Your online store? You pay fees to intermediaries.</li>
        </ul>
        <p className="text-sm mt-3">
          <strong>Blockchain changes this.</strong> You&apos;re about to learn how.
        </p>
      </div>
      <p className="text-muted-foreground">
        Don&apos;t worry if you&apos;ve never coded before. We&apos;ll guide you through every step. 
        By the end, you&apos;ll have built something real that lives on the blockchain forever.
      </p>
    </div>
  ),
  
  blockchain: (
    <div className="space-y-4">
      <div className="text-4xl text-center py-4">⛓️</div>
      <h3 className="text-xl font-bold text-center">Blockchain in 60 Seconds</h3>
      
      <p className="text-muted-foreground">
        Imagine a <strong>shared notebook</strong> that thousands of computers around the world 
        all have copies of. When someone writes something new:
      </p>
      
      <div className="grid gap-3">
        <div className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
          <span className="text-xl">1️⃣</span>
          <div>
            <p className="font-medium">Everyone checks it</p>
            <p className="text-sm text-muted-foreground">All the computers verify the new entry is valid</p>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
          <span className="text-xl">2️⃣</span>
          <div>
            <p className="font-medium">It gets added permanently</p>
            <p className="text-sm text-muted-foreground">Once approved, it&apos;s written in ink—can&apos;t be erased</p>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
          <span className="text-xl">3️⃣</span>
          <div>
            <p className="font-medium">Everyone&apos;s copy updates</p>
            <p className="text-sm text-muted-foreground">All computers sync up with the new entry</p>
          </div>
        </div>
      </div>

      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
        <p className="text-sm font-medium text-green-600">🎯 Why this matters:</p>
        <p className="text-sm text-muted-foreground mt-1">
          No single company controls it. No one can cheat. No one can take your stuff away.
          It&apos;s like having a robot notary that works 24/7 and can&apos;t be bribed.
        </p>
      </div>

      <p className="text-muted-foreground">
        <strong>Smart contracts</strong> (what you&apos;ll be building) are programs that live on this blockchain.
        They run exactly as programmed, automatically, forever. No middleman needed.
      </p>
    </div>
  ),

  history: (
    <div className="space-y-4">
      <div className="text-4xl text-center py-4">📜</div>
      <h3 className="text-xl font-bold text-center">From Cypherpunks to You</h3>
      
      <div className="space-y-4">
        <div className="border-l-2 border-primary pl-4">
          <p className="text-sm text-muted-foreground">2008</p>
          <p className="font-medium">Bitcoin is Born</p>
          <p className="text-sm text-muted-foreground">
            A mysterious person named Satoshi Nakamoto publishes a 9-page paper describing 
            &quot;digital cash&quot; that doesn&apos;t need banks. The first blockchain.
          </p>
        </div>

        <div className="border-l-2 border-primary pl-4">
          <p className="text-sm text-muted-foreground">2015</p>
          <p className="font-medium">Ethereum Changes Everything</p>
          <p className="text-sm text-muted-foreground">
            A 21-year-old named Vitalik Buterin launches Ethereum—a blockchain where you can 
            run <em>programs</em>, not just transfer money. Smart contracts are born.
          </p>
        </div>

        <div className="border-l-2 border-primary pl-4">
          <p className="text-sm text-muted-foreground">2017-2021</p>
          <p className="font-medium">The Explosion</p>
          <p className="text-sm text-muted-foreground">
            NFTs, DeFi, DAOs—new words for new possibilities. Artists sell digital art for millions. 
            Communities form around shared ownership. The future gets weird (in a good way).
          </p>
        </div>

        <div className="border-l-2 border-yellow-500 pl-4 bg-yellow-500/10 py-2 rounded-r-lg">
          <p className="text-sm text-yellow-600 font-medium">Now</p>
          <p className="font-medium">Your Turn</p>
          <p className="text-sm text-muted-foreground">
            The tools are easier than ever. The opportunities are bigger than ever. 
            And you&apos;re about to learn how to build on it.
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground italic text-center">
        &quot;We&apos;re at the 1995 moment of the internet. The people building now will shape what comes next.&quot;
      </p>
    </div>
  ),

  possibilities: (
    <div className="space-y-4">
      <div className="text-4xl text-center py-4">✨</div>
      <h3 className="text-xl font-bold text-center">What Will You Create?</h3>
      
      <p className="text-muted-foreground">
        Here&apos;s a taste of what&apos;s possible with the skills you&apos;re about to learn:
      </p>

      <div className="grid gap-3">
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
          <p className="font-medium flex items-center gap-2">
            <span>🎨</span> For Creators
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Sell art, music, or content directly to fans. Get royalties on every resale, forever. 
            No platform taking 30%.
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
          <p className="font-medium flex items-center gap-2">
            <span>🎮</span> For Gamers & Builders
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Create games where players truly own their items. Build virtual economies. 
            Make things that can&apos;t be shut down.
          </p>
        </div>

        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
          <p className="font-medium flex items-center gap-2">
            <span>🤝</span> For Communities
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Create membership tokens, voting systems, or shared treasuries. 
            Let your community make decisions together.
          </p>
        </div>

        <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-lg p-4 border border-orange-500/20">
          <p className="font-medium flex items-center gap-2">
            <span>💼</span> For Entrepreneurs
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Launch a token, crowdfund a project, or automate payments. 
            Build businesses that run on code instead of trust.
          </p>
        </div>
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
        <p className="font-medium">Ready to start building?</p>
        <p className="text-sm text-muted-foreground mt-1">
          Close this and dive into your first lesson. We&apos;ll be with you every step of the way! 🚀
        </p>
      </div>
    </div>
  ),
};

interface LearnModalProps {
  triggerClassName?: string;
}

export function LearnModal({ triggerClassName }: LearnModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('welcome');

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={triggerClassName}>
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          Learn Crypto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            Learn About Blockchain & Crypto
          </DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-border pb-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto py-4 pr-2">
          {content[activeTab]}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Compact button version for the IDE toolbar
export function LearnButton() {
  return <LearnModal />;
}
