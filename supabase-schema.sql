-- Run this script in your Supabase SQL Editor to create the necessary tables

-- 1. Create Profiles table for Roles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'Operator', -- Admin, Manager, Operator
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'Operator');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Create Core Tables
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT DEFAULT 'MineFleet',
  logo_url TEXT,
  currency TEXT DEFAULT 'USD',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (company_name, currency) VALUES ('MineFleet', 'USD');

CREATE TABLE equipment_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO equipment_categories (name) VALUES ('Excavator'), ('Dump Truck'), ('Dozer'), ('Loader'), ('Grader'), ('Light Vehicle');

CREATE TABLE operators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  license_type TEXT,
  contact TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_tag TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  model TEXT,
  manufacturer TEXT,
  year INTEGER,
  serial_number TEXT,
  license_plate TEXT, -- Added for vehicles
  vin TEXT, -- Added for vehicles
  assigned_operator_id UUID REFERENCES operators(id),
  current_location TEXT,
  status TEXT NOT NULL DEFAULT 'Active', -- Active, Under Maintenance, Out of Service, Damaged
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE fuel_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES equipment(id) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  quantity NUMERIC NOT NULL,
  cost NUMERIC NOT NULL,
  odometer NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE maintenance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES equipment(id) NOT NULL,
  service_type TEXT NOT NULL, -- routine, major, emergency
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  cost NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE repair_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES equipment(id) NOT NULL,
  issue_description TEXT NOT NULL,
  date_reported TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending', -- Pending, In Progress, Completed
  cost NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES equipment(id) NOT NULL,
  type_of_damage TEXT NOT NULL,
  severity TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  reported_by TEXT,
  notes TEXT,
  repair_log_id UUID REFERENCES repair_logs(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Advanced Fleet Management Tables

-- GPS Tracking and Telematics
CREATE TABLE vehicle_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES equipment(id) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2),
  heading DECIMAL(5, 2),
  odometer DECIMAL(10, 2),
  engine_hours DECIMAL(8, 2),
  fuel_level DECIMAL(5, 2),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver Behavior and Safety
CREATE TABLE driver_behavior_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES equipment(id) NOT NULL,
  operator_id UUID REFERENCES operators(id),
  event_type TEXT NOT NULL, -- speeding, harsh_braking, rapid_acceleration, harsh_cornering, idling
  severity TEXT NOT NULL, -- low, medium, high
  value DECIMAL(8, 2), -- speed, g-force, etc.
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Routes and Trip Management
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  start_location_lat DECIMAL(10, 8),
  start_location_lng DECIMAL(11, 8),
  end_location_lat DECIMAL(10, 8),
  end_location_lng DECIMAL(11, 8),
  estimated_distance DECIMAL(8, 2), -- in miles/km
  estimated_duration INTERVAL,
  waypoints JSONB, -- array of lat/lng points
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES equipment(id) NOT NULL,
  operator_id UUID REFERENCES operators(id),
  route_id UUID REFERENCES routes(id),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  start_location_lat DECIMAL(10, 8),
  start_location_lng DECIMAL(11, 8),
  end_location_lat DECIMAL(10, 8),
  end_location_lng DECIMAL(11, 8),
  distance_traveled DECIMAL(8, 2),
  fuel_used DECIMAL(6, 2),
  status TEXT NOT NULL DEFAULT 'planned', -- planned, in_progress, completed, cancelled
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance Management
CREATE TABLE hours_of_service (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_id UUID REFERENCES operators(id) NOT NULL,
  date DATE NOT NULL,
  on_duty_hours DECIMAL(4, 2) DEFAULT 0,
  driving_hours DECIMAL(4, 2) DEFAULT 0,
  off_duty_hours DECIMAL(4, 2) DEFAULT 0,
  sleeper_berth_hours DECIMAL(4, 2) DEFAULT 0,
  total_hours DECIMAL(4, 2) DEFAULT 0,
  violations JSONB, -- array of violation objects
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE dvir_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES equipment(id) NOT NULL,
  operator_id UUID REFERENCES operators(id) NOT NULL,
  report_date DATE NOT NULL,
  report_type TEXT NOT NULL, -- pre_trip, post_trip, intermediate
  vehicle_condition TEXT NOT NULL, -- satisfactory, needs_attention, out_of_service
  defects_found JSONB, -- array of defect objects
  corrective_actions TEXT,
  signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance Scheduling
CREATE TABLE maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES equipment(id) NOT NULL,
  maintenance_type TEXT NOT NULL, -- preventive, predictive, corrective
  description TEXT NOT NULL,
  interval_type TEXT NOT NULL, -- mileage, hours, days, months
  interval_value INTEGER NOT NULL,
  last_performed TIMESTAMP WITH TIME ZONE,
  next_due TIMESTAMP WITH TIME ZONE,
  priority TEXT NOT NULL DEFAULT 'normal', -- low, normal, high, critical
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, overdue, cancelled
  assigned_to UUID REFERENCES profiles(id),
  estimated_cost DECIMAL(8, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fuel Optimization
CREATE TABLE fuel_efficiency_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES equipment(id) NOT NULL,
  date DATE NOT NULL,
  fuel_consumed DECIMAL(6, 2),
  distance_traveled DECIMAL(8, 2),
  mpg DECIMAL(5, 2), -- miles per gallon or equivalent
  cost_per_mile DECIMAL(5, 2),
  idle_time_hours DECIMAL(5, 2),
  idle_fuel_wasted DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset Utilization
CREATE TABLE utilization_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES equipment(id) NOT NULL,
  date DATE NOT NULL,
  total_available_hours DECIMAL(5, 2) DEFAULT 24,
  operating_hours DECIMAL(5, 2) DEFAULT 0,
  idle_hours DECIMAL(5, 2) DEFAULT 0,
  maintenance_hours DECIMAL(5, 2) DEFAULT 0,
  utilization_percentage DECIMAL(5, 2),
  revenue_generated DECIMAL(8, 2),
  operating_cost DECIMAL(8, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  type TEXT NOT NULL, -- alert, warning, info, maintenance, fuel, compliance, incident
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  related_id UUID, -- can reference equipment, incident, etc.
  related_table TEXT, -- equipment, incidents, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parts Inventory Management
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

-- 3. Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- Generic Policies for MVP: Authenticated users can read everything
CREATE POLICY "Allow read access to authenticated users" ON settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON equipment_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON operators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON fuel_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON maintenance_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON repair_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON incidents FOR SELECT TO authenticated USING (true);

-- Write access: Admins and Managers can do everything. Operators can only insert logs.
CREATE POLICY "Allow all access to Admins and Managers" ON settings FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);
CREATE POLICY "Allow all access to Admins and Managers" ON equipment_categories FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);
CREATE POLICY "Allow all access to Admins and Managers" ON operators FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);
CREATE POLICY "Allow all access to Admins and Managers" ON equipment FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);
CREATE POLICY "Allow all access to Admins and Managers" ON maintenance_logs FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);
CREATE POLICY "Allow all access to Admins and Managers" ON repair_logs FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);

