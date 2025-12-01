-- Migration: Add push subscription storage to profiles table
-- This allows storing Web Push API subscription data for server-side push notifications

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS push_subscription JSONB;

-- Add GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_profiles_push_subscription 
ON profiles USING GIN (push_subscription) 
WHERE push_subscription IS NOT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN profiles.push_subscription IS 'Web Push API subscription data (endpoint, keys, etc.) for sending push notifications';
