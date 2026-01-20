'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Tutorial, categoryLabels, categoryColors, difficultyColors } from '@/lib/tutorials';

interface TutorialCardProps {
  tutorial: Tutorial;
  isWatched?: boolean;
}

export function TutorialCard({ tutorial, isWatched }: TutorialCardProps) {
  const thumbnailUrl = `https://img.youtube.com/vi/${tutorial.youtubeId}/mqdefault.jpg`;

  return (
    <Link href={`/tutorials/${tutorial.id}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/50 h-full">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted overflow-hidden">
          <img
            src={thumbnailUrl}
            alt={tutorial.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Duration Badge */}
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs font-medium rounded">
            {tutorial.duration}
          </div>
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
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-foreground ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Category and Difficulty */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${categoryColors[tutorial.category]}`}>
              {categoryLabels[tutorial.category]}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${difficultyColors[tutorial.difficulty]}`}>
              {tutorial.difficulty}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
            {tutorial.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {tutorial.description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
