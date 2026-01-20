'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export type BookmarkItemType = 'template' | 'project' | 'lesson' | 'snippet';

interface BookmarkButtonProps {
  itemType: BookmarkItemType;
  itemId: string;
  initialBookmarked?: boolean;
  isLoggedIn?: boolean;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost';
  showLabel?: boolean;
  className?: string;
  onToggle?: (isBookmarked: boolean) => void;
}

export function BookmarkButton({
  itemType,
  itemId,
  initialBookmarked = false,
  isLoggedIn = true,
  size = 'icon',
  variant = 'ghost',
  showLabel = false,
  className = '',
  onToggle,
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('item_type', itemType)
          .eq('item_id', itemId);

        if (!error) {
          setIsBookmarked(false);
          onToggle?.(false);
        }
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            item_type: itemType,
            item_id: itemId,
          });

        if (!error) {
          setIsBookmarked(true);
          onToggle?.(true);
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={isBookmarked ? 'default' : variant}
      size={size}
      className={`gap-2 ${isBookmarked ? 'text-primary-foreground' : ''} ${className}`}
      onClick={handleToggle}
      disabled={loading}
      title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      <svg
        className={`w-4 h-4 transition-transform ${isBookmarked ? 'scale-110' : ''}`}
        fill={isBookmarked ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      {showLabel && (isBookmarked ? 'Saved' : 'Save')}
    </Button>
  );
}

// Hook to check bookmark status
export function useBookmarkStatus(itemType: BookmarkItemType, itemId: string) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const checkStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsBookmarked(false);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .single();

      setIsBookmarked(!!data);
    } catch {
      setIsBookmarked(false);
    } finally {
      setLoading(false);
    }
  };

  return { isBookmarked, loading, checkStatus, setIsBookmarked };
}
