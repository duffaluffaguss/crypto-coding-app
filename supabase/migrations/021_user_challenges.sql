-- User-Generated Challenges Feature
-- Create tables for community-created challenges with admin approval

-- User challenges table
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  starter_code TEXT NOT NULL DEFAULT '',
  test_cases JSONB NOT NULL DEFAULT '[]',
  solution_hint TEXT,
  points INTEGER NOT NULL DEFAULT 20,
  category TEXT NOT NULL DEFAULT 'solidity',
  is_approved BOOLEAN NOT NULL DEFAULT false,
  is_rejected BOOLEAN NOT NULL DEFAULT false,
  rejection_reason TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User challenge completions table
CREATE TABLE IF NOT EXISTS user_challenge_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES user_challenges(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  code_submitted TEXT NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, challenge_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_challenges_creator ON user_challenges(creator_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_approved ON user_challenges(is_approved);
CREATE INDEX IF NOT EXISTS idx_user_challenges_pending ON user_challenges(is_approved, is_rejected) WHERE is_approved = false AND is_rejected = false;
CREATE INDEX IF NOT EXISTS idx_user_challenge_completions_user ON user_challenge_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenge_completions_challenge ON user_challenge_completions(challenge_id);

-- RLS Policies
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_completions ENABLE ROW LEVEL SECURITY;

-- Users can view approved challenges
CREATE POLICY "Anyone can view approved user challenges"
  ON user_challenges FOR SELECT
  TO authenticated
  USING (is_approved = true);

-- Users can view their own challenges (regardless of status)
CREATE POLICY "Users can view their own challenges"
  ON user_challenges FOR SELECT
  TO authenticated
  USING (auth.uid() = creator_id);

-- Users can create challenges
CREATE POLICY "Users can create challenges"
  ON user_challenges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

-- Users can update their own pending challenges
CREATE POLICY "Users can update their own pending challenges"
  ON user_challenges FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id AND is_approved = false AND is_rejected = false)
  WITH CHECK (auth.uid() = creator_id);

-- Users can delete their own pending challenges
CREATE POLICY "Users can delete their own pending challenges"
  ON user_challenges FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id AND is_approved = false);

-- User challenge completions policies
CREATE POLICY "Users can view their own challenge completions"
  ON user_challenge_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all completions for stats"
  ON user_challenge_completions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can submit challenge completions"
  ON user_challenge_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to get pending challenges count for admin
CREATE OR REPLACE FUNCTION get_pending_challenges_count()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*) FROM user_challenges 
  WHERE is_approved = false AND is_rejected = false;
$$;

-- Function to get user's created challenges count
CREATE OR REPLACE FUNCTION get_user_created_challenges_count(user_uuid UUID)
RETURNS TABLE (
  total_created BIGINT,
  approved_count BIGINT,
  pending_count BIGINT,
  rejected_count BIGINT
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE is_approved = true),
    COUNT(*) FILTER (WHERE is_approved = false AND is_rejected = false),
    COUNT(*) FILTER (WHERE is_rejected = true)
  FROM user_challenges
  WHERE creator_id = user_uuid;
$$;
