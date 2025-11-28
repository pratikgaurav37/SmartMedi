-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  type TEXT NOT NULL,
  frequency TEXT NOT NULL,
  times JSONB NOT NULL DEFAULT '[]'::jsonb,
  start_date DATE NOT NULL,
  end_date DATE,
  tracking JSONB NOT NULL DEFAULT '{"confirm": true, "notify": false, "repeat": false}'::jsonb,
  notes TEXT,
  current_supply INTEGER,
  supply_unit TEXT,
  low_stock_threshold INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create dose_logs table
CREATE TABLE IF NOT EXISTS dose_logs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMPTZ NOT NULL,
  actual_time TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('pending', 'taken', 'skipped', 'missed', 'delayed')),
  notes TEXT,
  delayed_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON medications(user_id);
CREATE INDEX IF NOT EXISTS idx_dose_logs_user_id ON dose_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_dose_logs_medication_id ON dose_logs(medication_id);
CREATE INDEX IF NOT EXISTS idx_dose_logs_scheduled_time ON dose_logs(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_dose_logs_status ON dose_logs(status);

-- Enable Row Level Security
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dose_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medications table
CREATE POLICY "Users can view their own medications"
  ON medications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medications"
  ON medications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medications"
  ON medications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medications"
  ON medications FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for dose_logs table
CREATE POLICY "Users can view their own dose logs"
  ON dose_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dose logs"
  ON dose_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dose logs"
  ON dose_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dose logs"
  ON dose_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON medications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dose_logs_updated_at
  BEFORE UPDATE ON dose_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
