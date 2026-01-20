-- Add discord field to profiles table for profile customization
-- Discord usernames can contain letters, numbers, periods, underscores, and hyphens

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS discord_username text;

-- Add constraint for discord username format (alphanumeric, periods, underscores, hyphens, max 32 chars)
ALTER TABLE public.profiles
ADD CONSTRAINT discord_username_format CHECK (
  discord_username IS NULL OR 
  discord_username ~ '^[a-zA-Z0-9._-]{2,32}$'
);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.discord_username IS 'Discord username (display name or username)';