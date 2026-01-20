'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Eye, Edit, BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  project_type: string | null;
}

interface Lesson {
  id: string;
  title: string;
  order: number;
}

interface User {
  id: string;
  email?: string;
}

interface AskQuestionClientProps {
  community: Community;
  lessons: Lesson[];
  user: User;
}

export function AskQuestionClient({
  community,
  lessons,
  user,
}: AskQuestionClientProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a question title');
      return;
    }

    if (!content.trim()) {
      toast.error('Please describe your question');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('discussions')
        .insert({
          community_id: community.id,
          author_id: user.id,
          title: title.trim(),
          content: content.trim(),
          lesson_id: selectedLessonId || null,
          is_question: true,
          is_answered: false,
        })
        .select('id')
        .single();

      if (error) throw error;

      toast.success('Question posted successfully!');
      startTransition(() => {
        router.push(`/community/${community.slug}/discussion/${data.id}`);
      });
    } catch (error) {
      console.error('Error creating discussion:', error);
      toast.error('Failed to post question');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/community/${community.slug}`}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to {community.name}
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{community.icon}</span>
              <h1 className="text-xl font-semibold">Ask a Question</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Post a New Question</CardTitle>
            <CardDescription>
              Get help from the {community.name} community. Be specific and provide details to get better answers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Question Title</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="What's your question? Be specific..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {title.length}/200 characters
                </p>
              </div>

              {/* Lesson Selection */}
              {lessons.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="lesson">Related Lesson (Optional)</Label>
                  <Select value={selectedLessonId} onValueChange={setSelectedLessonId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a lesson if your question is related to specific content" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No specific lesson</SelectItem>
                      {lessons.map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id}>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Lesson {lesson.order}: {lesson.title}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Content with Preview */}
              <div className="space-y-2">
                <Label htmlFor="content">Question Details</Label>
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
                  <TabsContent value="write" className="mt-4">
                    <Textarea
                      id="content"
                      placeholder="Describe your question in detail. Include:
• What you're trying to achieve
• What you've tried so far
• Any error messages
• Relevant code snippets (use ```code``` blocks)"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={12}
                      className="resize-none font-mono text-sm"
                      required
                    />
                  </TabsContent>
                  <TabsContent value="preview" className="mt-4">
                    <div className="border rounded-md p-4 min-h-[300px] bg-muted/20">
                      {content.trim() ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown>{content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          Nothing to preview. Write your question in the Write tab.
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
                <p className="text-xs text-muted-foreground">
                  You can use Markdown formatting (links, code blocks, lists, etc.)
                </p>
              </div>

              {/* Tips */}
              <Card className="bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                <CardContent className="pt-6">
                  <h3 className="font-medium mb-2 text-blue-900 dark:text-blue-100">
                    Tips for getting great answers:
                  </h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Make your title specific and descriptive</li>
                    <li>• Include relevant code snippets in your question</li>
                    <li>• Explain what you expected vs. what actually happened</li>
                    <li>• Tag the related lesson if applicable</li>
                    <li>• Be respectful and constructive</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4">
                <Link href={`/community/${community.slug}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !title.trim() || !content.trim()}
                >
                  {isSubmitting ? 'Posting...' : 'Post Question'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}