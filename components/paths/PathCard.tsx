'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen, Trophy, Play, RotateCcw } from 'lucide-react';

interface PathCardProps {
  path: {
    id: string;
    name: string;
    slug: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimated_hours: number;
    lesson_count?: number;
  };
  userProgress?: {
    progress: number;
    started_at: string;
    completed_at?: string;
    current_lesson_id?: string;
  } | null;
  className?: string;
}

const difficultyColors = {
  beginner: 'bg-green-500/10 text-green-700 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-700 border-red-500/20',
} as const;

const difficultyLabels = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
} as const;

export function PathCard({ path, userProgress, className }: PathCardProps) {
  const isEnrolled = !!userProgress;
  const isCompleted = userProgress?.completed_at;
  const progress = userProgress?.progress ?? 0;

  return (
    <Card className={`h-full transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg leading-tight mb-2">{path.name}</CardTitle>
            <div className="flex items-center gap-2 mb-3">
              <Badge 
                variant="outline" 
                className={difficultyColors[path.difficulty]}
              >
                {difficultyLabels[path.difficulty]}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{path.estimated_hours}h</span>
              </div>
              {path.lesson_count && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <BookOpen className="h-3 w-3" />
                  <span>{path.lesson_count} lessons</span>
                </div>
              )}
            </div>
          </div>
          {isCompleted && (
            <Trophy className="h-5 w-5 text-yellow-500 shrink-0" />
          )}
        </div>
        <CardDescription className="line-clamp-2">
          {path.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Progress Bar */}
        {isEnrolled && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <Link href={`/paths/${path.slug}`} className="block">
          <Button 
            variant={isEnrolled ? "outline" : "default"} 
            className="w-full"
            size="sm"
          >
            {isCompleted ? (
              <>
                <Trophy className="h-4 w-4 mr-2" />
                View Certificate
              </>
            ) : isEnrolled ? (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                Continue Learning
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Learning
              </>
            )}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}