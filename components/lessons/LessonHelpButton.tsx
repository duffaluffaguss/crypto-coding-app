'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { LessonQuestion } from '@/types';

interface LessonHelpButtonProps {
  lessonId: string;
  tutorialId: string; // For URL routing
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function LessonHelpButton({ 
  lessonId, 
  tutorialId,
  variant = 'outline', 
  size = 'sm',
  className = '' 
}: LessonHelpButtonProps) {
  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadQuestionCount();
  }, [lessonId]);

  const loadQuestionCount = async () => {
    try {
      setLoading(true);
      
      // Count questions for this lesson
      const { count, error } = await supabase
        .from('lesson_questions')
        .select('id', { count: 'exact', head: true })
        .eq('lesson_id', lessonId);

      if (error) throw error;
      
      setQuestionCount(count || 0);
    } catch (error) {
      console.error('Failed to load question count:', error);
      setQuestionCount(0);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Button 
        variant={variant} 
        size={size} 
        className={`${className} opacity-50`}
        disabled
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Help
      </Button>
    );
  }

  return (
    <Link href={`/tutorials/${tutorialId}/help`}>
      <Button variant={variant} size={size} className={className}>
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {questionCount > 0 ? (
          <>
            Help ({questionCount})
          </>
        ) : (
          'Ask for Help'
        )}
      </Button>
    </Link>
  );
}

// Component for inline help stats (for sidebar)
export function LessonHelpStats({ 
  lessonId, 
  className = '' 
}: { 
  lessonId: string; 
  className?: string; 
}) {
  const [stats, setStats] = useState({
    questions: 0,
    answers: 0,
    loading: true
  });
  const supabase = createClient();

  useEffect(() => {
    loadStats();
  }, [lessonId]);

  const loadStats = async () => {
    try {
      // Get question count and total answers for this lesson
      const { data: questions, error: questionsError } = await supabase
        .from('lesson_questions')
        .select(`
          id,
          lesson_question_answers(count)
        `)
        .eq('lesson_id', lessonId);

      if (questionsError) throw questionsError;

      const questionCount = questions?.length || 0;
      const answerCount = questions?.reduce((total, q) => {
        return total + (q.lesson_question_answers?.[0]?.count || 0);
      }, 0) || 0;

      setStats({
        questions: questionCount,
        answers: answerCount,
        loading: false
      });
    } catch (error) {
      console.error('Failed to load help stats:', error);
      setStats({ questions: 0, answers: 0, loading: false });
    }
  };

  if (stats.loading) {
    return null;
  }

  if (stats.questions === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>
        {stats.questions} {stats.questions === 1 ? 'person asked' : 'people asked'}
      </span>
    </div>
  );
}