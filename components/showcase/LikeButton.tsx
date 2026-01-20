'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface LikeButtonProps {
  projectId: string;
  initialLikes: number;
  initialHasLiked: boolean;
  isLoggedIn: boolean;
}

export function LikeButton({
  projectId,
  initialLikes,
  initialHasLiked,
  isLoggedIn,
}: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLike = async () => {
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

      if (hasLiked) {
        // Unlike
        const { error } = await supabase
          .from('project_likes')
          .delete()
          .eq('project_id', projectId)
          .eq('user_id', user.id);

        if (!error) {
          setHasLiked(false);
          setLikes((prev) => Math.max(prev - 1, 0));
        }
      } else {
        // Like
        const { error } = await supabase
          .from('project_likes')
          .insert({
            project_id: projectId,
            user_id: user.id,
          });

        if (!error) {
          setHasLiked(true);
          setLikes((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={hasLiked ? 'default' : 'outline'}
      className="w-full gap-2"
      onClick={handleLike}
      disabled={loading}
    >
      <svg
        className={`w-5 h-5 transition-transform ${hasLiked ? 'scale-110' : ''}`}
        fill={hasLiked ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {hasLiked ? 'Liked' : 'Like'} ({likes})
    </Button>
  );
}
