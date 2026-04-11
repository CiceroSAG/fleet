-- Run this script in your Supabase SQL Editor to add the Technician feature

-- 1. Create Technicians table
CREATE TABLE IF NOT EXISTS technicians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  specialty TEXT,
  contact_info TEXT,
  status TEXT DEFAULT 'Active', -- Active, Inactive
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create junction table for Maintenance Logs and Technicians (Many-to-Many)
CREATE TABLE IF NOT EXISTS maintenance_technicians (
  maintenance_log_id UUID REFERENCES maintenance_logs(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  PRIMARY KEY (maintenance_log_id, technician_id)
);

-- 3. Enable RLS on new tables
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_technicians ENABLE ROW LEVEL SECURITY;

-- 4. Create policies (Allow all for authenticated users for now, following project pattern)
CREATE POLICY "Allow all for authenticated users on technicians" ON technicians
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users on maintenance_technicians" ON maintenance_technicians
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
