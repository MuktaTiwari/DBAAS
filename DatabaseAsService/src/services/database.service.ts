import { Pool } from 'pg';
import fs from 'fs';
import csv from 'csv-parser';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseAttributes, databaseCollectionModel } from '@/models/databaseCollection.model';
import multer from 'multer';
import { mainPool } from '@/utils/pool.utils';
import { DB } from '@/databases';
import { IDatabase } from '@/interfaces/database.interface';

export class DatabaseService {
  private databaseCollectionModel = DB.DatabaseCollectionModel;
  private generateApiKey(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  private buildColumnDefinition(column: any): string {
    let definition = `${column.name} ${column.type}`;
    if (column.isPrimary) definition += ' PRIMARY KEY';
    if (column.isNotNull) definition += ' NOT NULL';
    if (column.isUnique) definition += ' UNIQUE';
    if (column.defaultValue) definition += ` DEFAULT ${column.defaultValue}`;
    if (column.foreignKey) {
      definition += ` REFERENCES ${column.foreignKey.table}(${column.foreignKey.column})`;
    }
    return definition;
  }

  private async getTempPool(database: string = 'postgres'): Promise<Pool> {
    return new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT),
    });
  }

  public async getTableCount(dbName: string): Promise<number> {
    let dbPool: Pool | null = null;
    try {
      dbPool = await this.getTempPool(dbName);
      const result = await dbPool.query(`
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error(`Error fetching table count for database ${dbName}:`, error);
      throw new Error('Failed to fetch table count');
    } finally {
      if (dbPool) await dbPool.end();
    }
  }

  public async createDatabase(databaseName: string, userId: string, orgId: string): Promise<{ success: boolean; message: string }> {
  if (!databaseName) {
    throw new Error('Database name is required');
  }

  let tempPool: Pool | null = null;
  try {
    const databasePayload = {
      dbName: databaseName,
      userId,
      orgId,
    };
    await this.databaseCollectionModel.create(databasePayload);

    tempPool = await this.getTempPool();
    // Use double quotes to preserve case sensitivity
    await tempPool.query(`CREATE DATABASE "${databaseName}"`);

    return {
      success: true,
      message: `Database '${databaseName}' created successfully`,
    };
  } catch (error) {
    console.error('Error creating database:', error);

    if (tempPool) {
      try {
        await tempPool.query(
          `SELECT pg_terminate_backend(pg_stat_activity.pid)
           FROM pg_stat_activity
           WHERE pg_stat_activity.datname = $1
           AND pid <> pg_backend_pid();`,
          [databaseName],
        );
        // Use double quotes for drop as well
        await tempPool.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
      } catch (dropError) {
        console.error('Error dropping database:', dropError);
      }
    }

    const message = error.message.includes('already exists') ? 'Database name already exists' : 'Failed to create database';
    throw new Error(message);
  } finally {
    if (tempPool) await tempPool.end();
  }
}

  public async getDatabases(userId: string, orgId: string): Promise<{ success: boolean; data: any[]; count: number }> {
    try {
      const databaseData = await this.databaseCollectionModel.findAll({ where: { orgId, userId }, raw: true });
      const totalCount = await this.databaseCollectionModel.count({ where: { userId, orgId } });

      // Fetch table count for each database
      const enrichedData = await Promise.all(databaseData.map(async (db) => {
        try {
          const tableCount = await this.getTableCount(db.dbName);
          return { ...db, tableCount };
        } catch (error) {
          console.error(`Failed to fetch table count for ${db.dbName}:`, error);
          return { ...db, tableCount: 0 }; // Fallback to 0 if table count fetch fails
        }
      }));

      return {
        success: true,
        data: enrichedData,
        count: totalCount,
      };
    } catch (error) {
      console.error('Error fetching databases:', error);
      throw new Error('Failed to fetch databases');
    }
  }

  public async getDatabasesByDbId(dbId: string, dbName: string): Promise<DatabaseAttributes> {
    try {
      const databaseData = await this.databaseCollectionModel.findOne({ where: { dbId, dbName }, raw: true });
      if (!databaseData) {
        throw new Error('Database not found');
      }
      return databaseData;
    } catch (error) {
      console.error('Error fetching database by dbId:', error);
      throw new Error('Failed to fetch database');
    }
  }

  public async deleteDatabase(dbName: string, userId: string, orgId: string): Promise<{ success: boolean; message: string }> {
    let tempPool: Pool | null = null;
    try {
      // Check if database exists in the collection
      const databaseData = await this.databaseCollectionModel.findOne({ where: { dbName, userId, orgId } });
      if (!databaseData) {
        throw new Error('Database not found or you do not have permission to delete it');
      }

      // Connect to the default postgres database
      tempPool = await this.getTempPool();
      
      // Terminate all active connections to the database
      await tempPool.query(
        `SELECT pg_terminate_backend(pg_stat_activity.pid)
         FROM pg_stat_activity
         WHERE pg_stat_activity.datname = $1
         AND pid <> pg_backend_pid();`,
        [dbName]
      );

      // Drop the database
      await tempPool.query(`DROP DATABASE IF EXISTS "${dbName}"`);

      // Delete the database record from the collection
      await this.databaseCollectionModel.destroy({ where: { dbName, userId, orgId } });

      return {
        success: true,
        message: `Database '${dbName}' deleted successfully`,
      };
    } catch (error) {
      console.error('Error deleting database:', error);
      throw new Error(error.message.includes('does not exist') ? 'Database does not exist' : 'Failed to delete database');
    } finally {
      if (tempPool) await tempPool.end();
    }
  }

  public async createTable(
    dbName: string,
    tableName: string,
    columns?: any[],
    csvFile?: Express.Multer.File,
  ): Promise<{ success: boolean; message: string }> {
    if (!dbName || !tableName) {
      throw new Error('Database name and table name are required');
    }

    let dbPool: Pool | null = null;
    try {
      dbPool = await this.getTempPool(dbName);
      let tableColumns: string[] = [];

      if (csvFile) {
        const columnsFromCsv = await new Promise<string[]>((resolve, reject) => {
          const columns: string[] = [];
          fs.createReadStream(csvFile.path)
            .pipe(csv())
            .on('headers', (headers: string[]) => {
              headers.forEach(header => {
                columns.push(`${header} TEXT`);
              });
              resolve(columns);
            })
            .on('error', reject);
        });
        tableColumns = columnsFromCsv;
      } else if (columns && Array.isArray(columns)) {
        tableColumns = columns.map(this.buildColumnDefinition);
      } else {
        throw new Error('Either columns or CSV file must be provided');
      }

      await dbPool.query(`CREATE TABLE ${tableName} (${tableColumns.join(', ')})`);

      return {
        success: true,
        message: `Table '${tableName}' created successfully in database '${dbName}'`,
      };
    } catch (error: any) {
      console.error('Error creating table:', error);
      throw new Error(error.message.includes('already exists') ? 'Table already exists' : error.message);
    } finally {
      if (dbPool) await dbPool.end();
      if (csvFile?.path) {
        try {
          fs.unlinkSync(csvFile.path);
        } catch (err) {
          console.error('Error deleting CSV file:', err);
        }
      }
    }
  }
}