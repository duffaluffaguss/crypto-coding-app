'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CertificateData {
  certificateId: string;
  userName: string;
  projectName: string;
  projectType: string;
  completionDate: string;
  contractAddress?: string | null;
  network?: string | null;
}

interface CertificateProps {
  data: CertificateData;
  className?: string;
}

const PROJECT_TYPE_LABELS: Record<string, string> = {
  nft_marketplace: 'NFT Marketplace',
  token: 'Token',
  dao: 'DAO',
  game: 'Game',
  social: 'Social Platform',
  creator: 'Creator Economy',
};

export const Certificate = forwardRef<HTMLDivElement, CertificateProps>(
  ({ data, className }, ref) => {
    const isDeployed = !!data.contractAddress;

    return (
      <div
        ref={ref}
        className={cn(
          'relative w-full max-w-[800px] aspect-[1.414/1] bg-white dark:bg-zinc-900',
          'rounded-lg overflow-hidden shadow-2xl print:shadow-none',
          className
        )}
      >
        {/* Gradient Border */}
        <div className="absolute inset-0 p-[3px] bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-lg">
          <div className="w-full h-full bg-white dark:bg-zinc-900 rounded-[5px]" />
        </div>

        {/* Certificate Content */}
        <div className="absolute inset-[3px] flex flex-col items-center justify-between p-6 sm:p-10 text-center">
          {/* Header */}
          <div className="space-y-2">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <svg
                  className="w-6 h-6 sm:w-7 sm:h-7 text-white"
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
              <span className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
                Zero to Crypto Dev
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-800 dark:text-zinc-100">
              Certificate of Completion
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base">
              This certifies that
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-4 py-4">
            {/* User Name */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              {data.userName}
            </h2>

            <p className="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base max-w-md">
              has successfully completed the Web3 development project
            </p>

            {/* Project Name */}
            <div className="mt-4">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-zinc-800 dark:text-zinc-100">
                {data.projectName}
              </h3>
              <span className="inline-block mt-2 px-3 py-1 text-xs sm:text-sm rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                {PROJECT_TYPE_LABELS[data.projectType] || data.projectType.replace('_', ' ')}
              </span>
            </div>

            {/* Deployed Badge */}
            {isDeployed && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-green-500"
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
                <span className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                  Deployed to Base Network
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="w-full space-y-4">
            {/* Date */}
            <div className="text-zinc-500 dark:text-zinc-400 text-sm">
              Completed on{' '}
              <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                {data.completionDate}
              </span>
            </div>

            {/* Certificate ID & Contract */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs text-zinc-400 dark:text-zinc-500">
              <span>Certificate ID: {data.certificateId}</span>
              {isDeployed && (
                <span className="font-mono">
                  Contract: {data.contractAddress?.slice(0, 6)}...
                  {data.contractAddress?.slice(-4)}
                </span>
              )}
            </div>

            {/* Decorative Elements */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <div className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent to-purple-500/50" />
              <div className="w-2 h-2 rounded-full bg-purple-500/50" />
              <div className="h-px w-16 sm:w-24 bg-gradient-to-l from-transparent to-purple-500/50" />
            </div>
          </div>
        </div>

        {/* Corner Decorations */}
        <div className="absolute top-4 left-4 w-8 h-8 sm:w-12 sm:h-12 border-l-2 border-t-2 border-purple-500/30 rounded-tl-lg" />
        <div className="absolute top-4 right-4 w-8 h-8 sm:w-12 sm:h-12 border-r-2 border-t-2 border-purple-500/30 rounded-tr-lg" />
        <div className="absolute bottom-4 left-4 w-8 h-8 sm:w-12 sm:h-12 border-l-2 border-b-2 border-purple-500/30 rounded-bl-lg" />
        <div className="absolute bottom-4 right-4 w-8 h-8 sm:w-12 sm:h-12 border-r-2 border-b-2 border-purple-500/30 rounded-br-lg" />
      </div>
    );
  }
);

Certificate.displayName = 'Certificate';
