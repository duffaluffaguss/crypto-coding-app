'use client';

import { Button } from '@/components/ui/button';
import { Users, MessageSquare } from 'lucide-react';

interface CommunityHeaderProps {
  community: {
    name: string;
    description: string | null;
    icon: string;
    member_count: number;
  };
  postCount: number;
  isMember: boolean;
  onJoin: () => void;
  onLeave: () => void;
  isLoading?: boolean;
}

export function CommunityHeader({
  community,
  postCount,
  isMember,
  onJoin,
  onLeave,
  isLoading = false,
}: CommunityHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-b border-border">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="text-6xl">{community.icon}</div>
            <div>
              <h1 className="text-3xl font-bold">{community.name}</h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                {community.description}
              </p>
              <div className="flex items-center gap-6 mt-4">
                <span className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-primary" />
                  <strong>{community.member_count.toLocaleString()}</strong> members
                </span>
                <span className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <strong>{postCount.toLocaleString()}</strong> discussions
                </span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            {isMember ? (
              <Button
                variant="outline"
                onClick={onLeave}
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? 'Leaving...' : 'Joined ✓'}
              </Button>
            ) : (
              <Button
                onClick={onJoin}
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? 'Joining...' : 'Join Community'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
