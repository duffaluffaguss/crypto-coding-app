'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ThumbsUp, Pin, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    post_type: 'discussion' | 'question' | 'announcement' | 'showcase';
    upvotes: number;
    replies_count: number;
    is_pinned: boolean;
    is_answered: boolean;
    created_at: string;
    profiles: {
      display_name: string | null;
    } | null;
  };
  communitySlug: string;
}

const POST_TYPE_STYLES: Record<string, { label: string; className: string }> = {
  discussion: { label: 'Discussion', className: 'bg-blue-500/10 text-blue-500' },
  question: { label: 'Question', className: 'bg-yellow-500/10 text-yellow-500' },
  announcement: { label: 'Announcement', className: 'bg-purple-500/10 text-purple-500' },
  showcase: { label: 'Showcase', className: 'bg-green-500/10 text-green-500' },
};

export function PostCard({ post, communitySlug }: PostCardProps) {
  const typeStyle = POST_TYPE_STYLES[post.post_type] || POST_TYPE_STYLES.discussion;

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Upvotes */}
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <button className="hover:text-primary transition-colors p-1">
              <ThumbsUp className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium">{post.upvotes}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {post.is_pinned && (
                <Pin className="h-4 w-4 text-primary" />
              )}
              <Link
                href={`/community/${communitySlug}/post/${post.id}`}
                className="font-semibold hover:text-primary transition-colors line-clamp-1"
              >
                {post.title}
              </Link>
              {post.is_answered && post.post_type === 'question' && (
                <span className="flex items-center gap-1 text-xs text-green-500">
                  <CheckCircle2 className="h-3 w-3" />
                  Answered
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {post.content}
            </p>

            <div className="flex items-center gap-4 mt-3">
              <Badge variant="secondary" className={typeStyle.className}>
                {typeStyle.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                by {post.profiles?.display_name || 'Anonymous'}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                {post.replies_count} replies
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
