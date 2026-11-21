create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar jsonb not null default '{"base":"✦","color":"#b9d4ff","accessory":null}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.learner_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.learner_progress enable row level security;

revoke all on public.profiles from anon, public;
revoke all on public.learner_progress from anon, public;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.learner_progress to authenticated;

drop policy if exists "Learners can read their own profile" on public.profiles;
create policy "Learners can read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
drop policy if exists "Learners can create their own profile" on public.profiles;
create policy "Learners can create their own profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
drop policy if exists "Learners can update their own profile" on public.profiles;
create policy "Learners can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Toute donnée de compte exige une session vérifiée par un second facteur.
drop policy if exists "Require WhatsApp MFA for profiles" on public.profiles;
create policy "Require WhatsApp MFA for profiles"
  on public.profiles as restrictive for all to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2')
  with check ((select auth.jwt()->>'aal') = 'aal2');

drop policy if exists "Learners can read their own progress" on public.learner_progress;
create policy "Learners can read their own progress"
  on public.learner_progress for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "Learners can create their own progress" on public.learner_progress;
create policy "Learners can create their own progress"
  on public.learner_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "Learners can update their own progress" on public.learner_progress;
create policy "Learners can update their own progress"
  on public.learner_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Require WhatsApp MFA for progress" on public.learner_progress;
create policy "Require WhatsApp MFA for progress"
  on public.learner_progress as restrictive for all to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2')
  with check ((select auth.jwt()->>'aal') = 'aal2');
