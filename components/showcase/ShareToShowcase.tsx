'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface ShareToShowcaseProps {
  projectId: string;
  initialIsPublic: boolean;
  initialDescription?: string;
  onUpdate?: (isPublic: boolean) => void;
}

export function ShareToShowcase({
  projectId,
  initialIsPublic,
  initialDescription,
  onUpdate,
}: ShareToShowcaseProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [description, setDescription] = useState(initialDescription || '');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const supabase = createClient();

  const handleToggle = async () => {
    if (!isPublic && !showForm) {
      setShowForm(true);
      return;
    }

    setLoading(true);

    try {
      const newIsPublic = !isPublic;
      
      const { error } = await supabase
        .from('projects')
        .update({
          is_public: newIsPublic,
          showcase_description: newIsPublic ? description : null,
        })
        .eq('id', projectId);

      if (!error) {
        setIsPublic(newIsPublic);
        setShowForm(false);
        onUpdate?.(newIsPublic);
      }
    } catch (error) {
      console.error('Error updating showcase status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          is_public: true,
          showcase_description: description,
        })
        .eq('id', projectId);

      if (!error) {
        setIsPublic(true);
        setShowForm(false);
        onUpdate?.(true);
      }
    } catch (error) {
      console.error('Error sharing to showcase:', error);
    } finally {
      setLoading(false);
    }
  };

  if (showForm && !isPublic) {
    return (
      <div className="space-y-3 p-4 bg-muted/50 rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Share to Showcase</h4>
          <button
            onClick={() => setShowForm(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          Add a description for the showcase (optional):
        </p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell others about your project..."
          className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          rows={3}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleShare}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Sharing...' : '🚀 Share to Showcase'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowForm(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isPublic ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'
        }`}>
          {isPublic ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
        </div>
        <div>
          <div className="text-sm font-medium">
            {isPublic ? 'Shared to Showcase' : 'Private Project'}
          </div>
          <div className="text-xs text-muted-foreground">
            {isPublic ? 'Anyone can view and fork' : 'Only you can see this'}
          </div>
        </div>
      </div>
      <Button
        variant={isPublic ? 'outline' : 'default'}
        size="sm"
        onClick={handleToggle}
        disabled={loading}
      >
        {loading ? '...' : isPublic ? 'Make Private' : 'Share'}
      </Button>
    </div>
  );
}
