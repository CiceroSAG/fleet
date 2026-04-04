-- ===========================================
-- ESSENTIAL SCHEMA FOR DRIVER BEHAVIOR, FUEL MANAGEMENT & MAINTENANCE SCHEDULING
-- Apply this schema first to enable these three core pages
-- ===========================================

-- DROP EXISTING TABLES (if they exist)
DROP TABLE IF EXISTS equipment_parts_mapping CASCADE;
DROP TABLE IF EXISTS parts_inventory CASCADE;
DROP TABLE IF EXISTS parts_suppliers CASCADE;
DROP TABLE IF EXISTS maintenance_schedules CASCADE;
DROP TABLE IF EXISTS fuel_efficiency_metrics CASCADE;
DROP TABLE IF EXISTS fuel_logs CASCADE;
DROP TABLE IF EXISTS driver_behavior_events CASCADE;

-- 1. DRIVER BEHAVIOR EVENTS
CREATE TABLE driver_behavior_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_id UUID REFERENCES profiles(id) NOT NULL,
  equipment_id UUID REFERENCES equipment(id),
  event_type TEXT NOT NULL, -- speeding, harsh_braking, rapid_acceleration, harsh_cornering, idling
  severity TEXT NOT NULL, -- low, medium, high
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  location TEXT,
  speed_limit DECIMAL(5,2),
  actual_speed DECIMAL(5,2),
  g_force DECIMAL(5,2),
  duration_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. FUEL LOGS (for fuel management)
CREATE TABLE fuel_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES equipment(id) NOT NULL,
  operator_id UUID REFERENCES profiles(id),
  date DATE NOT NULL,
  quantity DECIMAL(8,2) NOT NULL,
  cost DECIMAL(8,2),
  odometer_reading DECIMAL(10,2),
  fuel_type TEXT,
  station_name TEXT,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. FUEL EFFICIENCY METRICS
CREATE TABLE fuel_efficiency_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES equipment(id) NOT NULL,
  date DATE NOT NULL,
  fuel_consumption DECIMAL(8,2),
  distance_traveled DECIMAL(10,2),
  efficiency_mpg DECIMAL(6,2),
  cost_per_mile DECIMAL(6,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. MAINTENANCE SCHEDULES
CREATE TABLE maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES equipment(id) NOT NULL,
  maintenance_type TEXT NOT NULL,
  description TEXT NOT NULL,
  interval_type TEXT NOT NULL, -- days, miles, hours
  interval_value INTEGER NOT NULL,
  last_performed DATE,
  next_due DATE NOT NULL,
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  status TEXT DEFAULT 'active', -- active, completed, overdue, cancelled
  assigned_to UUID REFERENCES profiles(id),
  estimated_cost DECIMAL(8,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PARTS INVENTORY (for maintenance scheduling)
CREATE TABLE parts_suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE parts_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  part_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  max_stock INTEGER,
  unit_cost DECIMAL(8,2),
  supplier_id UUID REFERENCES parts_suppliers(id),
  category TEXT, -- engine, transmission, tires, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. EQUIPMENT PARTS MAPPING
CREATE TABLE equipment_parts_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES equipment(id) NOT NULL,
  part_id UUID REFERENCES parts_inventory(id) NOT NULL,
  quantity_needed INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- ROW LEVEL SECURITY POLICIES
-- ===========================================

-- Driver Behavior Events
ALTER TABLE driver_behavior_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users" ON driver_behavior_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all access to Admins and Managers" ON driver_behavior_events FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('Admin', 'Manager')
  )
);

-- Fuel Logs
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users" ON fuel_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all access to Admins and Managers" ON fuel_logs FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('Admin', 'Manager')
  )
);

-- Fuel Efficiency Metrics
ALTER TABLE fuel_efficiency_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users" ON fuel_efficiency_metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all access to Admins and Managers" ON fuel_efficiency_metrics FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('Admin', 'Manager')
  )
);

-- Maintenance Schedules
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users" ON maintenance_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all access to Admins and Managers" ON maintenance_schedules FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('Admin', 'Manager')
  )
);

-- Parts Suppliers
ALTER TABLE parts_suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users" ON parts_suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all access to Admins and Managers" ON parts_suppliers FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('Admin', 'Manager')
  )
);

-- Parts Inventory
ALTER TABLE parts_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users" ON parts_inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all access to Admins and Managers" ON parts_inventory FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('Admin', 'Manager')
  )
);

-- Equipment Parts Mapping
ALTER TABLE equipment_parts_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users" ON equipment_parts_mapping FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all access to Admins and Managers" ON equipment_parts_mapping FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('Admin', 'Manager')
  )
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

CREATE INDEX idx_driver_behavior_events_operator_timestamp ON driver_behavior_events(operator_id, timestamp);
CREATE INDEX idx_driver_behavior_events_equipment_timestamp ON driver_behavior_events(equipment_id, timestamp);
CREATE INDEX idx_driver_behavior_events_type ON driver_behavior_events(event_type);

CREATE INDEX idx_fuel_logs_equipment_date ON fuel_logs(equipment_id, date);
CREATE INDEX idx_fuel_logs_operator_date ON fuel_logs(operator_id, date);

CREATE INDEX idx_fuel_efficiency_equipment_date ON fuel_efficiency_metrics(equipment_id, date);

CREATE INDEX idx_maintenance_schedules_equipment_next_due ON maintenance_schedules(equipment_id, next_due);
CREATE INDEX idx_maintenance_schedules_assigned_to ON maintenance_schedules(assigned_to);
CREATE INDEX idx_maintenance_schedules_status ON maintenance_schedules(status);

CREATE INDEX idx_parts_inventory_part_number ON parts_inventory(part_number);
CREATE INDEX idx_parts_inventory_category ON parts_inventory(category);

CREATE INDEX idx_equipment_parts_mapping_equipment ON equipment_parts_mapping(equipment_id);
CREATE INDEX idx_equipment_parts_mapping_part ON equipment_parts_mapping(part_id);