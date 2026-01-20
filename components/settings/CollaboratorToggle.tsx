'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function CollaboratorToggle() {
  const [isLookingForCollaborators, setIsLookingForCollaborators] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    loadCurrentSetting();
  }, []);

  const loadCurrentSetting = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('looking_for_collaborators')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading collaborator setting:', error);
        return;
      }

      setIsLookingForCollaborators(profile?.looking_for_collaborators || false);
    } catch (error) {
      console.error('Error loading collaborator setting:', error);
    }
  };

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to change this setting');
        return;
      }

      const newValue = !isLookingForCollaborators;

      const { error } = await supabase
        .from('profiles')
        .update({ looking_for_collaborators: newValue })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setIsLookingForCollaborators(newValue);
      
      if (newValue) {
        toast.success('You\'re now visible in the Builder Directory as looking for collaborators!');
      } else {
        toast.success('You\'re no longer marked as looking for collaborators');
      }
    } catch (error) {
      console.error('Error updating collaborator setting:', error);
      toast.error('Failed to update setting. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant={isLookingForCollaborators ? "default" : "outline"}
        size="sm"
        onClick={handleToggle}
        disabled={isLoading}
        className="min-w-16"
      >
        {isLoading ? '...' : (isLookingForCollaborators ? 'On' : 'Off')}
      </Button>
      
      {isLookingForCollaborators && (
        <span className="text-xs text-muted-foreground">
          Other builders can find and connect with you
        </span>
      )}
    </div>
  );
}