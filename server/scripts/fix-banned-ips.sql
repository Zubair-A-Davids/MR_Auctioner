BEGIN;

-- Ensure users.last_ip exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ip text;

-- Ensure banned_ips.ip exists
ALTER TABLE banned_ips ADD COLUMN IF NOT EXISTS ip text;

-- Copy and normalize legacy ip_address -> ip where ip is empty
UPDATE banned_ips
SET ip = CASE
  WHEN ip_address IS NOT NULL AND ip_address <> '' THEN
    CASE
      WHEN ip_address = '::1' THEN '127.0.0.1'
      ELSE regexp_replace(ip_address, '^::ffff:', '')
    END
  ELSE ip
END
WHERE (ip IS NULL OR ip = '') AND (ip_address IS NOT NULL AND ip_address <> '');

-- Map any remaining IPv6 loopback forms to 127.0.0.1
UPDATE banned_ips
SET ip = '127.0.0.1'
WHERE ip IN ('::1', '0:0:0:0:0:0:0:1');

-- Create unique index on ip if missing
CREATE UNIQUE INDEX IF NOT EXISTS banned_ips_ip_idx ON banned_ips (ip);

COMMIT;
