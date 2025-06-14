import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Database path
const DB_PATH = path.resolve(process.cwd(), 'runtime/db/ora.db');

// Type definitions
export interface OraConversation {
  id: string;
  workstream_id?: string;
  message: string;
  speaker: 'user' | 'ora';
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface WorkstreamConstitution {
  id: string;
  workstream_id: string;
  vision: string;
  mission: string;
  cadence: string;
  okrs?: Array<{
    objective: string;
    keyResults: string[];
  }>;
  kpis?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface OraPattern {
  id: string;
  pattern_type: string;
  pattern_content: string;
  examples?: string[];
  occurrence_count?: number;
  last_observed?: string;
}

// Database connection helper
let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
  }
  return db;
}

// Conversation functions
export function saveConversation(conversation: Omit<OraConversation, 'id' | 'created_at'>): OraConversation {
  const db = getDatabase();
  const id = uuidv4();
  
  const stmt = db.prepare(`
    INSERT INTO ora_conversations (id, workstream_id, message, speaker, metadata)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    conversation.workstream_id || null,
    conversation.message,
    conversation.speaker,
    JSON.stringify(conversation.metadata || {})
  );
  
  return { ...conversation, id };
}

export function getConversationHistory(workstream_id?: string, limit: number = 50): OraConversation[] {
  const db = getDatabase();
  
  const query = workstream_id
    ? 'SELECT * FROM ora_conversations WHERE workstream_id = ? ORDER BY created_at DESC LIMIT ?'
    : 'SELECT * FROM ora_conversations ORDER BY created_at DESC LIMIT ?';
  
  const stmt = db.prepare(query);
  const rows = workstream_id ? stmt.all(workstream_id, limit) : stmt.all(limit);
  
  return rows.map((row: any) => ({
    ...row,
    metadata: JSON.parse(row.metadata || '{}')
  }));
}

// Constitution functions
export function saveConstitution(constitution: Omit<WorkstreamConstitution, 'id' | 'created_at' | 'updated_at'>): WorkstreamConstitution {
  const db = getDatabase();
  const id = uuidv4();
  
  const stmt = db.prepare(`
    INSERT INTO workstream_constitutions (id, workstream_id, vision, mission, cadence, okrs, kpis)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    constitution.workstream_id,
    constitution.vision,
    constitution.mission,
    constitution.cadence,
    JSON.stringify(constitution.okrs || []),
    JSON.stringify(constitution.kpis || [])
  );
  
  return { ...constitution, id };
}

export function getConstitution(workstream_id: string): WorkstreamConstitution | null {
  const db = getDatabase();
  
  const stmt = db.prepare('SELECT * FROM workstream_constitutions WHERE workstream_id = ?');
  const row = stmt.get(workstream_id);
  
  if (!row) return null;
  
  return {
    ...(row as any),
    okrs: JSON.parse((row as any).okrs || '[]'),
    kpis: JSON.parse((row as any).kpis || '[]')
  };
}

// Pattern functions
export function savePattern(pattern: Omit<OraPattern, 'id' | 'last_observed'>): OraPattern {
  const db = getDatabase();
  const id = uuidv4();
  
  // Check if pattern already exists
  const existing = db.prepare('SELECT * FROM ora_patterns WHERE pattern_type = ? AND pattern_content = ?')
    .get(pattern.pattern_type, pattern.pattern_content);
  
  if (existing) {
    // Update occurrence count
    db.prepare('UPDATE ora_patterns SET occurrence_count = occurrence_count + 1, last_observed = CURRENT_TIMESTAMP WHERE id = ?')
      .run((existing as any).id);
    return existing as OraPattern;
  }
  
  // Insert new pattern
  const stmt = db.prepare(`
    INSERT INTO ora_patterns (id, pattern_type, pattern_content, examples, occurrence_count)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    pattern.pattern_type,
    pattern.pattern_content,
    JSON.stringify(pattern.examples || []),
    pattern.occurrence_count || 1
  );
  
  return { ...pattern, id };
}

export function getPatterns(pattern_type?: string, limit: number = 10): OraPattern[] {
  const db = getDatabase();
  
  const query = pattern_type
    ? 'SELECT * FROM ora_patterns WHERE pattern_type = ? ORDER BY occurrence_count DESC, last_observed DESC LIMIT ?'
    : 'SELECT * FROM ora_patterns ORDER BY occurrence_count DESC, last_observed DESC LIMIT ?';
  
  const stmt = db.prepare(query);
  const rows = pattern_type ? stmt.all(pattern_type, limit) : stmt.all(limit);
  
  return rows.map((row: any) => ({
    ...row,
    examples: JSON.parse(row.examples || '[]')
  }));
}

// Utility function to close database connection (for cleanup)
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}