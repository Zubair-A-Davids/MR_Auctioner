-- Add elite and element columns to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS elite boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS element text;

-- Add elite and element columns to items_sold table if it exists
ALTER TABLE items_sold ADD COLUMN IF NOT EXISTS elite boolean DEFAULT false;
ALTER TABLE items_sold ADD COLUMN IF NOT EXISTS element text;
