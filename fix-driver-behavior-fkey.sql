-- Run this script in your Supabase SQL Editor to fix the foreign key constraint on driver_behavior_events

-- First, drop the existing constraint that points to the profiles table
ALTER TABLE driver_behavior_events
DROP CONSTRAINT IF EXISTS driver_behavior_events_operator_id_fkey;

-- Then, add the correct constraint that points to the operators table
ALTER TABLE driver_behavior_events
ADD CONSTRAINT driver_behavior_events_operator_id_fkey
FOREIGN KEY (operator_id) REFERENCES operators(id);
