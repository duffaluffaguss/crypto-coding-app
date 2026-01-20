'use client';

import { UserAvatar } from './UserAvatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LeagueBadge } from '@/components/leaderboard/LeagueBadge';
import { SocialVerificationList } from '@/components/verification/SocialVerifyButton';
import { VerificationBadges } from '@/components/verification/VerificationBadges';
import { MentorBadge } from '@/components/mentors/MentorBadge';
import { cn, formatDate } from '@/lib/utils';

interface ProfileStats {
  projectsCreated: number;
  lessonsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  achievementPoints: number;
}

interface SocialLinks {
  websiteUrl?: string | null;
  twitterHandle?: string | null;
  githubUsername?: string | null;
  discordUsername?: string | null;
}

interface ProfileCardProps {
  displayName?: string | null;
  email?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  socialLinks?: SocialLinks;
  memberSince: string;
  stats: ProfileStats;
  isOwnProfile?: boolean;
  className?: string;
  pointsRank?: number | null;
  userId: string;
}

export function ProfileCard({
  displayName,
  email,
  bio,
  avatarUrl,
  socialLinks,
  memberSince,
  stats,
  isOwnProfile = false,
  className,
  pointsRank,
  userId,
}: ProfileCardProps) {
  const hasSocialLinks = socialLinks?.websiteUrl || socialLinks?.twitterHandle || socialLinks?.githubUsername || socialLinks?.discordUsername;

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header with gradient background */}
      <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-background" />
      
      <CardHeader className="relative pb-0 -mt-12">
        <div className="flex items-end gap-4">
          <UserAvatar
            displayName={displayName}
            email={email}
            avatarUrl={avatarUrl}
            size="xl"
            className="ring-4 ring-background"
          />
          <div className="flex-1 min-w-0 pb-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold truncate">
                {displayName || 'Anonymous'}
              </h2>
              {pointsRank && <LeagueBadge rank={pointsRank} size="sm" />}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <VerificationBadges userId={userId} size="sm" maxBadges={4} />
              <MentorBadge userId={userId} size="sm" />
            </div>
            {isOwnProfile && email && (
              <p className="text-sm text-muted-foreground truncate">{email}</p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Bio Section */}
        {bio && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
              {bio}
            </p>
          </div>
        )}

        {/* Verified Social Accounts */}
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2 text-muted-foreground">Verified Accounts</h3>
          <SocialVerificationList userId={userId} />
        </div>

        {/* Social Links */}
        {hasSocialLinks && (
          <div className="flex flex-wrap gap-3 mb-6">
            {socialLinks?.websiteUrl && (
              <SocialLink
                href={socialLinks.websiteUrl}
                icon={<GlobeIcon />}
                label={getDomainFromUrl(socialLinks.websiteUrl)}
              />
            )}
            {socialLinks?.twitterHandle && (
              <SocialLink
                href={`https://x.com/${socialLinks.twitterHandle}`}
                icon={<XIcon />}
                label={`@${socialLinks.twitterHandle}`}
              />
            )}
            {socialLinks?.githubUsername && (
              <SocialLink
                href={`https://github.com/${socialLinks.githubUsername}`}
                icon={<GitHubIcon />}
                label={socialLinks.githubUsername}
              />
            )}
            {socialLinks?.discordUsername && (
              <SocialLink
                href={`https://discord.com/users/${socialLinks.discordUsername}`}
                icon={<DiscordIcon />}
                label={socialLinks.discordUsername}
              />
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon="📁"
            label="Projects"
            value={stats.projectsCreated}
          />
          <StatCard
            icon="📚"
            label="Lessons"
            value={stats.lessonsCompleted}
          />
          <StatCard
            icon="🔥"
            label="Current Streak"
            value={stats.currentStreak}
            suffix="days"
          />
          <StatCard
            icon="🏆"
            label="Points"
            value={stats.achievementPoints}
          />
        </div>

        {/* Additional Info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-border pt-4">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Member since {formatDate(memberSince)}</span>
          </div>
          {stats.longestStreak > 0 && (
            <div className="flex items-center gap-1.5">
              <span>⚡</span>
              <span>Best streak: {stats.longestStreak} days</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  suffix?: string;
}

function StatCard({ icon, label, value, suffix }: StatCardProps) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">
        {label}
        {suffix && <span className="ml-1">{suffix}</span>}
      </div>
    </div>
  );
}

interface SocialLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

function SocialLink({ href, icon, label }: SocialLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {icon}
      <span className="truncate max-w-[150px]">{label}</span>
    </a>
  );
}

// Helper function to extract domain from URL
function getDomainFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// Icon Components
function GlobeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.010c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}
