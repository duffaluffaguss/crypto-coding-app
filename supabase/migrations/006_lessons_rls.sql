-- Fix RLS policies for lessons table
-- Lessons should be readable by anyone (public content)
-- Only admins should be able to modify lessons

-- Enable RLS on lessons table
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read lessons (they're public educational content)
CREATE POLICY "Anyone can read lessons"
  ON lessons
  FOR SELECT
  USING (true);

-- Only authenticated users with admin role can insert/update/delete
-- For now, we'll restrict modifications to the service role only
-- (done through Supabase dashboard or migrations, not user actions)

-- Note: If you want user-generated lessons later, add:
-- CREATE POLICY "Users can create their own lessons"
--   ON lessons
--   FOR INSERT
--   WITH CHECK (auth.uid() = created_by);
