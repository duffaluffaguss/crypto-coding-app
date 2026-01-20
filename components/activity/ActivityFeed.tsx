'use client';

import { useState, useCallback } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Activity, ActivityType } from '@/lib/activity';
import { ActivityItem, ActivityItemSkeleton } from './ActivityItem';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, RefreshCw, Activity as ActivityIcon } from 'lucide-react';

const ACTIVITY_TYPES: { value: ActivityType | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'All Activity', icon: '📋' },
  { value: 'project_created', label: 'Projects Created', icon: '💡' },
  { value: 'lesson_completed', label: 'Lessons Completed', icon: '📚' },
  { value: 'contract_deployed', label: 'Contracts Deployed', icon: '🚀' },
  { value: 'achievement_earned', label: 'Achievements Earned', icon: '🏆' },
  { value: 'joined_showcase', label: 'Showcase Posts', icon: '🌟' },
];

const PAGE_SIZE = 20;

interface ActivityFeedProps {
  userId?: string;
  showFilters?: boolean;
  initialType?: ActivityType | 'all';
}

export function ActivityFeed({ userId, showFilters = true, initialType = 'all' }: ActivityFeedProps) {
  const [selectedType, setSelectedType] = useState<ActivityType | 'all'>(initialType);
  const supabase = createClient();

  const fetchActivities = useCallback(
    async ({ pageParam = 0 }) => {
      const typeFilter = selectedType === 'all' ? null : selectedType;

      const { data, error } = await supabase.rpc('get_activity_feed', {
        p_limit: PAGE_SIZE,
        p_offset: pageParam,
        p_type: typeFilter,
        p_user_id: userId || null,
      });

      if (error) throw error;

      return {
        activities: (data || []) as Activity[],
        nextOffset: data && data.length === PAGE_SIZE ? pageParam + PAGE_SIZE : undefined,
      };
    },
    [supabase, selectedType, userId]
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['activities', selectedType, userId],
    queryFn: fetchActivities,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const allActivities = data?.pages.flatMap((page) => page.activities) || [];

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      {showFilters && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Select
            value={selectedType}
            onValueChange={(value) => setSelectedType(value as ActivityType | 'all')}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <span className="flex items-center gap-2">
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            {isRefetching ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      )}

      {/* Activity list */}
      <div className="space-y-3">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, i) => (
            <ActivityItemSkeleton key={i} />
          ))
        ) : isError ? (
          // Error state
          <div className="text-center py-12">
            <p className="text-muted-foreground">Failed to load activities</p>
            <Button variant="ghost" onClick={() => refetch()} className="mt-2">
              Try again
            </Button>
          </div>
        ) : allActivities.length === 0 ? (
          // Empty state
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <ActivityIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
            <p className="text-muted-foreground">
              {userId
                ? 'Complete lessons, create projects, or deploy contracts to see activity here.'
                : 'Be the first to make some noise! Complete a lesson or create a project.'}
            </p>
          </div>
        ) : (
          // Activity items
          <>
            {allActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} showUser={!userId} />
            ))}

            {/* Load more button */}
            {hasNextPage && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    'Load more'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
