create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  password_hash text not null,
  display_name text,
  discord text,
  bio text,
  avatar text,
  is_admin boolean not null default false,
  is_mod boolean not null default false,
  banned_until timestamptz,
  banned_reason text,
  created_at timestamptz not null default now()
);

create table if not exists items (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text,
  price numeric(12,2),
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists idx_items_owner on items(owner_id);
create index if not exists idx_items_created on items(created_at desc);

-- Backfill and enforce unique, non-null display names
-- 1) Backfill any null display names using the local-part of email
update users
set display_name = split_part(email, '@', 1)
where display_name is null;

-- 2) Enforce NOT NULL on display_name
do $$
begin
  begin
    alter table users alter column display_name set not null;
  exception when others then
    -- ignore if already set
    null;
  end;
end $$;

-- 3) Enforce case-insensitive uniqueness of display_name
create unique index if not exists idx_users_display_name_unique
  on users (lower(display_name));
