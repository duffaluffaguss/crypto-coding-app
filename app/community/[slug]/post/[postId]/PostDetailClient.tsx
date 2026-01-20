'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, ThumbsUp, Pin, CheckCircle2, MessageSquare, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ReplyCard } from '@/components/community/ReplyCard';
import { ReplyFilters } from '@/components/community/ReplyFilters';
import { sortReplies, filterExpertReplies, type ReplySortOption, type ExpertLevel } from '@/lib/experts';
import type { ProjectType } from '@/types';

const POST_TYPE_STYLES: Record<string, { label: string; className: string }> = {
  discussion: { label: 'Discussion', className: 'bg-blue-500/10 text-blue-500' },
  question: { label: 'Question', className: 'bg-yellow-500/10 text-yellow-500' },
  announcement: { label: 'Announcement', className: 'bg-purple-500/10 text-purple-500' },
  showcase: { label: 'Showcase', className: 'bg-green-500/10 text-green-500' },
};

interface Reply {
  id: string;
  content: string;
  upvotes: number;
  is_accepted: boolean;
  created_at: string;
  author_id: string;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
  expertLevel: ExpertLevel | null;
  completedThisLesson: boolean;
  deployedProjectsCount: number;
  reputationScore: number;
}

interface PostDetailClientProps {
  community: {
    id: string;
    name: string;
    slug: string;
    projectType: ProjectType | null;
  };
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
    author_id: string;
    profiles: { display_name: string | null; avatar_url: string | null } | null;
  };
  initialReplies: Reply[];
  currentUserId: string | null;
  isMember: boolean;
  topicName?: string;
}

export function PostDetailClient({
  community,
  post,
  initialReplies,
  currentUserId,
  isMember,
  topicName,
}: PostDetailClientProps) {
  const [replies, setReplies] = useState(initialReplies);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<ReplySortOption>('votes');
  const [showExpertsOnly, setShowExpertsOnly] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  const typeStyle = POST_TYPE_STYLES[post.post_type] || POST_TYPE_STYLES.discussion;
  const isPostAuthor = currentUserId === post.author_id;

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Filter and sort replies
  const processedReplies = (() => {
    let result = [...replies];
    if (showExpertsOnly) {
      result = filterExpertReplies(result);
    }
    return sortReplies(result, sortBy);
  })();

  const expertRepliesCount = filterExpertReplies(replies).length;

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !currentUserId) {
      toast.error('Please sign in to reply');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('community_replies').insert({
        post_id: post.id,
        author_id: currentUserId,
        content: replyContent.trim(),
      });

      if (error) throw error;

      setReplyContent('');
      toast.success('Reply posted!');
      startTransition(() => router.refresh());
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (replyId: string) => {
    if (!currentUserId) {
      toast.error('Please sign in to upvote');
      return;
    }

    // Optimistic update
    setReplies((prev) =>
      prev.map((r) => (r.id === replyId ? { ...r, upvotes: r.upvotes + 1 } : r))
    );

    try {
      const { error } = await supabase.rpc('increment_reply_upvotes', {
        reply_id: replyId,
      });
      if (error) throw error;
    } catch (error) {
      // Revert on error
      setReplies((prev) =>
        prev.map((r) => (r.id === replyId ? { ...r, upvotes: r.upvotes - 1 } : r))
      );
      toast.error('Failed to upvote');
    }
  };

  const handleAcceptAnswer = async (replyId: string) => {
    if (!isPostAuthor || post.post_type !== 'question') return;

    try {
      const { error } = await supabase
        .from('community_replies')
        .update({ is_accepted: true })
        .eq('id', replyId);

      if (error) throw error;

      await supabase
        .from('community_posts')
        .update({ is_answered: true })
        .eq('id', post.id);

      setReplies((prev) =>
        prev.map((r) => ({
          ...r,
          is_accepted: r.id === replyId ? true : false,
        }))
      );
      toast.success('Answer accepted!');
    } catch (error) {
      toast.error('Failed to accept answer');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="container mx-auto px-4 pt-4">
        <Link href={`/community/${community.slug}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to {community.name}
          </Button>
        </Link>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Post */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">{post.upvotes}</span>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {post.is_pinned && <Pin className="h-4 w-4 text-primary" />}
                  <Badge variant="secondary" className={typeStyle.className}>
                    {typeStyle.label}
                  </Badge>
                  {post.is_answered && post.post_type === 'question' && (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/30 gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Answered
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl font-bold mb-2">{post.title}</h1>

                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={post.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(post.profiles?.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{post.profiles?.display_name || 'Anonymous'}</span>
                  </div>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{post.content}</p>
            </div>
          </CardContent>
        </Card>

        {/* Replies Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
            </h2>
          </div>

          {/* Filters */}
          {replies.length > 0 && (
            <ReplyFilters
              sortBy={sortBy}
              onSortChange={setSortBy}
              showExpertsOnly={showExpertsOnly}
              onExpertsOnlyChange={setShowExpertsOnly}
              totalReplies={replies.length}
              expertRepliesCount={expertRepliesCount}
            />
          )}

          {/* Reply Form */}
          {isMember ? (
            <Card>
              <CardContent className="p-4">
                <Textarea
                  placeholder="Write your reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[100px] mb-3"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitReply}
                    disabled={isSubmitting || !replyContent.trim()}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Post Reply
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : currentUserId ? (
            <Card className="p-4 text-center text-muted-foreground">
              Join the community to reply
            </Card>
          ) : (
            <Card className="p-4 text-center text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>{' '}
              to reply
            </Card>
          )}

          {/* Replies List */}
          <div className="space-y-3">
            {processedReplies.map((reply) => (
              <ReplyCard
                key={reply.id}
                reply={reply}
                expertLevel={reply.expertLevel}
                completedThisLesson={reply.completedThisLesson}
                deployedProjectsCount={reply.deployedProjectsCount}
                reputationScore={reply.reputationScore}
                topicName={topicName}
                isQuestionAuthor={isPostAuthor && post.post_type === 'question'}
                isReplyAuthor={currentUserId === reply.author_id}
                onUpvote={handleUpvote}
                onAcceptAnswer={handleAcceptAnswer}
              />
            ))}

            {processedReplies.length === 0 && replies.length > 0 && showExpertsOnly && (
              <Card className="p-8 text-center text-muted-foreground">
                <p>No expert replies yet.</p>
                <Button
                  variant="link"
                  onClick={() => setShowExpertsOnly(false)}
                  className="mt-2"
                >
                  Show all replies
                </Button>
              </Card>
            )}

            {replies.length === 0 && (
              <Card className="p-8 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No replies yet. Be the first to respond!</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
