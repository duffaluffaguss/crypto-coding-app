import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { ProjectIDE } from '@/components/editor/ProjectIDE';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!project) {
    notFound();
  }

  // Get project files
  const { data: files } = await supabase
    .from('project_files')
    .select('*')
    .eq('project_id', id)
    .order('filename');

  // Get lessons for this project type
  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .eq('project_type', project.project_type)
    .order('order');

  // Get user's progress
  const { data: progress } = await supabase
    .from('learning_progress')
    .select('*')
    .eq('project_id', id)
    .eq('user_id', user.id);

  return (
    <ProjectIDE
      project={project}
      initialFiles={files || []}
      lessons={lessons || []}
      progress={progress || []}
    />
  );
}
