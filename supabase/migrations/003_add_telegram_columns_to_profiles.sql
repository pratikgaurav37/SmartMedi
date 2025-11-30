-- Add Telegram chat ID column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

-- Create index for faster lookups by chat_id
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat_id ON profiles(telegram_chat_id);
