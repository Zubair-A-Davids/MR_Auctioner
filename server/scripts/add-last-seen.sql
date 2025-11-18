-- Add last_seen column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- Update existing users to have current timestamp
UPDATE users 
SET last_seen = NOW() 
WHERE last_seen IS NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen DESC);

-- Add comment for documentation
COMMENT ON COLUMN users.last_seen IS 'Timestamp of when the user was last active on the site';
