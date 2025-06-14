import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';

// Database connection configuration
const connectionConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'ora_development',
  user: process.env.DATABASE_USER || 'air',
  password: process.env.DATABASE_PASSWORD || '',
  // Connection pool settings
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // how long to try to connect before timing out
};

// Use DATABASE_URL if provided, otherwise use individual config
const pool = new Pool(
  process.env.DATABASE_URL 
    ? { connectionString: process.env.DATABASE_URL }
    : connectionConfig
);

// Log connection info (without password)
console.log('🔗 PostgreSQL connection configured:', {
  host: connectionConfig.host,
  port: connectionConfig.port,
  database: connectionConfig.database,
  user: connectionConfig.user,
});

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

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function for transactions
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Conversation functions
export async function saveConversation(
  conversation: Omit<OraConversation, 'id' | 'created_at'>
): Promise<OraConversation> {
  const id = uuidv4();
  
  const query = `
    INSERT INTO ora_conversations (id, workstream_id, message, speaker, metadata)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  
  const result = await pool.query(query, [
    id,
    conversation.workstream_id || null,
    conversation.message,
    conversation.speaker,
    JSON.stringify(conversation.metadata || {})
  ]);
  
  return {
    ...result.rows[0],
    metadata: result.rows[0].metadata || {}
  };
}

export async function getConversationHistory(
  workstream_id?: string,
  limit: number = 50
): Promise<OraConversation[]> {
  const query = workstream_id
    ? 'SELECT * FROM ora_conversations WHERE workstream_id = $1 ORDER BY created_at DESC LIMIT $2'
    : 'SELECT * FROM ora_conversations ORDER BY created_at DESC LIMIT $1';
  
  const params = workstream_id ? [workstream_id, limit] : [limit];
  const result = await pool.query(query, params);
  
  return result.rows.map(row => ({
    ...row,
    metadata: row.metadata || {}
  }));
}

// Constitution functions
export async function saveConstitution(
  constitution: Omit<WorkstreamConstitution, 'id' | 'created_at' | 'updated_at'>,
  client?: PoolClient
): Promise<WorkstreamConstitution> {
  const id = uuidv4();
  
  const query = `
    INSERT INTO workstream_constitutions (id, workstream_id, vision, mission, cadence, okrs, kpis)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  
  const queryClient = client || pool;
  const result = await queryClient.query(query, [
    id,
    constitution.workstream_id,
    constitution.vision,
    constitution.mission,
    constitution.cadence,
    JSON.stringify(constitution.okrs || []),
    JSON.stringify(constitution.kpis || [])
  ]);
  
  return {
    ...result.rows[0],
    okrs: result.rows[0].okrs || [],
    kpis: result.rows[0].kpis || []
  };
}

export async function getConstitution(workstream_id: string): Promise<WorkstreamConstitution | null> {
  const query = 'SELECT * FROM workstream_constitutions WHERE workstream_id = $1';
  const result = await pool.query(query, [workstream_id]);
  
  if (result.rows.length === 0) return null;
  
  return {
    ...result.rows[0],
    okrs: result.rows[0].okrs || [],
    kpis: result.rows[0].kpis || []
  };
}

// Pattern functions
export async function savePattern(
  pattern: Omit<OraPattern, 'id' | 'last_observed'>
): Promise<OraPattern> {
  // Check if pattern already exists
  const existingQuery = `
    SELECT * FROM ora_patterns 
    WHERE pattern_type = $1 AND pattern_content = $2
  `;
  const existing = await pool.query(existingQuery, [
    pattern.pattern_type,
    pattern.pattern_content
  ]);
  
  if (existing.rows.length > 0) {
    // Update occurrence count
    const updateQuery = `
      UPDATE ora_patterns 
      SET occurrence_count = occurrence_count + 1, 
          last_observed = CURRENT_TIMESTAMP 
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [existing.rows[0].id]);
    return {
      ...result.rows[0],
      examples: result.rows[0].examples || []
    };
  }
  
  // Insert new pattern
  const id = uuidv4();
  const insertQuery = `
    INSERT INTO ora_patterns (id, pattern_type, pattern_content, examples, occurrence_count)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  
  const result = await pool.query(insertQuery, [
    id,
    pattern.pattern_type,
    pattern.pattern_content,
    JSON.stringify(pattern.examples || []),
    pattern.occurrence_count || 1
  ]);
  
  return {
    ...result.rows[0],
    examples: result.rows[0].examples || []
  };
}

export async function getPatterns(
  pattern_type?: string,
  limit: number = 10
): Promise<OraPattern[]> {
  const query = pattern_type
    ? 'SELECT * FROM ora_patterns WHERE pattern_type = $1 ORDER BY occurrence_count DESC, last_observed DESC LIMIT $2'
    : 'SELECT * FROM ora_patterns ORDER BY occurrence_count DESC, last_observed DESC LIMIT $1';
  
  const params = pattern_type ? [pattern_type, limit] : [limit];
  const result = await pool.query(query, params);
  
  return result.rows.map(row => ({
    ...row,
    examples: row.examples || []
  }));
}

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection healthy:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Utility function to close database connection pool (for cleanup)
export async function closeDatabase() {
  await pool.end();
  console.log('🔒 Database connection pool closed');
}