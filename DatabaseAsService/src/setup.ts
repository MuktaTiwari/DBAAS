import { mainPool } from './utils/pool.utils';

async function initializeDatabase() {
  try {
    // Create databases table if not exists
    await mainPool.query(`
      CREATE TABLE IF NOT EXISTS databases (
        db_id VARCHAR(36) PRIMARY KEY,
        db_name VARCHAR(255) NOT NULL UNIQUE,
        user_id VARCHAR(36) NOT NULL,
        api_key VARCHAR(36) NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
      )
    `);

    // Create tables table if not exists
    await mainPool.query(`
      CREATE TABLE IF NOT EXISTS tables (
        table_id VARCHAR(36) PRIMARY KEY,
        db_name VARCHAR(255) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        table_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        UNIQUE(db_name, table_name)
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database tables:', error);
    process.exit(1);
  }
}

initializeDatabase();