import { Pool } from 'pg';
import { ITable, IColumn, ITableResponse, ITableError } from '../interfaces/table.interface';
import fs from 'fs';
import csv from 'csv-parser';
import { DB_HOST, DB_PASSWORD, DB_PORT, DB_USER } from '@/config';
import { createSequelizeInstance, DB } from '@/databases';
import { DataTypes, Sequelize } from 'sequelize';
import { error } from 'console';
import csvParser from 'csv-parser';
import { DatabaseService } from './database.service';


export class TableService {
  private tableModel = DB.TableModel;
  private databaseCollectionModel = DB.DatabaseCollectionModel;
  private databaseService : DatabaseService;
  
 constructor() {
    this.databaseService = new DatabaseService();
  }
  private async getTempPool(database: string): Promise<Pool> {
    return new Pool({
      user: DB_USER,
      host: DB_HOST,
      database,
      password: DB_PASSWORD,
      port: Number(DB_PORT),
    });
  }

  public async createTable(
    orgId: string,
    dbId: string,
    dbName: string,
    tableName: string,
    userId: string,
    columns?: string,
    csvFile?: Express.Multer.File,
  ): Promise<ITable> {
    try {

      if (csvFile) {
        return await this.createTableFromCSV(orgId, dbId, dbName, tableName, userId, csvFile);
      }

       const tableCount = await this.databaseService.getTableCount(dbName);
    const MAX_TABLES_PER_DB = 3; // Set your limit here
    
    if (tableCount >= MAX_TABLES_PER_DB) {
      throw new Error(`Table limit reached (max ${MAX_TABLES_PER_DB} tables per database). Please upgrade to create more tables.`);
    }


      const mapDataType = type => {
        const map = {
          STRING: DataTypes.STRING,
          INTEGER: DataTypes.INTEGER,
          BOOLEAN: DataTypes.BOOLEAN,
          UUID: DataTypes.UUID,
          DATE: DataTypes.DATE,
          TEXT: DataTypes.TEXT,
          FLOAT: DataTypes.FLOAT,
          DOUBLE: DataTypes.DOUBLE,
          BIGINT: DataTypes.BIGINT,
        };
        return map[type.toUpperCase()];
      };
      const sequelize = await createSequelizeInstance(dbName);
      const schema = JSON.parse(columns);

      const schemaStructure = {};

      const foreignKeyConstraints: Array<{
        columnName: string;
        referencedTable: string;
        referencedColumn: string;
      }> = [];
      for (const field of schema) {
        schemaStructure[field.name] = {
          type: mapDataType(field.type),
          allowNull: field.isNullable ?? true,
          unique: field.isUnique ?? false,
          primaryKey: field.isPrimary ?? false,
          defaultValue: field.defaultValue || undefined,
        };
        if (field.isForeignKey && field.foreignKeyTable && field.foreignKeyColumn) {
          foreignKeyConstraints.push({
            columnName: field.name,
            referencedTable: field.foreignKeyTable,
            referencedColumn: field.foreignKeyColumn
          });
        }
      }


      const DynamicModel = sequelize.define(tableName, schemaStructure, {
        freezeTableName: true,
      });
      await sequelize.authenticate();
      await DynamicModel.sync({ force: false });
        for (const constraint of foreignKeyConstraints) {
      await sequelize.query(`
        ALTER TABLE "${tableName}"
        ADD CONSTRAINT "fk_${tableName}_${constraint.columnName}"
        FOREIGN KEY ("${constraint.columnName}")
        REFERENCES "${constraint.referencedTable}" ("${constraint.referencedColumn}")
      `);
    }

      console.log(`Table '${tableName}' created successfully in DB '${dbName}'`);

      let tablePayload = {
        orgId,
        dbId,
        dbName,
        tableName,
        userId,
        schema,
      };
      const createTableMetaData = await this.tableModel.create(tablePayload);
      return createTableMetaData;
    } catch (error) {
      throw error;
    }
  }

  public async createTableFromCSV(
    orgId: string,
    dbId: string,
    dbName: string,
    tableName: string,
    userId: string,
    csvFile: Express.Multer.File,
  ): Promise<ITable> {
    try {

      const tableCount = await this.databaseService.getTableCount(dbName);
    const MAX_TABLES_PER_DB = 3; // Set your limit here
    
    if (tableCount >= MAX_TABLES_PER_DB) {
      throw new Error(`Table limit reached (max ${MAX_TABLES_PER_DB} tables per database). Please upgrade to create more tables.`);
    }
      const sequelize = await createSequelizeInstance(dbName);
      const schemaStructure = {};
      const headers: string[] = [];

      // Step 1: Extract headers
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(csvFile.path)
          .pipe(csvParser())
          .on('headers', (parsedHeaders) => {
            parsedHeaders.forEach(header => {
              const cleanHeader = header.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
              headers.push(cleanHeader);
              schemaStructure[cleanHeader] = {
                type: DataTypes.TEXT,
                allowNull: true,
              };
            });
            resolve();
          })
          .on('error', reject);
      });

