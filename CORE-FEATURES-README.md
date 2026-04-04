# Core Features Schema Setup

This directory contains the essential database schema and sample data needed to enable the three core pages that were showing loading states:

- **Driver Behavior** - Driver safety monitoring and analytics
- **Fuel Management** - Fuel tracking, efficiency analysis, and optimization
- **Maintenance Scheduling** - Maintenance planning, workload balancing, and parts management

## ⚠️ Important Warning

**This schema will DROP and RECREATE existing tables if they exist.** This will delete all existing data in these tables:
- driver_behavior_events
- fuel_logs
- fuel_efficiency_metrics
- maintenance_schedules
- parts_suppliers
- parts_inventory
- equipment_parts_mapping

**Make sure to backup any important data before running this schema.**

## Files

- `core-features-schema.sql` - **DROPS existing tables** (use this if you want to start fresh)
- `core-features-schema-safe.sql` - **Safe version** that only creates tables if they don't exist (preserves existing data)
- `core-features-sample-data.sql` - Sample data for testing

## Which File to Use?

### Use `core-features-schema.sql` if:
- You want to completely recreate these tables
- You're okay with losing existing data in these tables
- You want a clean slate

### Use `core-features-schema-safe.sql` if:
- You want to preserve existing data
- You just need to ensure the tables exist
- You're getting "table already exists" errors

## How to Apply

### Option 1: Drop and Recreate Tables (Recommended for clean setup)
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Open the **SQL Editor**
4. Copy and paste the entire contents of `core-features-schema.sql`
5. Click **Run** to drop existing tables and create new ones

### Option 2: Safe Update (Preserves existing data)
1. In the SQL Editor, copy and paste the contents of `core-features-schema-safe.sql`
2. Click **Run** to create tables only if they don't exist

### Step 2: Get Your Actual IDs (Important!)

Before adding sample data, you need to find the actual UUIDs in your database:

1. In the SQL Editor, run these queries to see existing data:
   ```sql
   -- See existing profiles (operators)
   SELECT id, name, email, role FROM profiles LIMIT 10;

   -- See existing equipment
   SELECT id, asset_tag, type, status FROM equipment LIMIT 10;
   ```

2. Copy 2-3 profile IDs and equipment IDs from the results

### Step 3: Add Sample Data (Optional)

1. Open `core-features-sample-data.sql`
2. Replace all instances of:
   - `REPLACE_WITH_ACTUAL_PROFILE_ID_1` with an actual profile ID
   - `REPLACE_WITH_ACTUAL_PROFILE_ID_2` with another actual profile ID
   - `REPLACE_WITH_ACTUAL_EQUIPMENT_ID_1` with an actual equipment ID
   - `REPLACE_WITH_ACTUAL_EQUIPMENT_ID_2` with another actual equipment ID

3. In the SQL Editor, copy and paste the modified contents of `core-features-sample-data.sql`
4. Click **Run** to insert sample data

### Step 4: Verify

After applying the schema, refresh your app. The three pages should now load properly with data.

## Tables Created

### Driver Behavior
- `driver_behavior_events` - Records of driver behavior incidents

### Fuel Management
- `fuel_logs` - Fuel purchase and consumption records
- `fuel_efficiency_metrics` - Calculated fuel efficiency data

### Maintenance Scheduling
- `maintenance_schedules` - Scheduled maintenance tasks
- `parts_suppliers` - Supplier information
- `parts_inventory` - Parts stock management
- `equipment_parts_mapping` - Which parts are needed for which equipment

## Security

All tables include Row Level Security (RLS) policies that allow:
- Read access to all authenticated users
- Full access (create/update/delete) to Admin and Manager roles

## Next Steps

Once these core features are working, you can apply the additional features from:
- `features-schema-updates.sql` - Advanced features like notifications, incidents, etc.
- `supabase-schema.sql` - Complete schema with all features