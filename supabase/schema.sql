-- Run this once in the Supabase SQL Editor.
-- All account approvals are managed by the server using the service role key.
create table if not exists public.user_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.user_access enable row level security;
revoke all on table public.user_access from anon, authenticated;
