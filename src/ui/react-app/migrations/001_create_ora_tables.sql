-- Migration: Create Ora tables for workstream consciousness
-- Date: 2025-06-14
-- Description: Creates tables for Ora conversations, workstream constitutions, and learning patterns

-- Table 1: Ora's Conversations
-- Stores the conversation history between users and Ora
CREATE TABLE IF NOT EXISTS ora_conversations (
  id TEXT PRIMARY KEY,
  workstream_id TEXT,
  message TEXT NOT NULL,
  speaker TEXT CHECK (speaker IN ('user', 'ora')),
  metadata TEXT DEFAULT '{}', -- JSON stored as text for SQLite
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workstream_id) REFERENCES workstreams (id)
);

-- Table 2: Workstream Constitutions
-- Stores the fundamental requirements for each workstream as defined through Ora
CREATE TABLE IF NOT EXISTS workstream_constitutions (
  id TEXT PRIMARY KEY,
  workstream_id TEXT UNIQUE,
  vision TEXT NOT NULL,
  mission TEXT NOT NULL,
  cadence TEXT NOT NULL,
  okrs TEXT DEFAULT '[]', -- JSON array stored as text
  kpis TEXT DEFAULT '[]', -- JSON array stored as text
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workstream_id) REFERENCES workstreams (id),
  CHECK (length(vision) >= 10),
  CHECK (length(mission) >= 10),
  CHECK (length(cadence) >= 5)
);

-- Table 3: Ora's Learning Patterns
-- Stores patterns that Ora learns to provide better suggestions
CREATE TABLE IF NOT EXISTS ora_patterns (
  id TEXT PRIMARY KEY,
  pattern_type TEXT NOT NULL,
  pattern_content TEXT NOT NULL,
  examples TEXT DEFAULT '[]', -- JSON array stored as text
  occurrence_count INTEGER DEFAULT 1,
  last_observed DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ora_conversations_workstream 
  ON ora_conversations(workstream_id);
CREATE INDEX IF NOT EXISTS idx_ora_conversations_created 
  ON ora_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ora_patterns_type 
  ON ora_patterns(pattern_type);

-- Trigger to update the updated_at timestamp for workstream_constitutions
CREATE TRIGGER IF NOT EXISTS update_workstream_constitutions_timestamp 
  AFTER UPDATE ON workstream_constitutions
  FOR EACH ROW
  WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE workstream_constitutions 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.id;
END;