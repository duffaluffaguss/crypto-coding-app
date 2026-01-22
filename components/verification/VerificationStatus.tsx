'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Check, ExternalLink, Shield, Star, Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserVerification, getVerificationCount, isFullyVerified } from './VerificationBadges';
import { SocialVerifyButton } from './SocialVerifyButton';

interface VerificationStatusProps {
  userId: string;
  className?: string;
}

interface VerificationItem {
  key: keyof UserVerification;
  icon: string;
  name: string;
  description: string;
  verified: boolean;
  value?: string;
  action?: React.ReactNode;
  priority: 'required' | 'recommended' | 'optional';
}

const VERIFICATION_BENEFITS = [
  {
    icon: Shield,
    title: 'Enhanced Trust',
    description: 'Verified users are more trusted by the community',
  },
  {
    icon: Trophy,
    title: 'Bonus Points',
    description: 'Earn 500 bonus achievement points',
  },
  {
    icon: Star,
    title: 'Featured Projects',
    description: 'Verified projects get priority in showcase',
  },
  {
    icon: Users,
    title: 'Exclusive Access',
    description: 'Access to verified-only features and events',
  },
];

export function VerificationStatus({ userId, className }: VerificationStatusProps) {
  const [verifications, setVerifications] = useState<UserVerification>({});
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadVerifications();
  }, [userId]);

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

  const verificationItems: VerificationItem[] = [
    {
      key: 'worldId',
      icon: '🌍',
      name: 'World ID',
      description: 'Prove you\'re a unique human with World ID Orb verification',
      verified: !!verifications.worldId?.verified,
      value: verifications.worldId?.level === 'orb' ? 'Orb Verified' : undefined,
      priority: 'required',
      action: !verifications.worldId?.verified && (
        <Button size="sm" asChild>
          <Link href="/verify/worldid">
            Verify with World ID
            <ExternalLink className="ml-2 h-3 w-3" />
          </Link>
        </Button>
      ),
    },
    {
      key: 'gitcoin',
      icon: '🛂',
      name: 'Gitcoin Passport',
      description: 'Connect your Gitcoin Passport to show your humanity score',
      verified: !!verifications.gitcoin?.verified,
      value: verifications.gitcoin?.score ? `Score: ${verifications.gitcoin.score}` : undefined,
      priority: 'required',
      action: !verifications.gitcoin?.verified && (
        <Button size="sm" asChild>
          <Link href="/verify/gitcoin">
            Connect Passport
            <ExternalLink className="ml-2 h-3 w-3" />
          </Link>
        </Button>
      ),
    },
    {
      key: 'twitter',
      icon: '𝕏',
      name: 'Twitter / X',
      description: 'Link your Twitter account for social verification',
      verified: !!verifications.twitter?.verified,
      value: verifications.twitter?.username ? `@${verifications.twitter.username}` : undefined,
      priority: 'recommended',
      action: !verifications.twitter?.verified && (
        <SocialVerifyButton platform="twitter" size="sm" showUsername={false} />
      ),
    },
    {
      key: 'github',
      icon: '🐙',
      name: 'GitHub',
      description: 'Connect your GitHub to showcase your coding activity',
      verified: !!verifications.github?.verified,
      value: verifications.github?.username,
      priority: 'recommended',
      action: !verifications.github?.verified && (
        <SocialVerifyButton platform="github" size="sm" showUsername={false} />
      ),
    },
    {
      key: 'discord',
      icon: '💬',
      name: 'Discord',
      description: 'Link your Discord for community verification',
      verified: !!verifications.discord?.verified,
      value: verifications.discord?.username,
      priority: 'optional',
      action: !verifications.discord?.verified && (
        <SocialVerifyButton platform="discord" size="sm" showUsername={false} />
      ),
    },
    {
      key: 'ens',
      icon: '◆',
      name: 'ENS Name',
      description: 'Display your ENS name as your on-chain identity',
      verified: !!verifications.ens?.verified,
      value: verifications.ens?.name,
      priority: 'optional',
      action: !verifications.ens?.verified && (
        <Button size="sm" variant="outline" asChild>
          <Link href="/verify/ens">
            Connect ENS
            <ExternalLink className="ml-2 h-3 w-3" />
          </Link>
        </Button>
      ),
    },
  ];

  const verificationCount = getVerificationCount(verifications);
  const totalVerifications = verificationItems.length;
  const progressPercent = (verificationCount / totalVerifications) * 100;
  const fullyVerified = isFullyVerified(verifications);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading verification status...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Verification Status
                {fullyVerified && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    <Check className="mr-1 h-3 w-3" />
                    Fully Verified
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Complete verifications to build trust and unlock features
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{verificationCount}/{totalVerifications}</div>
              <div className="text-sm text-muted-foreground">verifications</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercent} className="h-2" />
          <div className="mt-2 text-sm text-muted-foreground text-center">
            {fullyVerified 
              ? '🎉 Congratulations! You\'re fully verified!' 
              : `${totalVerifications - verificationCount} more to go`}
          </div>
        </CardContent>
      </Card>

      {/* Verification Items */}
      <Card>
        <CardHeader>
          <CardTitle>Verifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Required */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Required for Full Verification</h3>
            <div className="space-y-3">
              {verificationItems.filter(v => v.priority === 'required').map((item) => (
                <VerificationItemRow key={item.key} item={item} />
              ))}
            </div>
          </div>

          {/* Recommended */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Recommended (need at least one)</h3>
            <div className="space-y-3">
              {verificationItems.filter(v => v.priority === 'recommended').map((item) => (
                <VerificationItemRow key={item.key} item={item} />
              ))}
            </div>
          </div>

          {/* Optional */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Optional</h3>
            <div className="space-y-3">
              {verificationItems.filter(v => v.priority === 'optional').map((item) => (
                <VerificationItemRow key={item.key} item={item} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits Card */}
      <Card>
        <CardHeader>
          <CardTitle>Benefits of Verification</CardTitle>
          <CardDescription>
            Complete your verifications to unlock these benefits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {VERIFICATION_BENEFITS.map((benefit, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-lg',
                  fullyVerified ? 'bg-emerald-500/5' : 'bg-muted/50'
                )}
              >
                <benefit.icon className={cn(
                  'h-5 w-5 mt-0.5',
                  fullyVerified ? 'text-emerald-600' : 'text-muted-foreground'
                )} />
                <div>
                  <h4 className="font-medium">{benefit.title}</h4>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function VerificationItemRow({ item }: { item: VerificationItem }) {
  return (
    <div className={cn(
      'flex items-center justify-between p-4 rounded-lg border transition-colors',
      item.verified 
        ? 'bg-emerald-500/5 border-emerald-500/20' 
        : 'bg-muted/30 border-border hover:border-muted-foreground/20'
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full',
          item.verified ? 'bg-emerald-500/10' : 'bg-muted'
        )}>
          <span className="text-xl">{item.icon}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{item.name}</h4>
            {item.verified && (
              <Check className="h-4 w-4 text-emerald-600" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {item.verified && item.value ? item.value : item.description}
          </p>
        </div>
      </div>
      {item.action}
    </div>
  );
}

// Compact version for sidebar/widget use
export function VerificationStatusCompact({ userId, className }: VerificationStatusProps) {
  const [verifications, setVerifications] = useState<UserVerification>({});
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadVerifications();
  }, [userId]);

  const loadVerifications = async () => {
    try {
      const { data: socialVerifications } = await supabase
        .from('social_verifications')
        .select('*')
        .eq('user_id', userId);

      const { data: worldIdData } = await supabase
        .from('world_id_verifications')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data: gitcoinData } = await supabase
        .from('gitcoin_passports')
        .select('*')
        .eq('user_id', userId)
        .single();

      const newVerifications: UserVerification = {};

      socialVerifications?.forEach((v) => {
        if (v.platform === 'twitter') newVerifications.twitter = { verified: true };
        if (v.platform === 'github') newVerifications.github = { verified: true };
        if (v.platform === 'discord') newVerifications.discord = { verified: true };
      });

      if (worldIdData) newVerifications.worldId = { verified: true };
      if (gitcoinData) newVerifications.gitcoin = { verified: true };

      setVerifications(newVerifications);
    } catch (error) {
      console.error('Error loading verifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const verificationCount = getVerificationCount(verifications);
  const fullyVerified = isFullyVerified(verifications);

  if (isLoading) {
    return null;
  }

  return (
    <Link href="/verify" className={cn('block', className)}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className={cn(
                'h-5 w-5',
                fullyVerified ? 'text-emerald-600' : 'text-muted-foreground'
              )} />
              <span className="font-medium">Verification</span>
            </div>
            <Badge variant={fullyVerified ? 'default' : 'secondary'}>
              {fullyVerified ? 'Complete' : `${verificationCount}/6`}
            </Badge>
          </div>
          <Progress value={(verificationCount / 6) * 100} className="h-1.5 mt-3" />
        </CardContent>
      </Card>
    </Link>
  );
}
