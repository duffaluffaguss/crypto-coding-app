'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Eye, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

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

interface ReplyFormProps {
  discussionId: string;
  onReplyAdded: (reply: Reply) => void;
  placeholder?: string;
  className?: string;
}

export function ReplyForm({ 
  discussionId, 
  onReplyAdded, 
  placeholder = "Share your answer or thoughts...",
  className = "" 
}: ReplyFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Please enter your reply');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to reply');
        return;
      }

      // Insert the reply
      const { data: replyData, error: replyError } = await supabase
        .from('discussion_replies')
        .insert({
          discussion_id: discussionId,
          author_id: user.id,
          content: content.trim(),
        })
        .select(`
          *,
          profiles:author_id!inner (
            display_name
          )
        `)
        .single();

      if (replyError) throw replyError;

      // Add to UI immediately
      onReplyAdded(replyData);
      
      // Clear form
      setContent('');
      
      toast.success('Reply posted successfully!');
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Post Your Answer
        </CardTitle>
        <CardDescription>
          Help others by sharing your knowledge and experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reply-content">Your Answer</Label>
            <Tabs defaultValue="write" className="w-full">
              <TabsList>
                <TabsTrigger value="write" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Write
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="write" className="mt-2">
                <Textarea
                  id="reply-content"
                  placeholder={`${placeholder}

Tips:
• Be specific and helpful
• Include code examples if relevant
• Explain your reasoning
• Use markdown formatting`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className="resize-none font-mono text-sm"
                  required
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-2">
                <div className="border rounded-md p-4 min-h-[150px] bg-muted/20">
                  {content.trim() ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Nothing to preview. Write your answer in the Write tab.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            <p className="text-xs text-muted-foreground">
              You can use Markdown formatting (links, code blocks, lists, etc.)
            </p>
          </div>

          <div className="flex items-center justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting || !content.trim()}
              className="min-w-24"
            >
              {isSubmitting ? 'Posting...' : 'Post Answer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}