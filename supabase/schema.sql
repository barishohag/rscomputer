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

-- A single versioned JSON snapshot for the shared POS workspace.
-- Reads and writes go through authenticated server routes using the server-only Supabase secret.
create table if not exists public.pos_store (
  store_id text primary key check (store_id = 'main'),
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.pos_store enable row level security;
revoke all on table public.pos_store from anon, authenticated;
