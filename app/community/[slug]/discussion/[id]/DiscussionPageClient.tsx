'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReplyForm } from '@/components/community/ReplyForm';
import {
  ArrowLeft,
  ArrowUp,
  Check,
  CheckCircle,
  BookOpen,
  MessageSquare,
  Calendar,
  User,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';

interface Discussion {
  id: string;
  title: string;
  content: string;
  lesson_id: string | null;
  is_question: boolean;
  is_answered: boolean;
  upvotes: number;
  created_at: string;
  author_id: string;
  profiles: {
    display_name: string | null;
  };
  communities: {
    id: string;
    name: string;
    slug: string;
    icon: string;
  };
  lessons?: {
    id: string;
    title: string;
    order: number;
  } | null;
}

interface Reply {
  id: string;
  content: string;
  is_accepted_answer: boolean;
  upvotes: number;
  created_at: string;
  author_id: string;
  profiles: {
    display_name: string | null;
  };
}

interface User {
  id: string;
  email?: string;
}

interface DiscussionPageClientProps {
  discussion: Discussion;
  replies: Reply[];
  user: User | null;
  isMember: boolean;
  isAuthor: boolean;
}

export function DiscussionPageClient({
  discussion,
  replies: initialReplies,
  user,
  isMember,
  isAuthor,
}: DiscussionPageClientProps) {
  const [replies, setReplies] = useState(initialReplies);
  const [discussionData, setDiscussionData] = useState(discussion);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  const handleUpvoteDiscussion = async () => {
    if (!user) {
      toast.error('Please sign in to upvote');
      return;
    }

    try {
      const { error } = await supabase
        .from('discussions')
        .update({ upvotes: discussionData.upvotes + 1 })
        .eq('id', discussionData.id);

      if (error) throw error;

      setDiscussionData(prev => ({ ...prev, upvotes: prev.upvotes + 1 }));
      toast.success('Upvoted!');
    } catch (error) {
      console.error('Error upvoting discussion:', error);
      toast.error('Failed to upvote');
    }
  };

  const handleUpvoteReply = async (replyId: string) => {
    if (!user) {
      toast.error('Please sign in to upvote');
      return;
    }

    try {
      const reply = replies.find(r => r.id === replyId);
      if (!reply) return;

      const { error } = await supabase
        .from('discussion_replies')
        .update({ upvotes: reply.upvotes + 1 })
        .eq('id', replyId);

      if (error) throw error;

      setReplies(prev => 
        prev.map(r => 
          r.id === replyId 
            ? { ...r, upvotes: r.upvotes + 1 }
            : r
        )
      );
      toast.success('Upvoted!');
    } catch (error) {
      console.error('Error upvoting reply:', error);
      toast.error('Failed to upvote');
    }
  };

  const handleMarkAsAnswer = async (replyId: string) => {
    if (!isAuthor) {
      toast.error('Only the question author can mark answers');
      return;
    }

    try {
      const reply = replies.find(r => r.id === replyId);
      if (!reply) return;

      const newAcceptedStatus = !reply.is_accepted_answer;

      const { error } = await supabase
        .from('discussion_replies')
        .update({ is_accepted_answer: newAcceptedStatus })
        .eq('id', replyId);

      if (error) throw error;

      // Update replies state
      setReplies(prev => 
        prev.map(r => ({
          ...r,
          is_accepted_answer: r.id === replyId ? newAcceptedStatus : false
        }))
      );

      // Update discussion answered status
      setDiscussionData(prev => ({
        ...prev,
        is_answered: newAcceptedStatus
      }));

      toast.success(newAcceptedStatus ? 'Marked as accepted answer!' : 'Unmarked as answer');
    } catch (error) {
      console.error('Error marking answer:', error);
      toast.error('Failed to mark answer');
    }
  };

  const handleReplyAdded = (newReply: Reply) => {
    setReplies(prev => [...prev, newReply]);
  };

  const acceptedAnswer = replies.find(r => r.is_accepted_answer);
  const otherReplies = replies.filter(r => !r.is_accepted_answer);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/community/${discussionData.communities.slug}`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to {discussionData.communities.name}
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xl">{discussionData.communities.icon}</span>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">{discussionData.communities.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Question */}
          <Card>
            <CardHeader>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl leading-tight">
                      {discussionData.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {discussionData.profiles.display_name || 'Anonymous'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDistanceToNow(new Date(discussionData.created_at), { addSuffix: true })}
                      </div>
                      {discussionData.lessons && (
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <Badge variant="secondary" className="text-xs">
                            Lesson {discussionData.lessons.order}: {discussionData.lessons.title}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {discussionData.is_question && (
                      <Badge 
                        variant={discussionData.is_answered ? "default" : "secondary"}
                        className={discussionData.is_answered ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {discussionData.is_answered ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Answered</>
                        ) : (
                          'Question'
                        )}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{discussionData.content}</ReactMarkdown>
              </div>
              <div className="flex items-center gap-4 mt-6 pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUpvoteDiscussion}
                  className="gap-1"
                  disabled={!user}
                >
                  <ArrowUp className="h-4 w-4" />
                  {discussionData.upvotes}
                </Button>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accepted Answer */}
          {acceptedAnswer && (
            <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-base text-green-900 dark:text-green-100">
                    Accepted Answer
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{acceptedAnswer.content}</ReactMarkdown>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpvoteReply(acceptedAnswer.id)}
                      className="gap-1"
                      disabled={!user}
                    >
                      <ArrowUp className="h-4 w-4" />
                      {acceptedAnswer.upvotes}
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      by {acceptedAnswer.profiles.display_name || 'Anonymous'} • {' '}
                      {formatDistanceToNow(new Date(acceptedAnswer.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  {isAuthor && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsAnswer(acceptedAnswer.id)}
                      className="gap-1 text-green-700 border-green-300 hover:bg-green-100 dark:text-green-300"
                    >
                      <Check className="h-4 w-4" />
                      Unmark Answer
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Other Replies */}
          {otherReplies.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {acceptedAnswer ? 'Other Answers' : 'Answers'} ({otherReplies.length})
              </h3>
              {otherReplies.map((reply) => (
                <Card key={reply.id}>
                  <CardContent className="pt-6">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{reply.content}</ReactMarkdown>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpvoteReply(reply.id)}
                          className="gap-1"
                          disabled={!user}
                        >
                          <ArrowUp className="h-4 w-4" />
                          {reply.upvotes}
                        </Button>
                        <div className="text-sm text-muted-foreground">
                          by {reply.profiles.display_name || 'Anonymous'} • {' '}
                          {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                        </div>
                      </div>
                      {isAuthor && !discussionData.is_answered && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsAnswer(reply.id)}
                          className="gap-1 text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-950"
                        >
                          <Check className="h-4 w-4" />
                          Mark as Answer
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Reply Form */}
          {isMember && user && (
            <ReplyForm
              discussionId={discussionData.id}
              onReplyAdded={handleReplyAdded}
            />
          )}

          {/* Not a member notice */}
          {!isMember && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    Join the {discussionData.communities.name} community to post replies.
                  </p>
                  <Link href={`/community/${discussionData.communities.slug}`}>
                    <Button>Join Community</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}