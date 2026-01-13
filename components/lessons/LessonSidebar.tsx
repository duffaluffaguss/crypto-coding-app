'use client';

import type { Lesson, LearningProgress } from '@/types';

interface LessonSidebarProps {
  lessons: Lesson[];
  progress: LearningProgress[];
  currentLesson: Lesson | null;
  onSelectLesson: (lesson: Lesson) => void;
}

export function LessonSidebar({
  lessons,
  progress,
  currentLesson,
  onSelectLesson,
}: LessonSidebarProps) {
  const getProgressStatus = (lessonId: string) => {
    const lessonProgress = progress.find((p) => p.lesson_id === lessonId);
    return lessonProgress?.status || 'available';
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
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="p-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Lessons
        </h3>
        <div className="space-y-1">
          {lessons.map((lesson, index) => {
            const status = getProgressStatus(lesson.id);
            const isLocked = status === 'locked';
            const isActive = currentLesson?.id === lesson.id;

            return (
              <button
                key={lesson.id}
                onClick={() => !isLocked && onSelectLesson(lesson)}
                disabled={isLocked}
                className={`
                  w-full text-left p-2 rounded-lg transition-colors
                  ${isActive ? 'bg-primary/10 ring-1 ring-primary/20' : ''}
                  ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted cursor-pointer'}
                `}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">{getStatusIcon(status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {index + 1}. {lesson.title}
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

      {/* Current Lesson Goal */}
      {currentLesson && (
        <div className="p-3 border-t border-border mt-auto">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Current Goal
          </h4>
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm">{currentLesson.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
