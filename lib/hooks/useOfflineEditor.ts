'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import offlineManager, { localStorageHelpers } from '@/lib/offline';
import { toast } from '@/lib/toast';
import type { ProjectFile } from '@/types';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'offline';

interface UseOfflineEditorProps {
  projectId: string;
  activeFile: ProjectFile | null;
  code: string;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

export function useOfflineEditor({
  projectId,
  activeFile,
  code,
  onSaveSuccess,
  onSaveError
}: UseOfflineEditorProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  // Track online/offline status
  useEffect(() => {
    const unsubscribe = offlineManager.onStateChange((state) => {
      setIsOnline(state.isOnline);
    });

    return unsubscribe;
  }, []);

  // Enhanced auto-save that works offline
  const autoSave = useCallback(async () => {
    if (!activeFile || saveStatus === 'saving') return;
    
    setSaveStatus('saving');
    
    try {
      if (isOnline) {
        // Try to save to Supabase
        const { error } = await supabase
          .from('project_files')
          .update({ content: code })
          .eq('id', activeFile.id);

        if (error) throw error;

        // Also save to offline storage as backup
        await offlineManager.saveCodeOffline(
          `project_${projectId}_file_${activeFile.id}`,
          code
        );

        setSaveStatus('saved');
        setLastSaved(new Date());
        onSaveSuccess?.();

        // Clear any pending offline saves for this file
        localStorageHelpers.remove(`offline_code_${activeFile.id}`);
      } else {
        // Save offline
        await offlineManager.saveCodeOffline(
          `project_${projectId}_file_${activeFile.id}`,
          code
        );

        // Also save to localStorage as immediate backup
        localStorageHelpers.set(`offline_code_${activeFile.id}`, {
          content: code,
          timestamp: Date.now(),
          fileId: activeFile.id,
          filename: activeFile.filename
        });

        // Queue for sync when online
        await offlineManager.queueAction('save-code', {
          fileId: activeFile.id,
          projectId,
          content: code,
          filename: activeFile.filename
        });

        setSaveStatus('offline');
        setLastSaved(new Date());
        onSaveSuccess?.();

        toast({
          title: 'Saved offline',
          description: 'Changes will sync when you\'re back online',
        });
      }
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('unsaved');
      onSaveError?.(error as Error);

      // Still try to save offline as fallback
      if (isOnline) {
        try {
          await offlineManager.saveCodeOffline(
            `project_${projectId}_file_${activeFile.id}`,
            code
          );
          setSaveStatus('offline');
        } catch (offlineError) {
          console.error('Offline save also failed:', offlineError);
          toast({
            title: 'Save failed',
            description: 'Unable to save changes',
            variant: 'destructive',
          });
        }
      }
    }
  }, [
    activeFile,
    saveStatus,
    code,
    isOnline,
    projectId,
    supabase,
    onSaveSuccess,
    onSaveError
  ]);

  // Load offline code if available
  const loadOfflineCode = useCallback(async (fileId: string): Promise<string | null> => {
    if (!isOnline) {
      // Try IndexedDB first
      const offlineCode = await offlineManager.getOfflineCode(
        `project_${projectId}_file_${fileId}`
      );
      
      if (offlineCode) {
        return offlineCode;
      }

      // Fallback to localStorage
      const localCode = localStorageHelpers.get(`offline_code_${fileId}`);
      if (localCode?.content) {
        return localCode.content;
      }
    }
    
    return null;
  }, [projectId, isOnline]);

  // Check for unsaved offline changes
  const checkUnsavedChanges = useCallback(async (): Promise<Array<{
    fileId: string;
    filename: string;
    content: string;
    timestamp: number;
  }>> => {
    const unsavedChanges: Array<{
      fileId: string;
      filename: string;
      content: string;
      timestamp: number;
    }> = [];

    // Check IndexedDB
    const unsyncedCode = await offlineManager.getUnsyncedCode();
    for (const item of unsyncedCode) {
      if (item.key.startsWith(`project_${projectId}_file_`)) {
        const fileId = item.key.split('_').pop()!;
        unsavedChanges.push({
          fileId,
          filename: `file_${fileId}`, // Would need to fetch actual filename
          content: item.code,
          timestamp: item.modified
        });
      }
    }

    // Check localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('offline_code_')) {
        const data = localStorageHelpers.get(key);
        if (data?.content) {
          unsavedChanges.push({
            fileId: data.fileId,
            filename: data.filename,
            content: data.content,
            timestamp: data.timestamp
          });
        }
      }
    }

    return unsavedChanges;
  }, [projectId]);

  // Sync offline changes when back online
  const syncOfflineChanges = useCallback(async () => {
    if (!isOnline) return;

    try {
      const unsavedChanges = await checkUnsavedChanges();
      
      for (const change of unsavedChanges) {
        try {
          const { error } = await supabase
            .from('project_files')
            .update({ content: change.content })
            .eq('id', change.fileId);

          if (error) throw error;

          // Clear offline storage after successful sync
          await offlineManager.saveCodeOffline(
            `project_${projectId}_file_${change.fileId}`,
            change.content
          );
          localStorageHelpers.remove(`offline_code_${change.fileId}`);
        } catch (error) {
          console.error('Failed to sync file:', change.filename, error);
        }
      }

      if (unsavedChanges.length > 0) {
        toast({
          title: 'Offline changes synced',
          description: `Synced ${unsavedChanges.length} files`,
        });
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }, [isOnline, checkUnsavedChanges, projectId, supabase]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline) {
      syncOfflineChanges();
    }
  }, [isOnline, syncOfflineChanges]);

  // Debounced auto-save trigger
  useEffect(() => {
    if (!activeFile) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set save status based on current state
    const hasChanges = code !== (activeFile.content || '');
    if (hasChanges && saveStatus === 'saved') {
      setSaveStatus('unsaved');
    }

    // Set new timer for auto-save (2 seconds after last change)
    autoSaveTimerRef.current = setTimeout(() => {
      if (hasChanges) {
        autoSave();
      }
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [code, activeFile, autoSave, saveStatus]);

  // Manual save function
  const save = useCallback(async () => {
    await autoSave();
  }, [autoSave]);

  // Force sync function
  const forceSync = useCallback(async () => {
    if (isOnline) {
      await syncOfflineChanges();
    }
  }, [isOnline, syncOfflineChanges]);

  return {
    saveStatus,
    lastSaved,
    isOnline,
    save,
    autoSave,
    loadOfflineCode,
    checkUnsavedChanges,
    syncOfflineChanges,
    forceSync
  };
}