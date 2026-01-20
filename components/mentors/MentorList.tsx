'use client';

import { MentorCard } from './MentorCard';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Grid, List } from 'lucide-react';

interface MentorListProps {
  mentors: any[];
  mentorStats: Record<string, { rating: number; reviewCount: number; completedSessions: number }>;
  currentUserId?: string;
}

export function MentorList({ mentors, mentorStats, currentUserId }: MentorListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'sessions' | 'availability'>('newest');

  // Sort mentors based on selected criteria
  const sortedMentors = [...mentors].sort((a, b) => {
    const statsA = mentorStats[a.user_id] || { rating: 0, reviewCount: 0, completedSessions: 0 };
    const statsB = mentorStats[b.user_id] || { rating: 0, reviewCount: 0, completedSessions: 0 };

    switch (sortBy) {
      case 'rating':
        // Sort by rating, then by review count
        if (statsA.rating !== statsB.rating) {
          return statsB.rating - statsA.rating;
        }
        return statsB.reviewCount - statsA.reviewCount;
      
      case 'sessions':
        return statsB.completedSessions - statsA.completedSessions;
      
      case 'availability':
        // Sort by available slots (max_mentees - current_mentees)
        const availableA = a.max_mentees - a.current_mentees;
        const availableB = b.max_mentees - b.current_mentees;
        return availableB - availableA;
      
      case 'newest':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  if (mentors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-white">Available Mentors</h2>
          <p className="text-gray-400">{mentors.length} mentor{mentors.length !== 1 ? 's' : ''} found</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Sort Controls */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="newest">Newest</option>
              <option value="rating">Highest Rated</option>
              <option value="sessions">Most Sessions</option>
              <option value="availability">Most Available</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-gray-600 overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`rounded-none border-0 ${
                viewMode === 'grid' 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-transparent hover:bg-gray-700'
              }`}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={`rounded-none border-0 ${
                viewMode === 'list' 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-transparent hover:bg-gray-700'
              }`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mentor Cards */}
      <div className={`
        ${viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'grid grid-cols-1 gap-4'
        }
      `}>
        {sortedMentors.map((mentor) => (
          <MentorCard
            key={mentor.id}
            mentor={mentor}
            stats={mentorStats[mentor.user_id] || { rating: 0, reviewCount: 0, completedSessions: 0 }}
            currentUserId={currentUserId}
          />
        ))}
      </div>

      {/* Load More (if needed in the future) */}
      {mentors.length >= 12 && (
        <div className="text-center pt-6">
          <Button variant="outline" className="bg-gray-800 border-gray-600 hover:bg-gray-700">
            Load More Mentors
          </Button>
        </div>
      )}
    </div>
  );
}