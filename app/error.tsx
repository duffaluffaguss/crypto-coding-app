'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary flex items-center justify-center p-4">
      <div className="max-w-xl mx-auto text-center">
        {/* Animated error illustration */}
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto bg-destructive/10 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-24 h-24 bg-destructive/20 rounded-full flex items-center justify-center">
              <span className="text-6xl animate-wiggle" role="img" aria-label="Error">
                😵
              </span>
            </div>
          </div>
          {/* Floating error symbols */}
          <div className="absolute top-0 left-1/4 animate-float">
            <span className="text-2xl text-destructive/60">⚠️</span>
          </div>
          <div className="absolute bottom-0 right-1/4 animate-float-delayed">
            <span className="text-xl text-muted-foreground/60">🔧</span>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
          Oops! Something Went Wrong
        </h1>
        <p className="text-lg text-muted-foreground mb-2">
          Don&apos;t worry, even smart contracts fail sometimes.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Our team has been notified and is working on it.
        </p>

        {/* Error details (development mode) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-destructive/10 rounded-lg p-4 mb-8 text-left">
            <p className="text-sm font-mono text-destructive break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-muted-foreground mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <button
            onClick={reset}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-base font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all hover:scale-105 shadow-lg shadow-primary/25"
          >
            <svg
              className="mr-2 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Try Again
          </button>
          <a
            href="https://github.com/your-repo/crypto-coding-app/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-base font-semibold border border-border rounded-lg hover:bg-card transition-all"
          >
            <svg
              className="mr-2 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Report Issue
          </a>
          <a
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-base font-semibold border border-border rounded-lg hover:bg-card transition-all"
          >
            <svg
              className="mr-2 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Go Home
          </a>
        </div>

        {/* Helpful tips */}
        <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border">
          <h3 className="font-semibold mb-3">Things you can try:</h3>
          <ul className="text-sm text-muted-foreground space-y-2 text-left">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Refresh the page and try again
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Check your internet connection
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Clear your browser cache
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              If the problem persists, report the issue
            </li>
          </ul>
        </div>
      </div>

      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-wiggle {
          animation: wiggle 1s ease-in-out infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 3s ease-in-out infinite 0.5s;
        }
      `}</style>
    </main>
  );
}
