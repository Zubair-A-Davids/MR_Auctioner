-- Add item_type_id column to items table
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS item_type_id TEXT;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_items_type ON items(item_type_id);

-- Add comment for documentation
COMMENT ON COLUMN items.item_type_id IS 'References the item type ID from the frontend ITEM_TYPES array (e.g., Banisher, Elven-Sword)';
