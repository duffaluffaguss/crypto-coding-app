-- Achievement System Migration
-- Creates achievements table and user_achievements junction table

-- Achievements table - defines all available achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏆',
  category TEXT NOT NULL CHECK (category IN ('learning', 'building', 'social')),
  points INTEGER NOT NULL DEFAULT 10,
  condition_key TEXT NOT NULL UNIQUE, -- Programmatic key for checking conditions
  threshold INTEGER DEFAULT 1, -- Number required to earn (e.g., 5 lessons for Speed Demon)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User achievements - tracks which users have earned which achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_condition_key ON achievements(condition_key);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Achievements are readable by everyone (public catalog)
CREATE POLICY "Achievements are publicly readable"
  ON achievements FOR SELECT
  USING (true);

-- Users can read their own achievements
CREATE POLICY "Users can read own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- Only server can insert achievements (via service role)
CREATE POLICY "Service role can insert achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Seed achievements data
INSERT INTO achievements (name, description, icon, category, points, condition_key, threshold) VALUES
  -- Learning achievements
  ('First Steps', 'Complete your first lesson', '👶', 'learning', 10, 'first_lesson', 1),
  ('Bookworm', 'Complete 10 lessons', '📚', 'learning', 50, 'lessons_completed', 10),
  ('Scholar', 'Complete 25 lessons', '🎓', 'learning', 100, 'lessons_completed_25', 25),
  ('Speed Demon', 'Complete 5 lessons in a single day', '⚡', 'learning', 30, 'lessons_in_day', 5),
  ('Week Warrior', 'Maintain a 7-day learning streak', '🗓️', 'learning', 50, 'streak_7', 7),
  ('Streak Master', 'Maintain a 30-day learning streak', '🔥', 'learning', 150, 'streak_30', 30),
  ('Night Owl', 'Complete a lesson after midnight', '🦉', 'learning', 15, 'night_owl', 1),
  ('Early Bird', 'Complete a lesson before 6 AM', '🐦', 'learning', 15, 'early_bird', 1),
  
  -- Building achievements  
  ('Hello World', 'Deploy your first smart contract', '🚀', 'building', 25, 'first_deploy', 1),
  ('Builder', 'Deploy 5 smart contracts', '🏗️', 'building', 75, 'deploys_5', 5),
  ('Architect', 'Deploy 10 smart contracts', '🏛️', 'building', 150, 'deploys_10', 10),
  ('Project Starter', 'Create your first project', '💡', 'building', 10, 'first_project', 1),
  ('Prolific Creator', 'Create 5 projects', '🎨', 'building', 50, 'projects_5', 5),
  
  -- Social achievements
  ('Social Butterfly', 'Share your first project to the showcase', '🦋', 'social', 20, 'first_showcase', 1),
  ('Rising Star', 'Get 5 likes on a showcase project', '⭐', 'social', 30, 'likes_5', 5),
  ('Helper', 'Get 10 likes on a showcase project', '🤝', 'social', 50, 'likes_10', 10),
  ('Influencer', 'Get 50 likes across all projects', '🌟', 'social', 100, 'total_likes_50', 50)
ON CONFLICT (condition_key) DO NOTHING;

-- Function to check and award an achievement
CREATE OR REPLACE FUNCTION award_achievement(
  p_user_id UUID,
  p_condition_key TEXT
) RETURNS TABLE (
  awarded BOOLEAN,
  achievement_name TEXT,
  achievement_icon TEXT,
  achievement_points INTEGER
) AS $$
DECLARE
  v_achievement RECORD;
  v_already_has BOOLEAN;
BEGIN
  -- Find the achievement
  SELECT * INTO v_achievement
  FROM achievements
  WHERE condition_key = p_condition_key;
  
  IF v_achievement IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Check if user already has it
  SELECT EXISTS(
    SELECT 1 FROM user_achievements 
    WHERE user_id = p_user_id AND achievement_id = v_achievement.id
  ) INTO v_already_has;
  
  IF v_already_has THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Award the achievement
  INSERT INTO user_achievements (user_id, achievement_id)
  VALUES (p_user_id, v_achievement.id);
  
  RETURN QUERY SELECT 
    true,
    v_achievement.name,
    v_achievement.icon,
    v_achievement.points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's total achievement points
CREATE OR REPLACE FUNCTION get_user_achievement_points(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(a.points)
     FROM user_achievements ua
     JOIN achievements a ON a.id = ua.achievement_id
     WHERE ua.user_id = p_user_id),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
