-- Learning Paths Migration
-- Adds learning paths feature to organize lessons into structured learning paths

-- Learning paths table
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_hours integer NOT NULL,
  "order" integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Learning path items table (connects lessons to paths)
CREATE TABLE IF NOT EXISTS public.learning_path_items (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  path_id uuid REFERENCES public.learning_paths(id) ON DELETE CASCADE NOT NULL,
  lesson_id text REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  "order" integer NOT NULL,
  is_required boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(path_id, lesson_id),
  UNIQUE(path_id, "order")
);

-- User learning paths table (tracks user enrollment and progress)
CREATE TABLE IF NOT EXISTS public.user_learning_paths (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  path_id uuid REFERENCES public.learning_paths(id) ON DELETE CASCADE NOT NULL,
  started_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at timestamp with time zone,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_lesson_id text REFERENCES public.lessons(id),
  certificate_minted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, path_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_paths_slug ON public.learning_paths(slug);
CREATE INDEX IF NOT EXISTS idx_learning_paths_active_order ON public.learning_paths(is_active, "order");
CREATE INDEX IF NOT EXISTS idx_learning_path_items_path_order ON public.learning_path_items(path_id, "order");
CREATE INDEX IF NOT EXISTS idx_user_learning_paths_user ON public.user_learning_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_paths_path ON public.user_learning_paths(path_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_paths_progress ON public.user_learning_paths(user_id, progress);

-- Row Level Security
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_paths ENABLE ROW LEVEL SECURITY;

-- Learning paths policies (public read for active paths)
CREATE POLICY "Anyone can view active learning paths"
  ON public.learning_paths FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Learning path items policies (public read)
CREATE POLICY "Anyone can view learning path items"
  ON public.learning_path_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.learning_paths
      WHERE learning_paths.id = learning_path_items.path_id
      AND learning_paths.is_active = true
    )
  );

-- User learning paths policies
CREATE POLICY "Users can view own learning path enrollments"
  ON public.user_learning_paths FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll in learning paths"
  ON public.user_learning_paths FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning path progress"
  ON public.user_learning_paths FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
DROP TRIGGER IF EXISTS update_learning_paths_updated_at ON public.learning_paths;
CREATE TRIGGER update_learning_paths_updated_at
  BEFORE UPDATE ON public.learning_paths
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_learning_paths_updated_at ON public.user_learning_paths;
CREATE TRIGGER update_user_learning_paths_updated_at
  BEFORE UPDATE ON public.user_learning_paths
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Function to calculate learning path progress
CREATE OR REPLACE FUNCTION calculate_path_progress(p_user_id uuid, p_path_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  total_lessons integer;
  completed_lessons integer;
  progress_percentage integer;
BEGIN
  -- Get total required lessons in path
  SELECT COUNT(*)
  INTO total_lessons
  FROM public.learning_path_items
  WHERE path_id = p_path_id AND is_required = true;
  
  -- Get completed lessons for this user and path
  SELECT COUNT(DISTINCT lpi.lesson_id)
  INTO completed_lessons
  FROM public.learning_path_items lpi
  INNER JOIN public.learning_progress lp 
    ON lpi.lesson_id = lp.lesson_id 
    AND lp.user_id = p_user_id
    AND lp.status = 'completed'
  WHERE lpi.path_id = p_path_id 
    AND lpi.is_required = true;
  
  -- Calculate percentage
  IF total_lessons > 0 THEN
    progress_percentage := ROUND((completed_lessons::numeric / total_lessons::numeric) * 100);
  ELSE
    progress_percentage := 0;
  END IF;
  
  RETURN progress_percentage;
END;
$$;