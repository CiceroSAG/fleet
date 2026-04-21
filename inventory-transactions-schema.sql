-- ===========================================
-- INVENTORY TRANSACTIONS HISTORY
-- ===========================================

-- 1. Create Transactions Table
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  part_id UUID REFERENCES parts_inventory(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- IN, OUT, ADJUST
  quantity INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  notes TEXT,
  reference_id UUID, -- Can be an FSR ID, Order ID, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) DEFAULT auth.uid()
);

-- 2. Enable RLS
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- 3. Policies
CREATE POLICY "Allow all access to authenticated users on inventory_transactions" ON inventory_transactions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Sample Data (Optional)
-- INSERT INTO inventory_transactions (part_id, type, quantity, new_stock, notes) 
-- SELECT id, 'IN', current_stock, current_stock, 'Initial stock entry' FROM parts_inventory;
