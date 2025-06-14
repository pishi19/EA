#!/usr/bin/env node

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Test the Ora migration locally
async function testMigration() {
  console.log('🧪 Testing Ora database migration...\n');
  
  const dbPath = path.resolve(process.cwd(), 'runtime/db/ora.db');
  const migrationPath = path.resolve(process.cwd(), 'src/ui/react-app/migrations/001_create_ora_tables.sql');
  
  try {
    // Check if database exists
    if (!fs.existsSync(dbPath)) {
      console.log('❌ Database not found at:', dbPath);
      console.log('Please ensure the database exists before running migrations.');
      return;
    }
    
    // Read migration file
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log('📄 Migration file loaded successfully');
    
    // Connect to database
    const db = new Database(dbPath);
    console.log('🔗 Connected to database');
    
    // Run migration
    db.exec(migrationSQL);
    console.log('✅ Migration executed successfully');
    
    // Verify tables were created
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name LIKE 'ora_%' OR name = 'workstream_constitutions'
    `).all();
    
    console.log('\n📊 Created tables:');
    tables.forEach((table: any) => {
      console.log(`   - ${table.name}`);
      
      // Get column info
      const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
      columns.forEach((col: any) => {
        console.log(`     • ${col.name} (${col.type})`);
      });
    });
    
    // Check indexes
    const indexes = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='index' 
      AND name LIKE 'idx_ora_%'
    `).all();
    
    console.log('\n🔍 Created indexes:');
    indexes.forEach((index: any) => {
      console.log(`   - ${index.name}`);
    });
    
    db.close();
    console.log('\n✨ Migration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration test failed:', error);
  }
}

// Run the test
testMigration();