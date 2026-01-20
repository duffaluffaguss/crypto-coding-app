'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getTutorialById, categoryLabels } from '@/lib/tutorials';
import { createClient } from '@/lib/supabase/client';
import type { Tutorial } from '@/lib/tutorials';
import type { LessonQuestion, LessonQuestionAnswer, Profile } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export default function TutorialHelpPage() {
  const params = useParams();
  const router = useRouter();
  const tutorialId = params.id as string;
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [questions, setQuestions] = useState<LessonQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showAskModal, setShowAskModal] = useState(false);
  const [questionTitle, setQuestionTitle] = useState('');
  const [questionContent, setQuestionContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most_helpful'>('newest');
  const supabase = createClient();

  useEffect(() => {
    if (tutorialId) {
      loadTutorial();
      loadQuestions();
      checkAuth();
    }
  }, [tutorialId, sortBy]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);
    setUser(user);
  };

  const loadTutorial = async () => {
    const tutorialData = getTutorialById(tutorialId);
    if (!tutorialData) {
      router.push('/tutorials');
      return;
    }
    setTutorial(tutorialData);
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      
      let orderClause: string;
      switch (sortBy) {
        case 'oldest':
          orderClause = 'created_at';
          break;
        case 'most_helpful':
          orderClause = 'helpful_count desc, created_at desc';
          break;
        default:
          orderClause = 'is_pinned desc, created_at desc';
      }

      // Get questions with user profiles and answer counts
      const { data: questionsData, error } = await supabase
        .from('lesson_questions')
        .select(`
          *,
          user_profile:profiles(id, display_name, avatar_url),
          lesson_question_answers(count)
        `)
        .eq('lesson_id', tutorialId)
        .order(orderClause);

      if (error) throw error;

      // Get user votes if logged in
      let questionsWithVotes = questionsData || [];
      if (user) {
        const questionIds = questionsData?.map(q => q.id) || [];
        if (questionIds.length > 0) {
          const { data: votesData } = await supabase
            .from('lesson_help_votes')
            .select('question_id, is_helpful')
            .eq('user_id', user.id)
            .in('question_id', questionIds);

          const votesMap = new Map(votesData?.map(v => [v.question_id, v.is_helpful]) || []);
          
          questionsWithVotes = questionsData.map(q => ({
            ...q,
            answers_count: q.lesson_question_answers?.[0]?.count || 0,
            user_has_voted: votesMap.has(q.id),
            user_vote_helpful: votesMap.get(q.id) || false,
          }));
        }
      } else {
        questionsWithVotes = questionsData.map(q => ({
          ...q,
          answers_count: q.lesson_question_answers?.[0]?.count || 0,
          user_has_voted: false,
          user_vote_helpful: false,
        }));
      }

      setQuestions(questionsWithVotes);
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitQuestion = async () => {
    if (!user || !questionTitle.trim() || !questionContent.trim() || submitting) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('lesson_questions')
        .insert({
          lesson_id: tutorialId,
          user_id: user.id,
          title: questionTitle.trim(),
          content: questionContent.trim(),
        });

      if (error) throw error;

      // Create notifications for users who completed this lesson
      await createHelpNotifications();

      setQuestionTitle('');
      setQuestionContent('');
      setShowAskModal(false);
      loadQuestions();
    } catch (error) {
      console.error('Failed to submit question:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const createHelpNotifications = async () => {
    try {
      // Get users who completed this lesson (excluding the person asking)
      const { data: completedUsers } = await supabase
        .from('learning_progress')
        .select('user_id, profiles(display_name)')
        .eq('lesson_id', tutorialId)
        .eq('status', 'completed')
        .neq('user_id', user.id);

      if (completedUsers && completedUsers.length > 0) {
        const notifications = completedUsers.map(cu => ({
          recipient_id: cu.user_id,
          sender_id: user.id,
          lesson_id: tutorialId,
          notification_type: 'new_question' as const,
          title: 'Help someone learn!',
          message: `Someone asked a question about "${tutorial?.title}". Your experience could help them!`,
        }));

        await supabase
          .from('lesson_help_notifications')
          .insert(notifications);
      }
    } catch (error) {
      console.error('Failed to create notifications:', error);
    }
  };

  const toggleHelpful = async (questionId: string, currentlyHelpful: boolean) => {
    if (!user) return;

    try {
      if (currentlyHelpful) {
        // Remove vote
        await supabase
          .from('lesson_help_votes')
          .delete()
          .eq('user_id', user.id)
          .eq('question_id', questionId);
      } else {
        // Add or update vote
        await supabase
          .from('lesson_help_votes')
          .upsert({
            user_id: user.id,
            question_id: questionId,
            is_helpful: true,
          });
      }

      loadQuestions();
    } catch (error) {
      console.error('Failed to toggle helpful vote:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded mb-6" />
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Tutorial Not Found</h1>
            <Link href="/tutorials">
              <Button>Back to Tutorials</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Header */}
      <div className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex justify-between items-center">
            <Link href={`/tutorials/${tutorialId}`} className="text-xl font-bold text-primary">
              ← Back to Tutorial
            </Link>
            <div className="flex gap-4">
              <Link
                href="/tutorials"
                className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                All Tutorials
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-primary/10 text-primary">
                {categoryLabels[tutorial.category]}
              </span>
              <span className="text-sm text-muted-foreground">Help & Questions</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              Questions about "{tutorial.title}"
            </h1>
            <p className="text-muted-foreground mb-6">
              Get help from the community or help others who are learning this tutorial.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-2">
                <Dialog open={showAskModal} onOpenChange={setShowAskModal}>
                  <DialogTrigger asChild>
                    <Button disabled={!isLoggedIn}>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Ask Question
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Ask a Question</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Question Title</label>
                        <Input
                          placeholder="What's your question about?"
                          value={questionTitle}
                          onChange={(e) => setQuestionTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Question Details</label>
                        <Textarea
                          placeholder="Describe your question in detail..."
                          rows={6}
                          value={questionContent}
                          onChange={(e) => setQuestionContent(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowAskModal(false)}
                          disabled={submitting}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={submitQuestion}
                          disabled={!questionTitle.trim() || !questionContent.trim() || submitting}
                        >
                          {submitting ? 'Posting...' : 'Post Question'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {!isLoggedIn && (
                  <p className="text-sm text-muted-foreground">
                    <Link href="/auth/sign-in" className="text-primary hover:underline">
                      Sign in
                    </Link> to ask questions
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-sm border border-border rounded px-2 py-1 bg-background"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="most_helpful">Most Helpful</option>
                </select>
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {questions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No questions yet</h3>
                  <p className="text-muted-foreground mb-4">Be the first to ask a question about this tutorial!</p>
                  {isLoggedIn && (
                    <Button onClick={() => setShowAskModal(true)}>
                      Ask the First Question
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              questions.map((question) => (
                <Card key={question.id} className={question.is_pinned ? 'border-primary/50 bg-primary/5' : ''}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Vote Column */}
                      <div className="flex flex-col items-center gap-2 min-w-[60px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleHelpful(question.id, question.user_vote_helpful)}
                          disabled={!isLoggedIn}
                          className={question.user_vote_helpful ? 'text-primary' : ''}
                        >
                          <svg className="w-5 h-5" fill={question.user_vote_helpful ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </Button>
                        <span className="text-sm font-medium">{question.helpful_count}</span>
                        <span className="text-xs text-muted-foreground">helpful</span>
                      </div>

                      {/* Question Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              {question.is_pinned && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-yellow-500/20 text-yellow-600 rounded">
                                  Pinned
                                </span>
                              )}
                              {question.is_answered && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-600 rounded">
                                  Answered
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-semibold mb-2">
                              <Link 
                                href={`/tutorials/${tutorialId}/help/${question.id}`}
                                className="hover:text-primary transition-colors"
                              >
                                {question.title}
                              </Link>
                            </h3>
                            <p className="text-muted-foreground line-clamp-3">{question.content}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span>
                              by {question.user_profile?.display_name || 'Anonymous'}
                            </span>
                            <span>
                              {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}
                            </span>
                            {question.answers_count > 0 && (
                              <span className="text-primary">
                                {question.answers_count} {question.answers_count === 1 ? 'answer' : 'answers'}
                              </span>
                            )}
                          </div>
                          <Link
                            href={`/tutorials/${tutorialId}/help/${question.id}`}
                            className="text-primary hover:underline"
                          >
                            View details →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}