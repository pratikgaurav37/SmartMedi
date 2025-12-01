-- Migration: Refactor schema to match user request

-- 1. Update medications table
ALTER TABLE medications
  ALTER COLUMN times TYPE JSONB USING times::JSONB,
  ALTER COLUMN tracking TYPE JSONB USING tracking::JSONB,
  ALTER COLUMN start_date TYPE DATE,
  ALTER COLUMN end_date TYPE DATE;

-- Ensure columns exist and have correct types (idempotent checks)
DO $$
BEGIN
    -- Add columns if they don't exist (though they should based on previous migrations)
    -- This is a safety measure.
    
    -- Check for low_stock_threshold
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medications' AND column_name = 'low_stock_threshold') THEN
        ALTER TABLE medications ADD COLUMN low_stock_threshold INTEGER;
    END IF;

     -- Check for supply_unit
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medications' AND column_name = 'supply_unit') THEN
        ALTER TABLE medications ADD COLUMN supply_unit TEXT;
    END IF;
    
    -- Check for current_supply
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medications' AND column_name = 'current_supply') THEN
        ALTER TABLE medications ADD COLUMN current_supply INTEGER;
    END IF;

END $$;


-- 2. Update dose_logs table
-- Ensure status check constraint matches
ALTER TABLE dose_logs DROP CONSTRAINT IF EXISTS dose_logs_status_check;
ALTER TABLE dose_logs ADD CONSTRAINT dose_logs_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'taken'::text, 'skipped'::text, 'missed'::text, 'delayed'::text]));

-- Ensure delayed_until exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dose_logs' AND column_name = 'delayed_until') THEN
        ALTER TABLE dose_logs ADD COLUMN delayed_until TIMESTAMPTZ;
    END IF;
END $$;


-- 3. Update profiles table
-- Ensure all columns from request exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'dob') THEN
        ALTER TABLE profiles ADD COLUMN dob DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gender') THEN
        ALTER TABLE profiles ADD COLUMN gender TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'weight') THEN
        ALTER TABLE profiles ADD COLUMN weight TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'conditions') THEN
        ALTER TABLE profiles ADD COLUMN conditions TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'allergies') THEN
        ALTER TABLE profiles ADD COLUMN allergies TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'doctor_name') THEN
        ALTER TABLE profiles ADD COLUMN doctor_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'emergency_contact') THEN
        ALTER TABLE profiles ADD COLUMN emergency_contact TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferences') THEN
        ALTER TABLE profiles ADD COLUMN preferences JSONB;
    END IF;
END $$;

-- 4. Telegram tokens table (already correct in 002, but good to double check if anything missing)
-- No changes needed based on request vs 002.

