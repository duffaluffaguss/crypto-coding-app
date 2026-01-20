'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ReferralStats {
  referral_count: number;
  total_points: number;
}

interface ReferredUser {
  id: string;
  display_name: string | null;
  created_at: string;
  reward_points: number;
}

interface Reward {
  id: string;
  reward_type: string;
  points: number;
  created_at: string;
  profiles?: { display_name: string | null } | null;
}

interface ReferralDashboardProps {
  referralCode: string;
  referralLink: string;
  stats: ReferralStats;
  referredUsers: ReferredUser[];
  rewards: Reward[];
}

export function ReferralDashboard({
  referralCode,
  referralLink,
  stats,
  referredUsers,
  rewards,
}: ReferralDashboardProps) {
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const copyToClipboard = async (text: string, isCode: boolean = false) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isCode) {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(
      `🚀 Learning to build Web3 apps with Zero to Crypto Dev! Join me and start your journey:\n\n${referralLink}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    const url = encodeURIComponent(referralLink);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      '_blank'
    );
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Join me on Zero to Crypto Dev!');
    const body = encodeURIComponent(
      `Hey!\n\nI'm learning to build Web3 applications with Zero to Crypto Dev and thought you might be interested.\n\nSign up using my referral link: ${referralLink}\n\nSee you there!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{stats.referral_count}</div>
              <p className="text-sm text-muted-foreground mt-1">Friends Referred</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-500">{stats.total_points}</div>
              <p className="text-sm text-muted-foreground mt-1">Points Earned</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-500">100</div>
              <p className="text-sm text-muted-foreground mt-1">Points per Referral</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code & Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🔗</span>
            Your Referral Link
          </CardTitle>
          <CardDescription>
            Share this link with friends. When they sign up, you'll both get rewards!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Referral Code */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Your Referral Code
            </label>
            <div className="flex gap-2">
              <Input
                value={referralCode}
                readOnly
                className="font-mono text-lg tracking-wider"
              />
              <Button
                variant="outline"
                onClick={() => copyToClipboard(referralCode, true)}
                className="shrink-0"
              >
                {copiedCode ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Referral Link */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Full Referral Link
            </label>
            <div className="flex gap-2">
              <Input
                value={referralLink}
                readOnly
                className="text-sm"
              />
              <Button
                onClick={() => copyToClipboard(referralLink)}
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="pt-4">
            <label className="text-sm font-medium text-muted-foreground mb-3 block">
              Share via
            </label>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={shareOnTwitter} className="flex-1 min-w-[120px]">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Twitter/X
              </Button>
              <Button variant="outline" onClick={shareOnLinkedIn} className="flex-1 min-w-[120px]">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </Button>
              <Button variant="outline" onClick={shareViaEmail} className="flex-1 min-w-[120px]">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referred Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>👥</span>
            People You've Referred
          </CardTitle>
          <CardDescription>
            Track who joined using your referral link
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referredUsers.length > 0 ? (
            <div className="space-y-3">
              {referredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg">
                        {user.display_name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user.display_name || 'Anonymous'}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {formatDate(user.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                      +{user.reward_points} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-muted-foreground">
                No referrals yet. Share your link to get started!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rewards History */}
      {rewards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🏆</span>
              Rewards History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {reward.reward_type === 'signup_bonus' ? '🎉' : '⭐'}
                    </span>
                    <div>
                      <p className="text-sm font-medium">
                        {reward.reward_type === 'signup_bonus'
                          ? 'Signup Bonus'
                          : 'Milestone Bonus'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {reward.profiles?.display_name || 'A friend'} joined
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-green-500">+{reward.points} pts</span>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(reward.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>❓</span>
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <h4 className="font-medium mb-1">Share Your Link</h4>
              <p className="text-sm text-muted-foreground">
                Copy your unique referral link and share it with friends
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
              <h4 className="font-medium mb-1">Friend Signs Up</h4>
              <p className="text-sm text-muted-foreground">
                When they create an account using your link, they're linked to you
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <h4 className="font-medium mb-1">Earn Rewards</h4>
              <p className="text-sm text-muted-foreground">
                You get 100 points for each friend who joins!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
