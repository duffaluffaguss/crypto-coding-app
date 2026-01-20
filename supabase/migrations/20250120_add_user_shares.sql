-- Create user_shares table for tracking share events
CREATE TABLE IF NOT EXISTS user_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  platform VARCHAR(50) NOT NULL, -- 'twitter', 'linkedin', 'copy_link', 'image', etc.
  shared_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- who shared it (nullable for anonymous)
  achievement_id UUID REFERENCES achievements(id) ON DELETE SET NULL, -- if sharing specific achievement
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_platform CHECK (platform IN (
    'twitter', 
    'linkedin', 
    'copy_link', 
    'image',
    'twitter_achievement',
    'linkedin_achievement', 
    'copy_achievement',
    'image_achievement'
  ))
);

-- Add indexes for performance
CREATE INDEX idx_user_shares_user_id ON user_shares(user_id);
CREATE INDEX idx_user_shares_platform ON user_shares(platform);
CREATE INDEX idx_user_shares_shared_at ON user_shares(shared_at);
CREATE INDEX idx_user_shares_achievement_id ON user_shares(achievement_id) WHERE achievement_id IS NOT NULL;

-- Add share count columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_shares INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS twitter_shares INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS linkedin_shares INTEGER DEFAULT 0;

-- Create function to increment share counts
CREATE OR REPLACE FUNCTION increment_share_count(
  target_user_id UUID,
  share_platform VARCHAR(50)
) 
RETURNS VOID 
LANGUAGE plpgsql 
AS $$
BEGIN
  -- Increment total shares
  UPDATE profiles 
  SET total_shares = COALESCE(total_shares, 0) + 1
  WHERE id = target_user_id;
  
  -- Increment platform-specific shares
  CASE share_platform
    WHEN 'twitter' OR 'twitter_achievement' THEN
      UPDATE profiles 
      SET twitter_shares = COALESCE(twitter_shares, 0) + 1
      WHERE id = target_user_id;
    WHEN 'linkedin' OR 'linkedin_achievement' THEN
      UPDATE profiles 
      SET linkedin_shares = COALESCE(linkedin_shares, 0) + 1
      WHERE id = target_user_id;
  END CASE;
END;
$$;

-- Add RLS policies
ALTER TABLE user_shares ENABLE ROW LEVEL SECURITY;

-- Users can view all shares (for public stats)
CREATE POLICY "Allow users to view shares" ON user_shares
  FOR SELECT USING (true);

-- Users can insert shares for any user (for tracking)
CREATE POLICY "Allow users to insert shares" ON user_shares
  FOR INSERT WITH CHECK (true);

-- Users can only update/delete their own shares
CREATE POLICY "Users can manage their own shares" ON user_shares
  FOR ALL USING (shared_by = auth.uid());

-- Grant necessary permissions
GRANT ALL ON user_shares TO authenticated;
GRANT ALL ON user_shares TO anon; -- Allow anonymous sharing tracking