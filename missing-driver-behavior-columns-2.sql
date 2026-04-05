-- Run this script in your Supabase SQL Editor to add the remaining missing columns to the driver_behavior_events table

ALTER TABLE driver_behavior_events
ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS value DECIMAL(8, 2);
