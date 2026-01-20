-- Showcase Comments Migration
-- Adds comments functionality for showcase projects

-- Create showcase_comments table
CREATE TABLE IF NOT EXISTS public.showcase_comments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL CHECK (length(content) > 0 AND length(content) <= 1000),
  parent_id uuid REFERENCES public.showcase_comments(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_showcase_comments_project ON public.showcase_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_showcase_comments_user ON public.showcase_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_showcase_comments_parent ON public.showcase_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_showcase_comments_created ON public.showcase_comments(created_at DESC);

-- Add comments count to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0;

-- Enable RLS on showcase_comments
ALTER TABLE public.showcase_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for showcase_comments

-- Anyone can read comments on public projects
CREATE POLICY "Anyone can view showcase comments"
  ON public.showcase_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = showcase_comments.project_id
      AND projects.is_public = true
    )
  );

-- Authenticated users can add comments to public projects
CREATE POLICY "Users can add showcase comments"
  ON public.showcase_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_id
      AND projects.is_public = true
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update their own showcase comments"
  ON public.showcase_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own showcase comments"
  ON public.showcase_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_showcase_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_showcase_comment_updated_at ON public.showcase_comments;
CREATE TRIGGER update_showcase_comment_updated_at
  BEFORE UPDATE ON public.showcase_comments
  FOR EACH ROW EXECUTE FUNCTION update_showcase_comment_updated_at();

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
DROP TRIGGER IF EXISTS on_showcase_comment_add ON public.showcase_comments;
CREATE TRIGGER on_showcase_comment_add
  AFTER INSERT ON public.showcase_comments
  FOR EACH ROW EXECUTE FUNCTION increment_comments_count();

DROP TRIGGER IF EXISTS on_showcase_comment_delete ON public.showcase_comments;
CREATE TRIGGER on_showcase_comment_delete
  AFTER DELETE ON public.showcase_comments
  FOR EACH ROW EXECUTE FUNCTION decrement_comments_count();