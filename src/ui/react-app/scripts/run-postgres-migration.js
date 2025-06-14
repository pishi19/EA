const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function runMigration() {
  console.log('🚀 Running PostgreSQL migration for Ora...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://air@localhost:5432/ora_development'
  });

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL database\n');
    
    // Check if workstreams table exists (required dependency)
    const workstreamsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'workstreams'
      );
    `);
    
    if (!workstreamsCheck.rows[0].exists) {
      console.log('⚠️  WARNING: workstreams table does not exist.');
      console.log('Creating a temporary workstreams table for development...\n');
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS workstreams (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log('✅ Created temporary workstreams table\n');
    }
    
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', '001_create_ora_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📝 Running migration: 001_create_ora_tables.sql');
    
    // Run migration
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Verify tables were created
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (
        table_name LIKE 'ora_%' 
        OR table_name = 'workstream_constitutions'
      )
      ORDER BY table_name;
    `);
    
    console.log('📊 Created tables:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Show indexes
    const indexes = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_ora_%'
      ORDER BY indexname;
    `);
    
    console.log('\n🔍 Created indexes:');
    indexes.rows.forEach(row => {
      console.log(`   - ${row.indexname}`);
    });
    
    console.log('\n✨ Ora database setup complete!');
    console.log('\n📌 Next steps:');
    console.log('   1. Ensure PostgreSQL is running on localhost:5432');
    console.log('   2. Database name: ora_development');
    console.log('   3. Ready to build API endpoints!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n💡 Make sure PostgreSQL is running and accessible at:');
    console.error('   postgresql://postgres:postgres@localhost:5432/ora_development');
    console.error('\n   You can start PostgreSQL with:');
    console.error('   - macOS: brew services start postgresql');
    console.error('   - Docker: docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration();