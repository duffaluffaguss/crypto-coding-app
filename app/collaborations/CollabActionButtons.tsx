'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CollabActionButtonsProps {
  requestId: string;
}

export function CollabActionButtons({ requestId }: CollabActionButtonsProps) {
  const [isLoading, setIsLoading] = useState<'accept' | 'decline' | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleAction = async (action: 'accept' | 'decline') => {
    setIsLoading(action);
    
    try {
      const status = action === 'accept' ? 'accepted' : 'declined';
      
      const { error } = await supabase
        .from('collab_requests')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success(
        action === 'accept' 
          ? 'Collaboration request accepted!' 
          : 'Collaboration request declined'
      );
      
      router.refresh();
    } catch (error) {
      console.error(`Failed to ${action} collaboration request:`, error);
      toast.error(`Failed to ${action} request. Please try again.`);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="flex gap-2 pt-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction('decline')}
        disabled={isLoading !== null}
        className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
      >
        {isLoading === 'decline' ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <X className="h-4 w-4 mr-2" />
        )}
        Decline
      </Button>
      <Button
        variant="default"
        size="sm"
        onClick={() => handleAction('accept')}
        disabled={isLoading !== null}
        className="flex-1 bg-green-600 hover:bg-green-700"
      >
        {isLoading === 'accept' ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Check className="h-4 w-4 mr-2" />
        )}
        Accept
      </Button>
    </div>
  );
}