'use client';

import { WifiOff, RefreshCw, Home, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Animated Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center border border-gray-700">
            <WifiOff className="w-16 h-16 text-gray-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-4">
          You&apos;re Offline
        </h1>

        {/* Description */}
        <p className="text-gray-400 mb-8 leading-relaxed">
          Looks like you&apos;ve lost your internet connection. Don&apos;t worry—some features are still available offline!
        </p>

        {/* Offline Features */}
        <div className="bg-gray-800/50 rounded-2xl p-6 mb-8 border border-gray-700/50 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center justify-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            Available Offline
          </h2>
          <ul className="text-left text-gray-300 space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              <span>Previously viewed lessons and content</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              <span>Downloaded code examples</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              <span>Your saved bookmarks</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-all hover:scale-105"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-all hover:scale-105"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
        </div>

        {/* Tips */}
        <div className="mt-12 text-sm text-gray-500">
          <p>💡 Tip: Make sure Wi-Fi or mobile data is enabled</p>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-500 rounded-full opacity-50 animate-ping" />
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-violet-500 rounded-full opacity-50 animate-ping delay-150" />
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-purple-400 rounded-full opacity-50 animate-ping delay-300" />
      </div>
    </div>
  );
}
