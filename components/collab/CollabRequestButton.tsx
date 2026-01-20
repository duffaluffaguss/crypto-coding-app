'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { HandHeart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CollabRequestModal } from './CollabRequestModal';

interface CollabRequestButtonProps {
  targetUserId: string;
  currentUserId?: string | null;
  targetUsername?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  disabled?: boolean;
}

export function CollabRequestButton({
  targetUserId,
  currentUserId,
  targetUsername,
  size = 'default',
  variant = 'default',
  className,
  disabled = false,
}: CollabRequestButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(() => {
    if (!currentUserId || disabled || isLoading) return;
    setIsModalOpen(true);
  }, [currentUserId, disabled, isLoading]);

  const handleRequestSent = useCallback(() => {
    setIsModalOpen(false);
    setIsLoading(false);
  }, []);

  // Don't show button if user is viewing own profile or not logged in
  if (!currentUserId || currentUserId === targetUserId) {
    return null;
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={cn(
          'transition-all duration-200',
          'hover:scale-105 hover:shadow-md',
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <HandHeart className="h-4 w-4 mr-2" />
        )}
        {size === 'sm' ? 'Collaborate' : 'Request to Collaborate'}
      </Button>

      <CollabRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetUserId={targetUserId}
        targetUsername={targetUsername}
        currentUserId={currentUserId}
        onRequestSent={handleRequestSent}
        onLoading={setIsLoading}
      />
    </>
  );
}

// Compact version for cards and lists
interface CollabRequestButtonCompactProps {
  targetUserId: string;
  currentUserId?: string | null;
  targetUsername?: string;
  onRequestSent?: () => void;
  className?: string;
}

export function CollabRequestButtonCompact({
  targetUserId,
  currentUserId,
  targetUsername,
  onRequestSent,
  className,
}: CollabRequestButtonCompactProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(() => {
    if (!currentUserId || isLoading) return;
    setIsModalOpen(true);
  }, [currentUserId, isLoading]);

  const handleRequestSent = useCallback(() => {
    setIsModalOpen(false);
    setIsLoading(false);
    onRequestSent?.();
  }, [onRequestSent]);

  if (!currentUserId || currentUserId === targetUserId) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          'h-8 px-3 text-xs',
          'border-primary/20 hover:border-primary/40',
          'hover:bg-primary/5',
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
        ) : (
          <HandHeart className="h-3 w-3 mr-1" />
        )}
        Collab
      </Button>

      <CollabRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetUserId={targetUserId}
        targetUsername={targetUsername}
        currentUserId={currentUserId}
        onRequestSent={handleRequestSent}
        onLoading={setIsLoading}
      />
    </>
  );
}