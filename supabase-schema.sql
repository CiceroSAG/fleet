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

CREATE POLICY "Allow insert to Operators" ON incidents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow all access to Admins and Managers" ON incidents FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
);
