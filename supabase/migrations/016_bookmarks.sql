-- Bookmarks Migration
-- Creates bookmarks table for saving templates, projects, and lessons

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('template', 'project', 'lesson')),
  item_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate bookmarks
  CONSTRAINT unique_bookmark UNIQUE (user_id, item_type, item_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_item_type ON bookmarks(item_type);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_type ON bookmarks(user_id, item_type);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);

-- Enable RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can only view their own bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only create their own bookmarks
CREATE POLICY "Users can create own bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own bookmarks
CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Function to check if a user has bookmarked an item
CREATE OR REPLACE FUNCTION is_bookmarked(
  p_user_id UUID,
  p_item_type TEXT,
  p_item_id TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM bookmarks
    WHERE user_id = p_user_id
      AND item_type = p_item_type
      AND item_id = p_item_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get bookmark count for an item
CREATE OR REPLACE FUNCTION get_bookmark_count(
  p_item_type TEXT,
  p_item_id TEXT
) RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM bookmarks
    WHERE item_type = p_item_type
      AND item_id = p_item_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's bookmarks by type
CREATE OR REPLACE FUNCTION get_user_bookmarks(
  p_user_id UUID,
  p_item_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  id UUID,
  item_type TEXT,
  item_id TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.item_type,
    b.item_id,
    b.created_at
  FROM bookmarks b
  WHERE b.user_id = p_user_id
    AND (p_item_type IS NULL OR b.item_type = p_item_type)
  ORDER BY b.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
