'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

const PROJECT_TYPES = [
  { value: 'all', label: 'All Projects' },
  { value: 'token', label: 'Tokens' },
  { value: 'nft_marketplace', label: 'NFTs' },
  { value: 'dao', label: 'DAOs' },
  { value: 'game', label: 'Games' },
  { value: 'social', label: 'Social' },
  { value: 'creator', label: 'Creator' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'likes', label: 'Most Liked' },
];

interface ShowcaseFiltersProps {
  currentType: string;
  currentSort: string;
}

export function ShowcaseFilters({ currentType, currentSort }: ShowcaseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilters = (type?: string, sort?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (type !== undefined) {
      if (type === 'all') {
        params.delete('type');
      } else {
        params.set('type', type);
      }
    }
    
    if (sort !== undefined) {
      if (sort === 'newest') {
        params.delete('sort');
      } else {
        params.set('sort', sort);
      }
    }

    const queryString = params.toString();
    router.push(`/showcase${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <div className="mb-8 space-y-4">
      {/* Type Filters */}
      <div className="flex flex-wrap gap-2">
        {PROJECT_TYPES.map((type) => (
          <Button
            key={type.value}
            variant={currentType === type.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilters(type.value, undefined)}
            className="transition-all"
          >
            {type.label}
          </Button>
        ))}
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <div className="flex gap-2">
          {SORT_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={currentSort === option.value ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => updateFilters(undefined, option.value)}
            >
              {option.value === 'likes' && (
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              )}
              {option.value === 'newest' && (
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
