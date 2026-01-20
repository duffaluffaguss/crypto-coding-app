-- Announcements table for in-app announcements
-- Created: 2026-01-20

CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'feature')),
  priority INTEGER NOT NULL DEFAULT 0, -- Higher = more important, 10+ triggers modal
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index for fetching active announcements
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements (starts_at, expires_at) 
  WHERE expires_at IS NULL OR expires_at > NOW();

-- Index for ordering by priority
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements (priority DESC, created_at DESC);

-- RLS Policies
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Public can read active announcements
CREATE POLICY "Anyone can read active announcements"
  ON announcements
  FOR SELECT
  USING (
    starts_at <= NOW() 
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- Only admins can insert announcements (checked via API)
-- Using service role for admin operations
CREATE POLICY "Service role can manage announcements"
  ON announcements
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions
GRANT SELECT ON announcements TO anon, authenticated;
GRANT ALL ON announcements TO service_role;

-- Add comment for documentation
COMMENT ON TABLE announcements IS 'In-app announcements for users. Priority 10+ shows as modal.';
COMMENT ON COLUMN announcements.type IS 'Visual style: info (blue), warning (yellow), success (green), feature (purple)';
COMMENT ON COLUMN announcements.priority IS 'Display priority. 10+ triggers modal instead of banner.';
