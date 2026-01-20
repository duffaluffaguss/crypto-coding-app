'use client';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ThumbsUp, GraduationCap, Clock, Filter } from 'lucide-react';
import type { ReplySortOption } from '@/lib/experts';

interface ReplyFiltersProps {
  sortBy: ReplySortOption;
  onSortChange: (sort: ReplySortOption) => void;
  showExpertsOnly: boolean;
  onExpertsOnlyChange: (value: boolean) => void;
  totalReplies: number;
  expertRepliesCount: number;
}

export function ReplyFilters({
  sortBy,
  onSortChange,
  showExpertsOnly,
  onExpertsOnlyChange,
  totalReplies,
  expertRepliesCount,
}: ReplyFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
      {/* Sort Controls */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Sort by:</span>
        
        <div className="flex gap-1">
          <Button
            variant={sortBy === 'votes' ? 'secondary' : 'ghost'}
            size="sm"
            className="gap-1"
            onClick={() => onSortChange('votes')}
          >
            <ThumbsUp className="h-3 w-3" />
            Votes
          </Button>
          <Button
            variant={sortBy === 'experts' ? 'secondary' : 'ghost'}
            size="sm"
            className="gap-1"
            onClick={() => onSortChange('experts')}
          >
            <GraduationCap className="h-3 w-3" />
            Experts
          </Button>
          <Button
            variant={sortBy === 'newest' ? 'secondary' : 'ghost'}
            size="sm"
            className="gap-1"
            onClick={() => onSortChange('newest')}
          >
            <Clock className="h-3 w-3" />
            Newest
          </Button>
        </div>
      </div>

      {/* Experts Only Toggle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center space-x-2">
          <Switch
            id="experts-only"
            checked={showExpertsOnly}
            onCheckedChange={onExpertsOnlyChange}
          />
          <Label
            htmlFor="experts-only"
            className="text-sm cursor-pointer flex items-center gap-2"
          >
            <GraduationCap className="h-4 w-4 text-purple-500" />
            Show expert answers only
          </Label>
        </div>
        
        {showExpertsOnly && expertRepliesCount < totalReplies && (
          <span className="text-xs text-muted-foreground">
            ({expertRepliesCount} of {totalReplies})
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Compact filter for mobile or smaller spaces
 */
export function ReplyFiltersCompact({
  sortBy,
  onSortChange,
  showExpertsOnly,
  onExpertsOnlyChange,
}: Omit<ReplyFiltersProps, 'totalReplies' | 'expertRepliesCount'>) {
  return (
    <div className="flex items-center gap-3">
      <Select value={sortBy} onValueChange={(v) => onSortChange(v as ReplySortOption)}>
        <SelectTrigger className="w-[140px] h-8">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="votes">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-3 w-3" />
              Top Votes
            </div>
          </SelectItem>
          <SelectItem value="experts">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-3 w-3" />
              Experts First
            </div>
          </SelectItem>
          <SelectItem value="newest">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Newest
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant={showExpertsOnly ? 'secondary' : 'outline'}
        size="sm"
        className="gap-1"
        onClick={() => onExpertsOnlyChange(!showExpertsOnly)}
      >
        <GraduationCap className="h-3 w-3" />
        Experts
      </Button>
    </div>
  );
}
