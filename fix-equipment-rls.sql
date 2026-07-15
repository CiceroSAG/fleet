-- Update Equipment policies to use helper functions for better performance and reliability
-- This also ensures that the checks bypass recursive RLS issues

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Allow all access to Admins and Managers" ON equipment;
DROP POLICY IF EXISTS "Allow manage access to Admins, Managers, and Technicians" ON equipment;
DROP POLICY IF EXISTS "Allow all access to Admins and Managers" ON equipment_categories;
DROP POLICY IF EXISTS "Allow all access to Admins and Managers" ON parts_inventory;
DROP POLICY IF EXISTS "Allow all access to Admins and Managers" ON operators;

-- Re-create using the security-definer helper functions for better reliability
CREATE OR REPLACE FUNCTION public.is_admin_manager_or_technician()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role IN ('Admin', 'Manager', 'Technician');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Allow manage access to Admins, Managers, and Technicians" ON equipment 
FOR ALL TO authenticated 
USING (public.is_admin_manager_or_technician())
WITH CHECK (public.is_admin_manager_or_technician());

CREATE POLICY "Allow all access to Admins and Managers" ON equipment_categories 
FOR ALL TO authenticated 
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

CREATE POLICY "Allow all access to Admins and Managers" ON parts_inventory 
FOR ALL TO authenticated 
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

CREATE POLICY "Allow all access to Admins and Managers" ON operators 
FOR ALL TO authenticated 
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- Ensure read access is correctly set for all authenticated users
-- Using DO blocks to avoid errors if policies exist with different names but same logic
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'equipment' AND policyname = 'Allow read access to authenticated users') THEN
        CREATE POLICY "Allow read access to authenticated users" ON equipment FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'parts_inventory' AND policyname = 'Allow read access to authenticated users') THEN
        CREATE POLICY "Allow read access to authenticated users" ON parts_inventory FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'operators' AND policyname = 'Allow read access to authenticated users') THEN
        CREATE POLICY "Allow read access to authenticated users" ON operators FOR SELECT TO authenticated USING (true);
    END IF;
END $$;
