-- SQLite Schema for FilaExpress Queue Management System

CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    badge TEXT,
    color_accent TEXT,
    priority_weight INTEGER DEFAULT 1,
    target_wait_minutes INTEGER DEFAULT 20,
    icon_name TEXT DEFAULT 'users'
);

CREATE TABLE IF NOT EXISTS counters (
    id TEXT PRIMARY KEY,
    number INTEGER NOT NULL,
    name TEXT NOT NULL,
    room TEXT,
    attendant_name TEXT NOT NULL,
    status TEXT DEFAULT 'available', -- 'available', 'busy', 'paused', 'offline'
    current_ticket_id TEXT,
    allowed_categories TEXT DEFAULT '["SP","SG","SE","SC"]'
);

CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    number INTEGER NOT NULL,
    display_number TEXT NOT NULL,
    category_code TEXT NOT NULL,
    category_name TEXT NOT NULL,
    customer_name TEXT,
    customer_doc TEXT,
    priority_type TEXT NOT NULL, -- 'preferential', 'general', 'express', 'commercial'
    status TEXT DEFAULT 'waiting', -- 'waiting', 'called', 'in_service', 'completed', 'no_show', 'cancelled'
    created_at INTEGER NOT NULL,
    called_at INTEGER,
    service_started_at INTEGER,
    completed_at INTEGER,
    counter_id TEXT,
    counter_name TEXT,
    attendant_name TEXT,
    call_count INTEGER DEFAULT 0,
    notes TEXT,
    FOREIGN KEY(category_code) REFERENCES categories(code),
    FOREIGN KEY(counter_id) REFERENCES counters(id)
);

CREATE TABLE IF NOT EXISTS calls (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL,
    display_number TEXT NOT NULL,
    category_code TEXT NOT NULL,
    category_name TEXT NOT NULL,
    customer_name TEXT,
    counter_name TEXT NOT NULL,
    room TEXT,
    timestamp INTEGER NOT NULL,
    recalled INTEGER DEFAULT 0,
    FOREIGN KEY(ticket_id) REFERENCES tickets(id)
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_calls_timestamp ON calls(timestamp DESC);
