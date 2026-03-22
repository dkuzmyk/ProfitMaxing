create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  is_verified boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.profiles (id, email, is_verified)
select id, email, true
from auth.users
where email is not null
on conflict (id) do update
set
  email = excluded.email,
  updated_at = timezone('utc', now());

create or replace function public.handle_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, is_verified)
  values (new.id, new.email, false)
  on conflict (id) do update
  set
    email = excluded.email,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;

create trigger on_auth_user_created_profile
after insert on auth.users
for each row
execute function public.handle_profile_for_auth_user();

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles
  for select
  using (auth.uid() = id);
