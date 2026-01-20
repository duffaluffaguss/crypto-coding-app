'use client';

import { cn } from '@/lib/utils';
import type { CertificateData } from './Certificate';

interface NFTPreviewProps {
  data: CertificateData;
  className?: string;
  showBadge?: boolean;
}

const PROJECT_TYPE_LABELS: Record<string, string> = {
  nft_marketplace: 'NFT Marketplace',
  token: 'Token',
  dao: 'DAO',
  game: 'Game',
  social: 'Social Platform',
  creator: 'Creator Economy',
};

export function NFTPreview({ data, className, showBadge = true }: NFTPreviewProps) {
  const isDeployed = !!data.contractAddress;

  return (
    <div className={cn('relative group', className)}>
      {/* Animated glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-75 blur-lg group-hover:opacity-100 transition duration-500 animate-pulse" />
      
      {/* Animated border */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl animate-gradient-xy" />
      
      {/* NFT Card */}
      <div className="relative bg-zinc-900 rounded-xl overflow-hidden">
        {/* Badge */}
        {showBadge && (
          <div className="absolute top-3 right-3 z-10">
            <div className="px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-xs font-bold text-white shadow-lg">
              NFT
            </div>
          </div>
        )}

        {/* Main content area - mimics the certificate */}
        <div className="aspect-square p-6 flex flex-col items-center justify-between text-center">
          {/* Header */}
          <div className="space-y-2">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Certificate of Completion
            </h3>
          </div>

          {/* Center content */}
          <div className="space-y-3 flex-1 flex flex-col items-center justify-center">
            {/* User name with gradient */}
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              {data.userName}
            </h2>

            {/* Project name */}
            <div>
              <h4 className="text-lg font-semibold text-white">
                {data.projectName}
              </h4>
              <span className="inline-block mt-2 px-3 py-1 text-xs rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {PROJECT_TYPE_LABELS[data.projectType] || data.projectType.replace('_', ' ')}
              </span>
            </div>

            {/* Deployed badge */}
            {isDeployed && (
              <div className="flex items-center gap-1.5 text-xs text-green-400">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Deployed on Base</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">
              {data.completionDate}
            </p>
            <p className="text-[10px] text-zinc-600 font-mono">
              {data.certificateId}
            </p>
          </div>
        </div>

        {/* Animated shine effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-purple-500/50 rounded-tl-lg" />
      <div className="absolute -top-2 -right-2 w-4 h-4 border-r-2 border-t-2 border-purple-500/50 rounded-tr-lg" />
      <div className="absolute -bottom-2 -left-2 w-4 h-4 border-l-2 border-b-2 border-purple-500/50 rounded-bl-lg" />
      <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-purple-500/50 rounded-br-lg" />
    </div>
  );
}

// Compact NFT preview for smaller displays
export function NFTPreviewCompact({ data, className }: NFTPreviewProps) {
  return (
    <div className={cn('relative group', className)}>
      {/* Glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg opacity-50 blur group-hover:opacity-75 transition duration-300" />
      
      {/* Card */}
      <div className="relative bg-zinc-900 rounded-lg p-4 flex items-center gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
          <svg
            className="w-6 h-6 text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white truncate">{data.projectName}</h4>
          <p className="text-sm text-zinc-400 truncate">{data.userName}</p>
        </div>

        {/* NFT Badge */}
        <div className="px-2 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full text-xs font-medium text-amber-400">
          NFT
        </div>
      </div>
    </div>
  );
}

NFTPreview.displayName = 'NFTPreview';
NFTPreviewCompact.displayName = 'NFTPreviewCompact';
