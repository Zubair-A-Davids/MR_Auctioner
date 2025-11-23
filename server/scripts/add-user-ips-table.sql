-- Create user_ips table to track user IP addresses
CREATE TABLE IF NOT EXISTS user_ips (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address inet NOT NULL,
  last_seen timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  UNIQUE(user_id, ip_address)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_ips_user_id ON user_ips(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ips_ip_address ON user_ips(ip_address);

-- Create a function to update or insert user IPs
CREATE OR REPLACE FUNCTION update_user_ip(
  p_user_id uuid,
  p_ip_address inet,
  p_user_agent text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO user_ips (user_id, ip_address, user_agent, last_seen)
  VALUES (p_user_id, p_ip_address, p_user_agent, now())
  ON CONFLICT (user_id, ip_address) 
  DO UPDATE SET last_seen = now(), user_agent = EXCLUDED.user_agent;
END;
$$ LANGUAGE plpgsql;
