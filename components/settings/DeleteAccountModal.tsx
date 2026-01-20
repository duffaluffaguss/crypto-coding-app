'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface DeleteAccountModalProps {
  userEmail?: string | null;
}

export function DeleteAccountModal({ userEmail }: DeleteAccountModalProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmationRequired = 'DELETE';
  const isConfirmed = confirmText === confirmationRequired;

  const handleDelete = async () => {
    if (!isConfirmed) return;
    
    setIsDeleting(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Delete user data from profiles (cascade should handle related data)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Delete projects first
        await supabase.from('projects').delete().eq('user_id', user.id);
        
        // Delete learning progress
        await supabase.from('learning_progress').delete().eq('user_id', user.id);
        
        // Delete user achievements
        await supabase.from('user_achievements').delete().eq('user_id', user.id);
        
        // Delete profile
        await supabase.from('profiles').delete().eq('id', user.id);
      }
      
      // Sign out the user
      await supabase.auth.signOut();
      
      // Redirect to home
      window.location.href = '/';
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account. Please try again or contact support.');
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Delete Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Delete Account
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <p>
              This action is <strong>permanent and cannot be undone</strong>. All your data will be deleted:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 mt-2">
              <li>All projects and code</li>
              <li>Learning progress and achievements</li>
              <li>Profile information</li>
              <li>Showcase submissions</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {userEmail && (
            <p className="text-sm text-muted-foreground">
              Logged in as: <span className="font-medium text-foreground">{userEmail}</span>
            </p>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Type <span className="font-mono bg-muted px-1 rounded">{confirmationRequired}</span> to confirm:
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className={!isConfirmed && confirmText.length > 0 ? 'border-destructive' : ''}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setConfirmText('');
              setError(null);
            }}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
          >
            {isDeleting ? (
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Deleting...
              </>
            ) : (
              'Delete My Account'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
