'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { VideoPlayer } from './VideoPlayer';
import { cn } from '@/lib/utils';

interface VideoTutorial {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  video_id?: string;
  video_provider?: 'youtube' | 'vimeo' | 'custom';
  thumbnail_url?: string;
  duration_display?: string;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  is_featured?: boolean;
  view_count?: number;
}

interface VideoTutorialCardProps {
  tutorial: VideoTutorial;
  isWatched?: boolean;
  expandable?: boolean;
  className?: string;
}

const categoryColors: Record<string, string> = {
  'getting-started': 'bg-green-500/10 text-green-500',
  'solidity-basics': 'bg-blue-500/10 text-blue-500',
  'deploying': 'bg-purple-500/10 text-purple-500',
  'advanced': 'bg-orange-500/10 text-orange-500',
  'general': 'bg-gray-500/10 text-gray-500',
};

const categoryLabels: Record<string, string> = {
  'getting-started': 'Getting Started',
  'solidity-basics': 'Solidity Basics',
  'deploying': 'Deploying',
  'advanced': 'Advanced',
  'general': 'General',
};

const difficultyColors: Record<string, string> = {
  beginner: 'bg-emerald-500/10 text-emerald-500',
  intermediate: 'bg-amber-500/10 text-amber-500',
  advanced: 'bg-red-500/10 text-red-500',
};

export function VideoTutorialCard({ tutorial, isWatched, expandable = true, className }: VideoTutorialCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const videoId = tutorial.video_id || extractVideoId(tutorial.video_url);
  const provider = tutorial.video_provider || 'youtube';
  const thumbnailUrl = tutorial.thumbnail_url || getThumbnailUrl(videoId, provider);

  const handleCardClick = () => {
    if (expandable) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <Card className={cn(
      'group overflow-hidden transition-all duration-300',
      expandable && 'hover:shadow-lg hover:border-primary/50 cursor-pointer',
      isExpanded && 'ring-2 ring-primary',
      className
    )}>
      {/* Expanded video view */}
      {isExpanded && (
        <div className="relative">
          <VideoPlayer
            videoUrl={tutorial.video_url}
            videoId={videoId}
            provider={provider}
            title={tutorial.title}
            autoplay
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
            }}
            className="absolute top-2 right-2 w-8 h-8 bg-black/70 hover:bg-black rounded-full flex items-center justify-center text-white z-10"
            aria-label="Close video"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Thumbnail view */}
      {!isExpanded && (
        <div 
          className="relative aspect-video bg-muted overflow-hidden"
          onClick={handleCardClick}
        >
          <img
            src={thumbnailUrl}
            alt={tutorial.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Duration Badge */}
          {tutorial.duration_display && (
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs font-medium rounded">
              {tutorial.duration_display}
            </div>
          )}
          
          {/* Featured Badge */}
          {tutorial.is_featured && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded">
              Featured
            </div>
          )}
          
          {/* Watched Indicator */}
          {isWatched && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          
          {/* Play Icon Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-primary-foreground ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      <CardContent className="p-4" onClick={expandable ? handleCardClick : undefined}>
        {/* Category and Difficulty */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {tutorial.category && (
            <span className={cn(
              'px-2 py-0.5 text-xs font-medium rounded-full',
              categoryColors[tutorial.category] || categoryColors.general
            )}>
              {categoryLabels[tutorial.category] || tutorial.category}
            </span>
          )}
          {tutorial.difficulty && (
            <span className={cn(
              'px-2 py-0.5 text-xs font-medium rounded-full capitalize',
              difficultyColors[tutorial.difficulty]
            )}>
              {tutorial.difficulty}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
          {tutorial.title}
        </h3>

        {/* Description */}
        {tutorial.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {tutorial.description}
          </p>
        )}

        {/* View count */}
        {tutorial.view_count !== undefined && tutorial.view_count > 0 && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{formatViewCount(tutorial.view_count)} views</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper functions
function extractVideoId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\/]+)/,
    /vimeo\.com\/(?:video\/)?(\d+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return '';
}

function getThumbnailUrl(videoId: string, provider: string): string {
  if (!videoId) return '';
  if (provider === 'youtube') {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  } else if (provider === 'vimeo') {
    return `https://vumbnail.com/${videoId}.jpg`;
  }
  return '';
}

function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}
