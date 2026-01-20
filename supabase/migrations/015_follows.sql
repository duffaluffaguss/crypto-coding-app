-- Follow System Migration
-- Creates follows table for social following functionality

CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent self-following and duplicate follows
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at DESC);

-- Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Follows are publicly readable (anyone can see who follows whom)
CREATE POLICY "Follows are publicly readable"
  ON follows FOR SELECT
  USING (true);

-- Users can only create follows for themselves
CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Users can only delete their own follows
CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Function to get follower count for a user
CREATE OR REPLACE FUNCTION get_follower_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM follows
    WHERE following_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get following count for a user
CREATE OR REPLACE FUNCTION get_following_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM follows
    WHERE follower_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user follows another
CREATE OR REPLACE FUNCTION is_following(p_follower_id UUID, p_following_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM follows
    WHERE follower_id = p_follower_id
      AND following_id = p_following_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get followers list with pagination
CREATE OR REPLACE FUNCTION get_followers(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  id UUID,
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  followed_at TIMESTAMPTZ,
  is_following_back BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.follower_id AS user_id,
    COALESCE(p.display_name, 'Anonymous') AS display_name,
    p.avatar_url,
    p.bio,
    f.created_at AS followed_at,
    EXISTS (
      SELECT 1 FROM follows f2 
      WHERE f2.follower_id = p_user_id 
        AND f2.following_id = f.follower_id
    ) AS is_following_back
  FROM follows f
  LEFT JOIN profiles p ON p.id = f.follower_id
  WHERE f.following_id = p_user_id
  ORDER BY f.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get following list with pagination
CREATE OR REPLACE FUNCTION get_following(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  id UUID,
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  followed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.following_id AS user_id,
    COALESCE(p.display_name, 'Anonymous') AS display_name,
    p.avatar_url,
    p.bio,
    f.created_at AS followed_at
  FROM follows f
  LEFT JOIN profiles p ON p.id = f.following_id
  WHERE f.follower_id = p_user_id
  ORDER BY f.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated activity feed function to support following filter
CREATE OR REPLACE FUNCTION get_activity_feed(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_type TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_following_only BOOLEAN DEFAULT FALSE,
  p_viewer_id UUID DEFAULT NULL
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
    AND (
      NOT p_following_only 
      OR p_viewer_id IS NULL
      OR a.user_id IN (
        SELECT following_id FROM follows WHERE follower_id = p_viewer_id
      )
      OR a.user_id = p_viewer_id -- Include own activities
    )
  ORDER BY a.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a trigger to log follow activity (optional - can be added later if needed)
-- For now, follows don't generate activity feed entries to avoid spam
