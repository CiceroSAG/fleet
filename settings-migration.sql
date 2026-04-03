-- Add advanced settings columns to the settings table
-- Run this in your Supabase SQL Editor

-- Telematics Settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS gps_update_interval INTEGER DEFAULT 30;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS speed_limit_threshold INTEGER DEFAULT 65;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS idle_threshold INTEGER DEFAULT 5;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS enable_telematics BOOLEAN DEFAULT true;

-- Compliance Settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS hos_enabled BOOLEAN DEFAULT true;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS dvir_enabled BOOLEAN DEFAULT true;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS max_driving_hours DECIMAL(4,2) DEFAULT 11.0;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS max_duty_hours DECIMAL(4,2) DEFAULT 14.0;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS require_dvir BOOLEAN DEFAULT true;

-- Maintenance Settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS preventive_maintenance_interval INTEGER DEFAULT 90;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS maintenance_reminder_days INTEGER DEFAULT 7;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS auto_schedule_maintenance BOOLEAN DEFAULT true;

-- Fuel Settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS fuel_efficiency_target DECIMAL(4,2) DEFAULT 8.0;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS fuel_price_per_gallon DECIMAL(5,3) DEFAULT 3.50;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS track_idle_fuel BOOLEAN DEFAULT true;