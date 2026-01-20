-- Enhanced Activity Feed Migration
-- Creates updated activities table with expanded activity types

-- Drop existing table if we need to recreate with new schema
-- DROP TABLE IF EXISTS activities CASCADE;

-- Create activities table with updated schema
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'contract_deployed',
    'achievement_earned', 
    'lesson_completed',
    'project_created',
    'user_followed'
  )),
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_activities_user_id_new ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type_new ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at_new ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_composite_new ON activities(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public read access for activity feed
CREATE POLICY "Activities are publicly readable"
  ON activities FOR SELECT
  USING (true);

-- RLS Policy: Users can only insert their own activities
CREATE POLICY "Users can insert own activities"
  ON activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own activities  
CREATE POLICY "Users can delete own activities"
  ON activities FOR DELETE
  USING (auth.uid() = user_id);

-- Function to create activity with validation
CREATE OR REPLACE FUNCTION create_activity(
  activity_type TEXT,
  activity_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  activity_id UUID;
  current_user_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Insert activity
  INSERT INTO activities (user_id, type, data)
  VALUES (current_user_id, activity_type, activity_data)
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get activity feed with user details
CREATE OR REPLACE FUNCTION get_activity_feed(
  feed_limit INTEGER DEFAULT 20,
  feed_offset INTEGER DEFAULT 0,
  activity_type TEXT DEFAULT NULL,
  target_user_id UUID DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  user_id UUID,
  type TEXT,
  data JSONB,
  created_at TIMESTAMPTZ,
  user_display_name TEXT,
  user_avatar_url TEXT,
  user_username TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.user_id,
    a.type,
    a.data,
    a.created_at,
    COALESCE(p.display_name, p.username, 'Anonymous') AS user_display_name,
    p.avatar_url AS user_avatar_url,
    p.username AS user_username
  FROM activities a
  LEFT JOIN profiles p ON p.id = a.user_id
  WHERE 
    (activity_type IS NULL OR a.type = activity_type)
    AND (target_user_id IS NULL OR a.user_id = target_user_id)
  ORDER BY a.created_at DESC
  LIMIT feed_limit
  OFFSET feed_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get activity count for pagination
CREATE OR REPLACE FUNCTION get_activity_count(
  activity_type TEXT DEFAULT NULL,
  target_user_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM activities a
    WHERE 
      (activity_type IS NULL OR a.type = activity_type)
      AND (target_user_id IS NULL OR a.user_id = target_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;