      // Step 2: Define Sequelize model
      const DynamicModel = sequelize.define(tableName, schemaStructure, {
        freezeTableName: true,
      });

      await sequelize.authenticate();
      await DynamicModel.sync({ force: false });

      // Step 3: Insert CSV rows into the table
      await new Promise<void>((resolve, reject) => {
        const rowsToInsert: Record<string, any>[] = [];

        fs.createReadStream(csvFile.path)
          .pipe(csvParser())
          .on('data', (row) => {
            const cleanedRow = {};
            headers.forEach(originalHeader => {
              const rawValue = row[originalHeader];
              const key = originalHeader.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
              cleanedRow[key] = rawValue;
            });
            rowsToInsert.push(cleanedRow);
          })
          .on('end', async () => {
            if (rowsToInsert.length > 0) {
              await DynamicModel.bulkCreate(rowsToInsert);
            }
            resolve();
          })
          .on('error', reject);
      });

      // Step 4: Save schema metadata
      const schemaMeta = headers.map(header => ({
        name: header,
        type: 'TEXT',
        isNullable: true,
        isUnique: false,
        isPrimary: false,
      }));

      const tablePayload = {
        orgId,
        dbId,
        dbName,
        tableName,
        userId,
        schema: schemaMeta,
      };

      const tableMeta = await this.tableModel.create(tablePayload);

      fs.unlinkSync(csvFile.path); // Clean up the uploaded CSV file

