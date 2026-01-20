'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface CodeVersion {
  id: string;
  file_id: string;
  content: string;
  message: string | null;
  created_at: string;
}

interface VersionHistoryProps {
  fileId: string;
  currentCode: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (content: string) => void;
}

export function VersionHistory({ 
  fileId, 
  currentCode, 
  isOpen, 
  onClose, 
  onRestore 
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<CodeVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<CodeVersion | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const supabase = createClient();

  const loadVersions = useCallback(async () => {
    if (!fileId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('code_versions')
        .select('*')
        .eq('file_id', fileId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setVersions(data || []);
    } catch (err) {
      console.error('Failed to load versions:', err);
    } finally {
      setLoading(false);
    }
  }, [fileId, supabase]);

  useEffect(() => {
    if (isOpen && fileId) {
      loadVersions();
    }
  }, [isOpen, fileId, loadVersions]);

  const handleRestore = (version: CodeVersion) => {
    if (window.confirm('Restore this version? Your current code will be replaced.')) {
      onRestore(version.content);
      onClose();
    }
  };

  // Simple diff display - shows added/removed lines
  const renderDiff = (oldCode: string, newCode: string) => {
    const oldLines = oldCode.split('\n');
    const newLines = newCode.split('\n');
    const maxLines = Math.max(oldLines.length, newLines.length);
    
    return (
      <div className="font-mono text-xs overflow-auto max-h-64 bg-muted/30 rounded p-2">
        {Array.from({ length: maxLines }, (_, i) => {
          const oldLine = oldLines[i] || '';
          const newLine = newLines[i] || '';
          
          if (oldLine === newLine) {
            return (
              <div key={i} className="text-muted-foreground whitespace-pre">
                <span className="inline-block w-8 text-right pr-2 text-muted-foreground/50 select-none">{i + 1}</span>
                {oldLine || ' '}
              </div>
            );
          }
          
          return (
            <div key={i}>
              {oldLine && (
                <div className="bg-red-500/10 text-red-400 whitespace-pre">
                  <span className="inline-block w-8 text-right pr-2 text-red-400/50 select-none">{i + 1}</span>
                  - {oldLine}
                </div>
              )}
              {newLine && (
                <div className="bg-green-500/10 text-green-400 whitespace-pre">
                  <span className="inline-block w-8 text-right pr-2 text-green-400/50 select-none">{i + 1}</span>
                  + {newLine}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold">Version History</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <svg className="w-6 h-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No versions saved yet</p>
            <p className="text-xs mt-1">Versions are created when you save manually or deploy</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Current version indicator */}
            <div className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-medium text-primary">Current Version</span>
              </div>
            </div>

            {/* Version list */}
            {versions.map((version, index) => (
              <div
                key={version.id}
                className={`p-3 rounded-lg border transition-colors ${
                  selectedVersion?.id === version.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }`}
              >
                <div 
                  className="cursor-pointer"
                  onClick={() => setSelectedVersion(selectedVersion?.id === version.id ? null : version)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      #{versions.length - index}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  
                  {version.message && (
                    <p className="text-sm mb-2">{version.message}</p>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    {new Date(version.created_at).toLocaleString()}
                  </div>
                </div>

                {/* Expanded view */}
                {selectedVersion?.id === version.id && (
                  <div className="mt-3 pt-3 border-t border-border">
                    {/* Action buttons */}
                    <div className="flex gap-2 mb-3">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => handleRestore(version)}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant={compareMode ? 'default' : 'outline'}
                        onClick={() => setCompareMode(!compareMode)}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Compare
                      </Button>
                    </div>

                    {/* Diff view */}
                    {compareMode && (
                      <div className="mt-2">
                        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">- old</span>
                          <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">+ current</span>
                        </div>
                        {renderDiff(version.content, currentCode)}
                      </div>
                    )}

                    {/* Code preview */}
                    {!compareMode && (
                      <div className="font-mono text-xs overflow-auto max-h-48 bg-muted/30 rounded p-2 whitespace-pre">
                        {version.content.slice(0, 1000)}
                        {version.content.length > 1000 && (
                          <span className="text-muted-foreground">... ({version.content.length - 1000} more characters)</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border bg-muted/30 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Last 50 versions are kept per file
        </div>
      </div>
    </div>
  );
}

// Helper function to save a code version
export async function saveCodeVersion(
  supabase: ReturnType<typeof createClient>,
  fileId: string,
  content: string,
  message?: string
) {
  try {
    const { error } = await supabase
      .from('code_versions')
      .insert({
        file_id: fileId,
        content,
        message: message || null,
      });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Failed to save code version:', err);
    return { success: false, error: err };
  }
}
