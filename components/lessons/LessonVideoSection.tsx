'use client';

import { useState, useMemo } from 'react';
import { VideoPlayerInline } from '@/components/learn/VideoPlayer';
import { tutorials, Tutorial } from '@/lib/tutorials';
import { cn } from '@/lib/utils';

interface LessonVideoSectionProps {
  lessonTitle?: string;
  lessonOrder?: number;
  projectType?: string;
  className?: string;
}

// Map lesson topics to tutorial categories/keywords for matching
const topicMappings: Record<string, string[]> = {
  'introduction': ['intro', 'web3', 'getting-started'],
  'variables': ['fundamentals', 'solidity', 'basics'],
  'functions': ['fundamentals', 'solidity', 'basics'],
  'contract': ['structure', 'smart-contract'],
  'deploy': ['deploy', 'deploying', 'hardhat'],
  'mapping': ['mappings', 'structs'],
  'token': ['erc-20', 'token'],
  'nft': ['nft', 'erc-721'],
  'defi': ['defi', 'advanced'],
};

export function LessonVideoSection({ 
  lessonTitle, 
  lessonOrder, 
  projectType,
  className 
}: LessonVideoSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Find related tutorials based on lesson title/order
  const relatedTutorials = useMemo(() => {
    if (!lessonTitle) return [];
    
    const titleLower = lessonTitle.toLowerCase();
    
    // Find matching tutorials based on topic keywords
    const matches = tutorials.filter((tutorial) => {
      const tutorialText = `${tutorial.title} ${tutorial.description}`.toLowerCase();
      const tutorialCategory = tutorial.category.toLowerCase();
      
      // Check direct title matches
      if (tutorialText.includes(titleLower) || titleLower.includes(tutorial.title.toLowerCase().split(' ')[0])) {
        return true;
      }
      
      // Check topic mappings
      for (const [topic, keywords] of Object.entries(topicMappings)) {
        if (titleLower.includes(topic)) {
          if (keywords.some(k => tutorialText.includes(k) || tutorialCategory.includes(k))) {
            return true;
          }
        }
      }
      
      return false;
    });

    // Return top 2 matches
    return matches.slice(0, 2);
  }, [lessonTitle]);

  // Don't render if no related videos
  if (relatedTutorials.length === 0) return null;

  return (
    <div className={cn('border-t border-border pt-4 mt-4', className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left group"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              Related Videos
            </h4>
            <p className="text-xs text-muted-foreground">
              {relatedTutorials.length} tutorial{relatedTutorials.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>
        <svg
          className={cn(
            'w-5 h-5 text-muted-foreground transition-transform',
            isExpanded && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {relatedTutorials.map((tutorial) => (
            <VideoPlayerInline
              key={tutorial.id}
              videoUrl={`https://www.youtube.com/watch?v=${tutorial.youtubeId}`}
              videoId={tutorial.youtubeId}
              provider="youtube"
              title={tutorial.title}
              duration={tutorial.duration}
            />
          ))}
          <a
            href="/tutorials"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
          >
            View all tutorials
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}

// Compact version for small spaces
export function LessonVideoButton({ lessonTitle }: { lessonTitle?: string }) {
  const relatedTutorials = useMemo(() => {
    if (!lessonTitle) return [];
    const titleLower = lessonTitle.toLowerCase();
    return tutorials.filter((t) => {
      const tutorialText = `${t.title} ${t.description}`.toLowerCase();
      return tutorialText.includes(titleLower.split(' ')[0]);
    }).slice(0, 1);
  }, [lessonTitle]);

  if (relatedTutorials.length === 0) return null;

  const tutorial = relatedTutorials[0];

  return (
    <a
      href={`/tutorials/${tutorial.id}`}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium rounded-full transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Watch Tutorial
    </a>
  );
}
