'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, Users, Clock, MessageSquare, Award, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { RequestMentorModal } from './RequestMentorModal';

interface MentorCardProps {
  mentor: {
    id: string;
    user_id: string;
    is_available: boolean;
    topics: string[];
    max_mentees: number;
    current_mentees: number;
    bio?: string;
    hourly_rate?: number;
    timezone?: string;
    preferred_meeting_times?: string[];
    profiles: {
      id: string;
      display_name: string;
    };
  };
  stats: {
    rating: number;
    reviewCount: number;
    completedSessions: number;
  };
  currentUserId?: string;
}

export function MentorCard({ mentor, stats, currentUserId }: MentorCardProps) {
  const [showRequestModal, setShowRequestModal] = useState(false);
  
  const canTakeMentees = mentor.current_mentees < mentor.max_mentees;
  const isCurrentUser = currentUserId === mentor.user_id;
  
  const formatMeetingTimes = (times: string[] | undefined) => {
    if (!times || times.length === 0) return 'Flexible';
    return times.map(time => 
      time.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    ).join(', ');
  };

  const formatTopics = (topics: string[]) => {
    return topics.map(topic => 
      topic.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    );
  };

  return (
    <>
      <Card className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-blue-600 text-white">
                  {mentor.profiles.display_name?.charAt(0) || 'M'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-white text-lg">
                  {mentor.profiles.display_name || 'Anonymous Mentor'}
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  {stats.rating > 0 ? (
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span>{stats.rating.toFixed(1)}</span>
                      <span className="text-gray-400">({stats.reviewCount})</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">New mentor</span>
                  )}
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Award className="h-4 w-4 text-green-400" />
                    <span>{stats.completedSessions} sessions</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-1">
              {mentor.hourly_rate ? (
                <div className="flex items-center space-x-1 text-green-400 text-sm font-medium">
                  <DollarSign className="h-4 w-4" />
                  <span>${mentor.hourly_rate}/hr</span>
                </div>
              ) : (
                <Badge variant="secondary" className="bg-green-900/30 text-green-300 text-xs">
                  Free
                </Badge>
              )}
              <div className="text-xs text-gray-400">
                {mentor.timezone}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Bio */}
          {mentor.bio && (
            <p className="text-gray-300 text-sm line-clamp-3">
              {mentor.bio}
            </p>
          )}

          {/* Topics */}
          <div>
            <h4 className="text-sm font-medium text-gray-200 mb-2">Can help with:</h4>
            <div className="flex flex-wrap gap-1">
              {formatTopics(mentor.topics).slice(0, 4).map((topic, index) => (
                <Badge key={index} variant="outline" className="text-xs border-blue-500 text-blue-300">
                  {topic}
                </Badge>
              ))}
              {mentor.topics.length > 4 && (
                <Badge variant="outline" className="text-xs text-gray-400">
                  +{mentor.topics.length - 4} more
                </Badge>
              )}
            </div>
          </div>

          {/* Availability Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-gray-300">
                {mentor.max_mentees - mentor.current_mentees} slots left
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-purple-400" />
              <span className="text-gray-300 truncate">
                {formatMeetingTimes(mentor.preferred_meeting_times)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2">
            {isCurrentUser ? (
              <Button variant="outline" disabled className="w-full">
                This is you
              </Button>
            ) : !canTakeMentees ? (
              <Button variant="outline" disabled className="w-full">
                Currently unavailable
              </Button>
            ) : (
              <Button 
                onClick={() => setShowRequestModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!currentUserId}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Request Mentorship
              </Button>
            )}
          </div>

          {!currentUserId && (
            <p className="text-xs text-gray-400 text-center">
              Sign in to request mentorship
            </p>
          )}
        </CardContent>
      </Card>

      {/* Request Modal */}
      {showRequestModal && currentUserId && (
        <RequestMentorModal
          mentorId={mentor.user_id}
          mentorName={mentor.profiles.display_name || 'Mentor'}
          menteeId={currentUserId}
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
        />
      )}
    </>
  );
}