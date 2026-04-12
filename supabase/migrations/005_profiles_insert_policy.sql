-- Add missing INSERT policy on profiles.
-- Without this, the onboarding upsert was blocked by RLS for new users.
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can insert their own profile'
  ) then
    create policy "Users can insert their own profile"
      on public.profiles for insert with check (auth.uid() = id);
  end if;
end $$;
