-- Add streak tracking to profiles
-- Run this in your Supabase SQL Editor after the initial schema

-- Add streak columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_date date;

-- Create a function to update streak on activity
CREATE OR REPLACE FUNCTION public.update_user_streak(user_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_active date;
  current_str integer;
  longest_str integer;
  today date := CURRENT_DATE;
  result json;
BEGIN
  -- Get current values
  SELECT last_active_date, current_streak, longest_streak
  INTO last_active, current_str, longest_str
  FROM public.profiles
  WHERE id = user_uuid;

  -- If never active before, start streak at 1
  IF last_active IS NULL THEN
    current_str := 1;
  -- If last active was yesterday, increment streak
  ELSIF last_active = today - 1 THEN
    current_str := current_str + 1;
  -- If last active was today, keep streak (already counted)
  ELSIF last_active = today THEN
    -- No change needed
    NULL;
  -- Otherwise, reset streak to 1 (broke the chain)
  ELSE
    current_str := 1;
  END IF;

  -- Update longest streak if current is higher
  IF current_str > longest_str THEN
    longest_str := current_str;
  END IF;

  -- Update profile
  UPDATE public.profiles
  SET
    current_streak = current_str,
    longest_streak = longest_str,
    last_active_date = today
  WHERE id = user_uuid;

  -- Return the new streak values
  result := json_build_object(
    'current_streak', current_str,
    'longest_streak', longest_str,
    'last_active_date', today
  );

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_streak(uuid) TO authenticated;
