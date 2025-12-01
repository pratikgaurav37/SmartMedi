-- Migration: Add notification preferences to profiles table
-- This allows tracking of web notification preferences and when permission was requested

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS web_notifications_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_permission_requested_at TIMESTAMPTZ;

-- Add comment to explain the columns
COMMENT ON COLUMN profiles.web_notifications_enabled IS 'Whether the user has enabled browser push notifications';
COMMENT ON COLUMN profiles.notification_permission_requested_at IS 'Timestamp when notification permission was last requested from the user';
