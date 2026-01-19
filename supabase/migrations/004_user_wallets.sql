-- Migration: Add wallet address to user profiles
-- This allows us to link each user account to their connected wallet

-- Add wallet_address column to store user's connected wallet
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS wallet_address text;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS wallet_connected_at timestamp with time zone;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS wallet_education_completed boolean DEFAULT false;

-- Create index for wallet lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON public.users(wallet_address);

-- If users table doesn't exist (for fresh installs), create it
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    display_name text,
    wallet_address text,
    wallet_connected_at timestamp with time zone,
    wallet_education_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own profile
CREATE POLICY IF NOT EXISTS "Users can view own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can insert own profile"
    ON public.user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (id, display_name)
    VALUES (new.id, new.raw_user_meta_data->>'display_name')
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Comment for documentation
COMMENT ON TABLE public.user_profiles IS 'User profile data including wallet information';
COMMENT ON COLUMN public.user_profiles.wallet_address IS 'Connected crypto wallet address';
COMMENT ON COLUMN public.user_profiles.wallet_education_completed IS 'Whether user completed wallet education flow';
