'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CommentItem } from './CommentItem';
import { createClient } from '@/lib/supabase/client';

interface CommentProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: CommentProfile | CommentProfile[] | null;
}

// Helper to normalize profile data from Supabase (can be array or object)
function normalizeProfile(profiles: CommentProfile | CommentProfile[] | null): CommentProfile | null {
  if (!profiles) return null;
  if (Array.isArray(profiles)) return profiles[0] || null;
  return profiles;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseComment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: CommentProfile | CommentProfile[] | null;
};

interface CommentSectionProps {
  projectId: string;
  initialComments: SupabaseComment[];
  isLoggedIn: boolean;
  currentUserId?: string;
}

const MAX_COMMENT_LENGTH = 500;

export function CommentSection({
  projectId,
  initialComments,
  isLoggedIn,
  currentUserId,
}: CommentSectionProps) {
  const [comments, setComments] = useState<SupabaseComment[]>(initialComments);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const charactersRemaining = MAX_COMMENT_LENGTH - content.length;
  const isOverLimit = charactersRemaining < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setError('Comment cannot be empty');
      return;
    }

    if (trimmedContent.length > MAX_COMMENT_LENGTH) {
      setError(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: comment, error: insertError } = await supabase
        .from('project_comments')
        .insert({
          project_id: projectId,
          user_id: user.id,
          content: trimmedContent,
        })
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles (
            id,
            display_name,
            avatar_url
          )
        `)
        .single();

      if (insertError) throw insertError;

      if (comment) {
        setComments((prev) => [comment as SupabaseComment, ...prev]);
        setContent('');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      setError('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment Form */}
        {isLoggedIn ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add a comment..."
                className="w-full min-h-[100px] p-3 rounded-lg border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                disabled={submitting}
              />
              <div className={`absolute bottom-2 right-2 text-xs ${
                isOverLimit ? 'text-destructive' : charactersRemaining < 50 ? 'text-yellow-500' : 'text-muted-foreground'
              }`}>
                {charactersRemaining}
              </div>
            </div>
            
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={submitting || isOverLimit || !content.trim()}
              >
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Posting...
                  </>
                ) : (
                  'Post Comment'
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Sign in to leave a comment
            </p>
            <Button
              size="sm"
              onClick={() => router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))}
            >
              Sign In
            </Button>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-3">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={{
                  ...comment,
                  profiles: normalizeProfile(comment.profiles),
                }}
                currentUserId={currentUserId}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
