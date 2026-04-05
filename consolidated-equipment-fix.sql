-- Consolidated Migration to fix Equipment table and related schemas
-- Run this in your Supabase SQL Editor

-- 1. Ensure equipment_categories exists and has data
CREATE TABLE IF NOT EXISTS equipment_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO equipment_categories (name) 
VALUES ('Excavator'), ('Dump Truck'), ('Dozer'), ('Loader'), ('Grader'), ('Light Vehicle')
ON CONFLICT (name) DO NOTHING;

-- 2. Add missing columns to equipment table
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES equipment_categories(id);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS odometer NUMERIC DEFAULT 0;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS engine_hours NUMERIC DEFAULT 0;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS license_plate TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS vin TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS purchase_date DATE;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10, 2);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS warranty_start_date DATE;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS warranty_end_date DATE;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS warranty_provider TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS depreciation_method TEXT DEFAULT 'straight_line';
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS salvage_value DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS useful_life_years INTEGER;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS current_book_value DECIMAL(10, 2);

-- 3. Ensure RLS and Policies
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_categories ENABLE ROW LEVEL SECURITY;

-- Policies for equipment_categories
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'equipment_categories' AND policyname = 'Allow read access to authenticated users') THEN
        CREATE POLICY "Allow read access to authenticated users" ON equipment_categories FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'equipment_categories' AND policyname = 'Allow all access to Admins and Managers') THEN
        CREATE POLICY "Allow all access to Admins and Managers" ON equipment_categories FOR ALL TO authenticated USING (
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
        );
    END IF;
END $$;

-- Policies for equipment
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'equipment' AND policyname = 'Allow read access to authenticated users') THEN
        CREATE POLICY "Allow read access to authenticated users" ON equipment FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'equipment' AND policyname = 'Allow all access to Admins and Managers') THEN
        CREATE POLICY "Allow all access to Admins and Managers" ON equipment FOR ALL TO authenticated USING (
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
        );
    END IF;
END $$;
