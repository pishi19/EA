-- Migration: Create Ora tables for workstream consciousness
-- Date: 2025-06-14
-- Database: PostgreSQL
-- Description: Creates tables for Ora conversations, workstream constitutions, and learning patterns

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: Ora's Conversations
-- Stores the conversation history between users and Ora
CREATE TABLE IF NOT EXISTS ora_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workstream_id UUID,
  message TEXT NOT NULL,
  speaker VARCHAR(10) CHECK (speaker IN ('user', 'ora')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (workstream_id) REFERENCES workstreams (id) ON DELETE CASCADE
);

-- Table 2: Workstream Constitutions
-- Stores the fundamental requirements for each workstream as defined through Ora
CREATE TABLE IF NOT EXISTS workstream_constitutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workstream_id UUID UNIQUE,
  vision TEXT NOT NULL,
  mission TEXT NOT NULL,
  cadence TEXT NOT NULL,
  okrs JSONB DEFAULT '[]',
  kpis JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (workstream_id) REFERENCES workstreams (id) ON DELETE CASCADE,
  CONSTRAINT vision_min_length CHECK (char_length(vision) >= 10),
  CONSTRAINT mission_min_length CHECK (char_length(mission) >= 10),
  CONSTRAINT cadence_min_length CHECK (char_length(cadence) >= 5)
);

-- Table 3: Ora's Learning Patterns
-- Stores patterns that Ora learns to provide better suggestions
CREATE TABLE IF NOT EXISTS ora_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_type VARCHAR(50) NOT NULL,
  pattern_content TEXT NOT NULL,
  examples JSONB DEFAULT '[]',
  occurrence_count INTEGER DEFAULT 1,
  last_observed TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ora_conversations_workstream 
  ON ora_conversations(workstream_id);
CREATE INDEX IF NOT EXISTS idx_ora_conversations_created 
  ON ora_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ora_patterns_type 
  ON ora_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_ora_patterns_occurrence 
  ON ora_patterns(occurrence_count DESC);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at for workstream_constitutions
DROP TRIGGER IF EXISTS update_workstream_constitutions_updated_at ON workstream_constitutions;
CREATE TRIGGER update_workstream_constitutions_updated_at 
  BEFORE UPDATE ON workstream_constitutions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE ora_conversations IS 'Stores all conversations between users and Ora';
COMMENT ON TABLE workstream_constitutions IS 'Stores the fundamental requirements (vision, mission, cadence) for each workstream';
COMMENT ON TABLE ora_patterns IS 'Stores learned patterns to improve Ora suggestions over time';

COMMENT ON COLUMN ora_conversations.speaker IS 'Either "user" or "ora" to identify the speaker';
COMMENT ON COLUMN ora_conversations.metadata IS 'Additional context or data about the conversation';
COMMENT ON COLUMN workstream_constitutions.okrs IS 'Objectives and Key Results in JSONB format';
COMMENT ON COLUMN workstream_constitutions.kpis IS 'Key Performance Indicators as JSONB array';
COMMENT ON COLUMN ora_patterns.pattern_type IS 'Category of pattern (e.g., "vision_template", "cadence_suggestion")';
COMMENT ON COLUMN ora_patterns.examples IS 'Array of example uses of this pattern';