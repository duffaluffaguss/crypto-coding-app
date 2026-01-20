'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
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
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-xl mx-auto text-center">
          {/* Critical error illustration */}
          <div className="relative mb-8">
            <div className="w-40 h-40 mx-auto relative">
              {/* Animated glitch effect */}
              <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
              <div className="absolute inset-4 bg-red-500/30 rounded-full animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-7xl" role="img" aria-label="Critical error">
                  💥
                </span>
              </div>
            </div>
            
            {/* Floating debris */}
            <div className="absolute top-1/4 left-1/4 animate-bounce opacity-60">
              <span className="text-2xl">⚡</span>
            </div>
            <div className="absolute top-1/3 right-1/4 animate-bounce opacity-40" style={{ animationDelay: '0.2s' }}>
              <span className="text-xl">🔥</span>
            </div>
            <div className="absolute bottom-1/4 left-1/3 animate-bounce opacity-50" style={{ animationDelay: '0.4s' }}>
              <span className="text-lg">💫</span>
            </div>
          </div>

          {/* Message */}
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-red-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
            Critical System Error
          </h1>
          <p className="text-lg text-slate-400 mb-2">
            The entire application encountered an unexpected error.
          </p>
          <p className="text-sm text-slate-500 mb-8">
            This is a critical error. Our engineering team has been automatically notified via Sentry.
          </p>

          {/* Error details */}
          <div className="bg-slate-900/50 rounded-lg p-4 mb-8 border border-red-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-mono text-slate-500">ERROR DETAILS</span>
            </div>
            <p className="text-sm font-mono text-red-400 break-all text-left">
              {error.message || 'An unexpected error occurred'}
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-slate-600 mt-2 text-left">
                Reference: {error.digest}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <button
              onClick={reset}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-base font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-lg hover:from-violet-500 hover:to-blue-500 transition-all hover:scale-105 shadow-lg shadow-violet-500/25"
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
              Reload Application
            </button>
            <a
              href="https://github.com/your-repo/crypto-coding-app/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-base font-semibold border border-slate-700 rounded-lg hover:bg-slate-800 transition-all text-slate-300"
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
          </div>

          {/* Status info */}
          <div className="bg-slate-900/30 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-slate-400">Error tracking active</span>
            </div>
            <p className="text-xs text-slate-600">
              This error has been automatically reported to our monitoring system.
              <br />
              You can also manually report it with additional context if needed.
            </p>
          </div>

          {/* Footer */}
          <p className="mt-8 text-xs text-slate-600">
            Zero to Crypto Dev • {new Date().getFullYear()}
          </p>
        </div>

        <style>{`
          @keyframes ping {
            75%, 100% {
              transform: scale(2);
              opacity: 0;
            }
          }
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
          @keyframes bounce {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-20px);
            }
          }
          .animate-ping {
            animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
          .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          .animate-bounce {
            animation: bounce 2s ease-in-out infinite;
          }
        `}</style>
      </body>
    </html>
  );
}
