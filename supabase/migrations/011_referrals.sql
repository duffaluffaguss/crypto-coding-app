-- Add referral system to the app
-- Adds referral_code and referred_by to profiles, plus referral_rewards table

-- Add referral columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id);

-- Create index on referral_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- Create referral_rewards table
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  referred_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reward_type text NOT NULL CHECK (reward_type IN ('signup_bonus', 'milestone_bonus')),
  points integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for referral_rewards
CREATE INDEX IF NOT EXISTS idx_referral_rewards_user_id ON public.referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referred_user ON public.referral_rewards(referred_user_id);

-- Enable RLS on referral_rewards
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- Policies for referral_rewards
CREATE POLICY "Users can view own referral rewards"
  ON public.referral_rewards FOR SELECT
  USING (auth.uid() = user_id);

-- Function to generate a random 8-character referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Function to generate unique referral code (with collision check)
CREATE OR REPLACE FUNCTION public.generate_unique_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    new_code := public.generate_referral_code();
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

-- Update existing profiles to have referral codes
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN SELECT id FROM public.profiles WHERE referral_code IS NULL
  LOOP
    UPDATE public.profiles
    SET referral_code = public.generate_unique_referral_code()
    WHERE id = profile_record.id;
  END LOOP;
END;
$$;

-- Update the handle_new_user function to include referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_referral_code text;
  referrer_id uuid;
  referral_code_param text;
BEGIN
  -- Generate a unique referral code
  new_referral_code := public.generate_unique_referral_code();
  
  -- Check if a referral code was passed in user metadata
  referral_code_param := new.raw_user_meta_data->>'referral_code';
  
  -- Look up the referrer if a code was provided
  IF referral_code_param IS NOT NULL THEN
    SELECT id INTO referrer_id
    FROM public.profiles
    WHERE referral_code = referral_code_param;
  END IF;
  
  -- Insert the new profile with referral info
  INSERT INTO public.profiles (id, display_name, referral_code, referred_by, created_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new_referral_code,
    referrer_id,
    now()
  );
  
  -- If there was a valid referrer, create reward for them
  IF referrer_id IS NOT NULL THEN
    INSERT INTO public.referral_rewards (user_id, referred_user_id, reward_type, points)
    VALUES (referrer_id, new.id, 'signup_bonus', 100);
  END IF;
  
  RETURN new;
END;
$$;

-- Function to get referral stats for a user
CREATE OR REPLACE FUNCTION public.get_referral_stats(user_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  referral_count integer;
  total_points integer;
  result json;
BEGIN
  -- Count how many users this user has referred
  SELECT COUNT(*) INTO referral_count
  FROM public.profiles
  WHERE referred_by = user_uuid;
  
  -- Sum up all referral points
  SELECT COALESCE(SUM(points), 0) INTO total_points
  FROM public.referral_rewards
  WHERE user_id = user_uuid;
  
  result := json_build_object(
    'referral_count', referral_count,
    'total_points', total_points
  );
  
  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_unique_referral_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_referral_stats(uuid) TO authenticated;

-- Function to get list of referred users
CREATE OR REPLACE FUNCTION public.get_referred_users(user_uuid uuid)
RETURNS TABLE (
  id uuid,
  display_name text,
  created_at timestamptz,
  reward_points integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.created_at,
    COALESCE(rr.points, 0) as reward_points
  FROM public.profiles p
  LEFT JOIN public.referral_rewards rr ON rr.referred_user_id = p.id AND rr.user_id = user_uuid
  WHERE p.referred_by = user_uuid
  ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_referred_users(uuid) TO authenticated;
