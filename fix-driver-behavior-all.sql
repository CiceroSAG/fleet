-- Comprehensive fix for driver_behavior_events table

-- 1. Add all missing columns
ALTER TABLE driver_behavior_events
ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS value DECIMAL(8, 2),
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS speed_limit DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS actual_speed DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS g_force DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Fix the foreign key constraint for operator_id
ALTER TABLE driver_behavior_events
DROP CONSTRAINT IF EXISTS driver_behavior_events_operator_id_fkey;

ALTER TABLE driver_behavior_events
ADD CONSTRAINT driver_behavior_events_operator_id_fkey
FOREIGN KEY (operator_id) REFERENCES operators(id);
