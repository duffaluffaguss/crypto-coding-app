-- Project Comments Migration
-- Adds commenting functionality to showcase projects

-- Create project_comments table
CREATE TABLE IF NOT EXISTS public.project_comments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL CHECK (char_length(content) <= 500),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comments_count to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0;

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_project_comments_project ON public.project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_user ON public.project_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_created ON public.project_comments(created_at DESC);

-- Enable RLS on project_comments
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_comments

-- Anyone can read comments on public projects
CREATE POLICY "Anyone can view comments on public projects"
  ON public.project_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_comments.project_id
      AND projects.is_public = true
    )
  );

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON public.project_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_comments.project_id
      AND projects.is_public = true
    )
  );

-- Users can only delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON public.project_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to increment comments count
CREATE OR REPLACE FUNCTION increment_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.projects
  SET comments_count = comments_count + 1
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement comments count
CREATE OR REPLACE FUNCTION decrement_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.projects
  SET comments_count = GREATEST(comments_count - 1, 0)
  WHERE id = OLD.project_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for automatic comments count update
DROP TRIGGER IF EXISTS on_comment_insert ON public.project_comments;
CREATE TRIGGER on_comment_insert
  AFTER INSERT ON public.project_comments
  FOR EACH ROW EXECUTE FUNCTION increment_comments_count();

DROP TRIGGER IF EXISTS on_comment_delete ON public.project_comments;
CREATE TRIGGER on_comment_delete
  AFTER DELETE ON public.project_comments
  FOR EACH ROW EXECUTE FUNCTION decrement_comments_count();
