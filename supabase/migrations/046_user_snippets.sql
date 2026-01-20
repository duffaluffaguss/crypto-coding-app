-- User-submitted code snippets table
create table if not exists public.user_snippets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text not null,
  code text not null,
  category text not null check (category in ('basics', 'tokens', 'nft', 'security', 'patterns', 'utils')),
  tags text[] default '{}',
  is_official boolean default false not null,
  likes_count integer default 0 not null,
  downloads_count integer default 0 not null,
  is_public boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User snippet likes table
create table if not exists public.snippet_likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  snippet_id uuid references public.user_snippets(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, snippet_id)
);

-- User snippet downloads table
create table if not exists public.snippet_downloads (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  snippet_id uuid references public.user_snippets(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes
create index if not exists idx_user_snippets_user_id on public.user_snippets(user_id);
create index if not exists idx_user_snippets_category on public.user_snippets(category);
create index if not exists idx_user_snippets_is_public on public.user_snippets(is_public);
create index if not exists idx_user_snippets_created_at on public.user_snippets(created_at desc);
create index if not exists idx_snippet_likes_user_snippet on public.snippet_likes(user_id, snippet_id);
create index if not exists idx_snippet_downloads_user_snippet on public.snippet_downloads(user_id, snippet_id);

-- RLS policies
alter table public.user_snippets enable row level security;
alter table public.snippet_likes enable row level security;
alter table public.snippet_downloads enable row level security;

-- User snippets policies
create policy "Users can view public snippets and own snippets"
  on public.user_snippets for select
  to authenticated
  using (is_public = true or auth.uid() = user_id);

create policy "Users can create own snippets"
  on public.user_snippets for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own snippets"
  on public.user_snippets for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own snippets"
  on public.user_snippets for delete
  to authenticated
  using (auth.uid() = user_id);

-- Snippet likes policies
create policy "Users can view snippet likes"
  on public.snippet_likes for select
  to authenticated
  using (true);

create policy "Users can like snippets"
  on public.snippet_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can remove own likes"
  on public.snippet_likes for delete
  to authenticated
  using (auth.uid() = user_id);

-- Snippet downloads policies  
create policy "Users can view snippet downloads"
  on public.snippet_downloads for select
  to authenticated
  using (true);

create policy "Users can record snippet downloads"
  on public.snippet_downloads for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Functions to update counts
create or replace function public.update_snippet_likes_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if TG_OP = 'INSERT' then
    update public.user_snippets
    set likes_count = likes_count + 1
    where id = NEW.snippet_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update public.user_snippets
    set likes_count = likes_count - 1
    where id = OLD.snippet_id;
    return OLD;
  end if;
  return null;
end;
$$;

create or replace function public.update_snippet_downloads_count()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.user_snippets
  set downloads_count = downloads_count + 1
  where id = NEW.snippet_id;
  return NEW;
end;
$$;

-- Triggers
drop trigger if exists trigger_update_snippet_likes_count on public.snippet_likes;
create trigger trigger_update_snippet_likes_count
  after insert or delete on public.snippet_likes
  for each row execute function public.update_snippet_likes_count();

drop trigger if exists trigger_update_snippet_downloads_count on public.snippet_downloads;
create trigger trigger_update_snippet_downloads_count
  after insert on public.snippet_downloads
  for each row execute function public.update_snippet_downloads_count();

-- Updated at trigger for user_snippets
drop trigger if exists update_user_snippets_updated_at on public.user_snippets;
create trigger update_user_snippets_updated_at
  before update on public.user_snippets
  for each row execute procedure public.update_updated_at_column();

-- Helper functions
create or replace function public.is_snippet_liked(snippet_uuid uuid, user_uuid uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists(
    select 1 from public.snippet_likes
    where snippet_id = snippet_uuid and user_id = user_uuid
  );
end;
$$;