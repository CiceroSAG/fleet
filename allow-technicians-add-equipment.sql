-- =======================================================
-- ALLOW TECHNICIANS TO ADD AND MODIFY EQUIPMENT
-- Run this script in your Supabase SQL Editor
-- =======================================================

-- 1. Create or update a security-definer helper function to check roles
-- Using SECURITY DEFINER bypasses profiles table RLS to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin_manager_or_technician()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role IN ('Admin', 'Manager', 'Technician');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing RLS policies on equipment
DROP POLICY IF EXISTS "Allow all access to Admins and Managers" ON equipment;
DROP POLICY IF EXISTS "Allow manage access to Admins, Managers, and Technicians" ON equipment;

-- 3. Re-create the main policy to allow Admins, Managers, and Technicians all operations (INSERT, UPDATE, DELETE, etc.)
CREATE POLICY "Allow manage access to Admins, Managers, and Technicians" ON equipment 
FOR ALL TO authenticated 
USING (public.is_admin_manager_or_technician())
WITH CHECK (public.is_admin_manager_or_technician());

-- 4. Ensure read-only access for other authenticated users (e.g. Operators)
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON equipment;
CREATE POLICY "Allow read access to authenticated users" ON equipment 
FOR SELECT TO authenticated 
USING (true);
