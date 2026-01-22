'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface UserVerification {
  worldId?: {
    verified: boolean;
    verifiedAt?: string;
    level?: 'orb' | 'device';
  };
  gitcoin?: {
    verified: boolean;
    score?: number;
    verifiedAt?: string;
  };
  twitter?: {
    verified: boolean;
    username?: string;
    verifiedAt?: string;
  };
  github?: {
    verified: boolean;
    username?: string;
    verifiedAt?: string;
  };
  discord?: {
    verified: boolean;
    username?: string;
    verifiedAt?: string;
  };
  ens?: {
    verified: boolean;
    name?: string;
    verifiedAt?: string;
  };
}

interface VerificationBadgesProps {
  userId: string;
  verifications?: UserVerification;
  size?: 'xs' | 'sm' | 'md';
  showAll?: boolean;
  maxBadges?: number;
  className?: string;
}

const badgeSizes = {
  xs: 'text-[10px] px-1.5 py-0.5 gap-0.5',
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-2.5 py-1 gap-1.5',
};

const iconSizes = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
};

export function VerificationBadges({
  userId,
  verifications: propVerifications,
  size = 'sm',
  showAll = false,
  maxBadges = 3,
  className,
}: VerificationBadgesProps) {
  const [verifications, setVerifications] = useState<UserVerification>(propVerifications || {});
  const [isLoading, setIsLoading] = useState(!propVerifications);
  const supabase = createClient();

  useEffect(() => {
    if (!propVerifications) {
      loadVerifications();
    }
  }, [userId, propVerifications]);

  const loadVerifications = async () => {
    try {
      // Load social verifications
      const { data: socialVerifications } = await supabase
        .from('social_verifications')
        .select('*')
        .eq('user_id', userId);

      // Load World ID verification
      const { data: worldIdData } = await supabase
        .from('world_id_verifications')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Load Gitcoin Passport
      const { data: gitcoinData } = await supabase
        .from('gitcoin_passports')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Load ENS
      const { data: ensData } = await supabase
        .from('ens_names')
        .select('*')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .single();

      const newVerifications: UserVerification = {};

      // Process social verifications
      socialVerifications?.forEach((v) => {
        if (v.platform === 'twitter') {
          newVerifications.twitter = {
            verified: true,
            username: v.username,
            verifiedAt: v.verified_at,
          };
        } else if (v.platform === 'github') {
          newVerifications.github = {
            verified: true,
            username: v.username,
            verifiedAt: v.verified_at,
          };
        } else if (v.platform === 'discord') {
          newVerifications.discord = {
            verified: true,
            username: v.username,
            verifiedAt: v.verified_at,
          };
        }
      });

      // Process World ID
      if (worldIdData) {
        newVerifications.worldId = {
          verified: true,
          level: worldIdData.verification_level || 'orb',
          verifiedAt: worldIdData.verified_at,
        };
      }

      // Process Gitcoin
      if (gitcoinData) {
        newVerifications.gitcoin = {
          verified: true,
          score: gitcoinData.score,
          verifiedAt: gitcoinData.verified_at,
        };
      }

      // Process ENS
      if (ensData) {
        newVerifications.ens = {
          verified: true,
          name: ensData.name,
          verifiedAt: ensData.verified_at,
        };
      }

      setVerifications(newVerifications);
    } catch (error) {
      console.error('Error loading verifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  const badges = [];

  // World ID Badge - Most important, shows first
  if (verifications.worldId?.verified) {
    badges.push({
      key: 'worldId',
      icon: '🌍',
      label: 'Orb Verified',
      tooltip: 'Verified human via World ID Orb',
      className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
    });
  }

  // Gitcoin Passport Badge
  if (verifications.gitcoin?.verified) {
    badges.push({
      key: 'gitcoin',
      icon: '🛂',
      label: `Passport ${verifications.gitcoin.score ? `(${verifications.gitcoin.score})` : ''}`,
      tooltip: `Gitcoin Passport${verifications.gitcoin.score ? ` - Score: ${verifications.gitcoin.score}` : ''}`,
      className: 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400',
    });
  }

  // ENS Badge
  if (verifications.ens?.verified) {
    badges.push({
      key: 'ens',
      icon: '◆',
      label: verifications.ens.name || 'ENS',
      tooltip: `ENS: ${verifications.ens.name}`,
      className: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',
    });
  }

  // Twitter/X Badge
  if (verifications.twitter?.verified) {
    badges.push({
      key: 'twitter',
      icon: '𝕏',
      label: 'Verified',
      tooltip: `Twitter: @${verifications.twitter.username}`,
      className: 'bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400',
    });
  }

  // GitHub Badge
  if (verifications.github?.verified) {
    badges.push({
      key: 'github',
      icon: '🐙',
      label: 'GitHub',
      tooltip: `GitHub: ${verifications.github.username}`,
      className: 'bg-gray-500/10 text-gray-700 border-gray-500/20 dark:text-gray-300',
    });
  }

  // Discord Badge
  if (verifications.discord?.verified) {
    badges.push({
      key: 'discord',
      icon: '💬',
      label: 'Discord',
      tooltip: `Discord: ${verifications.discord.username}`,
      className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400',
    });
  }

  if (badges.length === 0) {
    return null;
  }

  const displayBadges = showAll ? badges : badges.slice(0, maxBadges);
  const remainingCount = badges.length - displayBadges.length;

  return (
    <TooltipProvider>
      <div className={cn('flex flex-wrap items-center gap-1', className)}>
        {displayBadges.map((badge) => (
          <Tooltip key={badge.key}>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={cn(
                  badgeSizes[size],
                  badge.className,
                  'cursor-default'
                )}
              >
                <span className={iconSizes[size]}>{badge.icon}</span>
                <span>{badge.label}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{badge.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={cn(
                  badgeSizes[size],
                  'bg-muted/50 text-muted-foreground cursor-default'
                )}
              >
                +{remainingCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{remainingCount} more verification{remainingCount > 1 ? 's' : ''}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

// Compact single badge for inline use
interface VerificationBadgeInlineProps {
  type: 'worldId' | 'gitcoin' | 'twitter' | 'github' | 'discord' | 'ens';
  value?: string | number;
  size?: 'xs' | 'sm' | 'md';
}

const badgeConfig = {
  worldId: { icon: '🌍', label: 'Orb Verified', color: 'text-emerald-600 dark:text-emerald-400' },
  gitcoin: { icon: '🛂', label: 'Passport', color: 'text-purple-600 dark:text-purple-400' },
  twitter: { icon: '𝕏', label: 'Verified', color: 'text-sky-600 dark:text-sky-400' },
  github: { icon: '🐙', label: 'GitHub', color: 'text-gray-700 dark:text-gray-300' },
  discord: { icon: '💬', label: 'Discord', color: 'text-indigo-600 dark:text-indigo-400' },
  ens: { icon: '◆', label: 'ENS', color: 'text-blue-600 dark:text-blue-400' },
};

export function VerificationBadgeInline({ type, value, size = 'sm' }: VerificationBadgeInlineProps) {
  const config = badgeConfig[type];
  
  return (
    <span className={cn('inline-flex items-center gap-0.5', config.color, iconSizes[size])}>
      <span>{config.icon}</span>
      {value && <span className="text-xs">{value}</span>}
    </span>
  );
}

// Get verification count for a user
export function getVerificationCount(verifications: UserVerification): number {
  let count = 0;
  if (verifications.worldId?.verified) count++;
  if (verifications.gitcoin?.verified) count++;
  if (verifications.twitter?.verified) count++;
  if (verifications.github?.verified) count++;
  if (verifications.discord?.verified) count++;
  if (verifications.ens?.verified) count++;
  return count;
}

// Check if user is "fully verified" (has core verifications)
export function isFullyVerified(verifications: UserVerification): boolean {
  return !!(
    verifications.worldId?.verified &&
    verifications.gitcoin?.verified &&
    (verifications.twitter?.verified || verifications.github?.verified)
  );
}
