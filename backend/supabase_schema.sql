-- ============================================================
-- COMPLETE SCHEMA — Medical Equipment Maintenance System
-- Run this in Supabase SQL Editor (safe to re-run — uses IF NOT EXISTS)
-- ============================================================

-- ── 1. USERS TABLE ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          VARCHAR(20) NOT NULL DEFAULT 'customer'
                  CHECK (role IN ('customer', 'mechanic')),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. EQUIPMENT TABLE ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS equipment (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_name    VARCHAR(255) NOT NULL,
    brand             VARCHAR(255),
    model_number      VARCHAR(255),
    serial_number     VARCHAR(255) UNIQUE,
    department        VARCHAR(255),
    location          VARCHAR(255),
    purchase_date     DATE,
    warranty_expiry   DATE,
    last_service_date DATE,
    qr_code_value     TEXT,
    customer_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. SERVICE HISTORY TABLE ─────────────────────────────────
CREATE TABLE IF NOT EXISTS service_history (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id     UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    technician_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    service_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    service_type     VARCHAR(255) DEFAULT 'General Service',
    issue_reported   TEXT,
    work_done        TEXT,
    parts_replaced   TEXT,
    status           VARCHAR(50) DEFAULT 'completed'
                     CHECK (status IN ('pending', 'in-progress', 'completed')),
    next_service_due DATE,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. PARTS INVENTORY TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS parts_inventory (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_name     VARCHAR(255) NOT NULL,
    part_number   VARCHAR(255) UNIQUE,
    quantity      INTEGER DEFAULT 0,
    threshold     INTEGER DEFAULT 5,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES (for fast lookups) ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_equipment_customer_id    ON equipment(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_equipment_id     ON service_history(equipment_id);
CREATE INDEX IF NOT EXISTS idx_service_technician_id    ON service_history(technician_id);
CREATE INDEX IF NOT EXISTS idx_users_email              ON users(email);

-- ── DISABLE ROW LEVEL SECURITY (backend uses service role key) ─
ALTER TABLE users          DISABLE ROW LEVEL SECURITY;
ALTER TABLE equipment      DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE parts_inventory DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- IF TABLES ALREADY EXIST — run only the ALTER statements below
-- to add any missing columns without recreating tables
-- ============================================================

ALTER TABLE equipment ADD COLUMN IF NOT EXISTS brand             VARCHAR(255);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS model_number      VARCHAR(255);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS department        VARCHAR(255);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS location          VARCHAR(255);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS purchase_date     DATE;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS warranty_expiry   DATE;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS last_service_date DATE;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS customer_id       UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE equipment ALTER  COLUMN qr_code_value TYPE TEXT;

ALTER TABLE service_history ADD COLUMN IF NOT EXISTS service_type     VARCHAR(255) DEFAULT 'General Service';
ALTER TABLE service_history ADD COLUMN IF NOT EXISTS parts_replaced   TEXT;
ALTER TABLE service_history ADD COLUMN IF NOT EXISTS next_service_due DATE;
