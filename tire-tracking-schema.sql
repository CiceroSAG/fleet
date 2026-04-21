-- ===========================================
-- TIRE TRACKING SYSTEM
-- ===========================================

-- 1. Tires Table
CREATE TABLE IF NOT EXISTS tires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  serial_number TEXT UNIQUE NOT NULL,
  brand TEXT,
  model TEXT,
  size TEXT,
  position TEXT, -- e.g., Front Left, Rear Right Inner
  equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL,
  tread_depth NUMERIC(4,2), -- in mm
  pressure NUMERIC(5,2), -- in PSI
  status TEXT DEFAULT 'Active', -- Active, Storage, Scrapped
  installation_date DATE,
  last_inspection_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tire Actions/History Table
CREATE TABLE IF NOT EXISTS tire_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tire_id UUID REFERENCES tires(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL, -- Installation, Removal, Inspection, Pressure Check, Rotation
  equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL,
  tread_depth_reading NUMERIC(4,2),
  pressure_reading NUMERIC(5,2),
  notes TEXT,
  performed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE tires ENABLE ROW LEVEL SECURITY;
ALTER TABLE tire_actions ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "Allow all access to authenticated users on tires" ON tires
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to authenticated users on tire_actions" ON tire_actions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
