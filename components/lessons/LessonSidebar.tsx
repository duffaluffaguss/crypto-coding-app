'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { logLessonCompleted } from '@/lib/activity';
import { VerificationModal, VerificationErrorModal } from './VerificationModal';
import type { Lesson, LearningProgress } from '@/types';

interface LessonSidebarProps {
  lessons: Lesson[];
  progress: LearningProgress[];
  currentLesson: Lesson | null;
  onSelectLesson: (lesson: Lesson) => void;
  projectId: string;
  onProgressUpdate?: (updatedProgress: LearningProgress[]) => void;
  currentCode?: string; // Code from the editor for verification
}

export function LessonSidebar({
  lessons,
  progress,
  currentLesson,
  onSelectLesson,
  projectId,
  onProgressUpdate,
  currentCode = '',
}: LessonSidebarProps) {
  const [localProgress, setLocalProgress] = useState<LearningProgress[]>(progress);
  const [completing, setCompleting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [verificationSummary, setVerificationSummary] = useState('');
  const [verificationErrors, setVerificationErrors] = useState<Array<{ message: string }>>([]);
  const supabase = createClient();

  // Determine if a lesson is locked based on previous lesson completion
  const isLessonLocked = (lessonIndex: number): boolean => {
    // First lesson is never locked
    if (lessonIndex === 0) return false;
    
    // Check if previous lesson is completed
    const previousLesson = lessons[lessonIndex - 1];
    if (!previousLesson) return false;
    
    const previousProgress = localProgress.find((p) => p.lesson_id === previousLesson.id);
    return previousProgress?.status !== 'completed';
  };

  const getProgressStatus = (lessonId: string, lessonIndex: number) => {
    // First check if locked based on previous lessons
    if (isLessonLocked(lessonIndex)) {
      return 'locked';
    }
    
    const lessonProgress = localProgress.find((p) => p.lesson_id === lessonId);
    return lessonProgress?.status || 'available';
  };

  // Check if current lesson needs verification (not completed yet)
  const needsVerification = currentLesson 
    ? getProgressStatus(currentLesson.id, lessons.findIndex(l => l.id === currentLesson.id)) !== 'completed'
    : false;

  const completedCount = localProgress.filter((p) => p.status === 'completed').length;
  const progressPercentage = lessons.length > 0
    ? Math.round((completedCount / lessons.length) * 100)
    : 0;

  const markLessonComplete = async () => {
    if (!currentLesson || completing) return;
    setCompleting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if progress record exists
      const existingProgress = localProgress.find(
        (p) => p.lesson_id === currentLesson.id
      );

      if (existingProgress) {
        // Update existing record
        await supabase
          .from('learning_progress')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', existingProgress.id);

        const updatedProgress = localProgress.map((p) =>
          p.lesson_id === currentLesson.id
            ? { ...p, status: 'completed' as const, completed_at: new Date().toISOString() }
            : p
        );
        setLocalProgress(updatedProgress);
        onProgressUpdate?.(updatedProgress);
      } else {
        // Create new progress record
        const { data: newProgress } = await supabase
          .from('learning_progress')
          .insert({
            user_id: user.id,
            project_id: projectId,
            lesson_id: currentLesson.id,
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (newProgress) {
          const updatedProgress = [...localProgress, newProgress];
          setLocalProgress(updatedProgress);
          onProgressUpdate?.(updatedProgress);
        }
      }

      // Unlock next lesson if there is one
      const currentIndex = lessons.findIndex((l) => l.id === currentLesson.id);
      const nextLesson = lessons[currentIndex + 1];

      if (nextLesson) {
        const nextProgress = localProgress.find((p) => p.lesson_id === nextLesson.id);
        if (!nextProgress) {
          // Create "available" progress for next lesson
          const { data: nextProgressData } = await supabase
            .from('learning_progress')
            .insert({
              user_id: user.id,
              project_id: projectId,
              lesson_id: nextLesson.id,
              status: 'available',
            })
            .select()
            .single();

          if (nextProgressData) {
            const updatedProgress = [...localProgress, nextProgressData];
            setLocalProgress(updatedProgress);
            onProgressUpdate?.(updatedProgress);
          }
        }
      }

      // Log activity for lesson completion
      await logLessonCompleted(
        supabase,
        user.id,
        currentLesson.id,
        currentLesson.title
      );
    } catch (error) {
      console.error('Failed to update progress:', error);
    } finally {
      setCompleting(false);
    }
  };

  const verifyAndContinue = async () => {
    if (!currentLesson || verifying || !currentCode.trim()) return;
    setVerifying(true);
    setVerificationErrors([]);
    setVerificationSummary('');

    try {
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceCode: currentCode,
          lessonTitle: currentLesson.title,
          lessonGoal: currentLesson.description,
        }),
      });

      const result = await response.json();

      if (!result.compiled) {
        // Compilation failed - show error modal
        setVerificationErrors(result.errors || [{ message: 'Compilation failed' }]);
        setShowErrorModal(true);
      } else {
        // Compilation succeeded - show summary modal
        setVerificationSummary(result.summary || 'Your code compiled successfully!');
        setShowVerificationModal(true);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationErrors([{ message: 'Failed to verify code. Please try again.' }]);
      setShowErrorModal(true);
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirmVerification = async () => {
    setShowVerificationModal(false);
    await markLessonComplete();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <svg
            className="w-4 h-4 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case 'in_progress':
        return (
          <svg
            className="w-4 h-4 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      case 'locked':
        return (
          <svg
            className="w-4 h-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        );
      default:
        return (
          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
      {/* Progress Bar */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Progress</span>
          <span className="text-xs font-semibold text-primary">{progressPercentage}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {completedCount} of {lessons.length} lessons completed
        </p>
      </div>

      <div className="p-3 flex-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Lessons
        </h3>
        <div className="space-y-1">
          {lessons.map((lesson, index) => {
            const status = getProgressStatus(lesson.id, index);
            const isLocked = status === 'locked';
            const isActive = currentLesson?.id === lesson.id;
            const isCompleted = status === 'completed';
            const isCurrentAndNeedsVerification = isActive && !isCompleted;

            return (
              <button
                key={lesson.id}
                onClick={() => !isLocked && onSelectLesson(lesson)}
                disabled={isLocked}
                className={`
                  w-full text-left p-2 rounded-lg transition-colors
                  ${isActive ? 'bg-primary/10 ring-1 ring-primary/20' : ''}
                  ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted cursor-pointer'}
                  ${isCompleted && !isActive ? 'opacity-75' : ''}
                `}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">{getStatusIcon(status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium truncate ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                        {index + 1}. {lesson.title}
                      </span>
                      {isCurrentAndNeedsVerification && (
                        <span className="shrink-0 text-[10px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded font-medium">
                          Verify
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {lesson.description}
                    </div>
                    {lesson.concepts && lesson.concepts.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {lesson.concepts.slice(0, 3).map((concept) => (
                          <span
                            key={concept}
                            className="text-[10px] px-1.5 py-0.5 bg-muted rounded"
                          >
                            {concept}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {lessons.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No lessons available yet.
              <br />
              Start by exploring your code!
            </div>
          )}
        </div>
      </div>

      {/* Current Lesson Goal + Complete Button */}
      {currentLesson && (
        <div className="p-3 border-t border-border mt-auto">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Current Goal
            </h4>
            {needsVerification && (
              <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded font-medium flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Verify to unlock next
              </span>
            )}
          </div>
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 mb-3">
            <p className="text-sm">{currentLesson.description}</p>
          </div>

          {needsVerification && (
            <Button
              onClick={verifyAndContinue}
              disabled={verifying || completing || !currentCode.trim()}
              className="w-full"
              size="sm"
            >
              {verifying ? (
                <>
                  <svg
                    className="w-4 h-4 mr-2 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Verifying...
                </>
              ) : completing ? (
                <>
                  <svg
                    className="w-4 h-4 mr-2 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Completing...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Verify & Continue
                </>
              )}
            </Button>
          )}

          {!needsVerification && (
            <div className="flex items-center justify-center gap-2 text-sm text-green-500">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Lesson Completed!
            </div>
          )}
        </div>
      )}

      {/* Verification Modals */}
      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onConfirm={handleConfirmVerification}
        summary={verificationSummary}
        lessonTitle={currentLesson?.title || 'Current Lesson'}
        isConfirming={completing}
      />

      <VerificationErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errors={verificationErrors}
      />
    </div>
  );
}
