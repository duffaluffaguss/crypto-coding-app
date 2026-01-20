import Link from 'next/link';
import { Accordion, AccordionItem } from '@/components/help/Accordion';

export const metadata = {
  title: 'Help & FAQ | Zero to Crypto Dev',
  description: 'Get help with Zero to Crypto Dev. Find answers to frequently asked questions about Web3 development, smart contracts, and our platform.',
};

const gettingStartedItems = [
  {
    title: 'How do I create my first project?',
    content: 'After signing up, click "New Project" on your dashboard. You\'ll be guided through selecting your interests, and our AI will generate personalized project ideas for you. Pick one, and start building with pre-written code and fill-in-the-blank exercises.',
  },
  {
    title: 'Do I need any coding experience?',
    content: 'No prior coding experience is required! Our platform is designed for complete beginners. We provide 80% of the code and guide you through the critical parts. Our AI tutor is always available to help explain concepts.',
  },
  {
    title: 'What do I need to get started?',
    content: 'Just a web browser and an email address! For deploying contracts, you\'ll want to install a wallet like MetaMask, but you can learn and build without one initially.',
  },
  {
    title: 'How long does it take to complete a project?',
    content: 'Most projects can be completed in 1-2 weeks depending on your pace. Our bite-sized lessons are designed for busy schedules—even 15-30 minutes a day can lead to significant progress.',
  },
];

const faqItems = [
  {
    title: 'What is a smart contract?',
    content: 'A smart contract is a self-executing program stored on the blockchain. It automatically enforces and executes the terms of an agreement when predetermined conditions are met. Think of it like a vending machine—you put in money, select your item, and it automatically gives you what you selected without needing a person.',
  },
  {
    title: 'How do I get test ETH?',
    content: 'Test ETH (also called testnet ETH) is free cryptocurrency used for practicing on test networks. For Base Sepolia testnet, you can get free test ETH from faucets like the Coinbase faucet or Alchemy faucet. We\'ll prompt you with a link when you need it during deployment.',
  },
  {
    title: 'What is Base network?',
    content: 'Base is a secure, low-cost, Ethereum Layer 2 blockchain built by Coinbase. It\'s designed to be beginner-friendly with lower transaction fees than Ethereum mainnet while maintaining the same security. It\'s perfect for learning and deploying your first projects.',
  },
  {
    title: 'How do I connect my wallet?',
    content: 'Click the "Connect Wallet" button in the top right of your dashboard. You\'ll need a browser wallet like MetaMask installed. Follow the prompts to connect—we support multiple wallets through our wallet connector. Make sure you\'re on the Base Sepolia testnet for testing.',
  },
  {
    title: 'Is my code saved automatically?',
    content: 'Yes! Your code is automatically saved to our servers as you type. You can close your browser and come back anytime to continue where you left off. We also provide the ability to export your code at any time.',
  },
  {
    title: 'Can I deploy to mainnet?',
    content: 'Yes, once you\'re comfortable with your project on testnet, you can deploy to mainnet. However, mainnet deployments require real ETH for gas fees. We recommend thoroughly testing on testnet first and only deploying to mainnet when you\'re confident in your code.',
  },
  {
    title: 'How do achievements work?',
    content: 'Achievements are badges you earn by completing milestones—like deploying your first contract, maintaining a learning streak, or completing lessons. They\'re displayed on your profile and show your progress. Some achievements unlock special features!',
  },
  {
    title: 'What programming language are smart contracts written in?',
    content: 'Smart contracts on Ethereum and Base are written in Solidity, a language specifically designed for blockchain development. Don\'t worry if you haven\'t heard of it—our platform teaches you Solidity from scratch with hands-on examples.',
  },
  {
    title: 'What is gas and why do I need it?',
    content: 'Gas is the unit measuring computational effort on Ethereum. Every transaction requires gas, which is paid in ETH. On testnet, you use free test ETH. Gas fees compensate the network validators who process your transactions.',
  },
  {
    title: 'Can I collaborate with others?',
    content: 'Currently, projects are individual, but you can share your deployed projects and code with others through our Showcase feature. You can also fork other users\' public projects to learn from their code.',
  },
  {
    title: 'What if I get stuck?',
    content: 'Use the AI Tutor! Click the chat icon in the editor to ask questions about your code. The tutor knows your project context and can provide personalized help. You can also check the hints provided in each lesson.',
  },
  {
    title: 'How do streaks work?',
    content: 'Streaks track consecutive days of learning. Complete at least one lesson or make progress on your project each day to maintain your streak. Longer streaks earn you achievements and help build consistent learning habits.',
  },
  {
    title: 'Is my wallet/funds safe?',
    content: 'We never have access to your wallet\'s private keys. When you connect your wallet, you\'re only granting read access and the ability to request transactions (which you must approve). Always verify transactions before signing.',
  },
  {
    title: 'Can I use this on mobile?',
    content: 'Yes! Our platform is fully responsive and works on tablets and mobile devices. For the best coding experience, we recommend a desktop/laptop, but you can review lessons and track progress on any device.',
  },
];

const keyboardShortcuts = [
  { keys: 'Ctrl/Cmd + S', action: 'Save current file' },
  { keys: 'Ctrl/Cmd + /', action: 'Toggle comment' },
  { keys: 'Ctrl/Cmd + Z', action: 'Undo' },
  { keys: 'Ctrl/Cmd + Shift + Z', action: 'Redo' },
  { keys: 'Ctrl/Cmd + F', action: 'Find in file' },
  { keys: 'Ctrl/Cmd + H', action: 'Find and replace' },
  { keys: 'Ctrl/Cmd + D', action: 'Select next occurrence' },
  { keys: 'Alt + Up/Down', action: 'Move line up/down' },
  { keys: 'Ctrl/Cmd + Enter', action: 'Run/compile code' },
  { keys: 'Escape', action: 'Close modal/panel' },
];

