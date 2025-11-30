-- Create telegram_verification_tokens table
CREATE TABLE IF NOT EXISTS telegram_verification_tokens (
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE telegram_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own tokens"
  ON telegram_verification_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own tokens"
  ON telegram_verification_tokens FOR SELECT
  USING (auth.uid() = user_id);
