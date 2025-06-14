import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// SQLite database path - using the existing ora.db
const DB_PATH = path.resolve(__dirname, '../../../../runtime/db/ora.db');
const MIGRATIONS_DIR = __dirname;

export function runMigrations() {
  console.log('🔄 Running Ora database migrations...');
  
  try {
    // Open database connection
    const db = new Database(DB_PATH);
    
    // Create migrations tracking table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT UNIQUE NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get list of migration files
    const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    // Get already executed migrations
    const executedMigrations = db.prepare('SELECT filename FROM migrations')
      .all()
      .map((row: any) => row.filename);
    
    // Run pending migrations
    let migrationsRun = 0;
    for (const file of migrationFiles) {
      if (!executedMigrations.includes(file)) {
        console.log(`📝 Running migration: ${file}`);
        
        const migrationSQL = fs.readFileSync(
          path.join(MIGRATIONS_DIR, file), 
          'utf-8'
        );
        
        // Run migration in a transaction
        db.transaction(() => {
          db.exec(migrationSQL);
          db.prepare('INSERT INTO migrations (filename) VALUES (?)').run(file);
        })();
        
        migrationsRun++;
      }
    }
    
    if (migrationsRun === 0) {
      console.log('✅ All migrations already up to date');
    } else {
      console.log(`✅ Successfully ran ${migrationsRun} migration(s)`);
    }
    
    // Close database
    db.close();
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}