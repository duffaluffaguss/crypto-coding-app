'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ExpertBadge } from './ExpertBadge';
import { getReputationLevel, getReputationColor } from '@/types';
import type { ExpertLevel } from '@/lib/experts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ReplyCardProps {
  reply: {
    id: string;
    content: string;
    upvotes: number;
    is_accepted: boolean;
    created_at: string;
    author_id: string;
    profiles: {
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  };
  // Expert info
  expertLevel?: ExpertLevel | null;
  completedThisLesson?: boolean;
  deployedProjectsCount?: number;
  reputationScore?: number;
  topicName?: string;
  // Interactions
  isQuestionAuthor?: boolean;
  isReplyAuthor?: boolean;
  onUpvote?: (replyId: string) => void;
  onAcceptAnswer?: (replyId: string) => void;
  onDelete?: (replyId: string) => void;
  isUpvoting?: boolean;
}

export function ReplyCard({
  reply,
  expertLevel,
  completedThisLesson = false,
  deployedProjectsCount = 0,
  reputationScore = 0,
  topicName,
  isQuestionAuthor = false,
  isReplyAuthor = false,
  onUpvote,
  onAcceptAnswer,
  onDelete,
  isUpvoting = false,
}: ReplyCardProps) {
  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const repLevel = reputationScore ? getReputationLevel(reputationScore) : null;
  const repColor = repLevel ? getReputationColor(repLevel) : '';

  // Highlight expert replies
  const isExpert = expertLevel && expertLevel !== 'verified';
  const highlightClass = isExpert
    ? 'border-l-2 border-l-purple-500/50 bg-purple-500/5'
    : '';

  return (
    <Card className={`${highlightClass} ${reply.is_accepted ? 'border-green-500/50 bg-green-500/5' : ''}`}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Upvotes */}
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onUpvote?.(reply.id)}
              disabled={isUpvoting}
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
              {reply.upvotes}
            </span>
            {reply.is_accepted && (
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Author Info */}
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={reply.profiles?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(reply.profiles?.display_name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="font-medium text-sm">
                  {reply.profiles?.display_name || 'Anonymous'}
                </span>
                
                {/* Badges row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Expert Badge */}
                  <ExpertBadge
                    level={expertLevel}
                    completedThisLesson={completedThisLesson}
                    deployedProjectsCount={deployedProjectsCount}
                    reputationScore={reputationScore}
                    topicName={topicName}
                  />

                  {/* Reputation Level Badge */}
                  {repLevel && !expertLevel && (
                    <Badge variant="outline" className={`text-xs ${repColor}`}>
                      {repLevel.charAt(0).toUpperCase() + repLevel.slice(1)}
                    </Badge>
                  )}

                  {/* Accepted Answer Badge */}
                  {reply.is_accepted && (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/30 gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Accepted
                    </Badge>
                  )}
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                </span>

                {/* Actions Menu */}
                {(isQuestionAuthor || isReplyAuthor) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isQuestionAuthor && !reply.is_accepted && (
                        <DropdownMenuItem onClick={() => onAcceptAnswer?.(reply.id)}>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Accept Answer
                        </DropdownMenuItem>
                      )}
                      {isReplyAuthor && (
                        <DropdownMenuItem
                          onClick={() => onDelete?.(reply.id)}
                          className="text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Reply Content */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
            </div>

            {/* Expert stats for highly qualified responders */}
            {isExpert && deployedProjectsCount > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-4 text-xs text-muted-foreground">
                <span>📦 {deployedProjectsCount} projects deployed</span>
                {reputationScore > 0 && (
                  <span>⭐ {reputationScore.toLocaleString()} reputation</span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
