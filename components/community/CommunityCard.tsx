'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

interface CommunityCardProps {
  community: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string;
    member_count: number;
    project_type: string | null;
  };
  isMember?: boolean;
  onJoin?: (communityId: string) => void;
  onLeave?: (communityId: string) => void;
  isLoading?: boolean;
}

const PROJECT_TYPE_COLORS: Record<string, string> = {
  token: 'bg-yellow-500/10 text-yellow-500',
  nft_marketplace: 'bg-purple-500/10 text-purple-500',
  dao: 'bg-blue-500/10 text-blue-500',
  game: 'bg-green-500/10 text-green-500',
  social: 'bg-pink-500/10 text-pink-500',
};

export function CommunityCard({
  community,
  isMember = false,
  onJoin,
  onLeave,
  isLoading = false,
}: CommunityCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="text-4xl flex-shrink-0">{community.icon}</div>
            <div className="flex-1 min-w-0">
              <Link
                href={`/community/${community.slug}`}
                className="block group-hover:text-primary transition-colors"
              >
                <h3 className="font-semibold text-lg truncate">{community.name}</h3>
              </Link>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {community.description}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {community.member_count.toLocaleString()} members
                </span>
                {community.project_type && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      PROJECT_TYPE_COLORS[community.project_type] || 'bg-gray-500/10 text-gray-500'
                    }`}
                  >
                    {community.project_type.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            {isMember ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onLeave?.(community.id)}
                disabled={isLoading}
              >
                {isLoading ? 'Leaving...' : 'Joined ✓'}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => onJoin?.(community.id)}
                disabled={isLoading}
              >
                {isLoading ? 'Joining...' : 'Join'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
