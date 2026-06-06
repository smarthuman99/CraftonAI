-- Crafton AI - Production-Grade 5-Table Database Schema
-- Run this SQL in your Supabase SQL Editor to set up a robust, state-preserving, multi-agent synchronized cloud database.

-- 1. Enable UUID Extension (usually enabled by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if they exist to prevent schema mismatch
DROP TABLE IF EXISTS agent_thought_logs CASCADE;
DROP TABLE IF EXISTS agent_logs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS specifications CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- 3. Create Projects Table (replaces old orders table & persists UI config states)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,                                     -- e.g., 'CRAFT-202605-01'
    client_name TEXT NOT NULL,                                     -- e.g., 'Client Design Studio (UK)'
    client_contact TEXT,                                           -- e.g., 'St Albans, UK' (acts as location)
    current_stage INT4 NOT NULL DEFAULT 1 CHECK (current_stage BETWEEN 1 AND 17), -- Maps S01 to S17 dynamically
    
    -- Persistent UI Customization Configurations & States
    selected_fabric TEXT NOT NULL DEFAULT 'FAB-02',                -- Tracks active fabric ID in Material Studio
    selected_leg TEXT NOT NULL DEFAULT 'matte-black',              -- Tracks active leg finish ID
    fabric_compatibility_test TEXT DEFAULT NULL,                   -- Swatch compliance check: 'passed', 'blocked', or NULL
    is_crib5_blocked BOOLEAN NOT NULL DEFAULT FALSE,               -- Tracks whether Crib 5 hardgate is blocking progress
    selected_supplier JSONB DEFAULT NULL,                          -- Persists the JSON of the chosen supplier bid
    split_delivery_active BOOLEAN NOT NULL DEFAULT FALSE,          -- Persists whether mid-route split delivery triggered
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Create Specifications Table (replaces old order_items table & tracks pricing changes)
CREATE TABLE specifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    item_type_cn TEXT NOT NULL,                                    -- e.g., '大堂扶手椅'
    item_type_en TEXT NOT NULL,                                    -- e.g., 'Lobby Armchair'
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    material_cn TEXT,                                              -- e.g., '海军蓝亚麻 (L-4410)'
    material_en TEXT,                                              -- e.g., 'Navy Classic Linen (L-4410)'
    original_unit_price NUMERIC(12, 2) NOT NULL CHECK (original_unit_price >= 0), -- Benchmarked original price
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),    -- Active billing price (updates upon bid award)
    notes_cn TEXT,
    notes_en TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Create Payments Table (NEW! Parameterized Billing Schedule)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    milestone_cn TEXT NOT NULL,                                    -- e.g., '50% 首期定金'
    milestone_en TEXT NOT NULL,                                    -- e.g., '50% Deposit'
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),            -- Payment amount in USD
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Paid', 'Pending')), -- 'Paid' or 'Pending'
    payment_date TEXT NOT NULL DEFAULT 'Pending',                  -- '2026-05-25' or 'Pending'
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. Create Agent Logs Table (High-level human-AI audit trail milestones)
CREATE TABLE agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    operator TEXT NOT NULL,                                        -- e.g., 'OpenClaw', 'Cho', 'Client'
    action_desc_cn TEXT NOT NULL,                                  -- Chinese action description
    action_desc_en TEXT NOT NULL,                                  -- English action description
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. Create Agent Thought Logs Table (NEW! OpenClaw Technical Trace Logger)
CREATE TABLE agent_thought_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    stage_id TEXT NOT NULL,                                        -- e.g., 'S01', 'S02', etc. (maps to stages)
    role TEXT NOT NULL CHECK (role IN ('thought', 'action', 'observation', 'system')), -- log category
    log_text_cn TEXT NOT NULL,                                     -- Chinese log trace text
    log_text_en TEXT NOT NULL,                                     -- English log trace text
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. Enable Realtime on all 5 core tables
-- This is critical for our application's postgres_changes listeners to receive real-time updates.
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table specifications;
alter publication supabase_realtime add table payments;
alter publication supabase_realtime add table agent_logs;
alter publication supabase_realtime add table agent_thought_logs;

-- 9. Add Comment Documentation for DB context
COMMENT ON COLUMN projects.current_stage IS 'Integer index representing S01 to S17 (1-17)';
COMMENT ON TABLE projects IS 'Holds Master Furniture Project Records and configuration state overrides';
COMMENT ON TABLE specifications IS 'Bespoke specifications linked to a furniture project, preserving price changes';
COMMENT ON TABLE payments IS 'Relational billing milestones for payment schedules and strike-through audits';
COMMENT ON TABLE agent_logs IS 'Bilingual high-level milestone audit logs';
COMMENT ON TABLE agent_thought_logs IS 'Bilingual technical execution trace logs for the OpenClaw Thought-Process Console';
