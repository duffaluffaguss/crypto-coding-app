'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  getLatestMajorAnnouncement, 
  shouldShowModal, 
  markModalSeen,
  getIconSvg,
  type Announcement 
} from '@/lib/announcements';

export function AnnouncementModal() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    // Check if we should show the modal
    if (shouldShowModal()) {
      const latest = getLatestMajorAnnouncement();
      if (latest) {
        setAnnouncement(latest);
        // Delay for page to load first
        setTimeout(() => setIsVisible(true), 500);
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      markModalSeen();
      setIsVisible(false);
      setAnnouncement(null);
    }, 300);
  };

  if (!announcement || !isVisible) return null;

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
        <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 pb-8">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-background/50 transition-colors"
            aria-label="Close announcement"
          >
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Version badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-sm font-medium text-primary mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Version {announcement.version}
          </div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold">
            {announcement.title.replace(/^[^\s]+\s/, '')}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {announcement.message}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 pt-4">
          {/* Highlights */}
          {announcement.highlights && announcement.highlights.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                What&apos;s New
              </h3>
              <div className="grid gap-3">
                {announcement.highlights.map((highlight, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <svg 
                        className="w-5 h-5 text-primary" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d={getIconSvg(highlight.icon)} />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">{highlight.title}</h4>
                      <p className="text-sm text-muted-foreground">{highlight.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors text-center"
          >
            Got it, thanks!
          </button>
          {announcement.link && (
            <Link
              href={announcement.link.href}
              onClick={handleDismiss}
              className="flex-1 px-6 py-3 border border-border font-semibold rounded-xl hover:bg-muted transition-colors text-center flex items-center justify-center gap-2"
            >
              {announcement.link.text}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
