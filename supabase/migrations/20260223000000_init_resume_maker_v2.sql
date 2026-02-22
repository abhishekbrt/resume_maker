-- Resume Maker v2 schema for Supabase Postgres.
-- Auth source of truth: auth.users (Google OAuth via Supabase Auth).

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.templates (
  id varchar(50) primary key,
  name varchar(100) not null,
  description text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title varchar(255) not null default 'Untitled Resume',
  template_id varchar(50) not null references public.templates(id),
  data jsonb not null,
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_resumes_user_id on public.resumes(user_id);
create index if not exists idx_resumes_user_updated_at on public.resumes(user_id, updated_at desc);

insert into public.templates (id, name, description, is_default)
values ('classic', 'Classic', 'Clean single-column ATS-friendly layout.', true)
on conflict (id) do nothing;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_resumes_updated_at on public.resumes;
create trigger trg_resumes_updated_at
before update on public.resumes
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

alter table public.resumes enable row level security;
alter table public.resumes force row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "resumes_select_own"
on public.resumes
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "resumes_insert_own"
on public.resumes
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "resumes_update_own"
on public.resumes
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "resumes_delete_own"
on public.resumes
for delete
to authenticated
using ((select auth.uid()) = user_id);
