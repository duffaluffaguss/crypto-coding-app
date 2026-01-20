'use client';

import { useState, useEffect } from 'react';
import { X, Info, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';

export type AnnouncementType = 'info' | 'warning' | 'success' | 'feature';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  priority: number;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
}

const DISMISSED_KEY = 'dismissed_announcements';

function getDismissedIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(DISMISSED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function dismissAnnouncement(id: string) {
  if (typeof window === 'undefined') return;
  const dismissed = getDismissedIds();
  if (!dismissed.includes(id)) {
    dismissed.push(id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
  }
}

function getTypeStyles(type: AnnouncementType) {
  switch (type) {
    case 'warning':
      return {
        bg: 'bg-yellow-500/10 border-yellow-500/30',
        text: 'text-yellow-500',
        icon: AlertTriangle,
      };
    case 'success':
      return {
        bg: 'bg-green-500/10 border-green-500/30',
        text: 'text-green-500',
        icon: CheckCircle,
      };
    case 'feature':
      return {
        bg: 'bg-purple-500/10 border-purple-500/30',
        text: 'text-purple-400',
        icon: Sparkles,
      };
    case 'info':
    default:
      return {
        bg: 'bg-blue-500/10 border-blue-500/30',
        text: 'text-blue-400',
        icon: Info,
      };
  }
}

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const res = await fetch('/api/announcements');
        if (!res.ok) return;
        
        const { announcements } = await res.json();
        if (!announcements?.length) return;

        const dismissedIds = getDismissedIds();
        
        // Find first non-dismissed, non-modal announcement (priority < 10)
        const banner = announcements.find(
          (a: Announcement) => !dismissedIds.includes(a.id) && a.priority < 10
        );
        
        if (banner) {
          setAnnouncement(banner);
          setTimeout(() => setIsVisible(true), 100);
        }
      } catch (error) {
        console.error('Failed to fetch announcements:', error);
      }
    }

    fetchAnnouncements();
  }, []);

  const handleDismiss = () => {
    if (!announcement) return;
    setIsAnimatingOut(true);
    setTimeout(() => {
      dismissAnnouncement(announcement.id);
      setIsVisible(false);
      setAnnouncement(null);
    }, 300);
  };

  if (!announcement || !isVisible) return null;

  const styles = getTypeStyles(announcement.type);
  const Icon = styles.icon;

  return (
    <div
      className={`
        relative overflow-hidden border-b transition-all duration-300 ease-out
        ${styles.bg} ${styles.text}
        ${isAnimatingOut ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'}
      `}
    >
      {/* Background shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />

      <div className="container mx-auto px-4 py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* Content */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Icon className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium truncate">
              <span className="font-semibold">{announcement.title}</span>
              <span className="hidden sm:inline text-muted-foreground ml-2">
                — {announcement.content}
              </span>
            </p>
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="p-1 rounded-md hover:bg-white/10 transition-colors shrink-0"
            aria-label="Dismiss announcement"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
