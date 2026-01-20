-- Enhanced Challenge Streaks with Milestone Bonuses
-- This migration enhances the existing challenge streak system

-- Add last challenge completion date to profiles for streak calculation
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_challenge_date DATE;

-- Create or replace function to update challenge streak and award milestone bonuses
CREATE OR REPLACE FUNCTION update_challenge_streak(user_uuid uuid, challenge_points integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_challenge date;
  current_streak integer;
  longest_streak integer;
  today date := CURRENT_DATE;
  bonus_points integer := 0;
  milestone_reached integer := 0;
  result json;
BEGIN
  -- Get current values from profile
  SELECT 
    last_challenge_date, 
    COALESCE(challenge_streak, 0), 
    COALESCE(longest_challenge_streak, 0)
  INTO last_challenge, current_streak, longest_streak
  FROM profiles
  WHERE id = user_uuid;

  -- Calculate new streak
  IF last_challenge IS NULL THEN
    -- First time completing a challenge
    current_streak := 1;
  ELSIF last_challenge = today - 1 THEN
    -- Consecutive day, increment streak
    current_streak := current_streak + 1;
  ELSIF last_challenge = today THEN
    -- Already completed today, no change to streak
    current_streak := current_streak;
  ELSE
    -- Broke the streak, reset to 1
    current_streak := 1;
  END IF;

  -- Check for milestone bonuses (only award on new streak achievements)
  CASE current_streak
    WHEN 3 THEN 
      bonus_points := 10;
      milestone_reached := 3;
    WHEN 7 THEN 
      bonus_points := 25;
      milestone_reached := 7;
    WHEN 14 THEN 
      bonus_points := 50;
      milestone_reached := 14;
    WHEN 30 THEN 
      bonus_points := 100;
      milestone_reached := 30;
    WHEN 60 THEN 
      bonus_points := 200;
      milestone_reached := 60;
    WHEN 100 THEN 
      bonus_points := 500;
      milestone_reached := 100;
    ELSE 
      bonus_points := 0;
  END CASE;

  -- Update longest streak if current is higher
  IF current_streak > longest_streak THEN
    longest_streak := current_streak;
  END IF;

  -- Update profile with new streak values
  UPDATE profiles
  SET
    challenge_streak = current_streak,
    longest_challenge_streak = longest_streak,
    last_challenge_date = today
  WHERE id = user_uuid;

  -- Build result JSON
  result := json_build_object(
    'current_streak', current_streak,
    'longest_streak', longest_streak,
    'bonus_points', bonus_points,
    'milestone_reached', milestone_reached,
    'last_challenge_date', today
  );

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_challenge_streak(uuid, integer) TO authenticated;

-- Create function to get user challenge streak stats
CREATE OR REPLACE FUNCTION get_user_challenge_streak_stats(user_uuid UUID)
RETURNS TABLE (
  current_streak INTEGER,
  longest_streak INTEGER,
  last_challenge_date DATE,
  days_since_last INTEGER,
  next_milestone INTEGER,
  next_milestone_bonus INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  current_str integer;
  longest_str integer;
  last_date date;
  days_since integer;
  next_milestone integer;
  next_bonus integer;
  milestones integer[] := ARRAY[3, 7, 14, 30, 60, 100];
  i integer;
BEGIN
  -- Get current streak data
  SELECT 
    COALESCE(p.challenge_streak, 0),
    COALESCE(p.longest_challenge_streak, 0),
    p.last_challenge_date
  INTO current_str, longest_str, last_date
  FROM profiles p
  WHERE p.id = user_uuid;

  -- Calculate days since last challenge
  IF last_date IS NULL THEN
    days_since := NULL;
  ELSE
    days_since := CURRENT_DATE - last_date;
  END IF;

  -- Find next milestone
  next_milestone := NULL;
  next_bonus := NULL;
  
  FOR i IN 1..array_length(milestones, 1) LOOP
    IF milestones[i] > current_str THEN
      next_milestone := milestones[i];
      -- Set bonus points for each milestone
      CASE next_milestone
        WHEN 3 THEN next_bonus := 10;
        WHEN 7 THEN next_bonus := 25;
        WHEN 14 THEN next_bonus := 50;
        WHEN 30 THEN next_bonus := 100;
        WHEN 60 THEN next_bonus := 200;
        WHEN 100 THEN next_bonus := 500;
      END CASE;
      EXIT;
    END IF;
  END LOOP;

  -- Return values
  current_streak := current_str;
  longest_streak := longest_str;
  last_challenge_date := last_date;

  RETURN NEXT;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_challenge_streak_stats(uuid) TO authenticated;

-- Update the challenge completion trigger to use our new function
CREATE OR REPLACE FUNCTION handle_challenge_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  streak_result json;
  bonus_points integer;
  challenge_points integer;
BEGIN
  -- Get the challenge points
  SELECT points INTO challenge_points
  FROM daily_challenges
  WHERE id = NEW.challenge_id;

  -- Update streak and get bonus points
  SELECT update_challenge_streak(NEW.user_id, challenge_points) INTO streak_result;
  
  -- Extract bonus points from result
  bonus_points := (streak_result->>'bonus_points')::integer;
  
  -- Update the completion record with bonus points
  NEW.bonus_points := bonus_points;
  
  -- Update user's total points (assuming there's a points field in profiles)
  UPDATE profiles 
  SET points = COALESCE(points, 0) + NEW.points_earned + bonus_points
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_challenge_completion ON challenge_completions;
CREATE TRIGGER trigger_challenge_completion
  BEFORE INSERT ON challenge_completions
  FOR EACH ROW
  EXECUTE FUNCTION handle_challenge_completion();

-- Add index for better performance on streak queries
CREATE INDEX IF NOT EXISTS idx_profiles_challenge_streak 
ON profiles(challenge_streak DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_last_challenge_date 
ON profiles(last_challenge_date DESC);

-- Create a view for leaderboard with streak information
CREATE OR REPLACE VIEW challenge_leaderboard AS
SELECT 
  p.id as user_id,
  COALESCE(p.display_name, 'Anonymous') as display_name,
  p.avatar_url,
  COALESCE(p.points, 0) as total_points,
  COALESCE(p.challenge_streak, 0) as current_streak,
  COALESCE(p.longest_challenge_streak, 0) as best_streak,
  (
    SELECT COUNT(*)
    FROM challenge_completions cc
    WHERE cc.user_id = p.id
  ) as challenges_completed,
  (
    SELECT COALESCE(SUM(cc.points_earned + COALESCE(cc.bonus_points, 0)), 0)
    FROM challenge_completions cc
    WHERE cc.user_id = p.id
  ) as challenge_points
FROM profiles p
WHERE p.challenge_streak > 0 OR EXISTS (
  SELECT 1 FROM challenge_completions cc WHERE cc.user_id = p.id
)
ORDER BY p.challenge_streak DESC, challenge_points DESC;

-- Grant access to the view
GRANT SELECT ON challenge_leaderboard TO authenticated;

-- Comment documenting the milestone system
COMMENT ON FUNCTION update_challenge_streak(uuid, integer) IS 
'Updates challenge streak and awards milestone bonuses: 3 days (+10), 7 days (+25), 14 days (+50), 30 days (+100), 60 days (+200), 100 days (+500)';