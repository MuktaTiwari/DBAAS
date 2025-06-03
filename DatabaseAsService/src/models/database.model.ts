import { IDatabase, CreateDatabaseDto } from '../interfaces/database.interface';
import { PostgresConfig } from '../config/postgres.config';
import { Pool } from 'pg';

export class DatabaseModel {
  private static instance: DatabaseModel;
  private databases: Record<string, IDatabase> = {};

  private constructor() {}

  public static getInstance(): DatabaseModel {
    if (!DatabaseModel.instance) {
      DatabaseModel.instance = new DatabaseModel();
    }
    return DatabaseModel.instance;
  }

  public async create(database: CreateDatabaseDto): Promise<IDatabase> {
    const timestamp = new Date();
    const newDatabase: IDatabase = {
      ...database,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    // Create the database in PostgreSQL
    const adminPool = new Pool({
      host: database.host,
      port: database.port,
      user: database.username,
      password: database.password,
      database: 'postgres' // Connect to default database to create new one
    });

    try {
      await adminPool.query(`CREATE DATABASE "${database.name}"`);
      this.databases[database.name] = newDatabase;
      return newDatabase;
    } finally {
      await adminPool.end();
    }
  }

  public async findAll(): Promise<IDatabase[]> {
    return Object.values(this.databases);
  }

  public async findOne(name: string): Promise<IDatabase | undefined> {
    return this.databases[name];
  }

  public async delete(name: string): Promise<boolean> {
    const db = this.databases[name];
    if (!db) return false;

    const adminPool = new Pool({
      host: db.host,
      port: db.port,
      user: db.username,
      password: db.password,
      database: 'postgres'
    });

    try {
      // Terminate all connections to the database first
      await adminPool.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = $1
      `, [name]);

      await adminPool.query(`DROP DATABASE "${name}"`);
      delete this.databases[name];
      return true;
    } finally {
      await adminPool.end();
    }
  }

  public async getPool(dbName: string): Promise<Pool> {
    const db = this.databases[dbName];
    if (!db) throw new Error('Database not found');

    return PostgresConfig.getPool({
      host: db.host,
      port: db.port,
      user: db.username,
      password: db.password,
      database: db.name
    });
  }
}