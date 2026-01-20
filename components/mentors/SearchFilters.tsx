'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

interface SearchFiltersProps {
  searchParams: {
    topic?: string;
    availability?: string;
    project_type?: string;
    search?: string;
  };
  userLessons: string[];
}

const PROJECT_TYPES = [
  { value: 'nft_marketplace', label: 'NFT Marketplace' },
  { value: 'token', label: 'Token/Coin' },
  { value: 'dao', label: 'DAO' },
  { value: 'game', label: 'Game/Gaming' },
  { value: 'social', label: 'Social Network' },
  { value: 'creator', label: 'Creator Tools' },
];

const AVAILABILITY_FILTERS = [
  { value: 'immediate', label: 'Available Now' },
  { value: 'this_week', label: 'This Week' },
  { value: 'flexible', label: 'Flexible Schedule' },
];

export function SearchFilters({ searchParams, userLessons }: SearchFiltersProps) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.search || '');
  const [showFilters, setShowFilters] = useState(false);

  // Check if any filters are active
  const hasActiveFilters = searchParams.topic || searchParams.project_type || searchParams.availability || searchParams.search;

  const updateSearchParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(urlSearchParams.toString());
    
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    router.push(`/mentors?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push('/mentors');
    setSearchTerm('');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParams('search', searchTerm || null);
  };

  // Auto-expand filters if any are active
  useEffect(() => {
    if (hasActiveFilters) {
      setShowFilters(true);
    }
  }, [hasActiveFilters]);

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Find Mentors
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-gray-400 hover:text-white"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 bg-blue-600 text-white text-xs">
                {Object.values(searchParams).filter(Boolean).length}
              </Badge>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex space-x-2">
          <Input
            placeholder="Search mentors by name, bio, or expertise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
          <Button type="submit" size="default" className="bg-blue-600 hover:bg-blue-700">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {/* Recommended Based on User's Lessons */}
        {userLessons.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">
              Recommended for your learning path:
            </h4>
            <div className="flex flex-wrap gap-2">
              {PROJECT_TYPES
                .filter(type => userLessons.some(lesson => lesson.includes(type.value)))
                .slice(0, 3)
                .map(type => (
                  <Button
                    key={type.value}
                    variant="outline"
                    size="sm"
                    onClick={() => updateSearchParams('project_type', type.value)}
                    className={`text-xs ${
                      searchParams.project_type === type.value
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-blue-500 text-blue-300 hover:bg-blue-600/20'
                    }`}
                  >
                    {type.label}
                  </Button>
                ))}
            </div>
          </div>
        )}

        {/* Expanded Filters */}
        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-gray-700">
            {/* Project Type Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Project Type:</h4>
              <div className="flex flex-wrap gap-2">
                {PROJECT_TYPES.map(type => (
                  <Button
                    key={type.value}
                    variant="outline"
                    size="sm"
                    onClick={() => updateSearchParams('project_type', 
                      searchParams.project_type === type.value ? null : type.value
                    )}
                    className={`text-xs ${
                      searchParams.project_type === type.value
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Availability Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Availability:</h4>
              <div className="flex flex-wrap gap-2">
                {AVAILABILITY_FILTERS.map(filter => (
                  <Button
                    key={filter.value}
                    variant="outline"
                    size="sm"
                    onClick={() => updateSearchParams('availability', 
                      searchParams.availability === filter.value ? null : filter.value
                    )}
                    className={`text-xs ${
                      searchParams.availability === filter.value
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Mentor Type Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Mentor Type:</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSearchParams('topic', 
                    searchParams.topic === 'free' ? null : 'free'
                  )}
                  className={`text-xs ${
                    searchParams.topic === 'free'
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Free Mentors
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSearchParams('topic', 
                    searchParams.topic === 'experienced' ? null : 'experienced'
                  )}
                  className={`text-xs ${
                    searchParams.topic === 'experienced'
                      ? 'bg-yellow-600 border-yellow-600 text-white'
                      : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Experienced (10+ sessions)
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters & Clear */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-700">
            <div className="flex flex-wrap gap-2">
              {Object.entries(searchParams).map(([key, value]) => {
                if (!value) return null;
                let label = value;
                
                if (key === 'project_type') {
                  label = PROJECT_TYPES.find(t => t.value === value)?.label || value;
                } else if (key === 'availability') {
                  label = AVAILABILITY_FILTERS.find(f => f.value === value)?.label || value;
                }
                
                return (
                  <Badge
                    key={key}
                    variant="secondary"
                    className="bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 cursor-pointer"
                    onClick={() => updateSearchParams(key, null)}
                  >
                    {label}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                );
              })}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-gray-400 hover:text-white"
            >
              Clear all
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}