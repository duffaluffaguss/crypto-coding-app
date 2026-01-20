'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LessonHelpButton } from '@/components/lessons/LessonHelpButton';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { getTutorialById, getRelatedTutorials, categoryLabels, difficultyColors } from '@/lib/tutorials';
import { createClient } from '@/lib/supabase/client';
import type { Tutorial } from '@/lib/tutorials';

export default function TutorialPage() {
  const params = useParams();
  const router = useRouter();
  const tutorialId = params.id as string;
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [relatedTutorials, setRelatedTutorials] = useState<Tutorial[]>([]);
  const [isWatched, setIsWatched] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (tutorialId) {
      loadTutorial();
      checkUserStatus();
    }
  }, [tutorialId]);

  const loadTutorial = async () => {
    try {
      const tutorialData = getTutorialById(tutorialId);
      if (!tutorialData) {
        router.push('/tutorials');
        return;
      }

      setTutorial(tutorialData);
      setRelatedTutorials(getRelatedTutorials(tutorialId));
      
      // Check if tutorial is watched from localStorage
      const watchedTutorials = typeof window !== 'undefined' 
        ? JSON.parse(localStorage.getItem('watchedTutorials') || '[]')
        : [];
      setIsWatched(watchedTutorials.includes(tutorialId));
    } catch (error) {
      console.error('Failed to load tutorial:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);
    
    if (!user) return;

    // Check if bookmarked
    const { data } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_type', 'lesson')
      .eq('item_id', tutorialId)
      .single();

    setIsBookmarked(!!data);
  };

  const markAsWatched = () => {
    if (typeof window === 'undefined') return;
    
    const watchedTutorials = JSON.parse(localStorage.getItem('watchedTutorials') || '[]');
    if (!watchedTutorials.includes(tutorialId)) {
      watchedTutorials.push(tutorialId);
      localStorage.setItem('watchedTutorials', JSON.stringify(watchedTutorials));
      setIsWatched(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="aspect-video bg-muted rounded-lg mb-6" />
              <div className="h-8 bg-muted rounded mb-4" />
              <div className="h-4 bg-muted rounded mb-2" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Tutorial Not Found</h1>
            <Link href="/tutorials">
              <Button>Back to Tutorials</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const youtubeUrl = `https://www.youtube.com/watch?v=${tutorial.youtubeId}`;
  const embedUrl = `https://www.youtube.com/embed/${tutorial.youtubeId}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Header */}
      <div className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex justify-between items-center">
            <Link href="/tutorials" className="text-xl font-bold text-primary">
              ← Tutorials
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

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Video Player */}
          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
            <iframe
              src={embedUrl}
              title={tutorial.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={markAsWatched}
            />
          </div>

          {/* Tutorial Info */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content */}
            <div className="flex-1">
              {/* Title and Meta */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full bg-primary/10 text-primary`}>
                    {categoryLabels[tutorial.category]}
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full capitalize ${difficultyColors[tutorial.difficulty]}`}>
                    {tutorial.difficulty}
                  </span>
                  <span className="text-sm text-muted-foreground">{tutorial.duration}</span>
                  {isWatched && (
                    <div className="flex items-center gap-1 text-sm text-green-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Watched
                    </div>
                  )}
                </div>

                <h1 className="text-3xl font-bold mb-4">{tutorial.title}</h1>
                <p className="text-lg text-muted-foreground mb-6">{tutorial.description}</p>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136C4.495 20.455 12 20.455 12 20.455s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      Watch on YouTube
                    </a>
                  </Button>

                  <LessonHelpButton 
                    lessonId={tutorial.id} 
                    tutorialId={tutorial.id}
                    variant="outline"
                  />

                  {isLoggedIn && (
                    <BookmarkButton
                      itemType="lesson"
                      itemId={tutorial.id}
                      initialBookmarked={isBookmarked}
                      isLoggedIn={isLoggedIn}
                      variant="outline"
                      onToggle={setIsBookmarked}
                    />
                  )}
                </div>
              </div>

              {/* Tutorial Content/Transcript could go here */}
            </div>

            {/* Sidebar */}
            <div className="lg:w-80">
              {/* Related Tutorials */}
              {relatedTutorials.length > 0 && (
                <Card className="mb-6">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4">Related Tutorials</h3>
                    <div className="space-y-3">
                      {relatedTutorials.map((related) => (
                        <Link 
                          key={related.id} 
                          href={`/tutorials/${related.id}`}
                          className="block p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="flex gap-3">
                            <img
                              src={`https://img.youtube.com/vi/${related.youtubeId}/mqdefault.jpg`}
                              alt={related.title}
                              className="w-16 h-12 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium line-clamp-2 mb-1">
                                {related.title}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {related.duration}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tutorial Stats */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4">Tutorial Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span>{categoryLabels[tutorial.category]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Difficulty:</span>
                      <span className="capitalize">{tutorial.difficulty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{tutorial.duration}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}