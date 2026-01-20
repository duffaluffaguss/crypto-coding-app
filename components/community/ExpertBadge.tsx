'use client';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CheckCircle2, GraduationCap, Star, BookOpen, Award } from 'lucide-react';
import type { ExpertLevel, ExpertBadgeInfo } from '@/lib/experts';

interface ExpertBadgeProps {
  level: ExpertLevel | null;
  completedThisLesson?: boolean;
  deployedProjectsCount?: number;
  reputationScore?: number;
  showDetails?: boolean;
  topicName?: string;
}

const LEVEL_ICONS = {
  master: GraduationCap,
  expert: Star,
  intermediate: BookOpen,
  verified: CheckCircle2,
};

const LEVEL_COLORS = {
  master: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/20',
  expert: 'bg-purple-500/10 text-purple-500 border-purple-500/30 hover:bg-purple-500/20',
  intermediate: 'bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500/20',
  verified: 'bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/20',
};

const LEVEL_LABELS = {
  master: 'Master',
  expert: 'Expert',
  intermediate: 'Learner',
  verified: 'Verified',
};

export function ExpertBadge({
  level,
  completedThisLesson = false,
  deployedProjectsCount = 0,
  reputationScore = 0,
  showDetails = true,
  topicName,
}: ExpertBadgeProps) {
  // Show nothing if no expertise
  if (!level && !completedThisLesson) return null;

  // If only completed this lesson (not an expert level)
  if (completedThisLesson && !level) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="gap-1 cursor-help bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/20"
            >
              <CheckCircle2 className="h-3 w-3" />
              <span className="text-xs">Completed this lesson</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">✓ Verified Completer</p>
              <p className="text-xs text-muted-foreground">
                This user has completed the lesson being discussed
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const Icon = level ? LEVEL_ICONS[level] : CheckCircle2;
  const color = level ? LEVEL_COLORS[level] : LEVEL_COLORS.verified;
  const label = level ? LEVEL_LABELS[level] : 'Verified';
  const fullLabel = topicName ? `${topicName} ${label}` : label;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`gap-1 cursor-help ${color}`}>
            <Icon className="h-3 w-3" />
            <span className="text-xs">{fullLabel}</span>
          </Badge>
        </TooltipTrigger>
        {showDetails && (
          <TooltipContent className="max-w-xs">
            <div className="space-y-2 py-1">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="font-medium">
                  {level === 'master' && '🎓 '}
                  {level === 'expert' && '⭐ '}
                  {topicName} {label}
                </span>
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                {completedThisLesson && (
                  <p className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Completed this lesson
                  </p>
                )}
                
                {deployedProjectsCount > 0 && (
                  <p className="flex items-center gap-1">
                    <Award className="h-3 w-3 text-blue-500" />
                    {deployedProjectsCount} project{deployedProjectsCount !== 1 ? 's' : ''} deployed
                  </p>
                )}
                
                {reputationScore > 0 && (
                  <p className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    {reputationScore.toLocaleString()} reputation
                  </p>
                )}
              </div>
              
              <p className="text-xs border-t border-border pt-2 text-muted-foreground">
                {level === 'master' && 'Completed all lessons and deployed projects'}
                {level === 'expert' && 'Completed 80%+ of topic lessons'}
                {level === 'intermediate' && 'Completed 50%+ of topic lessons'}
                {level === 'verified' && 'Has started learning this topic'}
              </p>
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Compact version for member lists
 */
export function ExpertBadgeCompact({ level, topicName }: { level: ExpertLevel | null; topicName?: string }) {
  if (!level) return null;
  
  const Icon = LEVEL_ICONS[level];
  const color = LEVEL_COLORS[level];
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full ${color} cursor-help`}>
            <Icon className="h-3 w-3" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <span className="text-xs">
            {topicName} {LEVEL_LABELS[level]}
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Multiple badges for showing expertise across topics
 */
interface MultiExpertBadgesProps {
  expertises: Array<{
    projectType: string;
    level: ExpertLevel;
    topicName: string;
  }>;
  maxVisible?: number;
}

export function MultiExpertBadges({ expertises, maxVisible = 2 }: MultiExpertBadgesProps) {
  if (expertises.length === 0) return null;
  
  // Sort by level (master > expert > intermediate > verified)
  const sorted = [...expertises].sort((a, b) => {
    const order: Record<ExpertLevel, number> = { master: 4, expert: 3, intermediate: 2, verified: 1 };
    return order[b.level] - order[a.level];
  });
  
  const visible = sorted.slice(0, maxVisible);
  const hidden = sorted.slice(maxVisible);
  
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visible.map((exp) => (
        <ExpertBadgeCompact
          key={exp.projectType}
          level={exp.level}
          topicName={exp.topicName}
        />
      ))}
      {hidden.length > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground cursor-help">
                +{hidden.length}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                {hidden.map((exp) => (
                  <p key={exp.projectType} className="text-xs">
                    {exp.topicName} {LEVEL_LABELS[exp.level]}
                  </p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
