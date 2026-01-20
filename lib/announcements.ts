import { changelog, CURRENT_VERSION } from './changelog';

export type AnnouncementPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Announcement {
  id: string;
  version: string;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  isMajorRelease: boolean;
  highlights?: {
    icon: 'sparkles' | 'rocket' | 'trophy' | 'zap' | 'gift' | 'star';
    title: string;
    description: string;
  }[];
  link?: {
    text: string;
    href: string;
  };
  expiresAt?: string; // ISO date string
}

// Announcements array - newest first
// Major releases (x.0.0 or x.y.0) will show as modals
export const announcements: Announcement[] = [
  {
    id: 'v1.4.0-release',
    version: '1.4.0',
    title: '🎉 Major Update: Achievements & Social Features',
    message: 'Earn badges, show off your profile, and compete on the leaderboard!',
    priority: 'high',
    isMajorRelease: true,
    highlights: [
      {
        icon: 'trophy',
        title: 'Achievement System',
        description: 'Earn 15+ badges as you learn and build projects',
      },
      {
        icon: 'star',
        title: 'User Profiles',
        description: 'Customize your profile and showcase your work',
      },
      {
        icon: 'zap',
        title: 'Learning Streaks',
        description: 'Build habits with daily streak tracking',
      },
      {
        icon: 'gift',
        title: 'Referral Program',
        description: 'Invite friends and track your referrals',
      },
    ],
    link: {
      text: 'See full changelog',
      href: '/changelog',
    },
  },
  {
    id: 'v1.3.0-release',
    version: '1.3.0',
    title: '🤖 AI Tutor Just Got Smarter',
    message: 'The AI tutor now understands your project context for better help.',
    priority: 'medium',
    isMajorRelease: true,
    highlights: [
      {
        icon: 'sparkles',
        title: 'Context-Aware AI',
        description: 'AI tutor that understands your specific project',
      },
      {
        icon: 'rocket',
        title: 'Code Snippets',
        description: 'Library of common Solidity patterns',
      },
    ],
    link: {
      text: 'Learn more',
      href: '/changelog',
    },
  },
];

// LocalStorage keys
const BANNER_DISMISSED_KEY = 'announcement_banner_dismissed';
const MODAL_SEEN_KEY = 'announcement_modal_seen';
const LAST_SEEN_VERSION_KEY = 'announcement_last_seen_version';

// Get the latest announcement that should be shown
export function getLatestAnnouncement(): Announcement | null {
  const now = new Date();
  return announcements.find(a => {
    if (a.expiresAt && new Date(a.expiresAt) < now) return false;
    return true;
  }) || null;
}

// Get latest major release announcement
export function getLatestMajorAnnouncement(): Announcement | null {
  const now = new Date();
  return announcements.find(a => {
    if (!a.isMajorRelease) return false;
    if (a.expiresAt && new Date(a.expiresAt) < now) return false;
    return true;
  }) || null;
}

// Check if banner should be shown (client-side only)
export function shouldShowBanner(): boolean {
  if (typeof window === 'undefined') return false;
  
  const latest = getLatestAnnouncement();
  if (!latest) return false;
  
  const dismissedId = localStorage.getItem(BANNER_DISMISSED_KEY);
  return dismissedId !== latest.id;
}

// Check if modal should be shown (client-side only)
export function shouldShowModal(): boolean {
  if (typeof window === 'undefined') return false;
  
  const latest = getLatestMajorAnnouncement();
  if (!latest) return false;
  
  const seenId = localStorage.getItem(MODAL_SEEN_KEY);
  return seenId !== latest.id;
}

// Dismiss the banner
export function dismissBanner(): void {
  if (typeof window === 'undefined') return;
  
  const latest = getLatestAnnouncement();
  if (latest) {
    localStorage.setItem(BANNER_DISMISSED_KEY, latest.id);
  }
}

// Mark modal as seen
export function markModalSeen(): void {
  if (typeof window === 'undefined') return;
  
  const latest = getLatestMajorAnnouncement();
  if (latest) {
    localStorage.setItem(MODAL_SEEN_KEY, latest.id);
    localStorage.setItem(LAST_SEEN_VERSION_KEY, latest.version);
  }
}

// Get last seen version
export function getLastSeenVersion(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_SEEN_VERSION_KEY);
}

// Check if user has seen any version
export function hasSeenAnyVersion(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(LAST_SEEN_VERSION_KEY) !== null;
}

// Get priority color classes
export function getPriorityColor(priority: AnnouncementPriority): string {
  switch (priority) {
    case 'critical':
      return 'bg-red-500/10 border-red-500/30 text-red-400';
    case 'high':
      return 'bg-primary/10 border-primary/30 text-primary';
    case 'medium':
      return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
    case 'low':
    default:
      return 'bg-muted border-border text-muted-foreground';
  }
}

// Get icon component name based on icon type
export function getIconSvg(icon: string): string {
  switch (icon) {
    case 'sparkles':
      return 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z';
    case 'rocket':
      return 'M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z';
    case 'trophy':
      return 'M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0116.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228M18.75 4.236V2.721';
    case 'zap':
      return 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z';
    case 'gift':
      return 'M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z';
    case 'star':
      return 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z';
    default:
      return 'M12 6v6m0 0v6m0-6h6m-6 0H6';
  }
}
