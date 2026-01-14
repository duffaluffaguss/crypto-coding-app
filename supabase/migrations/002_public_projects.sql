-- Allow public viewing of published/deployed projects
-- Run this in your Supabase SQL Editor

-- Add policy for public viewing of deployed projects
CREATE POLICY "Anyone can view published projects"
  ON public.projects FOR SELECT
  USING (status IN ('deployed', 'published'));

-- Add policy for public viewing of files for published projects
CREATE POLICY "Anyone can view published project files"
  ON public.project_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_files.project_id
      AND projects.status IN ('deployed', 'published')
    )
  );
