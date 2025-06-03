import { Pool } from 'pg';
import { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD } from '@/config';

// Main pool for the control database
export const mainPool = new Pool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: 'postgres', // Connect to default postgres database initially
});

// Cache for database-specific pools
const databasePools: Record<string, Pool> = {}; 

export function getPoolForDatabase(dbName: string): Pool {
  if (!databasePools[dbName]) {
    databasePools[dbName] = new Pool({
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      database: dbName,
    });
  }
  return databasePools[dbName];
}

// Initialize the main database tables
export async function initializeDatabaseTables() {
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
}