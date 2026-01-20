-- Social Account Verification
-- Stores verified social media accounts for users

create table if not exists public.social_verifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  platform text not null check (platform in ('twitter', 'github', 'discord')),
  platform_user_id text not null,
  username text not null,
  verified_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure one verification per platform per user
  unique(user_id, platform)
);

-- Row Level Security
alter table public.social_verifications enable row level security;

-- Users can read their own verifications
create policy "Users can read own social verifications"
  on public.social_verifications for select
  using (auth.uid() = user_id);

-- Users can insert their own verifications
create policy "Users can insert own social verifications"
  on public.social_verifications for insert
  with check (auth.uid() = user_id);

-- Users can delete their own verifications
create policy "Users can delete own social verifications"
  on public.social_verifications for delete
  using (auth.uid() = user_id);

-- Allow public read for profile display (usernames only)
create policy "Public can read verification status"
  on public.social_verifications for select
  using (true);

-- Create indexes for performance
create index if not exists idx_social_verifications_user_id 
  on public.social_verifications(user_id);

create index if not exists idx_social_verifications_platform 
  on public.social_verifications(platform);

create index if not exists idx_social_verifications_platform_user_id 
  on public.social_verifications(platform_user_id);