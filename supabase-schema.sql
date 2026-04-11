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
  license_number TEXT,
  license_expiry DATE,
  contact TEXT,
  phone TEXT,
  email TEXT,
  status TEXT DEFAULT 'Active',
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
  category_id UUID REFERENCES equipment_categories(id),
  assigned_operator_id UUID REFERENCES operators(id),
  current_location TEXT,
  status TEXT NOT NULL DEFAULT 'Active', -- Active, Under Maintenance, Out of Service, Damaged
  odometer NUMERIC DEFAULT 0,
  engine_hours NUMERIC DEFAULT 0,
  -- Warranty and Lifecycle fields
  purchase_date DATE,
  purchase_price DECIMAL(10, 2),
  warranty_start_date DATE,
  warranty_end_date DATE,
  warranty_provider TEXT,
  depreciation_method TEXT DEFAULT 'straight_line', -- straight_line, declining_balance
  salvage_value DECIMAL(10, 2) DEFAULT 0,
  useful_life_years INTEGER,
  current_book_value DECIMAL(10, 2),
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
  workplace TEXT,
  index_value NUMERIC,
  next_service_date DATE,
  status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, completed
  approval_status TEXT DEFAULT 'pending', -- pending, approved, rejected
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  schedule_id UUID REFERENCES maintenance_schedules(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE repair_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES equipment(id) NOT NULL,
  issue_description TEXT NOT NULL,
  action_taken TEXT,
  workplace TEXT,
  index_value NUMERIC,
  date_reported TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending', -- Pending, In Progress, Completed
  cost NUMERIC,
  schedule_id UUID REFERENCES maintenance_schedules(id),
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

-- Maintenance Technicians Mapping
CREATE TABLE maintenance_technicians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  maintenance_log_id UUID REFERENCES maintenance_logs(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE maintenance_technicians ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to authenticated users" ON maintenance_technicians FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all access to Admins and Managers" ON maintenance_technicians FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);
CREATE POLICY "Allow Technicians to insert maintenance_technicians" ON maintenance_technicians FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Technician')
);
CREATE POLICY "Allow Technicians to delete maintenance_technicians" ON maintenance_technicians FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Technician')
);

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
  location TEXT,
  speed_limit DECIMAL(5,2),
  actual_speed DECIMAL(5,2),
  g_force DECIMAL(5,2),
  duration_seconds INTEGER,
  notes TEXT,
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

-- Dashboard Configuration
CREATE TABLE dashboard_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  config JSONB NOT NULL, -- widget layout, visibility, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
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

-- Function to check if current user is admin or manager (bypasses RLS to avoid infinite recursion)
CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role IN ('Admin', 'Manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role = 'Admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can read their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- Profiles: Admins and Managers can view all profiles
CREATE POLICY "Admins and Managers can view all profiles" ON profiles FOR SELECT USING (public.is_admin_or_manager());
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (public.is_admin());

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
CREATE POLICY "Allow Technicians to insert maintenance logs" ON maintenance_logs FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Technician')
);
CREATE POLICY "Allow Technicians to update maintenance logs" ON maintenance_logs FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Technician')
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
ALTER TABLE parts_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_parts_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_configs ENABLE ROW LEVEL SECURITY;

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

-- Field Service Reports
CREATE TABLE field_service_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workplace TEXT,
  job_type TEXT, -- BD, PM, RP, SAF
  job_description TEXT,
  action_taken TEXT,
  technician_name TEXT,
  supervisor_name TEXT,
  manager_name TEXT,
  kamoa_hod_name TEXT,
  supervisor_date DATE,
  manager_date DATE,
  kamoa_hod_date DATE,
  technician_id UUID REFERENCES profiles(id),
  schedule_id UUID REFERENCES maintenance_schedules(id),
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed
  report_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE field_service_report_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES field_service_reports(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipment(id),
  index_value NUMERIC,
  next_service_date DATE
);

CREATE TABLE field_service_report_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES field_service_reports(id) ON DELETE CASCADE,
  part_description TEXT,
  quantity_used INTEGER,
  remark TEXT
);

-- Enable RLS and add policies for the new tables
ALTER TABLE field_service_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_service_report_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_service_report_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users" ON field_service_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all access to authenticated users" ON field_service_reports FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow read access to authenticated users" ON field_service_report_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all access to authenticated users" ON field_service_report_assets FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow read access to authenticated users" ON field_service_report_parts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all access to authenticated users" ON field_service_report_parts FOR ALL TO authenticated USING (true);

-- Storage Bucket for Company Assets (Logos, etc)
INSERT INTO storage.buckets (id, name, public) VALUES ('company-assets', 'company-assets', true) ON CONFLICT (id) DO NOTHING;

-- Storage Policies for company-assets
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'company-assets');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'company-assets');
CREATE POLICY "Authenticated users can update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'company-assets');
CREATE POLICY "Authenticated users can delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'company-assets');
