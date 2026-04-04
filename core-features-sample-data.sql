-- ===========================================
-- SAMPLE DATA FOR CORE FEATURES
-- Insert this after applying the core-features-schema.sql
-- Note: Update the UUIDs below to match actual profiles and equipment in your database
-- ===========================================

-- First, let's get some actual IDs from your database (run these queries first to see what IDs exist):
-- SELECT id, name FROM profiles LIMIT 5;
-- SELECT id, asset_tag FROM equipment LIMIT 5;

-- Replace these placeholder UUIDs with actual IDs from your database:
-- Operator IDs (from profiles table):
-- Manager/Operator 1: 'REPLACE_WITH_ACTUAL_PROFILE_ID_1'
-- Manager/Operator 2: 'REPLACE_WITH_ACTUAL_PROFILE_ID_2'

-- Equipment IDs (from equipment table):
-- Equipment 1: 'REPLACE_WITH_ACTUAL_EQUIPMENT_ID_1'
-- Equipment 2: 'REPLACE_WITH_ACTUAL_EQUIPMENT_ID_2'

-- Sample Driver Behavior Events
-- Note: Replace the UUIDs below with actual IDs from your database
INSERT INTO driver_behavior_events (operator_id, equipment_id, event_type, severity, timestamp, speed_limit, actual_speed, notes) VALUES
('REPLACE_WITH_ACTUAL_PROFILE_ID_1', 'REPLACE_WITH_ACTUAL_EQUIPMENT_ID_1', 'speeding', 'high', NOW() - INTERVAL '2 days', 65, 85, 'Exceeded speed limit by 20 mph'),
('REPLACE_WITH_ACTUAL_PROFILE_ID_1', 'REPLACE_WITH_ACTUAL_EQUIPMENT_ID_1', 'harsh_braking', 'medium', NOW() - INTERVAL '1 day', NULL, NULL, 'Sudden braking detected'),
('REPLACE_WITH_ACTUAL_PROFILE_ID_2', 'REPLACE_WITH_ACTUAL_EQUIPMENT_ID_2', 'idling', 'low', NOW() - INTERVAL '6 hours', NULL, NULL, 'Extended idling period');

-- Sample Fuel Logs
INSERT INTO fuel_logs (equipment_id, operator_id, date, quantity, cost, odometer_reading, fuel_type, station_name) VALUES
('REPLACE_WITH_ACTUAL_EQUIPMENT_ID_1', 'REPLACE_WITH_ACTUAL_PROFILE_ID_1', CURRENT_DATE - INTERVAL '1 day', 45.5, 136.50, 125000, 'diesel', 'Fuel Stop A'),
('REPLACE_WITH_ACTUAL_EQUIPMENT_ID_1', 'REPLACE_WITH_ACTUAL_PROFILE_ID_1', CURRENT_DATE - INTERVAL '3 days', 42.0, 126.00, 124500, 'diesel', 'Fuel Stop B'),
('REPLACE_WITH_ACTUAL_EQUIPMENT_ID_2', 'REPLACE_WITH_ACTUAL_PROFILE_ID_2', CURRENT_DATE - INTERVAL '2 days', 38.5, 115.50, 98000, 'diesel', 'Fuel Stop A');

-- Sample Fuel Efficiency Metrics
INSERT INTO fuel_efficiency_metrics (equipment_id, date, fuel_consumption, distance_traveled, efficiency_mpg, cost_per_mile) VALUES
('REPLACE_WITH_ACTUAL_EQUIPMENT_ID_1', CURRENT_DATE - INTERVAL '1 day', 45.5, 280, 6.15, 0.487),
('REPLACE_WITH_ACTUAL_EQUIPMENT_ID_1', CURRENT_DATE - INTERVAL '3 days', 42.0, 275, 6.55, 0.458),
('REPLACE_WITH_ACTUAL_EQUIPMENT_ID_2', CURRENT_DATE - INTERVAL '2 days', 38.5, 265, 6.88, 0.435);

-- Sample Maintenance Schedules
INSERT INTO maintenance_schedules (equipment_id, maintenance_type, description, interval_type, interval_value, next_due, priority, status, estimated_cost) VALUES
('REPLACE_WITH_ACTUAL_EQUIPMENT_ID_1', 'Oil Change', 'Regular oil and filter change', 'miles', 5000, CURRENT_DATE + INTERVAL '7 days', 'medium', 'active', 150.00),
('REPLACE_WITH_ACTUAL_EQUIPMENT_ID_1', 'Tire Rotation', 'Rotate tires for even wear', 'miles', 8000, CURRENT_DATE + INTERVAL '14 days', 'low', 'active', 75.00),
('REPLACE_WITH_ACTUAL_EQUIPMENT_ID_2', 'Brake Inspection', 'Check brake pads and rotors', 'months', 6, CURRENT_DATE + INTERVAL '30 days', 'high', 'active', 200.00);

-- Sample Parts Suppliers
INSERT INTO parts_suppliers (name, contact_person, email, phone) VALUES
('AutoParts Plus', 'John Smith', 'john@autopartsplus.com', '555-0101'),
('Fleet Parts Co', 'Sarah Johnson', 'sarah@fleetparts.com', '555-0102');

-- Sample Parts Inventory
INSERT INTO parts_inventory (part_number, name, description, current_stock, min_stock, unit_cost, supplier_id, category) VALUES
('ENG-OIL-5W30', 'Engine Oil 5W-30', 'Synthetic engine oil', 50, 10, 8.50, (SELECT id FROM parts_suppliers WHERE name = 'AutoParts Plus' LIMIT 1), 'engine'),
('FLT-OIL', 'Oil Filter', 'Standard oil filter', 30, 5, 12.99, (SELECT id FROM parts_suppliers WHERE name = 'AutoParts Plus' LIMIT 1), 'engine'),
('BRK-PAD-FRT', 'Front Brake Pads', 'Ceramic brake pads', 20, 4, 45.00, (SELECT id FROM parts_suppliers WHERE name = 'Fleet Parts Co' LIMIT 1), 'brakes');

-- Sample Equipment Parts Mapping
INSERT INTO equipment_parts_mapping (equipment_id, part_id, quantity_needed) VALUES
('REPLACE_WITH_ACTUAL_EQUIPMENT_ID_1', (SELECT id FROM parts_inventory WHERE part_number = 'ENG-OIL-5W30' LIMIT 1), 6),
('REPLACE_WITH_ACTUAL_EQUIPMENT_ID_1', (SELECT id FROM parts_inventory WHERE part_number = 'FLT-OIL' LIMIT 1), 1),
('REPLACE_WITH_ACTUAL_EQUIPMENT_ID_2', (SELECT id FROM parts_inventory WHERE part_number = 'BRK-PAD-FRT' LIMIT 1), 2);