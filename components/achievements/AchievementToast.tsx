'use client';

import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ShareableAchievementCard } from './ShareableAchievementCard';
import { Button } from '@/components/ui/button';

interface AchievementNotification {
  id: string;
  name: string;
  icon: string;
  points: number;
  description?: string;
  category?: string;
  userId?: string;
  displayName?: string;
}

interface AchievementToastProps {
  achievement: AchievementNotification;
  onClose: () => void;
  duration?: number;
}

export function AchievementToast({
  achievement,
  onClose,
  duration = 5000,
}: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setIsVisible(true));

    // Auto-dismiss
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-[100] transform transition-all duration-300',
        isVisible && !isLeaving
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      )}
    >
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 p-[2px] shadow-2xl shadow-amber-500/30">
        <div className="relative bg-background rounded-[10px] p-4 pr-10">
          {/* Confetti particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${1 + Math.random() * 0.5}s`,
                }}
              >
                {['🎉', '⭐', '✨', '🎊'][Math.floor(Math.random() * 4)]}
              </div>
            ))}
          </div>

          {/* Close button */}
          <button
            onClick={() => {
              setIsLeaving(true);
              setTimeout(onClose, 300);
            }}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>

          {/* Content */}
          <div className="flex items-center gap-4">
            {/* Badge icon with glow */}
            <div className="relative">
              <div className="absolute inset-0 animate-ping bg-amber-400/50 rounded-full" />
              <div className="relative w-14 h-14 flex items-center justify-center bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full text-3xl shadow-lg">
                {achievement.icon}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-amber-500 uppercase tracking-wide mb-0.5">
                🏆 Achievement Unlocked!
              </div>
              <div className="font-bold text-lg truncate">{achievement.name}</div>
              {achievement.description && (
                <div className="text-sm text-muted-foreground truncate">
                  {achievement.description}
                </div>
              )}
            </div>

            {/* Points earned */}
            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg px-3 py-2 text-white shadow">
              <span className="text-xl font-bold">+{achievement.points}</span>
              <span className="text-[10px] uppercase tracking-wide opacity-90">
                points
              </span>
            </div>
          </div>

          {/* Share Button */}
          {achievement.userId && (
            <div className="mt-3 flex justify-center">
              <ShareableAchievementCard
                achievement={{
                  id: achievement.id,
                  name: achievement.name,
                  description: achievement.description || '',
                  icon: achievement.icon,
                  category: achievement.category || 'general',
                  points: achievement.points,
                }}
                userId={achievement.userId}
                displayName={achievement.displayName}
              >
                <Button size="sm" variant="outline" className="gap-2 text-xs">
                  <span>📤</span>
                  Share Achievement
                </Button>
              </ShareableAchievementCard>
            </div>
          )}

          {/* Progress bar */}
          <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all"
              style={{
                width: '100%',
                animation: `shrink ${duration}ms linear forwards`,
              }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        @keyframes confetti {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100px) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Hook to manage achievement notifications
interface UseAchievementToastsReturn {
  toasts: AchievementNotification[];
  showAchievement: (achievement: AchievementNotification) => void;
  dismissToast: (id: string) => void;
}

export function useAchievementToasts(): UseAchievementToastsReturn {
  const [toasts, setToasts] = useState<AchievementNotification[]>([]);

  const showAchievement = useCallback((achievement: AchievementNotification) => {
    const id = achievement.id || `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { ...achievement, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showAchievement, dismissToast };
}

// Container component for multiple toasts
interface AchievementToastContainerProps {
  toasts: AchievementNotification[];
  onDismiss: (id: string) => void;
}

export function AchievementToastContainer({
  toasts,
  onDismiss,
}: AchievementToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ transform: `translateY(${index * 8}px)` }}
        >
          <AchievementToast
            achievement={toast}
            onClose={() => onDismiss(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}
