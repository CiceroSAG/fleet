-- ===========================================
-- EXPANDED FIELD SERVICE REPORTS SCHEMA
-- ===========================================

-- 1. Add missing columns to field_service_reports
ALTER TABLE field_service_reports ADD COLUMN IF NOT EXISTS workplace TEXT;
ALTER TABLE field_service_reports ADD COLUMN IF NOT EXISTS job_type TEXT DEFAULT 'PM';
ALTER TABLE field_service_reports ADD COLUMN IF NOT EXISTS job_description TEXT;
ALTER TABLE field_service_reports ADD COLUMN IF NOT EXISTS action_taken TEXT;
ALTER TABLE field_service_reports ADD COLUMN IF NOT EXISTS technician_name TEXT; -- Metadata backup
ALTER TABLE field_service_reports ADD COLUMN IF NOT EXISTS supervisor_name TEXT;
ALTER TABLE field_service_reports ADD COLUMN IF NOT EXISTS supervisor_date DATE;
ALTER TABLE field_service_reports ADD COLUMN IF NOT EXISTS manager_name TEXT;
ALTER TABLE field_service_reports ADD COLUMN IF NOT EXISTS manager_date DATE;
ALTER TABLE field_service_reports ADD COLUMN IF NOT EXISTS kamoa_hod_name TEXT;
ALTER TABLE field_service_reports ADD COLUMN IF NOT EXISTS kamoa_hod_date DATE;
ALTER TABLE field_service_reports ADD COLUMN IF NOT EXISTS report_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE field_service_reports ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'; -- pending, in_progress, completed
ALTER TABLE field_service_reports ADD COLUMN IF NOT EXISTS parts_replaced TEXT;
ALTER TABLE field_service_reports ADD COLUMN IF NOT EXISTS parts_ordered TEXT;
ALTER TABLE field_service_reports ADD COLUMN IF NOT EXISTS maintenance_details JSONB DEFAULT '{}';
ALTER TABLE field_service_reports ADD COLUMN IF NOT EXISTS repair_details JSONB DEFAULT '{}';
ALTER TABLE field_service_reports ADD COLUMN IF NOT EXISTS safety_details JSONB DEFAULT '{}';
ALTER TABLE field_service_reports ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES maintenance_schedules(id) ON DELETE SET NULL;

-- 2. Create Asset linking table (if multi-asset FSR support is needed)
CREATE TABLE IF NOT EXISTS field_service_report_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES field_service_reports(id) ON DELETE CASCADE NOT NULL,
  equipment_id UUID REFERENCES equipment(id) NOT NULL,
  index_value NUMERIC(10,2), -- odometer/hours at time of report
  next_service_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Parts linking table
CREATE TABLE IF NOT EXISTS field_service_report_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES field_service_reports(id) ON DELETE CASCADE NOT NULL,
  part_description TEXT,
  part_number TEXT,
  quantity_used INTEGER DEFAULT 1,
  remark TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE field_service_report_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_service_report_parts ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Allow all access to authenticated users on fsr_assets" ON field_service_report_assets
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to authenticated users on fsr_parts" ON field_service_report_parts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