      return tableMeta;

    } catch (err) {
      throw err;
    }
  }



  public async getTables(dbId: string, orgId: string): Promise<Array<ITable>> {
    const tableData = await this.tableModel.findAll({ where: { dbId, orgId }, raw: true });
    return tableData;
  }

  //   public async createTableFromCSV(
  //   orgId: string,
  //   dbId: string,
  //   dbName: string,
  //   tableName: string,
  //   userId: string,
  //   csvFile: Express.Multer.File
  // ): Promise<ITable> {
  //   try {
  //     const sequelize = await createSequelizeInstance(dbName);

  //     // Read CSV file and extract headers
  //     const headers = await new Promise<string[]>((resolve, reject) => {
  //       const results: string[] = [];
  //       fs.createReadStream(csvFile.path)
  //         .pipe(csv())
  //         .on('headers', (headers) => {
  //           resolve(headers);
  //         })
  //         .on('error', reject);
  //     });

  //     // Create schema structure from CSV headers
  //     const schemaStructure = {};
  //     const schemaColumns: IColumn[] = [];

  //     headers.forEach(header => {
  //       const cleanHeader = header.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  //       schemaStructure[cleanHeader] = {
  //         type: DataTypes.STRING,
  //         allowNull: true
  //       };
  //       schemaColumns.push({
  //         name: cleanHeader,
  //         type: 'STRING',
  //         isNullable: true,
  //         isUnique: false,
  //         isPrimaryKey: false
  //       });
  //     });

  //     // Create the table
  //     const DynamicModel = sequelize.define(tableName, schemaStructure, {
  //       freezeTableName: true,
  //     });
  //     await DynamicModel.sync({ force: false });

  //     // Create table metadata
  //     const tablePayload = {
  //       orgId,
  //       dbId,
  //       dbName,
  //       tableName,
  //       userId,
  //       schema: schemaColumns,
  //       isPyramidDocument: false
  //     };

  //     const createTableMetaData = await this.tableModel.create(tablePayload);

  //     // Delete the uploaded file after processing
  //     fs.unlinkSync(csvFile.path);

  //     return createTableMetaData;
  //   } catch (error) {
  //     // Clean up the file if error occurs
  //     if (csvFile?.path && fs.existsSync(csvFile.path)) {
  //       fs.unlinkSync(csvFile.path);
  //     }
  //     throw error;
  //   }
  // }

  public async getTableSchema(dbName: string, tableName: string): Promise<ITableResponse | ITableError> {
    try {
      const sequelize = await createSequelizeInstance(dbName);
      const queryInterface = sequelize.getQueryInterface();
      const tableDescription = await queryInterface.describeTable(tableName);

      if (!tableDescription) {
        return {
          error: 'Not found',
          details: `Table '${tableName}' not found in database '${dbName}'`,
        };
      }

      return {
        message: `Schema for table '${tableName}' retrieved successfully`,
        schema: tableDescription,
      };
    } catch (error) {
      throw new Error(`Failed to fetch table schema: ${error.message}`);
    }
  }

  public async updateTableSchema(dbName: string, tableName: string, schema: IColumn[]): Promise<ITableResponse | ITableError> {
    try {
      const sequelize = await createSequelizeInstance(dbName);
      const queryInterface = sequelize.getQueryInterface();

      const currentSchema = await queryInterface.describeTable(tableName);

      if (!currentSchema) {
        return {
          error: 'Not found',
          details: `Table '${tableName}' not found in database '${dbName}'`,
        };
      }

      const mapDataType = type => {
        const map = {
          STRING: DataTypes.STRING,
          INTEGER: DataTypes.INTEGER,
          BOOLEAN: DataTypes.BOOLEAN,
          UUID: DataTypes.UUID,
          DATE: DataTypes.DATE,
          TEXT: DataTypes.TEXT,
          FLOAT: DataTypes.FLOAT,
          DOUBLE: DataTypes.DOUBLE,
          BIGINT: DataTypes.BIGINT,
        };
        return map[type.toUpperCase()];
      };

      for (const field of schema) {
        if (!currentSchema[field.name]) {
          await queryInterface.addColumn(tableName, field.name, {
            type: mapDataType(field.type),
            allowNull: field.isNullable ?? true,
            unique: field.isUnique ?? false,
            primaryKey: field.PrimaryKey ?? false,
            defaultValue: field.defaultValue || undefined,
          });
        } else {
          await queryInterface.changeColumn(tableName, field.name, {
            type: mapDataType(field.type),
            allowNull: field.isNullable ?? true,
            unique: field.isUnique ?? false,
            defaultValue: field.defaultValue || undefined,
          });
        }
      }
      if (!Array.isArray(schema)) {
        throw new Error("schema is not an array");
      }

      await this.tableModel.update(
        { schema },
        { where: { dbName, tableName } }
      );

      return {
        message: `Schema for table '${tableName}' updated successfully`,
      };
    } catch (error) {
      throw new Error(`Failed to update table schema: ${error.message}`);
    }
  }

  // public async updateTableSchema(
  //   sequelize: Sequelize,
  //   tableName: string,
  //   newColumns: IColumn[],
  //   existingColumns: any[]
  // ): Promise<void> {
  //   const transaction = await sequelize.transaction();

  //   try {
  //     // 1. Handle new columns
  //     const columnsToAdd = newColumns.filter(newCol => 
  //       !existingColumns.some(existing => existing.column_name === newCol.name)
  //     );

  //     // 2. Handle modified columns
  //     const columnsToModify = newColumns.filter(newCol => {
  //       const existing = existingColumns.find(e => e.column_name === newCol.name);
  //       return existing && (
  //         this.shouldModifyColumnType(existing.data_type, newCol.type) ||
  //         existing.is_nullable !== (newCol.isNullable ? 'YES' : 'NO')
  //       );
  //     });

  //     // 3. Execute changes
  //     for (const col of columnsToAdd) {
  //       await sequelize.query(
  //         `ALTER TABLE "${tableName}" ADD COLUMN "${col.name}" ${col.type} ${col.isNullable ? '' : 'NOT NULL'}`,
  //         { transaction }
  //       );
  //     }

  //     // Commit transaction
  //     await transaction.commit();
  //   } catch (error) {
  //     await transaction.rollback();
  //     throw error;
  //   }
  // }

  public async deleteTable(dbId: string, tableName: string, orgId: string, dbName: string): Promise<ITableResponse | ITableError> {
    let dbPool: Pool | null = null;
    try {
      // Find the table metadata
      const table = await this.tableModel.findOne({
        where: { dbId, tableName, orgId },
      });

      if (!table) {
        return {
          error: 'Not found',
          details: `Table '${tableName}' not found in database with ID '${dbId}'`,
        };
      }

      // Create a connection to the specific database
      dbPool = await this.getTempPool(dbName);

      // Drop the table from the PostgreSQL database
      await dbPool.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);

      // Delete the table metadata from TableModel
      await table.destroy();

      return {
        message: `Table '${tableName}' deleted successfully`,
      };
    } catch (error) {
      console.error(`Error deleting table '${tableName}':`, error);
      throw new Error(`: ${error.message}`);
    } finally {
      if (dbPool) {
        await dbPool.end();
      }
    }
  }
  public async viewTableData(dbName: string, tableName: string, userId: string, mainPool: Pool): Promise<any> {
    let dbPool = null;
    let client = null;

    try {
      const dbResult = await this.databaseCollectionModel.findOne({
        where: {
          dbName: dbName,
          userId: userId,
        },
        raw: true,
      })

      if (dbResult.dbId = null) {
        throw new Error('Database not found or access denied');
      }


      dbPool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: dbName,
        password: process.env.DB_PASSWORD || 'postgres',
        port: parseInt(process.env.DB_PORT || '5432', 10),
      });

      const isValidTableName = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName);
      if (!isValidTableName) {
        throw new Error('Invalid table name');
      }

      const dataResult = await dbPool.query(`SELECT * FROM ${tableName}`);
      return dataResult.rows;

    }
    catch (error) {
      throw error;
    }
    finally {
      if (dbPool) await dbPool.end().catch(console.error);
      if (client) client.release();
    }
  }

  public async viewTableColumns(dbName: string, tableName: string, userId: string, mainPool: Pool): Promise<any> {
    let dbPool = null;
    let client = null;

    try {
      // Verify user access
      // client = await mainPool.connect();
      // const dbResult = await client.query(
      //   'SELECT dbId FROM databases_collection WHERE dbName = $1 AND userId = $2',
      //   [dbName, userId]
      // );

      const dbResult = await this.databaseCollectionModel.findOne({
        where: {
          dbName: dbName,
          userId: userId,
        },
        raw: true,
      })

      if (dbResult.dbId = null) {
        throw new Error('Database not found or access denied');
      }

      // Connect to specific DB
      dbPool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: dbName,
        password: process.env.DB_PASSWORD || 'postgres',
        port: parseInt(process.env.DB_PORT || '5432', 10),
      });

      // 🛡️ Validate table name
      const isValidTableName = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName);
      if (!isValidTableName) {
        throw new Error('Invalid table name');
      }

      // Fetch column metadata
      const columnsResult = await dbPool.query(
        `
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM 
        information_schema.columns 
      WHERE 
        table_name = $1
      ORDER BY 
        ordinal_position
      `,
        [tableName]
      );

      return columnsResult.rows;
    } finally {
      if (dbPool) await dbPool.end().catch(console.error);
      if (client) client.release();
    }
  }





  public async updateTable(
    orgId: string,
    dbId: string,
    dbName: string,
    tableName: string,
    userId: string,
    columns: string,
  ): Promise<ITableResponse | ITableError> {
    try {
      // First, check if table exists
      const tableExists = await this.tableModel.findOne({
        where: { dbId, orgId, tableName },
      });

      if (!tableExists) {
        return {
          error: 'Not found',
          details: `Table '${tableName}' does not exist in database '${dbName}'`,
        };
      }

      const mapDataType = type => {
        const map = {
          STRING: DataTypes.STRING,
          INTEGER: DataTypes.INTEGER,
          BOOLEAN: DataTypes.BOOLEAN,
          UUID: DataTypes.UUID,
          DATE: DataTypes.DATE,
          TEXT: DataTypes.TEXT,
          FLOAT: DataTypes.FLOAT,
          DOUBLE: DataTypes.DOUBLE,
          BIGINT: DataTypes.BIGINT,
        };
        return map[type.toUpperCase()];
      };

      const sequelize = await createSequelizeInstance(dbName);
      const schema = JSON.parse(columns);

      // Get the table's current schema from the database
      const [results] = await sequelize.query(
        `SELECT column_name, data_type, is_nullable 
         FROM information_schema.columns 
         WHERE table_name = '${tableName}'`,
      );

      const currentColumns = results as { column_name: string; data_type: string; is_nullable: string }[];

      // Prepare for schema modifications
      const schemaUpdates = [];

      // Check for columns to add or modify
      for (const field of schema) {
        const existingColumn = currentColumns.find(
          (col) => col.column_name === field.name
        );

        if (!existingColumn) {
          // Add new column
          schemaUpdates.push(`ALTER TABLE "${tableName}" ADD COLUMN "${field.name}" ${field.type}`);

          // Add constraints if needed
          if (field.isUnique) {
            schemaUpdates.push(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${tableName}_${field.name}_unique" UNIQUE ("${field.name}")`);
          }

          if (!field.isNullable) {
            // Adding a NOT NULL constraint to a new column needs a default value or the table must be empty
            schemaUpdates.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${field.name}" SET NOT NULL`);
          }
        } else {
          // Check if we need to modify the column
          const sequelizeType = mapDataType(field.type);
          const pgType = existingColumn.data_type;

          // Only attempt type conversion if necessary (could be risky for data integrity)
          if (this.shouldModifyColumnType(pgType, field.type)) {
            schemaUpdates.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${field.name}" TYPE ${field.type} USING "${field.name}"::${field.type}`);
          }

          // Update nullability if needed
          const currentNullable = existingColumn.is_nullable === 'YES';
          if (field.isNullable === false && currentNullable) {
            schemaUpdates.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${field.name}" SET NOT NULL`);
          } else if (field.isNullable === true && !currentNullable) {
            schemaUpdates.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${field.name}" DROP NOT NULL`);
          }
        }
      }

      // Check for columns to remove (if specified by the update policy)
      const newColumnNames = schema.map(field => field.name);
      const columnsToRemove = currentColumns
        .filter(col => !newColumnNames.includes(col.column_name))
        // Don't remove system columns or primary keys
        .filter(col => !['id', 'createdAt', 'updatedAt'].includes(col.column_name));

      for (const col of columnsToRemove) {
        schemaUpdates.push(`ALTER TABLE "${tableName}" DROP COLUMN "${col.column_name}"`);
      }

      // Execute all schema modifications in transaction
      await sequelize.transaction(async (t) => {
        for (const update of schemaUpdates) {
          await sequelize.query(update, { transaction: t });
        }
      });

      // Update the schema metadata in our table model
      await this.tableModel.update(
        { schema, userId },
        { where: { dbId, orgId, tableName } }
      );

      return {
        message: `Table '${tableName}' updated successfully in DB '${dbName}'`,
        schema: schema,
      };
    } catch (error) {
      console.error(`Error updating table ${tableName}:`, error);
      return {
        error: 'Table update failed',
        details: error.message || 'Failed to update table schema',
      };
    }
  }

  // Helper method to determine if column type should be modified
  private shouldModifyColumnType(pgType: string, requestedType: string): boolean {
    // Map PostgreSQL types to Sequelize types
    const pgToSequelizeMap = {
      'character varying': 'STRING',
      'integer': 'INTEGER',
      'boolean': 'BOOLEAN',
      'uuid': 'UUID',
      'timestamp with time zone': 'DATE',
      'text': 'TEXT',
      'double precision': 'DOUBLE',
      'real': 'FLOAT',
      'bigint': 'BIGINT',
    };

    const normalizedPgType = pgToSequelizeMap[pgType.toLowerCase()] || pgType;
    return normalizedPgType.toUpperCase() !== requestedType.toUpperCase();
  }


  // Fixed getTableColumns method to match your IColumn interface exactly
  //  public async getTableColumns(orgId: string, dbName: string, tableName: string): Promise<IColumn[]> {
  //   // First check if table exists
  //   const table = await this.tableModel.findOne({
  //     where: { orgId, tableName },
  //     raw: true
  //   }) as any;

  //   if (!table) {
  //     throw new Error(`Table ${tableName} not found`);
  //   }

  //   // Return the schema mapped to match your IColumn interface exactly
  //   return table.schema.map((col: any): IColumn => ({
  //     name: col.name,
  //     type: col.type,
  //     isNullable: col.isNullable,
  //     isUnique: col.isUnique || false,
  //     PrimaryKey: col.PrimaryKey || col.isPrimary || false, // Handle both property names
  //     defaultValue: col.defaultValue || col.columnDefault || undefined,
  //     columnDefault: col.columnDefault || col.defaultValue || null
  //   }));
  // }

  public async getTableColumns(orgId: string, dbName: string, tableName: string): Promise<IColumn[]> {
    // First check if table exists
    const table = await this.tableModel.findOne({
      where: { orgId, tableName },
      raw: true
    }) as any;

    if (!table) {
      throw new Error(`Table ${tableName} not found`);
    }

    // Return the schema mapped to match your IColumn interface exactly
    return table.schema.map((col: any): IColumn => ({
      name: col.name,
      type: col.type,
      isNullable: col.isNullable,
      isUnique: col.isUnique || false,
      PrimaryKey: col.PrimaryKey || col.isPrimary || false, // Handle both property names
      defaultValue: col.defaultValue || col.columnDefault || undefined,
      columnDefault: col.columnDefault || col.defaultValue || null,
      
    }));
  }

}
