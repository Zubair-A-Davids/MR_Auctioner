-- Reset all listings and items sold
-- This will delete all active items and clear the items_sold history

-- Delete all items from items_sold table (sold items history)
DELETE FROM items_sold;

-- Delete all active listings from items table
DELETE FROM items;

-- Reset sequences if needed (PostgreSQL will handle this automatically)
-- Optionally, you could add vacuum to reclaim space:
-- VACUUM ANALYZE items;
-- VACUUM ANALYZE items_sold;
