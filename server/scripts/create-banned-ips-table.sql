-- Table to store banned IP addresses
CREATE TABLE IF NOT EXISTS banned_ips (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address text NOT NULL,
  reason text,
  banned_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_banned_ips_ip ON banned_ips(ip_address);
