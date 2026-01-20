'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CollabRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUsername?: string;
  currentUserId: string | null;
  onRequestSent: () => void;
  onLoading?: (loading: boolean) => void;
}

export function CollabRequestModal({
  isOpen,
  onClose,
  targetUserId,
  targetUsername,
  currentUserId,
  onRequestSent,
  onLoading,
}: CollabRequestModalProps) {
  const [message, setMessage] = useState('');
  const [projectIdea, setProjectIdea] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUserId || !message.trim() || !projectIdea.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (message.length > 500) {
      toast.error('Message must be 500 characters or less');
      return;
    }

    if (projectIdea.length > 1000) {
      toast.error('Project idea must be 1000 characters or less');
      return;
    }

    setIsSubmitting(true);
    onLoading?.(true);

    try {
      // Check if a request already exists
      const { data: existingRequest, error: checkError } = await supabase
        .from('collab_requests')
        .select('id')
        .eq('from_user_id', currentUserId)
        .eq('to_user_id', targetUserId)
        .eq('status', 'pending')
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingRequest) {
        toast.error('You already have a pending collaboration request with this user');
        return;
      }

      // Create the collaboration request
      const { error: insertError } = await supabase
        .from('collab_requests')
        .insert({
          from_user_id: currentUserId,
          to_user_id: targetUserId,
          message: message.trim(),
          project_idea: projectIdea.trim(),
        });

      if (insertError) throw insertError;

      toast.success('Collaboration request sent successfully!');
      setMessage('');
      setProjectIdea('');
      onRequestSent();
    } catch (error) {
      console.error('Failed to send collaboration request:', error);
      toast.error('Failed to send collaboration request. Please try again.');
    } finally {
      setIsSubmitting(false);
      onLoading?.(false);
    }
  }, [currentUserId, targetUserId, message, projectIdea, supabase, onRequestSent, onLoading]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setMessage('');
      setProjectIdea('');
      onClose();
    }
  }, [isSubmitting, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Request Collaboration
          </DialogTitle>
          <DialogDescription>
            Send a collaboration request to{' '}
            {targetUsername ? `@${targetUsername}` : 'this user'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Idea */}
          <div className="space-y-2">
            <Label htmlFor="project-idea">
              Project Idea <span className="text-destructive">*</span>
            </Label>
            <Input
              id="project-idea"
              value={projectIdea}
              onChange={(e) => setProjectIdea(e.target.value)}
              placeholder="What would you like to build together?"
              maxLength={1000}
              disabled={isSubmitting}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {projectIdea.length}/1000 characters
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">
              Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell them why you'd like to collaborate..."
              className="min-h-[100px] resize-none"
              maxLength={500}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/500 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !message.trim() || !projectIdea.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Request
            </Button>
          </div>
        </form>

        {/* Tips */}
        <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
          <p className="font-medium text-muted-foreground">Tips for a great request:</p>
          <ul className="text-muted-foreground space-y-0.5 ml-2">
            <li>• Be specific about what you want to build</li>
            <li>• Explain what skills you bring</li>
            <li>• Keep it friendly and professional</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}