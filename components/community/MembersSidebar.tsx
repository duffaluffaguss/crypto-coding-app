'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Crown, Shield } from 'lucide-react';

interface Member {
  user_id: string;
  role: 'member' | 'moderator' | 'admin';
  joined_at: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface MembersSidebarProps {
  members: Member[];
  totalMembers: number;
}

const ROLE_BADGES: Record<string, { label: string; icon: typeof Crown; className: string }> = {
  admin: { label: 'Admin', icon: Crown, className: 'bg-yellow-500/10 text-yellow-500' },
  moderator: { label: 'Mod', icon: Shield, className: 'bg-blue-500/10 text-blue-500' },
};

export function MembersSidebar({ members, totalMembers }: MembersSidebarProps) {
  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Sort: admins first, then moderators, then members
  const sortedMembers = [...members].sort((a, b) => {
    const order = { admin: 0, moderator: 1, member: 2 };
    return order[a.role] - order[b.role];
  });

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
          return (
            <div key={member.user_id} className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(member.profiles?.display_name)}
                </AvatarFallback>
              </Avatar>
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
                </div>
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
