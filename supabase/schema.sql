-- Zero to Crypto Developer Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  interests text[] default '{}',
  experience_level text check (experience_level in ('complete_beginner', 'some_coding', 'web3_curious')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  onboarding_completed boolean default false not null
);

-- Projects table
create table if not exists public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text not null,
  project_type text not null check (project_type in ('nft_marketplace', 'token', 'dao', 'game', 'social', 'creator')),
  status text default 'draft' check (status in ('draft', 'learning', 'deployed', 'published')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  deployed_at timestamp with time zone,
  contract_address text,
  network text check (network in ('base-sepolia', 'base-mainnet'))
);

-- Project files table
create table if not exists public.project_files (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  filename text not null,
  content text not null,
  file_type text not null check (file_type in ('solidity', 'javascript', 'json')),
  is_template boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Lessons table (static content, seeded)
create table if not exists public.lessons (
  id text primary key,
  title text not null,
  description text not null,
  project_type text not null check (project_type in ('nft_marketplace', 'token', 'dao', 'game', 'social', 'creator')),
  "order" integer not null,
  prerequisite_lesson_id text references public.lessons(id),
  code_template text not null,
  concepts text[] default '{}'
);

-- Learning progress table
create table if not exists public.learning_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  lesson_id text references public.lessons(id) on delete cascade not null,
  status text default 'locked' check (status in ('locked', 'available', 'in_progress', 'completed')),
  completed_at timestamp with time zone,
  unique(user_id, project_id, lesson_id)
);

-- Chat messages table
create table if not exists public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_project_files_project_id on public.project_files(project_id);
create index if not exists idx_learning_progress_user_project on public.learning_progress(user_id, project_id);
create index if not exists idx_chat_messages_project on public.chat_messages(project_id);
create index if not exists idx_lessons_project_type on public.lessons(project_type, "order");

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_files enable row level security;
alter table public.learning_progress enable row level security;
alter table public.chat_messages enable row level security;
alter table public.lessons enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Projects policies
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can create own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Project files policies
create policy "Users can view own project files"
  on public.project_files for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_files.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can create project files"
  on public.project_files for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = project_files.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can update own project files"
  on public.project_files for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_files.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete own project files"
  on public.project_files for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_files.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Learning progress policies
create policy "Users can view own progress"
  on public.learning_progress for select
  using (auth.uid() = user_id);

create policy "Users can create own progress"
  on public.learning_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.learning_progress for update
  using (auth.uid() = user_id);

-- Chat messages policies
create policy "Users can view own chat messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

create policy "Users can create chat messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

-- Lessons are public read
create policy "Anyone can view lessons"
  on public.lessons for select
  to authenticated
  using (true);

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    now()
  );
  return new;
end;
$$;

-- Trigger to create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Trigger for project_files updated_at
drop trigger if exists update_project_files_updated_at on public.project_files;
create trigger update_project_files_updated_at
  before update on public.project_files
  for each row execute procedure public.update_updated_at_column();
