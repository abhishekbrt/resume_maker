-- Ensure profiles are auto-provisioned and each user owns exactly one resume.

insert into public.profiles (id, full_name, avatar_url)
select
  users.id,
  nullif(coalesce(users.raw_user_meta_data->>'full_name', users.raw_user_meta_data->>'name', ''), ''),
  nullif(users.raw_user_meta_data->>'avatar_url', '')
from auth.users as users
left join public.profiles as profiles
  on profiles.id = users.id
where profiles.id is null;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    nullif(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), ''),
    nullif(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user_profile();

with ranked_resumes as (
  select
    resumes.id,
    row_number() over (
      partition by resumes.user_id
      order by resumes.updated_at desc nulls last, resumes.created_at desc nulls last, resumes.id desc
    ) as rank
  from public.resumes as resumes
)
delete from public.resumes as resumes
using ranked_resumes as ranked
where resumes.id = ranked.id
  and ranked.rank > 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'resumes_user_id_key'
      and conrelid = 'public.resumes'::regclass
  ) then
    alter table public.resumes
    add constraint resumes_user_id_key unique (user_id);
  end if;
end;
$$;
