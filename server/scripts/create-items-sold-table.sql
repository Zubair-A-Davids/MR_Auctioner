-- Create items_sold table to track deletion history
CREATE TABLE IF NOT EXISTS items_sold (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_item_id UUID NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2),
  item_type_id TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_sold_owner ON items_sold(owner_id);
CREATE INDEX IF NOT EXISTS idx_items_sold_deleted ON items_sold(deleted_at DESC);

COMMENT ON TABLE items_sold IS 'Tracks deleted items (sold items) for statistics and history';
