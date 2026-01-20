'use client';

import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export interface CertificatePreviewData {
  courseName: string;
  userName: string;
  completionDate: Date | string;
  score?: number;
  pathId?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  lessonsCompleted?: number;
  totalLessons?: number;
}

interface CertificatePreviewProps {
  data: CertificatePreviewData;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const DIFFICULTY_BADGES: Record<string, { label: string; color: string }> = {
  beginner: { label: 'Beginner', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  intermediate: { label: 'Intermediate', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  advanced: { label: 'Advanced', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export function CertificatePreview({ 
  data, 
  className, 
  size = 'md',
  animated = true 
}: CertificatePreviewProps) {
  const formattedDate = typeof data.completionDate === 'string' 
    ? data.completionDate 
    : format(data.completionDate, 'MMMM d, yyyy');

  const sizeClasses = {
    sm: 'max-w-[280px]',
    md: 'max-w-[380px]',
    lg: 'max-w-[480px]',
  };

  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const difficultyBadge = data.difficulty ? DIFFICULTY_BADGES[data.difficulty] : null;

  return (
    <div className={cn('relative group', sizeClasses[size], className)}>
      {/* Animated glow effect */}
      {animated && (
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-75 blur-lg group-hover:opacity-100 transition duration-500 animate-pulse" />
      )}
      
      {/* Animated border */}
      <div className={cn(
        "absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl",
        animated && "animate-gradient-xy"
      )} />
      
      {/* NFT Card */}
      <div className="relative bg-zinc-900 rounded-xl overflow-hidden">
        {/* NFT Badge */}
        <div className="absolute top-3 right-3 z-10">
          <div className="px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            NFT
          </div>
        </div>

        {/* Main content area */}
        <div className={cn("aspect-square flex flex-col items-center justify-between text-center", paddingClasses[size])}>
          {/* Header */}
          <div className="space-y-2">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2">
              <div className={cn(
                "rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center",
                size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-10 h-10'
              )}>
                <svg
                  className={cn("text-white", size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6')}
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
            <h3 className={cn(
              "font-semibold text-zinc-400 uppercase tracking-wider",
              size === 'sm' ? 'text-[10px]' : size === 'md' ? 'text-xs' : 'text-sm'
            )}>
              Certificate of Completion
            </h3>
          </div>

          {/* Center content */}
          <div className="space-y-3 flex-1 flex flex-col items-center justify-center">
            {/* User name with gradient */}
            <h2 className={cn(
              "font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400",
              size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'
            )}>
              {data.userName}
            </h2>

            {/* Completion text */}
            <p className="text-zinc-400 text-xs">has successfully completed</p>

            {/* Course name */}
            <div>
              <h4 className={cn(
                "font-semibold text-white",
                size === 'sm' ? 'text-base' : size === 'md' ? 'text-lg' : 'text-xl'
              )}>
                {data.courseName}
              </h4>
              
              {/* Difficulty badge */}
              {difficultyBadge && (
                <span className={cn(
                  "inline-block mt-2 px-3 py-1 text-xs rounded-full border",
                  difficultyBadge.color
                )}>
                  {difficultyBadge.label}
                </span>
              )}
            </div>

            {/* Score */}
            {data.score !== undefined && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <StarIcon className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-zinc-300">
                    Score: <span className="font-bold text-yellow-500">{data.score}%</span>
                  </span>
                </div>
              </div>
            )}

            {/* Lessons completed */}
            {data.lessonsCompleted !== undefined && data.totalLessons !== undefined && (
              <div className="flex items-center gap-1 text-xs text-green-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{data.lessonsCompleted}/{data.totalLessons} lessons completed</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="space-y-1">
            <p className={cn("text-zinc-500", size === 'sm' ? 'text-[10px]' : 'text-xs')}>
              {formattedDate}
            </p>
            {data.pathId && (
              <p className="text-[10px] text-zinc-600 font-mono">
                ID: {data.pathId}
              </p>
            )}
          </div>
        </div>

        {/* Animated shine effect on hover */}
        {animated && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </div>
        )}
      </div>

      {/* Decorative corner elements */}
      <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-purple-500/50 rounded-tl-lg" />
      <div className="absolute -top-2 -right-2 w-4 h-4 border-r-2 border-t-2 border-purple-500/50 rounded-tr-lg" />
      <div className="absolute -bottom-2 -left-2 w-4 h-4 border-l-2 border-b-2 border-purple-500/50 rounded-bl-lg" />
      <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-purple-500/50 rounded-br-lg" />
    </div>
  );
}

// Compact preview for lists/galleries
export function CertificatePreviewCompact({ 
  data, 
  className,
  onClick 
}: CertificatePreviewProps & { onClick?: () => void }) {
  const formattedDate = typeof data.completionDate === 'string' 
    ? data.completionDate 
    : format(data.completionDate, 'MMM d, yyyy');

  return (
    <div 
      className={cn(
        'relative group cursor-pointer transition-all duration-300 hover:scale-[1.02]', 
        className
      )}
      onClick={onClick}
    >
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
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white truncate">{data.courseName}</h4>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="truncate">{data.userName}</span>
            <span>•</span>
            <span className="text-xs">{formattedDate}</span>
          </div>
        </div>

        {/* Score badge */}
        {data.score !== undefined && (
          <div className="px-2 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full text-xs font-medium text-amber-400">
            {data.score}%
          </div>
        )}

        {/* Arrow */}
        <svg className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

CertificatePreview.displayName = 'CertificatePreview';
CertificatePreviewCompact.displayName = 'CertificatePreviewCompact';
