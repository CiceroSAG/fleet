-- Create Workshop Bays table if it doesn't exist
CREATE TABLE IF NOT EXISTS workshop_bays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'available', -- available, occupied, maintenance
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add workshop_bay_id to equipment if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='workshop_bay_id') THEN
        ALTER TABLE equipment ADD COLUMN workshop_bay_id UUID REFERENCES workshop_bays(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='workshop_entry_date') THEN
        ALTER TABLE equipment ADD COLUMN workshop_entry_date TIMESTAMPTZ;
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE workshop_bays ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON workshop_bays;
CREATE POLICY "Allow read access to authenticated users" ON workshop_bays 
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all access to Admins and Managers" ON workshop_bays;
CREATE POLICY "Allow all access to Admins and Managers" ON workshop_bays 
FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);
