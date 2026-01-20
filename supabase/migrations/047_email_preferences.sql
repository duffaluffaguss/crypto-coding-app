-- Add email preferences to profiles
-- Allows users to control which types of emails they receive

-- Add email_preferences JSONB column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT jsonb_build_object(
  'welcome', true,
  'achievement', true,
  'streak_reminder', true,
  'weekly_digest', true,
  'weekly_digest_day', 'monday'
);

-- Add constraint to validate email preferences structure
ALTER TABLE public.profiles
ADD CONSTRAINT email_preferences_structure CHECK (
  email_preferences IS NULL OR (
    email_preferences ? 'welcome' AND
    email_preferences ? 'achievement' AND
    email_preferences ? 'streak_reminder' AND
    email_preferences ? 'weekly_digest' AND
    email_preferences ? 'weekly_digest_day'
  )
);

-- Add constraint to validate weekly digest day values
ALTER TABLE public.profiles
ADD CONSTRAINT weekly_digest_day_valid CHECK (
  email_preferences IS NULL OR
  email_preferences->>'weekly_digest_day' IN (
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  )
);

-- Add index on email_preferences for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_email_preferences 
ON public.profiles USING GIN (email_preferences);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.email_preferences IS 'User email notification preferences';

-- Function to update email preference
CREATE OR REPLACE FUNCTION public.update_email_preference(
  p_user_id UUID,
  p_preference_key TEXT,
  p_enabled BOOLEAN
) RETURNS BOOLEAN AS $$
BEGIN
  -- Update the specific preference
  UPDATE public.profiles
  SET email_preferences = jsonb_set(
    COALESCE(email_preferences, '{}'::jsonb),
    ARRAY[p_preference_key],
    to_jsonb(p_enabled)
  )
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set weekly digest day preference
CREATE OR REPLACE FUNCTION public.set_weekly_digest_day(
  p_user_id UUID,
  p_day TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Validate day
  IF p_day NOT IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') THEN
    RAISE EXCEPTION 'Invalid day: %. Must be one of: monday, tuesday, wednesday, thursday, friday, saturday, sunday', p_day;
  END IF;

  -- Update the weekly digest day preference
  UPDATE public.profiles
  SET email_preferences = jsonb_set(
    COALESCE(email_preferences, '{}'::jsonb),
    ARRAY['weekly_digest_day'],
    to_jsonb(p_day)
  )
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user email preferences
CREATE OR REPLACE FUNCTION public.get_email_preferences(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_preferences JSONB;
BEGIN
  SELECT email_preferences INTO v_preferences
  FROM public.profiles
  WHERE id = p_user_id;

  -- Return default preferences if none set
  IF v_preferences IS NULL THEN
    RETURN jsonb_build_object(
      'welcome', true,
      'achievement', true,
      'streak_reminder', true,
      'weekly_digest', true,
      'weekly_digest_day', 'monday'
    );
  END IF;

  RETURN v_preferences;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.update_email_preference(UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_weekly_digest_day(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_preferences(UUID) TO authenticated;

-- Update existing users to have default email preferences
UPDATE public.profiles
SET email_preferences = jsonb_build_object(
  'welcome', true,
  'achievement', true,
  'streak_reminder', true,
  'weekly_digest', true,
  'weekly_digest_day', 'monday'
)
WHERE email_preferences IS NULL;