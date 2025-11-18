-- Migration to add profile fields to users table
-- Run this on your existing database to add the new columns

ALTER TABLE users ADD COLUMN IF NOT EXISTS discord text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_mod boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_until timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_reason text;
