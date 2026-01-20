-- Challenge Streak Achievements
-- Add specific achievements for challenge completion streaks

-- Add new challenge streak achievements
INSERT INTO achievements (name, description, icon, category, points, condition_key, threshold) VALUES
  -- Challenge streak achievements
  ('Challenge Starter', 'Complete your first daily challenge', '🎯', 'learning', 10, 'first_challenge', 1),
  ('Getting Warmed Up', 'Complete challenges for 3 consecutive days', '✨', 'learning', 25, 'challenge_streak_3', 3),
  ('Hot Streak', 'Complete challenges for 7 consecutive days', '🔥', 'learning', 50, 'challenge_streak_7', 7),
  ('Challenge Beast', 'Complete challenges for 14 consecutive days', '⚡', 'learning', 100, 'challenge_streak_14', 14),
  ('Challenge Champion', 'Complete challenges for 30 consecutive days', '🏆', 'learning', 200, 'challenge_streak_30', 30),
  ('Challenge Legend', 'Complete challenges for 60 consecutive days', '💎', 'learning', 400, 'challenge_streak_60', 60),
  ('Challenge God', 'Complete challenges for 100 consecutive days', '🌟', 'learning', 1000, 'challenge_streak_100', 100),
  
  -- Challenge milestone achievements
  ('Problem Solver', 'Complete 10 challenges', '🧩', 'learning', 50, 'challenges_10', 10),
  ('Code Warrior', 'Complete 25 challenges', '⚔️', 'learning', 100, 'challenges_25', 25),
  ('Algorithm Master', 'Complete 50 challenges', '🧠', 'learning', 200, 'challenges_50', 50),
  ('Coding Sage', 'Complete 100 challenges', '🧙‍♂️', 'learning', 500, 'challenges_100', 100),
  
  -- Special challenge achievements
  ('Early Bird Coder', 'Complete a challenge within the first hour of release', '🌅', 'learning', 30, 'early_bird_challenge', 1),
  ('Perfect Week', 'Complete all 7 challenges in a week', '⭐', 'learning', 75, 'perfect_week', 1),
  ('Point Collector', 'Earn 1000 points from challenges', '💰', 'learning', 100, 'challenge_points_1000', 1000)
ON CONFLICT (condition_key) DO NOTHING;

-- Function to check and award challenge streak achievements
CREATE OR REPLACE FUNCTION check_challenge_streak_achievements(p_user_id UUID, p_current_streak INTEGER)
RETURNS TABLE (
  awarded BOOLEAN,
  achievement_name TEXT,
  achievement_icon TEXT,
  achievement_points INTEGER
) AS $$
DECLARE
  v_achievement RECORD;
  v_condition_key TEXT;
