'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TutorialCard } from '@/components/tutorials/TutorialCard';
import {
  getTutorialById,
  getRelatedTutorials,
  categoryLabels,
  categoryColors,
  difficultyColors,
  Tutorial,
} from '@/lib/tutorials';

export default function TutorialDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [relatedTutorials, setRelatedTutorials] = useState<Tutorial[]>([]);
  const [isWatched, setIsWatched] = useState(false);

  useEffect(() => {
    const foundTutorial = getTutorialById(id);
    if (foundTutorial) {
      setTutorial(foundTutorial);
      setRelatedTutorials(getRelatedTutorials(id, 3));
      
      // Check if watched
      const watched = localStorage.getItem('watchedTutorials');
      const watchedList: string[] = watched ? JSON.parse(watched) : [];
      setIsWatched(watchedList.includes(id));
    }
  }, [id]);

  const handleMarkAsWatched = () => {
    const watched = localStorage.getItem('watchedTutorials');
    const watchedList: string[] = watched ? JSON.parse(watched) : [];
    
    if (isWatched) {
      // Remove from watched
      const updated = watchedList.filter((t) => t !== id);
      localStorage.setItem('watchedTutorials', JSON.stringify(updated));
      setIsWatched(false);
    } else {
      // Add to watched
      watchedList.push(id);
      localStorage.setItem('watchedTutorials', JSON.stringify(watchedList));
      setIsWatched(true);
    }
  };

  if (!tutorial) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-secondary">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Tutorial Not Found</h1>
            <p className="text-muted-foreground mb-6">The tutorial you&apos;re looking for doesn&apos;t exist.</p>
            <Link href="/tutorials">
              <Button>Browse All Tutorials</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

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
                href="/tutorials"
                className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                All Tutorials
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/tutorials" className="hover:text-primary transition-colors">
            Tutorials
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-foreground">{tutorial.title}</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
              <iframe
                src={`https://www.youtube.com/embed/${tutorial.youtubeId}`}
                title={tutorial.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            {/* Video Info */}
            <div className="space-y-4">
              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${categoryColors[tutorial.category]}`}>
                  {categoryLabels[tutorial.category]}
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full capitalize ${difficultyColors[tutorial.difficulty]}`}>
                  {tutorial.difficulty}
                </span>
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-muted text-muted-foreground">
                  {tutorial.duration}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold">{tutorial.title}</h1>

              {/* Description */}
              <p className="text-lg text-muted-foreground leading-relaxed">
                {tutorial.description}
              </p>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4">
                <Button
                  onClick={handleMarkAsWatched}
                  variant={isWatched ? 'default' : 'outline'}
                  className="gap-2"
                >
                  {isWatched ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Watched
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Mark as Watched
                    </>
                  )}
                </Button>
                <a
                  href={`https://www.youtube.com/watch?v=${tutorial.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    Watch on YouTube
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Related Tutorials */}
            {relatedTutorials.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Related Tutorials
                  </h2>
                  <div className="space-y-4">
                    {relatedTutorials.map((related) => (
                      <Link
                        key={related.id}
                        href={`/tutorials/${related.id}`}
                        className="flex gap-3 group"
                      >
                        <div className="w-28 h-16 rounded overflow-hidden flex-shrink-0 bg-muted">
                          <img
                            src={`https://img.youtube.com/vi/${related.youtubeId}/mqdefault.jpg`}
                            alt={related.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                            {related.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {related.duration}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Links */}
            <Card>
              <CardContent className="p-4">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Links
                </h2>
                <div className="space-y-2">
                  <Link
                    href="/tutorials"
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    All Tutorials
                  </Link>
                  <Link
                    href="/help"
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Help & FAQ
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Dashboard
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground text-sm">
          <div className="flex justify-center gap-6 mb-4">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
            <Link href="/tutorials" className="hover:text-primary transition-colors font-medium text-primary">Tutorials</Link>
            <Link href="/help" className="hover:text-primary transition-colors">Help</Link>
          </div>
          <p>© 2026 Zero to Crypto Dev. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
