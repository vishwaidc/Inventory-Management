-- ============================================================
-- MIGRATION: Add missing columns to existing tables
-- Run this in Supabase SQL Editor if you already ran the old schema
-- ============================================================

-- Add new columns to equipment table
ALTER TABLE equipment
  ADD COLUMN IF NOT EXISTS brand VARCHAR(255),
  ADD COLUMN IF NOT EXISTS purchase_date DATE,
  ADD COLUMN IF NOT EXISTS location VARCHAR(255),
  ADD COLUMN IF NOT EXISTS last_service_date DATE,
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Ensure qr_code_value is TEXT (not VARCHAR(255)) to hold data URLs
ALTER TABLE equipment ALTER COLUMN qr_code_value TYPE TEXT;

-- Add index for customer lookups
CREATE INDEX IF NOT EXISTS idx_equipment_customer_id ON equipment(customer_id);

-- ============================================================
-- OR: If you haven't run any schema yet, run the FULL schema:
-- (see supabase_schema.sql for the complete setup)
-- ============================================================
