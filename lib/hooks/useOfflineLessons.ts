'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import offlineManager from '@/lib/offline';
import type { Lesson, LearningProgress } from '@/types';

interface UseOfflineLessonsProps {
  initialLessons?: Lesson[];
  initialProgress?: LearningProgress[];
}

interface CachedLesson extends Lesson {
  cached_at: number;
  offline_available: boolean;
}

interface LessonCache {
  lessons: CachedLesson[];
  progress: LearningProgress[];
  last_sync: number;
}

export function useOfflineLessons({
  initialLessons = [],
  initialProgress = []
}: UseOfflineLessonsProps = {}) {
  const [lessons, setLessons] = useState<CachedLesson[]>([]);
  const [progress, setProgress] = useState<LearningProgress[]>(initialProgress);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cacheStatus, setCacheStatus] = useState<'fresh' | 'stale' | 'offline'>('fresh');
  
  const supabase = createClient();

  // Track online status
  useEffect(() => {
    const unsubscribe = offlineManager.onStateChange((state) => {
      setIsOnline(state.isOnline);
    });

    return unsubscribe;
  }, []);

  // Cache lessons for offline access
  const cacheLessons = useCallback(async (lessonsToCache: Lesson[]) => {
    for (const lesson of lessonsToCache) {
      try {
        const cachedLesson: CachedLesson = {
          ...lesson,
          cached_at: Date.now(),
          offline_available: true
        };

        await offlineManager.cacheLessonContent(lesson.id, cachedLesson);
      } catch (error) {
        console.error('Failed to cache lesson:', lesson.id, error);
      }
    }
  }, []);

  // Load lessons from cache
  const loadCachedLessons = useCallback(async (): Promise<CachedLesson[]> => {
    const cachedLessons: CachedLesson[] = [];

    for (const lesson of initialLessons) {
      try {
        const cached = await offlineManager.getCachedLessonContent(lesson.id);
        if (cached) {
          cachedLessons.push(cached);
        } else {
          // Add as uncached
          cachedLessons.push({
            ...lesson,
            cached_at: 0,
            offline_available: false
          });
        }
      } catch (error) {
        console.error('Failed to load cached lesson:', lesson.id, error);
        cachedLessons.push({
          ...lesson,
          cached_at: 0,
          offline_available: false
        });
      }
    }

    return cachedLessons;
  }, [initialLessons]);

  // Fetch lessons from API
  const fetchLessons = useCallback(async (): Promise<Lesson[]> => {
    if (!isOnline) {
      throw new Error('Cannot fetch lessons while offline');
    }

    const { data, error } = await supabase
      .from('lessons')
      .select(`
        *,
        learning_progress (*)
      `)
      .order('order_index');

    if (error) throw error;

    return data || [];
  }, [isOnline, supabase]);

  // Load lessons (try online first, fallback to cache)
  const loadLessons = useCallback(async () => {
    setIsLoading(true);

    try {
      if (isOnline) {
        // Try to fetch fresh data
        try {
          const freshLessons = await fetchLessons();
          
          // Cache the fresh lessons
          await cacheLessons(freshLessons);
          
          // Convert to cached lessons format
          const cachedLessons: CachedLesson[] = freshLessons.map(lesson => ({
            ...lesson,
            cached_at: Date.now(),
            offline_available: true
          }));

          setLessons(cachedLessons);
          setCacheStatus('fresh');
        } catch (error) {
          console.error('Failed to fetch fresh lessons:', error);
          
          // Fallback to cache
          const cachedLessons = await loadCachedLessons();
          setLessons(cachedLessons);
          setCacheStatus('stale');
        }
      } else {
        // Load from cache only
        const cachedLessons = await loadCachedLessons();
        setLessons(cachedLessons);
        setCacheStatus('offline');
      }
    } catch (error) {
      console.error('Failed to load lessons:', error);
      
      // Final fallback to initial lessons
      if (initialLessons.length > 0) {
        const fallbackLessons: CachedLesson[] = initialLessons.map(lesson => ({
          ...lesson,
          cached_at: 0,
          offline_available: false
        }));
        setLessons(fallbackLessons);
        setCacheStatus('offline');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, fetchLessons, cacheLessons, loadCachedLessons, initialLessons]);

  // Cache specific lesson content (for when user opens a lesson)
  const cacheLesson = useCallback(async (lessonId: string) => {
    if (!isOnline) return;

    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (error) throw error;

      await offlineManager.cacheLessonContent(lessonId, {
        ...data,
        cached_at: Date.now(),
        offline_available: true
      });

      // Update local state
      setLessons(prev => prev.map(lesson => 
        lesson.id === lessonId 
          ? { ...lesson, cached_at: Date.now(), offline_available: true }
          : lesson
      ));
    } catch (error) {
      console.error('Failed to cache lesson:', lessonId, error);
    }
  }, [isOnline, supabase]);

  // Save progress (offline-capable)
  const saveProgress = useCallback(async (
    lessonId: string, 
    progressData: Partial<LearningProgress>
  ) => {
    const progressItem: LearningProgress = {
      user_id: progressData.user_id || '',
      lesson_id: lessonId,
      completed: progressData.completed || false,
      score: progressData.score || 0,
      completed_at: progressData.completed_at || new Date().toISOString(),
      time_spent: progressData.time_spent || 0,
      ...progressData
    } as LearningProgress;

    // Update local state immediately
    setProgress(prev => {
      const existing = prev.find(p => p.lesson_id === lessonId);
      if (existing) {
        return prev.map(p => p.lesson_id === lessonId ? progressItem : p);
      } else {
        return [...prev, progressItem];
      }
    });

    try {
      if (isOnline) {
        // Try to save to database
        const { error } = await supabase
          .from('learning_progress')
          .upsert(progressItem);

        if (error) throw error;
      } else {
        // Queue for offline sync
        await offlineManager.queueAction('save-progress', {
          lessonId,
          progressData: progressItem
        });
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
      
      // Queue for offline sync as fallback
      await offlineManager.queueAction('save-progress', {
        lessonId,
        progressData: progressItem
      });
    }
  }, [isOnline, supabase]);

  // Get cached lesson count and size
  const getCacheInfo = useCallback(async () => {
    const cachedCount = lessons.filter(l => l.offline_available).length;
    const totalCount = lessons.length;
    
    // Estimate cache size (simplified)
    let totalSize = 0;
    for (const lesson of lessons) {
      if (lesson.offline_available) {
        totalSize += JSON.stringify(lesson).length;
      }
    }

    return {
      cachedCount,
      totalCount,
      cachePercentage: totalCount > 0 ? (cachedCount / totalCount) * 100 : 0,
      estimatedSize: Math.round(totalSize / 1024), // KB
      lastSync: Math.min(...lessons.map(l => l.cached_at).filter(t => t > 0))
    };
  }, [lessons]);

  // Clear lesson cache
  const clearCache = useCallback(async () => {
    await offlineManager.clearOldCache(0); // Clear all cache
    
    const uncachedLessons: CachedLesson[] = lessons.map(lesson => ({
      ...lesson,
      cached_at: 0,
      offline_available: false
    }));
    
    setLessons(uncachedLessons);
    setCacheStatus('offline');
  }, [lessons]);

  // Preload all lessons for offline use
  const preloadAllLessons = useCallback(async () => {
    if (!isOnline) return;

    try {
      for (const lesson of lessons) {
        if (!lesson.offline_available) {
          await cacheLesson(lesson.id);
        }
      }
    } catch (error) {
      console.error('Failed to preload lessons:', error);
    }
  }, [isOnline, lessons, cacheLesson]);

  // Initialize lessons
  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && cacheStatus === 'offline') {
      loadLessons();
    }
  }, [isOnline, cacheStatus, loadLessons]);

  return {
    lessons,
    progress,
    isLoading,
    isOnline,
    cacheStatus,
    loadLessons,
    cacheLesson,
    saveProgress,
    getCacheInfo,
    clearCache,
    preloadAllLessons
  };
}