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

const MODAL_SEEN_KEY = 'seen_modal_announcements';

function getSeenModalIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(MODAL_SEEN_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function markModalSeen(id: string) {
  if (typeof window === 'undefined') return;
  const seen = getSeenModalIds();
  if (!seen.includes(id)) {
    seen.push(id);
    localStorage.setItem(MODAL_SEEN_KEY, JSON.stringify(seen));
  }
}

function getTypeStyles(type: AnnouncementType) {
  switch (type) {
    case 'warning':
      return {
        gradient: 'from-yellow-500/20 via-yellow-500/10',
        accent: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-500',
        icon: AlertTriangle,
      };
    case 'success':
      return {
        gradient: 'from-green-500/20 via-green-500/10',
        accent: 'bg-green-500/20 border-green-500/30 text-green-500',
        icon: CheckCircle,
      };
    case 'feature':
      return {
        gradient: 'from-purple-500/20 via-purple-500/10',
        accent: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
        icon: Sparkles,
      };
    case 'info':
    default:
      return {
        gradient: 'from-primary/20 via-primary/10',
        accent: 'bg-primary/20 border-primary/30 text-primary',
        icon: Info,
      };
  }
}

export function AnnouncementModal() {
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

        const seenIds = getSeenModalIds();
        
        // Find first high-priority unseen announcement (priority >= 10)
        const modal = announcements.find(
          (a: Announcement) => !seenIds.includes(a.id) && a.priority >= 10
        );
        
        if (modal) {
          setAnnouncement(modal);
          // Delay for page to load first
          setTimeout(() => setIsVisible(true), 500);
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
      markModalSeen(announcement.id);
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
        fixed inset-0 z-50 flex items-center justify-center p-4
        transition-all duration-300
        ${isAnimatingOut ? 'opacity-0' : 'opacity-100'}
      `}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div
        className={`
          relative bg-card border border-border rounded-2xl shadow-2xl
          max-w-lg w-full max-h-[90vh] overflow-hidden
          transition-all duration-300
          ${isAnimatingOut ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
        `}
      >
        {/* Header with gradient */}
        <div className={`relative bg-gradient-to-br ${styles.gradient} to-transparent p-6 pb-8`}>
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-background/50 transition-colors"
            aria-label="Close announcement"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Type badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium mb-4 ${styles.accent}`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
            </span>
            {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Icon className="w-6 h-6" />
            {announcement.title}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 pt-4">
          <p className="text-muted-foreground whitespace-pre-wrap">
            {announcement.content}
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <button
            onClick={handleDismiss}
            className="w-full px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors text-center"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
