'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { BuilderProfile, getReputationLevel, getReputationColor } from '@/types';
import { Users, Code, Star, UserPlus, MessageCircle } from 'lucide-react';
import { useState } from 'react';

interface BuilderCardProps {
  builder: BuilderProfile;
  currentUserId?: string;
  onFollow?: (builderId: string) => Promise<void>;
  onUnfollow?: (builderId: string) => Promise<void>;
}

export function BuilderCard({ builder, currentUserId, onFollow, onUnfollow }: BuilderCardProps) {
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  
  const reputationLevel = getReputationLevel(builder.reputation_score || 0);
  const reputationColorClass = getReputationColor(reputationLevel);
  
  const displayName = builder.display_name || 'Anonymous Builder';
  const initials = displayName
    .split(' ')
    .map((name) => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Get top interests as tags (limit to 3)
  const topInterests = builder.interests.slice(0, 3);
  
  // Get top skills (limit to 4)
  const topSkills = builder.skills?.slice(0, 4) || [];

  const handleFollowToggle = async () => {
    if (!currentUserId || !onFollow || !onUnfollow) return;
    
    setIsFollowLoading(true);
    try {
      if (builder.is_following) {
        await onUnfollow(builder.id);
      } else {
        await onFollow(builder.id);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const isOwnProfile = currentUserId === builder.id;

  return (
    <Card className="group hover:shadow-md transition-all duration-200 border border-border/50 hover:border-border">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={builder.avatar_url || undefined} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={`/profile/${builder.id}`}
                className="font-semibold text-foreground hover:text-primary transition-colors truncate"
              >
                {displayName}
              </Link>
              <Badge
                variant="outline"
                className={`text-xs px-2 py-0.5 ${reputationColorClass}`}
              >
                {reputationLevel}
              </Badge>
            </div>
            
            {builder.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {builder.bio}
              </p>
            )}
            
            {builder.looking_for_collaborators && (
              <Badge variant="secondary" className="text-xs mt-2 w-fit">
                Looking for collaborators
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="py-0 space-y-3">
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Code className="h-4 w-4" />
            <span>{builder.projects_count || 0} projects</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{builder.followers_count || 0} followers</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            <span>{builder.reputation_score || 0}</span>
          </div>
        </div>

        {/* Interests */}
        {topInterests.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Interests
            </p>
            <div className="flex flex-wrap gap-1">
              {topInterests.map((interest) => (
                <Badge key={interest} variant="outline" className="text-xs">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {topSkills.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Skills
            </p>
            <div className="flex flex-wrap gap-1">
              {topSkills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4 flex gap-2">
        <Button asChild variant="outline" className="flex-1">
          <Link href={`/profile/${builder.id}`}>
            View Profile
          </Link>
        </Button>
        
        {!isOwnProfile && currentUserId && (
          <>
            <Button
              variant={builder.is_following ? "secondary" : "default"}
              size="sm"
              onClick={handleFollowToggle}
              disabled={isFollowLoading}
              className="flex items-center gap-1"
            >
              <UserPlus className="h-4 w-4" />
              {builder.is_following ? 'Following' : 'Follow'}
            </Button>
            
            <Button asChild variant="outline" size="sm">
              <Link href={`/profile/${builder.id}?tab=contact`}>
                <MessageCircle className="h-4 w-4" />
              </Link>
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}