'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { TutorialCard } from '@/components/tutorials/TutorialCard';
import { tutorials, categoryLabels, TutorialCategory } from '@/lib/tutorials';
import { Button } from '@/components/ui/button';

const categories: (TutorialCategory | 'all')[] = ['all', 'getting-started', 'solidity-basics', 'deploying', 'advanced'];

export default function TutorialsPage() {
  const [selectedCategory, setSelectedCategory] = useState<TutorialCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [watchedTutorials, setWatchedTutorials] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('watchedTutorials');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const filteredTutorials = useMemo(() => {
    let result = tutorials;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter((t) => t.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((t) => 
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.difficulty.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [selectedCategory, searchQuery]);

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
                href="/help"
                className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Help
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4">Video Tutorials</h1>
          <p className="text-lg text-muted-foreground">
            Learn Web3 development with curated video tutorials. From basics to advanced smart contract patterns.
          </p>
        </div>

        {/* Progress Stats */}
        <div className="max-w-md mx-auto mb-8">
          <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="font-semibold">{watchedTutorials.length} / {tutorials.length} watched</p>
              </div>
            </div>
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(watchedTutorials.length / tutorials.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="relative">
            <svg 
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search tutorials by title, topic, or difficulty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Found {filteredTutorials.length} tutorial{filteredTutorials.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </p>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category === 'all' ? 'All Tutorials' : categoryLabels[category as TutorialCategory]}
            </Button>
          ))}
        </div>

        {/* Tutorials Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTutorials.map((tutorial) => (
            <TutorialCard
              key={tutorial.id}
              tutorial={tutorial}
              isWatched={watchedTutorials.includes(tutorial.id)}
            />
          ))}
        </div>

        {filteredTutorials.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No tutorials found</h3>
            <p className="text-muted-foreground">Try selecting a different category.</p>
          </div>
        )}

        {/* Back Links */}
        <div className="text-center pt-12">
          <div className="flex justify-center gap-4">
            <Link href="/help">
              <Button variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Help & FAQ
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Button>
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
            <Link href="/tutorials" className="hover:text-primary transition-colors font-medium text-primary">Tutorials</Link>
            <Link href="/help" className="hover:text-primary transition-colors">Help</Link>
          </div>
          <p>© 2026 Zero to Crypto Dev. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
