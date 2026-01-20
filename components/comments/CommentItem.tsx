'use client';

import { useState } from 'react';
import { UserAvatar } from '@/components/profile/UserAvatar';
import { Button } from '@/components/ui/button';
import { VerificationBadges } from '@/components/verification/VerificationBadges';
import { createClient } from '@/lib/supabase/client';

interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles: {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  };
  currentUserId?: string;
  onDelete: (commentId: string) => void;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function CommentItem({ comment, currentUserId, onDelete }: CommentItemProps) {
  const [deleting, setDeleting] = useState(false);
  const isOwnComment = currentUserId === comment.user_id;
  const supabase = createClient();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('project_comments')
        .delete()
        .eq('id', comment.id);

      if (error) throw error;
      onDelete(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex gap-3 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <UserAvatar
        displayName={comment.profiles?.display_name}
        avatarUrl={comment.profiles?.avatar_url}
        size="sm"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="font-medium text-sm truncate">
              {comment.profiles?.display_name || 'Anonymous'}
            </span>
            <VerificationBadges userId={comment.user_id} size="xs" maxBadges={2} />
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatRelativeTime(comment.created_at)}
            </span>
          </div>
          
          {isOwnComment && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            >
              {deleting ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </Button>
          )}
        </div>
        
        <p className="text-sm mt-1 whitespace-pre-wrap break-words">
          {comment.content}
        </p>
      </div>
    </div>
  );
}