const glossaryTerms = [
  { term: 'Blockchain', definition: 'A distributed, immutable ledger that records transactions across many computers. Once data is recorded, it cannot be altered.' },
  { term: 'DApp', definition: 'Decentralized Application. An application that runs on a blockchain network rather than centralized servers.' },
  { term: 'ERC-20', definition: 'A standard interface for fungible tokens on Ethereum. Most cryptocurrencies on Ethereum follow this standard.' },
  { term: 'ERC-721', definition: 'A standard for non-fungible tokens (NFTs). Each token is unique and can represent ownership of digital or physical assets.' },
  { term: 'Gas', definition: 'A unit measuring the computational effort required to execute operations on Ethereum. Users pay gas fees in ETH.' },
  { term: 'Layer 2 (L2)', definition: 'A secondary protocol built on top of an existing blockchain to improve scalability and reduce fees. Base is an L2 on Ethereum.' },
  { term: 'Mainnet', definition: 'The main, live blockchain network where real transactions occur with real value.' },
  { term: 'MetaMask', definition: 'A popular browser extension wallet for interacting with Ethereum and EVM-compatible blockchains.' },
  { term: 'NFT', definition: 'Non-Fungible Token. A unique digital asset on the blockchain that represents ownership of items like art, music, or collectibles.' },
  { term: 'Private Key', definition: 'A secret cryptographic key that proves ownership of a wallet. Never share this—anyone with your private key controls your assets.' },
  { term: 'Solidity', definition: 'The primary programming language for writing smart contracts on Ethereum and compatible chains.' },
  { term: 'Testnet', definition: 'A blockchain network for testing where the cryptocurrency has no real value. Perfect for learning without risk.' },
  { term: 'Transaction Hash (TxHash)', definition: 'A unique identifier for a blockchain transaction. Use it to look up transaction details on a block explorer.' },
  { term: 'Wallet', definition: 'Software that stores your private keys and allows you to interact with blockchain networks. Examples: MetaMask, Coinbase Wallet.' },
  { term: 'Web3', definition: 'The vision of a decentralized internet built on blockchain technology, giving users ownership and control of their data and assets.' },
  { term: 'Wei', definition: 'The smallest denomination of ETH. 1 ETH = 1,000,000,000,000,000,000 wei (10^18 wei).' },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Header */}
      <div className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-primary">
              Zero to Crypto Dev
            </Link>
            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Log in
              </Link>
            </div>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4">Help & FAQ</h1>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about learning Web3 development with Zero to Crypto Dev
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-12">
          {/* Getting Started Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              Getting Started
            </h2>
            <Accordion>
              {gettingStartedItems.map((item, index) => (
                <AccordionItem key={index} title={item.title} defaultOpen={index === 0}>
                  {item.content}
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* FAQ Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Frequently Asked Questions
            </h2>
            <Accordion>
              {faqItems.map((item, index) => (
                <AccordionItem key={index} title={item.title}>
                  {item.content}
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* Keyboard Shortcuts Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </span>
              Keyboard Shortcuts
            </h2>
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Shortcut</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {keyboardShortcuts.map((shortcut, index) => (
                    <tr key={index} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border border-border">
                          {shortcut.keys}
                        </kbd>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{shortcut.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Glossary Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </span>
              Web3 Glossary
            </h2>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="grid gap-4">
                {glossaryTerms.map((item, index) => (
                  <div key={index} className="border-b border-border last:border-b-0 pb-4 last:pb-0">
                    <dt className="font-semibold text-primary">{item.term}</dt>
                    <dd className="mt-1 text-muted-foreground">{item.definition}</dd>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Contact/Support Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              Contact & Support
            </h2>
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    AI Tutor
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    For immediate help with your code, use the AI Tutor in the editor. It knows your project context and can explain concepts in detail.
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email Support
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    For account issues or general inquiries, reach out to us at{' '}
                    <a href="mailto:support@zerotocryptodev.com" className="text-primary hover:underline">
                      support@zerotocryptodev.com
                    </a>
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Community
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Join our Discord community to connect with other learners, share projects, and get help from the community.
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Bug Reports
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Found a bug? Report it on our{' '}
                    <a href="https://github.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                      GitHub repository
                    </a>{' '}
                    or email us with details.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Video Tutorials CTA */}
          <section className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl p-6 border border-primary/20">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-center sm:text-left flex-1">
                <h3 className="font-semibold text-lg">Learn with Video Tutorials</h3>
                <p className="text-muted-foreground text-sm">
                  Watch curated video tutorials covering Solidity basics, smart contract deployment, and advanced patterns.
                </p>
              </div>
              <Link
                href="/tutorials"
                className="px-6 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all whitespace-nowrap"
              >
                Browse Tutorials
              </Link>
            </div>
          </section>

          {/* Back to Dashboard CTA */}
          <div className="text-center pt-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground text-sm">
          <div className="flex justify-center gap-6 mb-4">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
            <Link href="/leaderboard" className="hover:text-primary transition-colors">Leaderboard</Link>
            <Link href="/showcase" className="hover:text-primary transition-colors">Showcase</Link>
            <Link href="/tutorials" className="hover:text-primary transition-colors">Tutorials</Link>
            <Link href="/help" className="hover:text-primary transition-colors font-medium text-primary">Help</Link>
            <Link href="/changelog" className="hover:text-primary transition-colors">Changelog</Link>
          </div>
          <p>© 2026 Zero to Crypto Dev. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
