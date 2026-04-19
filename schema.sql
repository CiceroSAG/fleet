-- Parts Inventory Tables
CREATE TABLE IF NOT EXISTS parts_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parts_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    part_number VARCHAR(100) UNIQUE,
    category VARCHAR(100),
    current_stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    unit_price DECIMAL(12,2) DEFAULT 0,
    supplier_id UUID REFERENCES parts_suppliers(id) ON DELETE SET NULL,
    storage_location VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inspections (DVIR) Tables
CREATE TABLE IF NOT EXISTS inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    inspector_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    inspection_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    odometer_reading INTEGER,
    checklist_data JSONB NOT NULL, -- Stores nested { category: { item: status } }
    status VARCHAR(50) NOT NULL, -- 'Pass', 'Fail', 'Warning'
    notes TEXT,
    signature_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Equipment Table (Added QR/NFC field)
-- ALTER TABLE equipment ADD COLUMN qr_code_tag VARCHAR(255) UNIQUE;

-- Maintenance Schedules (Added Assignee)
-- ALTER TABLE maintenance_schedules ADD COLUMN assigned_to_id UUID REFERENCES profiles(id);
-- ALTER TABLE maintenance_schedules ADD COLUMN priority VARCHAR(20) DEFAULT 'medium';

-- Workshop Bays
CREATE TABLE IF NOT EXISTS workshop_bays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'available', -- available, occupied, maintenance
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment Documents
CREATE TABLE IF NOT EXISTS equipment_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- manual, certificate, photo, other
    file_url TEXT NOT NULL,
    expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add columns to equipment
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='qr_code_tag') THEN
        ALTER TABLE equipment ADD COLUMN qr_code_tag VARCHAR(255) UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='nfc_tag') THEN
        ALTER TABLE equipment ADD COLUMN nfc_tag VARCHAR(255) UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='workshop_bay_id') THEN
        ALTER TABLE equipment ADD COLUMN workshop_bay_id UUID REFERENCES workshop_bays(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='workshop_entry_date') THEN
        ALTER TABLE equipment ADD COLUMN workshop_entry_date TIMESTAMPTZ;
    END IF;
END $$;
