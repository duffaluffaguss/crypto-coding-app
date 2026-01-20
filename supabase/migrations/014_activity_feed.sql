-- Activity Feed Migration
-- Creates activities table for community activity feed

-- Activity types enum-like constraint
-- Types: project_created, lesson_completed, contract_deployed, achievement_earned, joined_showcase

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'project_created',
    'lesson_completed', 
    'contract_deployed',
    'achievement_earned',
    'joined_showcase'
  )),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_created ON activities(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Activities are publicly readable (community feed)
CREATE POLICY "Activities are publicly readable"
  ON activities FOR SELECT
  USING (true);

-- Users can insert their own activities
CREATE POLICY "Users can insert own activities"
  ON activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own activities
CREATE POLICY "Users can delete own activities"
  ON activities FOR DELETE
  USING (auth.uid() = user_id);

-- Function to log an activity
CREATE OR REPLACE FUNCTION log_activity(
  p_user_id UUID,
  p_type TEXT,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO activities (user_id, type, metadata)
  VALUES (p_user_id, p_type, p_metadata)
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get paginated activity feed
CREATE OR REPLACE FUNCTION get_activity_feed(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_type TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  user_id UUID,
  type TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  display_name TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.user_id,
    a.type,
    a.metadata,
    a.created_at,
    COALESCE(p.display_name, 'Anonymous') AS display_name,
    p.avatar_url
  FROM activities a
  LEFT JOIN profiles p ON p.id = a.user_id
  WHERE 
    (p_type IS NULL OR a.type = p_type)
    AND (p_user_id IS NULL OR a.user_id = p_user_id)
  ORDER BY a.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get activity count (for pagination)
CREATE OR REPLACE FUNCTION get_activity_count(
  p_type TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM activities a
    WHERE 
      (p_type IS NULL OR a.type = p_type)
      AND (p_user_id IS NULL OR a.user_id = p_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
