'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
};

const bgColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-red-500',
];

function getInitials(displayName?: string | null, email?: string | null): string {
  if (displayName) {
    const parts = displayName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }
  if (email) {
    const localPart = email.split('@')[0];
    return localPart.slice(0, 2).toUpperCase();
  }
  return '??';
}

function getColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bgColors[Math.abs(hash) % bgColors.length];
}

export function UserAvatar({
  displayName,
  email,
  avatarUrl,
  size = 'md',
  className,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(displayName, email);
  const colorKey = displayName || email || 'default';
  const bgColor = getColorFromString(colorKey);

  // If we have a valid avatar URL and the image hasn't errored, show it
  if (avatarUrl && !imageError) {
    return (
      <div
        className={cn(
          'relative rounded-full overflow-hidden bg-muted',
          sizeClasses[size],
          className
        )}
      >
        <img
          src={avatarUrl}
          alt={displayName || 'User avatar'}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Fallback to initials
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold text-white',
        sizeClasses[size],
        bgColor,
        className
      )}
    >
      {initials}
    </div>
  );
}
