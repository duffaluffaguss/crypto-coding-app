-- Challenge Streaks and Bonus Points
-- Add bonus points to challenge completions and challenge streak to profiles

-- Add bonus_points column to challenge_completions
ALTER TABLE challenge_completions
ADD COLUMN IF NOT EXISTS bonus_points INTEGER DEFAULT 0;

-- Add challenge streak columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS challenge_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_challenge_streak INTEGER DEFAULT 0;

-- Update the user challenge stats function to include bonus points
CREATE OR REPLACE FUNCTION get_user_challenge_stats(user_uuid UUID)
RETURNS TABLE (
  total_completed BIGINT,
  total_points BIGINT,
  total_bonus_points BIGINT,
  current_streak INTEGER,
  longest_streak INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  streak INTEGER := 0;
  check_date DATE := CURRENT_DATE;
  profile_streak INTEGER;
  profile_longest_streak INTEGER;
BEGIN
  -- Get totals
  SELECT 
    COUNT(*),
    COALESCE(SUM(points_earned), 0),
    COALESCE(SUM(bonus_points), 0)
  INTO total_completed, total_points, total_bonus_points
  FROM challenge_completions
  WHERE challenge_completions.user_id = user_uuid;
  
  -- Get streak from profile
  SELECT 
    COALESCE(p.challenge_streak, 0),
    COALESCE(p.longest_challenge_streak, 0)
  INTO profile_streak, profile_longest_streak
  FROM profiles p
  WHERE p.id = user_uuid;
  
  current_streak := profile_streak;
  longest_streak := profile_longest_streak;
  
  RETURN NEXT;
END;
$$;

-- Function to get challenge leaderboard (weekly)
CREATE OR REPLACE FUNCTION get_weekly_challenge_leaderboard(limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  total_points BIGINT,
  completions_count BIGINT,
  challenge_streak INTEGER
)
LANGUAGE sql
STABLE
AS $$
  WITH weekly_stats AS (
    SELECT 
      cc.user_id,
      SUM(cc.points_earned + COALESCE(cc.bonus_points, 0)) as total_points,
      COUNT(*) as completions_count
    FROM challenge_completions cc
    WHERE cc.completed_at >= date_trunc('week', CURRENT_DATE)
    GROUP BY cc.user_id
  )
  SELECT 
    ws.user_id,
    COALESCE(p.display_name, 'Anonymous') as display_name,
    p.avatar_url,
    ws.total_points,
    ws.completions_count,
    COALESCE(p.challenge_streak, 0) as challenge_streak
  FROM weekly_stats ws
  JOIN profiles p ON p.id = ws.user_id
  ORDER BY ws.total_points DESC
  LIMIT limit_count;
$$;

-- Function to get challenge leaderboard (all time)
CREATE OR REPLACE FUNCTION get_alltime_challenge_leaderboard(limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  total_points BIGINT,
  completions_count BIGINT,
  challenge_streak INTEGER
)
LANGUAGE sql
STABLE
AS $$
  WITH alltime_stats AS (
    SELECT 
      cc.user_id,
      SUM(cc.points_earned + COALESCE(cc.bonus_points, 0)) as total_points,
      COUNT(*) as completions_count
    FROM challenge_completions cc
    GROUP BY cc.user_id
  )
  SELECT 
    ats.user_id,
    COALESCE(p.display_name, 'Anonymous') as display_name,
    p.avatar_url,
    ats.total_points,
    ats.completions_count,
    COALESCE(p.challenge_streak, 0) as challenge_streak
  FROM alltime_stats ats
  JOIN profiles p ON p.id = ats.user_id
  ORDER BY ats.total_points DESC
  LIMIT limit_count;
$$;

-- Index for faster leaderboard queries
CREATE INDEX IF NOT EXISTS idx_challenge_completions_completed_at 
ON challenge_completions(completed_at);

-- Comment explaining bonus points system
COMMENT ON COLUMN challenge_completions.bonus_points IS 
'Bonus points earned: early_bird (+10), perfect_week (+50), streak milestones (7=+25, 30=+100, 100=+500)';
