-- Migration: add last_ip to users and banned_ips table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ip text;

-- Create the banned_ips table if it doesn't exist (preferred schema uses `ip`)
CREATE TABLE IF NOT EXISTS banned_ips (
  ip text PRIMARY KEY,
  banned_until timestamptz,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- If a legacy column `ip_address` exists on an existing `banned_ips` table,
-- add a compatibility `ip` column and copy data across. This block is
-- idempotent so the migration can be re-run safely.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'banned_ips') THEN
    -- Add `ip` column if it's missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'banned_ips' AND column_name = 'ip') THEN
      ALTER TABLE banned_ips ADD COLUMN ip text;
    END IF;

    -- If there is a legacy `ip_address` column, copy values into `ip` where missing
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'banned_ips' AND column_name = 'ip_address') THEN
      UPDATE banned_ips SET ip = ip_address WHERE ip IS NULL;
    END IF;
  END IF;
END$$;

-- Index for quick lookup on the compatibility `ip` column
CREATE INDEX IF NOT EXISTS idx_banned_ips_ip ON banned_ips(ip);
