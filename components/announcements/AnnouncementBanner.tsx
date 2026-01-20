'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  getLatestAnnouncement, 
  shouldShowBanner, 
  dismissBanner,
  getPriorityColor,
  type Announcement 
} from '@/lib/announcements';

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    // Check if we should show the banner
    if (shouldShowBanner()) {
      const latest = getLatestAnnouncement();
      if (latest) {
        setAnnouncement(latest);
        // Small delay for entrance animation
        setTimeout(() => setIsVisible(true), 100);
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      dismissBanner();
      setIsVisible(false);
      setAnnouncement(null);
    }, 300);
  };

  if (!announcement || !isVisible) return null;

  const colorClasses = getPriorityColor(announcement.priority);

  return (
    <div 
      className={`
        relative overflow-hidden border-b transition-all duration-300 ease-out
        ${colorClasses}
        ${isAnimatingOut ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'}
      `}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      
      <div className="container mx-auto px-4 py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* Content */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Icon */}
            <span className="shrink-0 text-lg">
              {announcement.title.split(' ')[0]}
            </span>
            
            {/* Message */}
            <p className="text-sm font-medium truncate">
              <span className="hidden sm:inline">{announcement.title.replace(/^[^\s]+\s/, '')}</span>
              <span className="sm:hidden">{announcement.message}</span>
              <span className="hidden md:inline text-muted-foreground ml-2">
                — {announcement.message}
              </span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {announcement.link && (
              <Link
                href={announcement.link.href}
                className="text-sm font-semibold hover:underline underline-offset-4 transition-colors hidden sm:inline-flex items-center gap-1"
              >
                {announcement.link.text}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
            
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="p-1 rounded-md hover:bg-white/10 transition-colors"
              aria-label="Dismiss announcement"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
