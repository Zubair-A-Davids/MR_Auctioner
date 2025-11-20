-- Add indexes to PostgreSQL database for faster queries
-- This migration adds indexes to frequently queried columns

-- Index on items.owner_id for faster seller filtering
CREATE INDEX IF NOT EXISTS idx_items_owner_id ON items(owner_id);

-- Index on items.created_at for faster date sorting
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at);

-- Index on items.item_type_id for faster item type filtering
CREATE INDEX IF NOT EXISTS idx_items_item_type_id ON items(item_type_id);

-- Index on users.email for faster login lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index on users.last_seen for faster "last seen" queries
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);

-- Composite index for items queries (owner_id + created_at)
-- Useful for "my listings" queries with date sorting
CREATE INDEX IF NOT EXISTS idx_items_owner_created ON items(owner_id, created_at DESC);
