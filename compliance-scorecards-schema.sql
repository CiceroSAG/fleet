-- ===========================================
-- COMPLIANCE AND OPERATOR SCORECARDS
-- ===========================================

-- 1. Compliance Alerts Table
CREATE TABLE IF NOT EXISTS compliance_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- Insurance, License, Permit, Inspection
  document_number TEXT,
  expiry_date DATE NOT NULL,
  status TEXT DEFAULT 'Active',
  notes TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Operator Scorecards Table (for persisting the rankings)
CREATE TABLE IF NOT EXISTS operator_scorecards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_id UUID REFERENCES profiles(id) NOT NULL,
  period DATE NOT NULL, -- First day of the month for monthly scores
  safety_score INTEGER DEFAULT 100,
  efficiency_score INTEGER DEFAULT 100,
  reliability_score INTEGER DEFAULT 100,
  total_score INTEGER DEFAULT 100,
  incidents_count INTEGER DEFAULT 0,
  idle_time_avg NUMERIC(5,2),
  fuel_efficiency_avg NUMERIC(5,2),
  ranking INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(operator_id, period)
);

-- 3. Enable RLS
ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_scorecards ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "Allow all access to authenticated users on compliance_alerts" ON compliance_alerts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to authenticated users on operator_scorecards" ON operator_scorecards
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Helper Function to calculate scores (conceptual - would be triggered by worker or cron)
-- In this app, score calculation logic resides in src/services/geminiService.ts or in-app logic.
