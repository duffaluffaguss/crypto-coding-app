'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Crown, Shield, GraduationCap, Star } from 'lucide-react';
import { ExpertBadgeCompact } from './ExpertBadge';
import type { ExpertLevel } from '@/lib/experts';

interface MemberExpertInfo {
  level: ExpertLevel | null;
  deployedProjects: number;
}

interface Member {
  user_id: string;
  role: 'member' | 'moderator' | 'admin';
  joined_at: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  expertInfo?: MemberExpertInfo;
}

interface MembersSidebarProps {
  members: Member[];
  totalMembers: number;
  topicName?: string;
}

const ROLE_BADGES: Record<string, { label: string; icon: typeof Crown; className: string }> = {
  admin: { label: 'Admin', icon: Crown, className: 'bg-yellow-500/10 text-yellow-500' },
  moderator: { label: 'Mod', icon: Shield, className: 'bg-blue-500/10 text-blue-500' },
};

export function MembersSidebar({ members, totalMembers, topicName }: MembersSidebarProps) {
  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Sort: admins first, then moderators, then experts, then regular members
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { admin: 0, moderator: 1, member: 2 };
    const expertOrder: Record<ExpertLevel | 'none', number> = {
      master: 0, expert: 1, intermediate: 2, verified: 3, none: 4
    };
    
    const roleDiff = roleOrder[a.role] - roleOrder[b.role];
    if (roleDiff !== 0) return roleDiff;
    
    // Within same role, sort by expert level
    const aExpert = a.expertInfo?.level || 'none';
    const bExpert = b.expertInfo?.level || 'none';
    return expertOrder[aExpert] - expertOrder[bExpert];
  });

  // Check if member is an expert (not just verified)
  const isExpert = (member: Member) => {
    const level = member.expertInfo?.level;
    return level && level !== 'verified';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Members
          <Badge variant="secondary" className="ml-auto">
            {totalMembers.toLocaleString()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedMembers.slice(0, 10).map((member) => {
          const roleInfo = ROLE_BADGES[member.role];
          const memberIsExpert = isExpert(member);
          
          return (
            <div 
              key={member.user_id} 
              className={`flex items-center gap-3 ${
                memberIsExpert ? 'p-2 -mx-2 rounded-lg bg-purple-500/5 border border-purple-500/10' : ''
              }`}
            >
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(member.profiles?.display_name)}
                  </AvatarFallback>
                </Avatar>
                {/* Expert indicator dot */}
                {memberIsExpert && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-purple-500 border-2 border-background flex items-center justify-center">
                    <Star className="h-1.5 w-1.5 text-white" />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {member.profiles?.display_name || 'Anonymous'}
                  </span>
                  {roleInfo && (
                    <Badge variant="secondary" className={`${roleInfo.className} text-xs px-1.5 py-0`}>
                      <roleInfo.icon className="h-3 w-3 mr-1" />
                      {roleInfo.label}
                    </Badge>
                  )}
                  {member.expertInfo?.level && (
                    <ExpertBadgeCompact 
                      level={member.expertInfo.level} 
                      topicName={topicName}
                    />
                  )}
                </div>
                {/* Show deployed projects count for experts */}
                {memberIsExpert && member.expertInfo?.deployedProjects > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {member.expertInfo.deployedProjects} project{member.expertInfo.deployedProjects !== 1 ? 's' : ''} deployed
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {totalMembers > 10 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            +{(totalMembers - 10).toLocaleString()} more members
          </p>
        )}
      </CardContent>
    </Card>
  );
}
