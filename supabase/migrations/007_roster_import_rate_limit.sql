-- ─────────────────────────────────────────
-- Roster import rate-limit log
-- Tracks per-user API calls so the route can enforce a cap
-- without any external Redis/Upstash dependency.
-- ─────────────────────────────────────────

create table roster_import_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index idx_roster_import_log_user_time
  on roster_import_log (user_id, created_at desc);

alter table roster_import_log enable row level security;

-- Users can only see their own log entries (used by the route via service role anyway)
create policy "roster_import_log_owner_read" on roster_import_log
  for select using (auth.uid() = user_id);
