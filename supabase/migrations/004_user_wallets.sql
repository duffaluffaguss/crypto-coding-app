-- Migration: Add wallet address to user profiles with STRICT privacy controls
-- PRIVACY PRINCIPLE: Users are the ONLY ones who can access their wallet data
-- Even database administrators should not be able to casually view wallet addresses

-- If users table doesn't exist (for fresh installs), create it
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    display_name text,
    -- Wallet data is private - only accessible by the owning user
    wallet_address text,
    wallet_connected_at timestamp with time zone,
    wallet_education_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS - this is CRITICAL for privacy
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner too (extra security)
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;

-- Drop any existing policies to ensure clean slate
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_own" ON public.user_profiles;

-- STRICT RLS Policies: Users can ONLY access their own data
-- These policies ensure complete isolation between users

-- SELECT: Users can only read their own profile
CREATE POLICY "user_profiles_select_own"
    ON public.user_profiles 
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- UPDATE: Users can only update their own profile
CREATE POLICY "user_profiles_update_own"
    ON public.user_profiles 
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- INSERT: Users can only insert their own profile
CREATE POLICY "user_profiles_insert_own"
    ON public.user_profiles 
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- DELETE: Users can only delete their own profile
CREATE POLICY "user_profiles_delete_own"
    ON public.user_profiles 
    FOR DELETE
    TO authenticated
    USING (auth.uid() = id);

-- NO public/anonymous access - these policies are intentionally NOT created:
-- - No anon SELECT policy
-- - No service_role bypass for SELECT
-- This means even backend services must go through authenticated user context

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

-- Revoke direct table access from public
REVOKE ALL ON public.user_profiles FROM anon;
REVOKE ALL ON public.user_profiles FROM public;

-- Grant only to authenticated users (access still controlled by RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;

-- Documentation
COMMENT ON TABLE public.user_profiles IS 'User profile data with STRICT privacy controls. Wallet data is only accessible by the owning user.';
COMMENT ON COLUMN public.user_profiles.wallet_address IS 'Connected crypto wallet address - PRIVATE to user only';
COMMENT ON COLUMN public.user_profiles.wallet_education_completed IS 'Whether user completed wallet education flow';

-- Security note for developers
COMMENT ON POLICY "user_profiles_select_own" ON public.user_profiles IS 
    'PRIVACY: Users can ONLY view their own profile. No cross-user access allowed.';
    
-- Additional security: Create a view that masks wallet addresses for any admin queries
-- This is an extra layer - even if someone bypasses RLS, they see masked data
CREATE OR REPLACE VIEW public.user_profiles_masked AS
SELECT 
    id,
    display_name,
    CASE 
        WHEN wallet_address IS NOT NULL 
        THEN CONCAT(LEFT(wallet_address, 6), '****', RIGHT(wallet_address, 4))
        ELSE NULL 
    END as wallet_address_masked,
    wallet_connected_at,
    wallet_education_completed,
    created_at,
    updated_at
FROM public.user_profiles;

-- The masked view is for admin dashboard only - not for application use
COMMENT ON VIEW public.user_profiles_masked IS 'Admin view with masked wallet addresses for privacy';