BEGIN
  -- Determine which achievement to check based on current streak
  CASE p_current_streak
    WHEN 1 THEN v_condition_key := 'first_challenge';
    WHEN 3 THEN v_condition_key := 'challenge_streak_3';
    WHEN 7 THEN v_condition_key := 'challenge_streak_7';
    WHEN 14 THEN v_condition_key := 'challenge_streak_14';
    WHEN 30 THEN v_condition_key := 'challenge_streak_30';
    WHEN 60 THEN v_condition_key := 'challenge_streak_60';
    WHEN 100 THEN v_condition_key := 'challenge_streak_100';
    ELSE v_condition_key := NULL;
  END CASE;
  
  -- If no milestone reached, return false
  IF v_condition_key IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Award the achievement using existing function
  RETURN QUERY SELECT * FROM award_achievement(p_user_id, v_condition_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check challenge completion count achievements
CREATE OR REPLACE FUNCTION check_challenge_completion_achievements(p_user_id UUID)
RETURNS TABLE (
  awarded BOOLEAN,
  achievement_name TEXT,
  achievement_icon TEXT,
  achievement_points INTEGER
) AS $$
DECLARE
  v_total_challenges INTEGER;
  v_achievement_key TEXT := NULL;
BEGIN
  -- Get total challenges completed
  SELECT COUNT(*) INTO v_total_challenges
  FROM challenge_completions
  WHERE user_id = p_user_id;
  
  -- Check milestones
  CASE v_total_challenges
    WHEN 10 THEN v_achievement_key := 'challenges_10';
    WHEN 25 THEN v_achievement_key := 'challenges_25';
    WHEN 50 THEN v_achievement_key := 'challenges_50';
    WHEN 100 THEN v_achievement_key := 'challenges_100';
    ELSE v_achievement_key := NULL;
  END CASE;
  
  IF v_achievement_key IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, NULL::INTEGER;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT * FROM award_achievement(p_user_id, v_achievement_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check challenge points achievements
CREATE OR REPLACE FUNCTION check_challenge_points_achievements(p_user_id UUID)
RETURNS TABLE (
  awarded BOOLEAN,
  achievement_name TEXT,
  achievement_icon TEXT,
  achievement_points INTEGER
) AS $$
DECLARE
  v_total_points INTEGER;
BEGIN
  -- Get total points from challenges
  SELECT COALESCE(SUM(points_earned + COALESCE(bonus_points, 0)), 0) INTO v_total_points
  FROM challenge_completions
  WHERE user_id = p_user_id;
  
  IF v_total_points >= 1000 THEN
    RETURN QUERY SELECT * FROM award_achievement(p_user_id, 'challenge_points_1000');
  ELSE
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, NULL::INTEGER;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced challenge completion handler that checks for achievements
CREATE OR REPLACE FUNCTION handle_challenge_completion_with_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  streak_result json;
  bonus_points integer;
  challenge_points integer;
  current_streak integer;
  achievement_result RECORD;
BEGIN
  -- Get the challenge points
  SELECT points INTO challenge_points
  FROM daily_challenges
  WHERE id = NEW.challenge_id;

  -- Update streak and get bonus points
  SELECT update_challenge_streak(NEW.user_id, challenge_points) INTO streak_result;
  
  -- Extract values from result
  bonus_points := (streak_result->>'bonus_points')::integer;
  current_streak := (streak_result->>'current_streak')::integer;
  
  -- Update the completion record with bonus points
  NEW.bonus_points := bonus_points;
  
  -- Update user's total points
  UPDATE profiles 
  SET points = COALESCE(points, 0) + NEW.points_earned + bonus_points
  WHERE id = NEW.user_id;
  
  -- Check for streak achievements
  SELECT * INTO achievement_result FROM check_challenge_streak_achievements(NEW.user_id, current_streak);
  
  -- Check for completion count achievements  
  PERFORM check_challenge_completion_achievements(NEW.user_id);
  
  -- Check for points achievements
  PERFORM check_challenge_points_achievements(NEW.user_id);

  RETURN NEW;
END;
$$;

-- Replace the trigger with our enhanced version
DROP TRIGGER IF EXISTS trigger_challenge_completion ON challenge_completions;
CREATE TRIGGER trigger_challenge_completion
  BEFORE INSERT ON challenge_completions
  FOR EACH ROW
  EXECUTE FUNCTION handle_challenge_completion_with_achievements();

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_challenge_streak_achievements(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION check_challenge_completion_achievements(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_challenge_points_achievements(uuid) TO authenticated;

-- Comment explaining the achievement system
COMMENT ON FUNCTION check_challenge_streak_achievements(uuid, integer) IS 
'Checks and awards challenge streak achievements at milestones: 1, 3, 7, 14, 30, 60, 100 days';

COMMENT ON FUNCTION check_challenge_completion_achievements(uuid) IS 
'Checks and awards achievements for total challenge completions: 10, 25, 50, 100 challenges';

COMMENT ON FUNCTION check_challenge_points_achievements(uuid) IS 
'Checks and awards achievements for total challenge points: 1000+ points';