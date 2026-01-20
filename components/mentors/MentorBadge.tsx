'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserCheck, Star, Users, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface MentorBadgeProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showStats?: boolean;
}

interface MentorInfo {
  is_available: boolean;
  topics: string[];
  max_mentees: number;
  current_mentees: number;
  created_at: string;
  rating?: number;
  sessionCount?: number;
}

export function MentorBadge({ userId, size = 'sm', className, showStats = false }: MentorBadgeProps) {
  const [mentorInfo, setMentorInfo] = useState<MentorInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMentorInfo() {
      try {
        const supabase = createClientComponentClient();

        // Get mentor availability info
        const { data: mentorProfile } = await supabase
          .from('mentor_availability')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!mentorProfile) {
          setIsLoading(false);
          return;
        }

        // Get mentor statistics
        const [reviewsResult, sessionsResult] = await Promise.all([
          supabase
            .from('mentor_reviews')
            .select('rating')
            .eq('mentor_id', userId)
            .eq('is_public', true),
          supabase
            .from('mentorship_requests')
            .select('id')
            .eq('mentor_id', userId)
            .eq('status', 'completed')
        ]);

        const reviews = reviewsResult.data || [];
        const sessions = sessionsResult.data || [];
        
        const avgRating = reviews.length > 0 
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
          : 0;

        setMentorInfo({
          ...mentorProfile,
          rating: avgRating,
          sessionCount: sessions.length
        });
      } catch (error) {
        console.error('Error fetching mentor info:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMentorInfo();
  }, [userId]);

  if (isLoading || !mentorInfo) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const isActive = mentorInfo.is_available && mentorInfo.current_mentees < mentorInfo.max_mentees;
  
  const badgeVariant = isActive ? 'default' : 'secondary';
  const badgeColor = isActive 
    ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
    : 'bg-gray-600 hover:bg-gray-700 text-gray-200 border-gray-600';

  const tooltipContent = (
    <div className="space-y-2 text-center">
      <div className="font-medium">
        {isActive ? '🟢 Active Mentor' : '🟡 Mentor (Unavailable)'}
      </div>
      <div className="text-xs space-y-1">
        <div>Topics: {mentorInfo.topics.slice(0, 3).map(t => t.replace(/_/g, ' ')).join(', ')}</div>
        {mentorInfo.topics.length > 3 && (
          <div className="text-gray-400">+{mentorInfo.topics.length - 3} more</div>
        )}
        <div className="flex justify-center items-center space-x-3 pt-1">
          {mentorInfo.rating > 0 && (
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 text-yellow-400 fill-current" />
              <span>{mentorInfo.rating.toFixed(1)}</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Award className="h-3 w-3 text-blue-400" />
            <span>{mentorInfo.sessionCount}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3 text-purple-400" />
            <span>{mentorInfo.max_mentees - mentorInfo.current_mentees}</span>
          </div>
        </div>
      </div>
      <div className="text-xs text-gray-400 border-t border-gray-600 pt-1">
        Click to view mentor profile
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={`/mentors?mentor=${userId}`} className="inline-block">
            <Badge 
              variant={badgeVariant}
              className={cn(
                sizeClasses[size],
                badgeColor,
                'cursor-pointer transition-colors hover:scale-105',
                className
              )}
            >
              <UserCheck className={cn(iconSizes[size], 'mr-1')} />
              Mentor
              {showStats && mentorInfo.rating > 0 && (
                <>
                  <Star className={cn(iconSizes[size], 'ml-1 text-yellow-400 fill-current')} />
                  <span className="ml-0.5">{mentorInfo.rating.toFixed(1)}</span>
                </>
              )}
            </Badge>
          </Link>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          className="bg-gray-800 border-gray-700 text-white max-w-xs"
        >
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Hook for checking if a user is a mentor (can be used in other components)
export function useMentorStatus(userId: string) {
  const [isMentor, setIsMentor] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkMentorStatus() {
      try {
        const supabase = createClientComponentClient();
        const { data } = await supabase
          .from('mentor_availability')
          .select('is_available')
          .eq('user_id', userId)
          .single();

        setIsMentor(!!data);
      } catch {
        setIsMentor(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkMentorStatus();
  }, [userId]);

  return { isMentor, isLoading };
}