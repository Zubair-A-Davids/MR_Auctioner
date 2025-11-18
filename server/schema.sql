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
