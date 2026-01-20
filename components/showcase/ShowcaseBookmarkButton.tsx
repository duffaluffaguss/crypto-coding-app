'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface ShowcaseBookmarkButtonProps {
  projectId: string;
  isLoggedIn: boolean;
}

export function ShowcaseBookmarkButton({ projectId, isLoggedIn }: ShowcaseBookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (isLoggedIn) {
      checkBookmarkStatus();
    }
  }, [projectId, isLoggedIn]);

  const checkBookmarkStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_type', 'project')
      .eq('item_id', projectId)
      .single();

    setIsBookmarked(!!data);
  };

  const handleToggle = async () => {
    if (!isLoggedIn) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isBookmarked) {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('item_type', 'project')
          .eq('item_id', projectId);
        setIsBookmarked(false);
      } else {
        await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            item_type: 'project',
            item_id: projectId,
          });
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={isBookmarked ? 'default' : 'outline'}
      className="w-full gap-2"
      onClick={handleToggle}
      disabled={loading}
    >
      <svg
        className={`w-5 h-5 transition-transform ${isBookmarked ? 'scale-110' : ''}`}
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
      {isBookmarked ? 'Saved' : 'Save'}
    </Button>
  );
}
