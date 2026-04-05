-- Run this script in your Supabase SQL Editor to add the missing columns to the driver_behavior_events table

ALTER TABLE driver_behavior_events
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS speed_limit DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS actual_speed DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS g_force DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS notes TEXT;
