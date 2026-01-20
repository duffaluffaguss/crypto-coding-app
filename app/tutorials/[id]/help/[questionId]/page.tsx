'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getTutorialById, categoryLabels } from '@/lib/tutorials';
import { createClient } from '@/lib/supabase/client';
import type { Tutorial } from '@/lib/tutorials';
import type { LessonQuestion, LessonQuestionAnswer, Profile } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export default function QuestionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tutorialId = params.id as string;
  const questionId = params.questionId as string;
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [question, setQuestion] = useState<LessonQuestion | null>(null);
  const [answers, setAnswers] = useState<LessonQuestionAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [answerContent, setAnswerContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (tutorialId && questionId) {
      loadTutorial();
      loadQuestionAndAnswers();
      checkAuth();
    }
  }, [tutorialId, questionId]);

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

  const loadQuestionAndAnswers = async () => {
    try {
      setLoading(true);
      
      // Load question with user profile
      const { data: questionData, error: questionError } = await supabase
        .from('lesson_questions')
        .select(`
          *,
          user_profile:profiles(id, display_name, avatar_url)
        `)
        .eq('id', questionId)
        .single();

      if (questionError) throw questionError;
      if (!questionData) {
        router.push(`/tutorials/${tutorialId}/help`);
        return;
      }

      // Increment view count
      await supabase
        .from('lesson_questions')
        .update({ view_count: (questionData.view_count || 0) + 1 })
        .eq('id', questionId);

      // Load answers with user profiles
      const { data: answersData, error: answersError } = await supabase
        .from('lesson_question_answers')
        .select(`
          *,
          user_profile:profiles(id, display_name, avatar_url)
        `)
        .eq('question_id', questionId)
        .order('is_accepted desc, helpful_count desc, created_at asc');

      if (answersError) throw answersError;

      // Get user votes if logged in
      let questionWithVotes = questionData;
      let answersWithVotes = answersData || [];
      
      if (user) {
        // Get question vote
        const { data: questionVote } = await supabase
          .from('lesson_help_votes')
          .select('is_helpful')
          .eq('user_id', user.id)
          .eq('question_id', questionId)
          .single();

        questionWithVotes = {
          ...questionData,
          user_has_voted: !!questionVote,
          user_vote_helpful: questionVote?.is_helpful || false,
        };

        // Get answer votes
        if (answersData && answersData.length > 0) {
          const answerIds = answersData.map(a => a.id);
          const { data: answerVotes } = await supabase
            .from('lesson_help_votes')
            .select('answer_id, is_helpful')
            .eq('user_id', user.id)
            .in('answer_id', answerIds);

          const votesMap = new Map(answerVotes?.map(v => [v.answer_id, v.is_helpful]) || []);
          
          answersWithVotes = answersData.map(a => ({
            ...a,
            user_has_voted: votesMap.has(a.id),
            user_vote_helpful: votesMap.get(a.id) || false,
          }));
        }
      }

      setQuestion(questionWithVotes);
      setAnswers(answersWithVotes);
    } catch (error) {
      console.error('Failed to load question:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!user || !answerContent.trim() || submitting) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('lesson_question_answers')
        .insert({
          question_id: questionId,
          user_id: user.id,
          content: answerContent.trim(),
        });

      if (error) throw error;

      // Create notification for question author
      if (question && question.user_id !== user.id) {
        await supabase
          .from('lesson_help_notifications')
          .insert({
            recipient_id: question.user_id,
            sender_id: user.id,
            lesson_id: tutorialId,
            question_id: questionId,
            notification_type: 'new_answer',
            title: 'New answer to your question',
            message: `Someone answered your question about "${tutorial?.title}".`,
          });
      }

      setAnswerContent('');
      loadQuestionAndAnswers();
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleQuestionHelpful = async (currentlyHelpful: boolean) => {
    if (!user || !question) return;

    try {
      if (currentlyHelpful) {
        await supabase
          .from('lesson_help_votes')
          .delete()
          .eq('user_id', user.id)
          .eq('question_id', questionId);
      } else {
        await supabase
          .from('lesson_help_votes')
          .upsert({
            user_id: user.id,
            question_id: questionId,
            is_helpful: true,
          });
      }

      loadQuestionAndAnswers();
    } catch (error) {
      console.error('Failed to toggle question vote:', error);
    }
  };

  const toggleAnswerHelpful = async (answerId: string, currentlyHelpful: boolean) => {
    if (!user) return;

    try {
      if (currentlyHelpful) {
        await supabase
          .from('lesson_help_votes')
          .delete()
          .eq('user_id', user.id)
          .eq('answer_id', answerId);
      } else {
        await supabase
          .from('lesson_help_votes')
          .upsert({
            user_id: user.id,
            answer_id: answerId,
            is_helpful: true,
          });
      }

      loadQuestionAndAnswers();
    } catch (error) {
      console.error('Failed to toggle answer vote:', error);
    }
  };

  const markAnswerAccepted = async (answerId: string, isAccepted: boolean) => {
    if (!user || !question || question.user_id !== user.id) return;

    try {
      // If accepting, first remove any existing accepted answer
      if (isAccepted) {
        await supabase
          .from('lesson_question_answers')
          .update({ is_accepted: false })
          .eq('question_id', questionId)
          .eq('is_accepted', true);
      }

      // Update the target answer
      await supabase
        .from('lesson_question_answers')
        .update({ is_accepted: isAccepted })
        .eq('id', answerId);

      // Update question answered status
      const hasAcceptedAnswer = isAccepted;
      await supabase
        .from('lesson_questions')
        .update({ is_answered: hasAcceptedAnswer })
        .eq('id', questionId);

      // Create notification for answer author
      if (isAccepted) {
        const answer = answers.find(a => a.id === answerId);
        if (answer && answer.user_id !== user.id) {
          await supabase
            .from('lesson_help_notifications')
            .insert({
              recipient_id: answer.user_id,
              sender_id: user.id,
              lesson_id: tutorialId,
              question_id: questionId,
              answer_id: answerId,
              notification_type: 'answer_accepted',
              title: 'Your answer was accepted!',
              message: `Your answer was marked as helpful for "${tutorial?.title}".`,
            });
        }
      }

      loadQuestionAndAnswers();
    } catch (error) {
      console.error('Failed to update answer acceptance:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded mb-6" />
              <div className="h-32 bg-muted rounded mb-6" />
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-24 bg-muted rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tutorial || !question) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Question Not Found</h1>
            <Link href={`/tutorials/${tutorialId}/help`}>
              <Button>Back to Help</Button>
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
            <Link href={`/tutorials/${tutorialId}/help`} className="text-xl font-bold text-primary">
              ← Back to Questions
            </Link>
            <div className="flex gap-4">
              <Link
                href={`/tutorials/${tutorialId}`}
                className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                View Tutorial
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
          {/* Tutorial Context */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-primary/10 text-primary">
                {categoryLabels[tutorial.category]}
              </span>
              <span className="text-sm text-muted-foreground">Question about tutorial</span>
            </div>
            <Link 
              href={`/tutorials/${tutorialId}`}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              "{tutorial.title}"
            </Link>
          </div>

          {/* Question */}
          <Card className={`mb-6 ${question.is_pinned ? 'border-primary/50 bg-primary/5' : ''}`}>
            <CardContent className="p-6">
              <div className="flex gap-4">
                {/* Vote Column */}
                <div className="flex flex-col items-center gap-2 min-w-[60px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleQuestionHelpful(question.user_vote_helpful)}
                    disabled={!isLoggedIn || question.user_id === user?.id}
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
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
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
                      <h1 className="text-2xl font-bold mb-4">{question.title}</h1>
                      <div className="prose prose-sm max-w-none mb-4">
                        <p className="whitespace-pre-wrap">{question.content}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={question.user_profile?.avatar_url} />
                          <AvatarFallback>
                            {question.user_profile?.display_name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span>{question.user_profile?.display_name || 'Anonymous'}</span>
                      </div>
                      <span>asked {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}</span>
                      <span>{question.view_count} views</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Answers Section */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
            </h2>

            <div className="space-y-4">
              {answers.map((answer) => (
                <Card key={answer.id} className={answer.is_accepted ? 'border-green-500/50 bg-green-500/5' : ''}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Vote Column */}
                      <div className="flex flex-col items-center gap-2 min-w-[60px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAnswerHelpful(answer.id, answer.user_vote_helpful)}
                          disabled={!isLoggedIn || answer.user_id === user?.id}
                          className={answer.user_vote_helpful ? 'text-primary' : ''}
                        >
                          <svg className="w-5 h-5" fill={answer.user_vote_helpful ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </Button>
                        <span className="text-sm font-medium">{answer.helpful_count}</span>
                        <span className="text-xs text-muted-foreground">helpful</span>
                        
                        {/* Accept Answer Button (only for question author) */}
                        {user && question.user_id === user.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAnswerAccepted(answer.id, !answer.is_accepted)}
                            className={answer.is_accepted ? 'text-green-500' : 'text-muted-foreground'}
                          >
                            <svg className="w-4 h-4" fill={answer.is_accepted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </Button>
                        )}
                      </div>

                      {/* Answer Content */}
                      <div className="flex-1">
                        {answer.is_accepted && (
                          <div className="flex items-center gap-1 text-green-500 text-sm font-medium mb-3">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Accepted Answer
                          </div>
                        )}
                        
                        <div className="prose prose-sm max-w-none mb-4">
                          <p className="whitespace-pre-wrap">{answer.content}</p>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={answer.user_profile?.avatar_url} />
                              <AvatarFallback>
                                {answer.user_profile?.display_name?.[0] || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span>{answer.user_profile?.display_name || 'Anonymous'}</span>
                          </div>
                          <span>answered {formatDistanceToNow(new Date(answer.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Add Answer Section */}
          {isLoggedIn && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Your Answer</h3>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Share your knowledge to help others learn..."
                    rows={6}
                    value={answerContent}
                    onChange={(e) => setAnswerContent(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={submitAnswer}
                      disabled={!answerContent.trim() || submitting}
                    >
                      {submitting ? 'Posting Answer...' : 'Post Your Answer'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!isLoggedIn && (
            <Card>
              <CardContent className="text-center py-8">
                <h3 className="text-lg font-semibold mb-2">Want to help?</h3>
                <p className="text-muted-foreground mb-4">
                  <Link href="/auth/sign-in" className="text-primary hover:underline">
                    Sign in
                  </Link> to post an answer and help others learn.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}