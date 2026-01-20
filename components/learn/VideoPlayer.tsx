'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  videoUrl: string;
  videoId?: string;
  provider?: 'youtube' | 'vimeo' | 'custom';
  title?: string;
  onProgress?: (seconds: number) => void;
  onComplete?: () => void;
  className?: string;
  autoplay?: boolean;
}

export function VideoPlayer({
  videoUrl,
  videoId,
  provider = 'youtube',
  title,
  onProgress,
  onComplete,
  className,
  autoplay = false,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlay, setShowOverlay] = useState(!autoplay);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Extract video ID from URL if not provided
  const extractedVideoId = videoId || extractVideoId(videoUrl, provider);

  // Generate embed URL based on provider
  const embedUrl = getEmbedUrl(extractedVideoId, provider, autoplay);

  const handlePlay = () => {
    setShowOverlay(false);
    setIsPlaying(true);
  };

  // Get thumbnail URL
  const thumbnailUrl = getThumbnailUrl(extractedVideoId, provider);

  if (!extractedVideoId) {
    return (
      <div className={cn('relative aspect-video bg-muted rounded-lg flex items-center justify-center', className)}>
        <p className="text-muted-foreground">Invalid video URL</p>
      </div>
    );
  }

  return (
    <div className={cn('relative aspect-video bg-black rounded-lg overflow-hidden group', className)}>
      {showOverlay ? (
        // Thumbnail with play button
        <button
          onClick={handlePlay}
          className="absolute inset-0 w-full h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label={`Play ${title || 'video'}`}
        >
          {/* Thumbnail */}
          <img
            src={thumbnailUrl}
            alt={title || 'Video thumbnail'}
            className="w-full h-full object-cover"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center transition-all transform hover:scale-110 shadow-xl">
              <svg className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          
          {/* Title overlay */}
          {title && (
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-semibold text-lg line-clamp-2">{title}</h3>
            </div>
          )}

          {/* Provider badge */}
          <div className="absolute top-4 right-4">
            <span className="px-2 py-1 bg-black/60 text-white text-xs font-medium rounded capitalize">
              {provider}
            </span>
          </div>
        </button>
      ) : (
        // Embedded player
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={title || 'Video player'}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      )}
    </div>
  );
}

// Helper functions
function extractVideoId(url: string, provider: 'youtube' | 'vimeo' | 'custom'): string | null {
  if (provider === 'youtube') {
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\/]+)/,
      /youtube\.com\/v\/([^&?\/]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
  } else if (provider === 'vimeo') {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (match) return match[1];
  }
  return url; // Return as-is for custom
}

function getEmbedUrl(videoId: string | null, provider: 'youtube' | 'vimeo' | 'custom', autoplay: boolean): string {
  if (!videoId) return '';
  
  const autoplayParam = autoplay ? '1' : '0';
  
  switch (provider) {
    case 'youtube':
      return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplayParam}&rel=0&modestbranding=1`;
    case 'vimeo':
      return `https://player.vimeo.com/video/${videoId}?autoplay=${autoplayParam}&byline=0&portrait=0`;
    case 'custom':
    default:
      return videoId; // Assume it's already a full embed URL
  }
}

function getThumbnailUrl(videoId: string | null, provider: 'youtube' | 'vimeo' | 'custom'): string {
  if (!videoId) return '';
  
  switch (provider) {
    case 'youtube':
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    case 'vimeo':
      // Vimeo thumbnails require API call, use placeholder
      return `https://vumbnail.com/${videoId}.jpg`;
    case 'custom':
    default:
      return ''; // No thumbnail for custom
  }
}

// Compact inline player variant
export function VideoPlayerInline({
  videoUrl,
  videoId,
  provider = 'youtube',
  title,
  duration,
  className,
}: {
  videoUrl: string;
  videoId?: string;
  provider?: 'youtube' | 'vimeo' | 'custom';
  title?: string;
  duration?: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const extractedVideoId = videoId || extractVideoId(videoUrl, provider);
  const thumbnailUrl = getThumbnailUrl(extractedVideoId, provider);

  if (expanded) {
    return (
      <div className={cn('space-y-2', className)}>
        <VideoPlayer
          videoUrl={videoUrl}
          videoId={videoId}
          provider={provider}
          title={title}
          autoplay
        />
        <button
          onClick={() => setExpanded(false)}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Close video
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setExpanded(true)}
      className={cn(
        'flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors w-full text-left',
        className
      )}
    >
      {/* Thumbnail */}
      <div className="relative w-24 h-16 rounded overflow-hidden flex-shrink-0">
        <img
          src={thumbnailUrl}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <svg className="w-4 h-4 text-primary-foreground ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        {duration && (
          <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 text-white text-[10px] font-medium rounded">
            {duration}
          </span>
        )}
      </div>
      
      {/* Title */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground line-clamp-2">{title || 'Watch Video'}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Click to expand</p>
      </div>
    </button>
  );
}
