-- ===========================================
-- UPDATED SCHEMA FOR NEW FEATURES
-- Add these tables to your existing supabase-schema.sql
-- ===========================================

-- 1. REAL-TIME ALERTS & NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  type TEXT NOT NULL, -- alert, warning, info, maintenance, fuel, compliance, incident, inventory
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  related_id UUID, -- can reference equipment, incident, etc.
  related_table TEXT, -- equipment, incidents, parts_inventory, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PARTS INVENTORY MANAGEMENT
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
  unit_cost DECIMAL(8, 2),
  supplier_id UUID REFERENCES parts_suppliers(id),
  category TEXT, -- engine, transmission, tires, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE equipment_parts_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES equipment(id) NOT NULL,
  part_id UUID REFERENCES parts_inventory(id) NOT NULL,
  quantity_needed INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. DASHBOARD CONFIGURATION (Customizable Widgets)
CREATE TABLE dashboard_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  config JSONB NOT NULL, -- widget layout, visibility, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ===========================================
-- EQUIPMENT TABLE EXTENSIONS (Warranty & Lifecycle)
-- ===========================================

-- Add these columns to your existing equipment table:
-- ALTER TABLE equipment ADD COLUMN purchase_date DATE;
-- ALTER TABLE equipment ADD COLUMN purchase_price DECIMAL(10, 2);
-- ALTER TABLE equipment ADD COLUMN warranty_start_date DATE;
-- ALTER TABLE equipment ADD COLUMN warranty_end_date DATE;
-- ALTER TABLE equipment ADD COLUMN warranty_provider TEXT;
-- ALTER TABLE equipment ADD COLUMN depreciation_method TEXT DEFAULT 'straight_line';
-- ALTER TABLE equipment ADD COLUMN salvage_value DECIMAL(10, 2) DEFAULT 0;
-- ALTER TABLE equipment ADD COLUMN useful_life_years INTEGER;
-- ALTER TABLE equipment ADD COLUMN current_book_value DECIMAL(10, 2);

-- ===========================================
-- ROW LEVEL SECURITY POLICIES
-- ===========================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_parts_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_configs ENABLE ROW LEVEL SECURITY;

-- Notifications: Users can view their own, admins/managers can manage all
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Allow all access to Admins and Managers" ON notifications FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);

-- Parts Suppliers: Authenticated users can read, admins/managers can manage
CREATE POLICY "Allow read access to authenticated users" ON parts_suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all access to Admins and Managers" ON parts_suppliers FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);

-- Parts Inventory: Authenticated users can read, admins/managers can manage
CREATE POLICY "Allow read access to authenticated users" ON parts_inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all access to Admins and Managers" ON parts_inventory FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);

-- Equipment Parts Mapping: Authenticated users can read, admins/managers can manage
CREATE POLICY "Allow read access to authenticated users" ON equipment_parts_mapping FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all access to Admins and Managers" ON equipment_parts_mapping FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);

-- Dashboard Configs: Users can manage their own configs
CREATE POLICY "Users can manage own dashboard config" ON dashboard_configs FOR ALL TO authenticated USING (user_id = auth.uid());

-- ===========================================
-- OPTIONAL: SAMPLE DATA FOR TESTING
-- ===========================================

-- Sample suppliers
INSERT INTO parts_suppliers (name, contact_person, email, phone) VALUES
('Heavy Equipment Parts Co', 'John Smith', 'john@heavyparts.com', '555-0101'),
('Industrial Supplies Inc', 'Sarah Johnson', 'sarah@industrialsupplies.com', '555-0102');

-- Sample parts
INSERT INTO parts_inventory (part_number, name, current_stock, min_stock, unit_cost, supplier_id, category) VALUES
('ENG-001', 'Engine Oil Filter', 50, 10, 25.99, (SELECT id FROM parts_suppliers WHERE name = 'Heavy Equipment Parts Co' LIMIT 1), 'Engine'),
('TRN-002', 'Transmission Fluid', 30, 5, 45.50, (SELECT id FROM parts_suppliers WHERE name = 'Industrial Supplies Inc' LIMIT 1), 'Transmission'),
('BRK-003', 'Brake Pads Set', 20, 8, 89.99, (SELECT id FROM parts_suppliers WHERE name = 'Heavy Equipment Parts Co' LIMIT 1), 'Brakes');