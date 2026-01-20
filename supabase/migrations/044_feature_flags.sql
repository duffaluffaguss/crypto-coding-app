-- Create feature_flags table for managing feature rollouts
create table if not exists public.feature_flags (
    id uuid default gen_random_uuid() primary key,
    key text not null unique,
    name text not null,
    description text,
    enabled boolean default false,
    rollout_percentage integer default 0 check (rollout_percentage >= 0 and rollout_percentage <= 100),
    user_ids text[] default '{}',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes for performance
create index if not exists idx_feature_flags_key on public.feature_flags(key);
create index if not exists idx_feature_flags_enabled on public.feature_flags(enabled);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger handle_feature_flags_updated_at
    before update on public.feature_flags
    for each row execute function public.handle_updated_at();

-- RLS policies
alter table public.feature_flags enable row level security;

-- Admin can do everything (assumes admins have a specific role/claim)
create policy "Admins can manage feature flags"
    on public.feature_flags
    for all
    using (
        auth.jwt() ->> 'role' = 'admin' or
        auth.jwt() ->> 'user_role' = 'admin' or
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );

-- Everyone can read feature flags (needed for frontend to check flags)
create policy "Public read access to feature flags"
    on public.feature_flags
    for select
    using (true);

-- Insert some example feature flags
insert into public.feature_flags (key, name, description, enabled, rollout_percentage) values
    ('new_editor', 'New Code Editor', 'Enhanced code editor with AI assistance', false, 0),
    ('ai_review_v2', 'AI Code Review V2', 'Improved AI code review with better suggestions', false, 10),
    ('dark_mode_v2', 'Dark Mode V2', 'Enhanced dark mode with better contrast', false, 25)
on conflict (key) do nothing;