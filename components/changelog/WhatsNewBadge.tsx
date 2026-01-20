'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CURRENT_VERSION } from '@/lib/changelog';

const LAST_SEEN_VERSION_KEY = 'lastSeenVersion';

interface WhatsNewBadgeProps {
  className?: string;
}

export function WhatsNewBadge({ className = '' }: WhatsNewBadgeProps) {
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const lastSeenVersion = localStorage.getItem(LAST_SEEN_VERSION_KEY);
    if (!lastSeenVersion || lastSeenVersion !== CURRENT_VERSION) {
      setHasNewUpdates(true);
    }
  }, []);

  const markAsSeen = () => {
    localStorage.setItem(LAST_SEEN_VERSION_KEY, CURRENT_VERSION);
    setHasNewUpdates(false);
  };

  // Don't render anything during SSR to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  if (!hasNewUpdates) {
    return null;
  }

  return (
    <Link
      href="/changelog"
      onClick={markAsSeen}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors animate-pulse ${className}`}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
      What&apos;s New
    </Link>
  );
}

// Larger variant for prominent placement
export function WhatsNewBanner({ className = '' }: WhatsNewBadgeProps) {
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    const lastSeenVersion = localStorage.getItem(LAST_SEEN_VERSION_KEY);
    if (!lastSeenVersion || lastSeenVersion !== CURRENT_VERSION) {
      setHasNewUpdates(true);
    }
  }, []);

  const markAsSeen = () => {
    localStorage.setItem(LAST_SEEN_VERSION_KEY, CURRENT_VERSION);
    setHasNewUpdates(false);
  };

  const dismiss = () => {
    setDismissed(true);
  };

  if (!mounted || !hasNewUpdates || dismissed) {
    return null;
  }

  return (
    <div className={`relative rounded-lg border border-primary/20 bg-primary/5 p-4 ${className}`}>
      <button
        onClick={dismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-primary/10 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">New updates available!</h4>
          <p className="text-sm text-muted-foreground mt-0.5">
            Check out the latest features and improvements in v{CURRENT_VERSION}.
          </p>
          <Link
            href="/changelog"
            onClick={markAsSeen}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline mt-2"
          >
            See what&apos;s new
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
