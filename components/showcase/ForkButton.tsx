'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface ForkButtonProps {
  projectId: string;
  projectName: string;
  isLoggedIn: boolean;
}

export function ForkButton({ projectId, projectName, isLoggedIn }: ForkButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleFork = async () => {
    if (!isLoggedIn) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch original project
      const { data: originalProject, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError || !originalProject) {
        throw new Error('Could not fetch original project');
      }

      // Fetch original files
      const { data: originalFiles, error: filesError } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId);

      if (filesError) {
        throw new Error('Could not fetch project files');
      }

      // Create forked project
      const { data: forkedProject, error: forkError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: `${projectName} (Fork)`,
          description: `Forked from: ${originalProject.description}`,
          project_type: originalProject.project_type,
          status: 'draft',
          is_public: false,
        })
        .select()
        .single();

      if (forkError || !forkedProject) {
        throw new Error('Could not create forked project');
      }

      // Copy files to forked project
      if (originalFiles && originalFiles.length > 0) {
        const filesToInsert = originalFiles.map((file) => ({
          project_id: forkedProject.id,
          filename: file.filename,
          content: file.content,
          file_type: file.file_type,
          is_template: false,
        }));

        await supabase.from('project_files').insert(filesToInsert);
      }

      // Redirect to the new forked project
      router.push(`/projects/${forkedProject.id}`);
    } catch (error) {
      console.error('Error forking project:', error);
      alert('Failed to fork project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full gap-2"
      onClick={handleFork}
      disabled={loading}
    >
      {loading ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Forking...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Fork this Project
        </>
      )}
    </Button>
  );
}
