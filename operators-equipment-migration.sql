-- Add missing columns to operators table
-- Run this in your Supabase SQL Editor

-- Add missing columns to operators table
ALTER TABLE operators ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE operators ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE operators ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE operators ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE operators ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE operators ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE operators ADD COLUMN IF NOT EXISTS emergency_contact TEXT;

-- Add missing columns to equipment table
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS purchase_date DATE;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10, 2);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS depreciation_rate DECIMAL(5, 2);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS warranty_expiration DATE;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS insurance_expiration DATE;

-- Add missing columns to maintenance_logs table
ALTER TABLE maintenance_logs ADD COLUMN IF NOT EXISTS performed_by UUID REFERENCES profiles(id);
ALTER TABLE maintenance_logs ADD COLUMN IF NOT EXISTS hours_worked DECIMAL(5, 2);
ALTER TABLE maintenance_logs ADD COLUMN IF NOT EXISTS parts_used JSONB;
ALTER TABLE maintenance_logs ADD COLUMN IF NOT EXISTS next_service_due DATE;
ALTER TABLE maintenance_logs ADD COLUMN IF NOT EXISTS maintenance_type TEXT DEFAULT 'preventive';
ALTER TABLE maintenance_logs ADD COLUMN IF NOT EXISTS description TEXT;

-- Add missing columns to fuel_logs table
ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS price_per_gallon DECIMAL(5, 3);
ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS fuel_type TEXT DEFAULT 'diesel';
ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS odometer_end DECIMAL(10, 2);
ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS mpg DECIMAL(5, 2);

-- Update RLS policies for new columns
-- Allow operators to update their own records
CREATE POLICY "Allow operators to update own info" ON operators FOR UPDATE TO authenticated USING (
  id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);