-- Operators can insert fuel logs and incidents
CREATE POLICY "Allow insert to Operators" ON fuel_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow all access to Admins and Managers" ON fuel_logs FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);

CREATE POLICY "Allow all access to Admins and Managers" ON incidents FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);

-- RLS for new advanced tables
ALTER TABLE vehicle_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_behavior_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE hours_of_service ENABLE ROW LEVEL SECURITY;
ALTER TABLE dvir_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_efficiency_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilization_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Vehicle Locations: Authenticated users can read, admins/managers can manage
CREATE POLICY "Allow read access to authenticated users" ON vehicle_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all access to Admins and Managers" ON vehicle_locations FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);

-- Driver Behavior Events: Authenticated users can read, admins/managers can manage
CREATE POLICY "Allow read access to authenticated users" ON driver_behavior_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all access to Admins and Managers" ON driver_behavior_events FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);

-- Routes: Authenticated users can read, admins/managers can manage
CREATE POLICY "Allow read access to authenticated users" ON routes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all access to Admins and Managers" ON routes FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);

-- Trips: Authenticated users can read, operators can insert/update their own, admins/managers can manage all
CREATE POLICY "Allow read access to authenticated users" ON trips FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow operators to manage their trips" ON trips FOR ALL TO authenticated USING (
  operator_id IN (SELECT id FROM operators WHERE id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);
CREATE POLICY "Allow all access to Admins and Managers" ON trips FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);

-- Hours of Service: Users can read their own, admins/managers can manage all
CREATE POLICY "Users can view own HoS" ON hours_of_service FOR SELECT USING (
  operator_id IN (SELECT id FROM operators WHERE id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);
CREATE POLICY "Allow all access to Admins and Managers" ON hours_of_service FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);

-- DVIR Reports: Authenticated users can read, operators can create their own, admins/managers can manage all
CREATE POLICY "Allow read access to authenticated users" ON dvir_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow operators to create DVIR" ON dvir_reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow all access to Admins and Managers" ON dvir_reports FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);

-- Maintenance Schedules: Authenticated users can read, admins/managers can manage
CREATE POLICY "Allow read access to authenticated users" ON maintenance_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all access to Admins and Managers" ON maintenance_schedules FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);

-- Fuel Efficiency Metrics: Authenticated users can read, admins/managers can manage
CREATE POLICY "Allow read access to authenticated users" ON fuel_efficiency_metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all access to Admins and Managers" ON fuel_efficiency_metrics FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);

-- Utilization Metrics: Authenticated users can read, admins/managers can manage
CREATE POLICY "Allow read access to authenticated users" ON utilization_metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all access to Admins and Managers" ON utilization_metrics FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);

-- Notifications: Users can view their own, admins/managers can manage all
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Allow all access to Admins and Managers" ON notifications FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);
