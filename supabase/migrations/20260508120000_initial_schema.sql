-- Projects table
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  category text default 'Hardware',
  visibility text default 'team',
  progress int default 0,
  status text default 'draft',
  image_url text,
  version text default 'v1',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Comments table
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  created_at timestamptz default now()
);

-- Profiles table
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

-- Row Level Security
alter table projects enable row level security;
alter table comments enable row level security;
alter table profiles enable row level security;

-- Projects policies
create policy "owner full access" on projects
  for all using (auth.uid() = user_id);

-- Comments policies
create policy "anyone can read comments" on comments
  for select using (true);

create policy "authenticated users can comment" on comments
  for insert with check (auth.uid() = user_id);

-- Profiles policies
create policy "own profile" on profiles
  for all using (auth.uid() = id);

create policy "anyone can read profiles" on profiles
  for select using (true);

-- Enable realtime
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table comments;
