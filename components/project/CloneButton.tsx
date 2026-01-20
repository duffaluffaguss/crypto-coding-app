'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CloneButtonProps {
  projectId: string;
  projectName: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function CloneButton({ 
  projectId, 
  projectName, 
  variant = 'outline',
  size = 'default',
  showText = true,
  className = ''
}: CloneButtonProps) {
  const [isCloning, setIsCloning] = useState(false);
  const router = useRouter();

  const handleClone = async () => {
    if (isCloning) return;

    try {
      setIsCloning(true);
      
      const response = await fetch('/api/projects/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clone project');
      }

      // Show success message
      toast.success(`Successfully cloned "${projectName}"`, {
        description: `Created "${data.project.name}" with ${data.filesCloned} files`,
      });

      // Redirect to the new project
      router.push(`/projects/${data.project.id}`);
      
    } catch (error) {
      console.error('Error cloning project:', error);
      toast.error('Failed to clone project', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClone}
      disabled={isCloning}
      className={className}
    >
      {isCloning ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      {showText && (
        <span className="ml-2">
          {isCloning ? 'Cloning...' : 'Clone Project'}
        </span>
      )}
    </Button>
  );
}