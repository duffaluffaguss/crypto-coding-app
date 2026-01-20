-- Add profile customization fields
-- Allows users to add bio, social links, and custom avatar

-- Add new columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS twitter_handle text,
ADD COLUMN IF NOT EXISTS github_username text,
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add constraint for bio length (max 500 characters)
ALTER TABLE public.profiles
ADD CONSTRAINT bio_length_check CHECK (char_length(bio) <= 500);

-- Add constraint for twitter handle format (alphanumeric and underscores only, max 15 chars)
ALTER TABLE public.profiles
ADD CONSTRAINT twitter_handle_format CHECK (
  twitter_handle IS NULL OR 
  twitter_handle ~ '^[a-zA-Z0-9_]{1,15}$'
);

-- Add constraint for github username format (alphanumeric and hyphens, max 39 chars)
ALTER TABLE public.profiles
ADD CONSTRAINT github_username_format CHECK (
  github_username IS NULL OR 
  github_username ~ '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$'
);

-- Add constraint for website URL format
ALTER TABLE public.profiles
ADD CONSTRAINT website_url_format CHECK (
  website_url IS NULL OR 
  website_url ~ '^https?://[^\s]+$'
);

-- Add constraint for avatar URL format
ALTER TABLE public.profiles
ADD CONSTRAINT avatar_url_format CHECK (
  avatar_url IS NULL OR 
  avatar_url ~ '^https?://[^\s]+$'
);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.bio IS 'User bio, max 500 characters';
COMMENT ON COLUMN public.profiles.website_url IS 'User personal website URL';
COMMENT ON COLUMN public.profiles.twitter_handle IS 'Twitter/X username without @ symbol';
COMMENT ON COLUMN public.profiles.github_username IS 'GitHub username';
COMMENT ON COLUMN public.profiles.avatar_url IS 'Custom avatar image URL';
