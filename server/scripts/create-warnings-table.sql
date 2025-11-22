-- Item warnings table
create table if not exists item_warnings (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references items(id) on delete cascade,
  moderator_id uuid not null references users(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_item_warnings_item on item_warnings(item_id);
create index if not exists idx_item_warnings_owner on item_warnings(item_id);

-- User notifications table for item deletions/warnings
create table if not exists user_notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null, -- 'item_deleted', 'item_warned', etc.
  item_id uuid, -- can be null if item was deleted
  item_title text,
  reason text,
  moderator_name text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_notifications_user on user_notifications(user_id);
create index if not exists idx_user_notifications_read on user_notifications(user_id, is_read);
