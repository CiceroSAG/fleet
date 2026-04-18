-- Run this script in your Supabase SQL Editor to enable multiple technicians for Repairs and Field Service Reports

-- 1. Create junction table for Repair Logs and Technicians
CREATE TABLE IF NOT EXISTS repair_technicians (
  repair_log_id UUID REFERENCES repair_logs(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  PRIMARY KEY (repair_log_id, technician_id)
);

-- 2. Create junction table for Field Service Reports and Technicians
CREATE TABLE IF NOT EXISTS field_service_report_technicians (
  report_id UUID REFERENCES field_service_reports(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  PRIMARY KEY (report_id, technician_id)
);

-- 3. Enable RLS
ALTER TABLE repair_technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_service_report_technicians ENABLE ROW LEVEL SECURITY;

-- 4. Create policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'repair_technicians' AND policyname = 'Allow all for authenticated users on repair_technicians'
    ) THEN
        CREATE POLICY "Allow all for authenticated users on repair_technicians" ON repair_technicians
          FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'field_service_report_technicians' AND policyname = 'Allow all for authenticated users on field_service_report_technicians'
    ) THEN
        CREATE POLICY "Allow all for authenticated users on field_service_report_technicians" ON field_service_report_technicians
          FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;
