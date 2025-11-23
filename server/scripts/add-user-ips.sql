-- Idempotent migration: create user_ips table to record historical IPs per user
BEGIN;

CREATE TABLE IF NOT EXISTS user_ips (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip text NOT NULL,
  seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, ip)
);

CREATE INDEX IF NOT EXISTS user_ips_ip_idx ON user_ips (ip);
CREATE INDEX IF NOT EXISTS user_ips_user_idx ON user_ips (user_id);

-- Backfill existing last_ip values for users
INSERT INTO user_ips (user_id, ip, seen_at)
SELECT id, last_ip, now() FROM users WHERE last_ip IS NOT NULL
ON CONFLICT DO NOTHING;

COMMIT;
