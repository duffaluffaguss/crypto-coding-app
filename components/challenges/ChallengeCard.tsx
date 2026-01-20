'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  points: number;
  challenge_date: string;
  category: string;
}

interface ChallengeCardProps {
  challenge: Challenge;
  isCompleted?: boolean;
  isToday?: boolean;
  pointsEarned?: number;
}

const difficultyColors = {
  beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const difficultyLabels = {
  beginner: '🌱 Beginner',
  intermediate: '🔥 Intermediate',
  advanced: '⚡ Advanced',
};

export function ChallengeCard({ challenge, isCompleted, isToday, pointsEarned }: ChallengeCardProps) {
  const formattedDate = new Date(challenge.challenge_date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link href={`/challenges/${challenge.id}`}>
      <Card 
        className={`h-full transition-all cursor-pointer hover:border-primary/50 hover:shadow-md ${
          isToday ? 'border-primary ring-2 ring-primary/20' : ''
        } ${isCompleted ? 'bg-green-500/5' : ''}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {isToday && (
                  <Badge variant="default" className="bg-primary text-primary-foreground text-xs">
                    Today
                  </Badge>
                )}
                {isCompleted && (
                  <Badge variant="outline" className="border-green-500 text-green-500 text-xs">
                    ✓ Completed
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg leading-tight">{challenge.title}</CardTitle>
              <CardDescription className="text-xs mt-1">{formattedDate}</CardDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`px-2 py-0.5 text-xs rounded-full border ${difficultyColors[challenge.difficulty]}`}>
                {difficultyLabels[challenge.difficulty]}
              </span>
              <span className="text-sm font-semibold text-primary">
                {isCompleted && pointsEarned ? pointsEarned : challenge.points} pts
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {challenge.description}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground capitalize">
              📝 {challenge.category}
            </span>
            {isCompleted ? (
              <span className="text-xs text-green-500 font-medium">View Solution →</span>
            ) : (
              <span className="text-xs text-primary font-medium">Start Challenge →</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
