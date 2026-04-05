-- Migration to add missing fields to the equipment table
-- Run this in your Supabase SQL Editor

ALTER TABLE equipment ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES equipment_categories(id);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS odometer NUMERIC DEFAULT 0;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS engine_hours NUMERIC DEFAULT 0;

-- Ensure RLS is enabled (it should be already, but just in case)
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

-- Add policies if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'equipment' AND policyname = 'Allow read access to authenticated users'
    ) THEN
        CREATE POLICY "Allow read access to authenticated users" ON equipment FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'equipment' AND policyname = 'Allow all access to Admins and Managers'
    ) THEN
        CREATE POLICY "Allow all access to Admins and Managers" ON equipment FOR ALL TO authenticated USING (
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
        );
    END IF;
END $$;
