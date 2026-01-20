'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TeamMember {
  id: string;
  user_id: string;
  role: 'owner' | 'member';
  profile?: {
    username?: string;
    avatar_url?: string;
  };
}

interface TeamCardProps {
  team: {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    members?: TeamMember[];
    project_count?: number;
  };
}

export function TeamCard({ team }: TeamCardProps) {
  const memberCount = team.members?.length || 0;
  const displayMembers = team.members?.slice(0, 5) || [];
  const owner = team.members?.find(m => m.role === 'owner');

  return (
    <Link href={`/teams/${team.id}`}>
      <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="group-hover:text-primary transition-colors">
                {team.name}
              </CardTitle>
              <CardDescription className="mt-1">
                {memberCount} member{memberCount !== 1 ? 's' : ''}
                {team.project_count !== undefined && (
                  <> • {team.project_count} project{team.project_count !== 1 ? 's' : ''}</>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {team.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {team.description}
            </p>
          )}
          
          {/* Members preview */}
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {displayMembers.map((member) => (
                <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                  <AvatarImage src={member.profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {member.profile?.username?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              ))}
              {memberCount > 5 && (
                <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">+{memberCount - 5}</span>
                </div>
              )}
            </div>
            {owner && (
              <span className="text-xs text-muted-foreground">
                by {owner.profile?.username || 'Unknown'}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
