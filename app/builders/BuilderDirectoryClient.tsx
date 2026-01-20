'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BuilderCard } from '@/components/builders/BuilderCard';
import { BuilderFilters } from '@/components/builders/BuilderFilters';
import { BuilderProfile, BuilderFilters as BuilderFiltersType, BUILDER_SORT_OPTIONS, BuilderSortOption } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { ArrowUpDown, Grid, List } from 'lucide-react';
import { toast } from 'sonner';

interface BuilderDirectoryClientProps {
  initialBuilders: BuilderProfile[];
  currentUserId?: string;
}

export function BuilderDirectoryClient({ 
  initialBuilders, 
  currentUserId 
}: BuilderDirectoryClientProps) {
  const [builders, setBuilders] = useState<BuilderProfile[]>(initialBuilders);
  const [filters, setFilters] = useState<BuilderFiltersType>({});
  const [sortBy, setSortBy] = useState<BuilderSortOption['value']>('reputation');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  // Filter and sort builders
  const filteredAndSortedBuilders = useMemo(() => {
    let filtered = builders.filter(builder => {
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matches = 
          builder.display_name?.toLowerCase().includes(search) ||
          builder.bio?.toLowerCase().includes(search) ||
          builder.interests.some(i => i.toLowerCase().includes(search));
        if (!matches) return false;
      }

      // Interests filter
      if (filters.interests && filters.interests.length > 0) {
        const hasMatchingInterest = filters.interests.some(interest =>
          builder.interests.includes(interest)
        );
        if (!hasMatchingInterest) return false;
      }

      // Skills filter
      if (filters.skills && filters.skills.length > 0) {
        const hasMatchingSkill = filters.skills.some(skill =>
          builder.skills?.includes(skill)
        );
        if (!hasMatchingSkill) return false;
      }

      // Experience level filter
      if (filters.experience_level && filters.experience_level.length > 0) {
        if (!builder.experience_level || !filters.experience_level.includes(builder.experience_level)) {
          return false;
        }
      }

      // Reputation filter
      if (filters.reputation_min && (builder.reputation_score || 0) < filters.reputation_min) {
        return false;
      }
      if (filters.reputation_max && (builder.reputation_score || 0) > filters.reputation_max) {
        return false;
      }

      // Looking for collaborators filter
      if (filters.looking_for_collaborators && !builder.looking_for_collaborators) {
        return false;
      }

      // Has projects filter
      if (filters.has_projects && (builder.projects_count || 0) === 0) {
        return false;
      }

      // Hide current user from results
      if (currentUserId && builder.id === currentUserId) {
        return false;
      }

      return true;
    });

    // Sort builders
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'reputation':
          aValue = a.reputation_score || 0;
          bValue = b.reputation_score || 0;
          break;
        case 'projects_count':
          aValue = a.projects_count || 0;
          bValue = b.projects_count || 0;
          break;
        case 'followers_count':
          aValue = a.followers_count || 0;
          bValue = b.followers_count || 0;
          break;
        case 'recent_activity':
          aValue = new Date(a.recent_activity || a.created_at).getTime();
          bValue = new Date(b.recent_activity || b.created_at).getTime();
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      if (sortDirection === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });

    return filtered;
  }, [builders, filters, sortBy, sortDirection, currentUserId]);

  const handleFiltersChange = useCallback((newFilters: BuilderFiltersType) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const handleSortChange = useCallback((value: string) => {
    const option = BUILDER_SORT_OPTIONS.find(opt => opt.value === value);
    if (option) {
      setSortBy(option.value);
      setSortDirection(option.direction);
    }
  }, []);

  const handleToggleSortDirection = useCallback(() => {
    setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
  }, []);

  const handleFollow = useCallback(async (builderId: string) => {
    if (!currentUserId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('follows')
        .insert({ 
          follower_id: currentUserId, 
          following_id: builderId 
        });

      if (error) throw error;

      // Update local state
      setBuilders(prev => prev.map(builder => 
        builder.id === builderId 
          ? { 
              ...builder, 
              is_following: true,
              followers_count: (builder.followers_count || 0) + 1
            }
          : builder
      ));

      toast.success('Now following this builder!');
    } catch (error) {
      console.error('Error following builder:', error);
      toast.error('Failed to follow builder');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, supabase]);

  const handleUnfollow = useCallback(async (builderId: string) => {
    if (!currentUserId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', builderId);

      if (error) throw error;

      // Update local state
      setBuilders(prev => prev.map(builder => 
        builder.id === builderId 
          ? { 
              ...builder, 
              is_following: false,
              followers_count: Math.max((builder.followers_count || 0) - 1, 0)
            }
          : builder
      ));

      toast.success('Unfollowed builder');
    } catch (error) {
      console.error('Error unfollowing builder:', error);
      toast.error('Failed to unfollow builder');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, supabase]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <BuilderFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />

      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-4 py-4 border-t border-b border-border/50">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {filteredAndSortedBuilders.length} builder{filteredAndSortedBuilders.length !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Controls */}
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BUILDER_SORT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleSortDirection}
            className="p-2"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none border-r border-border"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Builder Grid/List */}
      {filteredAndSortedBuilders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No builders found matching your criteria.</p>
          <Button 
            variant="outline" 
            onClick={handleClearFilters}
            className="mt-4"
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
        }>
          {filteredAndSortedBuilders.map(builder => (
            <BuilderCard
              key={builder.id}
              builder={builder}
              currentUserId={currentUserId}
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
            />
          ))}
        </div>
      )}
    </div>
  );
}