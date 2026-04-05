-- Migration script to add missing columns for new features

-- 1. Update repair_logs table
ALTER TABLE repair_logs ADD COLUMN IF NOT EXISTS repair_type TEXT;
ALTER TABLE repair_logs ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Update maintenance_logs table
ALTER TABLE maintenance_logs ADD COLUMN IF NOT EXISTS odometer_reading NUMERIC;
ALTER TABLE maintenance_logs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE maintenance_logs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- 3. Update incidents table
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS operator_id UUID REFERENCES operators(id);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS location TEXT;

-- 4. Update parts_inventory table
ALTER TABLE parts_inventory ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'pcs';
ALTER TABLE parts_inventory ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE parts_inventory ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0;
ALTER TABLE parts_inventory ADD COLUMN IF NOT EXISTS min_quantity INTEGER DEFAULT 0;

-- 5. Add missing columns to equipment table if they are not there
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

-- 6. Update settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS fuel_price_per_gallon NUMERIC DEFAULT 0;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS preventive_maintenance_interval INTEGER DEFAULT 0;
