-- Community Showcase Migration
-- Adds public showcase functionality for projects

-- Add new columns to projects table for showcase feature
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS showcase_description text,
ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;

-- Create project_likes table for tracking likes
CREATE TABLE IF NOT EXISTS public.project_likes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, project_id)
);

-- Index for efficient like lookups
CREATE INDEX IF NOT EXISTS idx_project_likes_project ON public.project_likes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_likes_user ON public.project_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_is_public ON public.projects(is_public) WHERE is_public = true;

-- Enable RLS on project_likes
ALTER TABLE public.project_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_likes
CREATE POLICY "Users can view all likes"
  ON public.project_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can like projects"
  ON public.project_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
  ON public.project_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update projects policies for public showcase
-- Anyone can read public projects (even unauthenticated)
DROP POLICY IF EXISTS "Anyone can view public showcase projects" ON public.projects;
CREATE POLICY "Anyone can view public showcase projects"
  ON public.projects FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

-- Allow viewing files for public projects
DROP POLICY IF EXISTS "Anyone can view public project files" ON public.project_files;
CREATE POLICY "Anyone can view public project files"
  ON public.project_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_files.project_id
      AND (projects.is_public = true OR projects.user_id = auth.uid())
    )
  );

-- Function to increment likes count
CREATE OR REPLACE FUNCTION increment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.projects
  SET likes_count = likes_count + 1
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement likes count
CREATE OR REPLACE FUNCTION decrement_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.projects
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = OLD.project_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for automatic likes count update
DROP TRIGGER IF EXISTS on_project_like ON public.project_likes;
CREATE TRIGGER on_project_like
  AFTER INSERT ON public.project_likes
  FOR EACH ROW EXECUTE FUNCTION increment_likes_count();

DROP TRIGGER IF EXISTS on_project_unlike ON public.project_likes;
CREATE TRIGGER on_project_unlike
  AFTER DELETE ON public.project_likes
  FOR EACH ROW EXECUTE FUNCTION decrement_likes_count();
