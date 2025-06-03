// services/oData.service.ts
import { Pool } from 'pg';

interface QueryResult {
  rows: any[];
  rowCount: number;
}

interface GetDataResult {
  value: any[];
  count?: number;
}

export class ODataService {
  private poolCache: Record<string, Pool> = {};

  private getDbPool(dbName: string): Pool {
    if (!/^[a-zA-Z0-9_]+$/.test(dbName)) {
      throw new Error('Invalid database name');
    }

    if (!this.poolCache[dbName]) {
      this.poolCache[dbName] = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: dbName,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT),
      });
    }

    return this.poolCache[dbName];
  }

  public async getData(
    dbName: string,
    tableName: string,
    options: {
      filter?: string;
      select?: string;
      orderby?: string;
      top?: string;
      skip?: string;
      count?: string;
      join?: string;
    }
  ): Promise<GetDataResult> {
    const pool = this.getDbPool(dbName);
    const { filter, select, orderby, top, skip, count, join } = options;

    // Parse join clauses if provided
    const joinClauses = join ? this.parseJoinClause(join) : [];

    // Build SELECT clause
    const selectClause = select
      ? select.split(',').map(col => {
        // Handle joined table columns (format: "joinAlias/columnName")
        if (col.includes('/')) {
          const [alias, column] = col.split('/');
          return `"${alias}"."${column.trim()}" AS "${alias}_${column.trim()}"`;
        }
        return `"${tableName}"."${col.trim()}"`;
      }).join(', ')
      : `"${tableName}".*${joinClauses.length > 0 ? `, ${joinClauses.map(j => `${j.alias}.*`).join(', ')}` : ''}`;

    // Build WHERE clause
    let whereClause = '';
    const params: any[] = [];
    if (filter) {
      whereClause = this.parseFilter(filter, params);
    }

    // Build JOIN clauses
    let joinClause = '';
    if (joinClauses.length > 0) {
      joinClause = ' ' + joinClauses.map(j =>
        `${j.joinType} JOIN "${j.foreignTable}" AS "${j.alias}" ON "${tableName}"."${j.localColumn}" = "${j.alias}"."${j.foreignColumn}"`
      ).join(' ');
    }
    // Build ORDER BY clause
    let orderByClause = '';
    if (orderby) {
      orderByClause = this.parseOrderBy(orderby);
    }

    // Build LIMIT/OFFSET
    let limitOffsetClause = '';
    if (top) {
      limitOffsetClause = ` LIMIT ${top}`;
      if (skip) {
        limitOffsetClause += ` OFFSET ${skip}`;
      }
    }

    // Main query
    const query = `SELECT ${selectClause} FROM "${tableName}"${joinClause}${whereClause}${orderByClause}${limitOffsetClause}`;
    console.log('Executing query:', query); // Debug logging
    const result = await pool.query(query, params);

    // Count query if requested
    let rowCount = null;
    if (count === 'true') {
      const countQuery = `SELECT COUNT(*) FROM "${tableName}"${joinClause}${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      rowCount = parseInt(countResult.rows[0].count);
    }

    return {
      value: result.rows,
      ...(rowCount !== null && { count: rowCount })
    };
  }

  private parseJoinClause(joinString: string): Array<{
  alias: string;
  foreignTable: string;
  localColumn: string;
  foreignColumn: string;
  joinType: string;
}> {
  try {
    console.log('Raw joinString:', JSON.stringify(joinString));

    // Assume a single join for now (no comma splitting for multiple joins)
    const equalsParts = joinString.split('=');
    if (equalsParts.length !== 2) {
      throw new Error('Invalid join format. Expected format: alias=foreignTable(localColumn:foreignColumn[,joinType])');
    }

    const alias = equalsParts[0].trim();
    const joinDefinition = equalsParts[1].trim();
    console.log('Join definition:', JSON.stringify(joinDefinition));

    // Extract foreign table and join details
    const parenMatch = joinDefinition.match(/^([a-zA-Z0-9_-]+)\((.*)\)$/);
    if (!parenMatch) {
      throw new Error(`Invalid join table specification: ${joinDefinition}. Expected format: foreignTable(localColumn:foreignColumn[,joinType])`);
    }

    const foreignTable = parenMatch[1].trim();
    const joinDetails = parenMatch[2].split(',').map(part => part.trim());
    console.log('Join details:', joinDetails);
    if (!joinDetails[0]) {
      throw new Error(`Missing join columns in: ${joinDefinition}. Expected format: localColumn:foreignColumn[,joinType]`);
    }

    // Parse column mapping
    const columnParts = joinDetails[0].split(':');
    if (columnParts.length !== 2) {
      throw new Error(`Invalid join column specification: ${joinDetails[0]}. Expected format: localColumn:foreignColumn`);
    }

    // Handle join type
    let joinType = joinDetails[1]?.toUpperCase() || 'INNER';
    if (joinType === 'OUTER') {
      joinType = 'FULL OUTER';
    }
    const validJoinTypes = ['INNER', 'LEFT', 'RIGHT', 'FULL', 'FULL OUTER'];
    if (!validJoinTypes.includes(joinType)) {
      throw new Error(`Invalid join type: ${joinType}. Supported types: INNER, LEFT, RIGHT, FULL, OUTER`);
    }

    return [{
      alias,
      foreignTable,
      localColumn: columnParts[0].trim(),
      foreignColumn: columnParts[1].trim(),
      joinType
    }];
  } catch (error) {
    console.error('Error parsing join clause:', error.message);
    throw new Error(`Invalid join specification: ${error.message}`);
  }
}



  public async insertData(dbName: string, tableName: string, data: Record<string, any>): Promise<any> {
    const pool = this.getDbPool(dbName);

    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      throw new Error('Invalid or empty data object');
    }

    // Add current timestamps
    const dataWithTimestamps = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const columns = Object.keys(dataWithTimestamps);
    const values = Object.values(dataWithTimestamps);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const query = `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const result = await pool.query(query, values);

    return result.rows[0];
  }

  // services/oData.service.ts
  public async updateData(
    dbName: string,
    tableName: string,
    filter: string,
    data: Record<string, any>
  ): Promise<QueryResult> {
    const pool = this.getDbPool(dbName);

    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      throw new Error('Invalid or empty data object');
    }

    if (!filter) {
      throw new Error('Filter parameter is required for updates');
    }

    // Add updatedAt timestamp
    const dataWithTimestamp = {
      ...data,
      updatedAt: new Date()
    };

    // Build SET clause with proper parameter numbering
    const setEntries = Object.entries(dataWithTimestamp);
    const setColumns = setEntries.map(([col], i) => `"${col}" = $${i + 1}`);
    const setValues = setEntries.map(([, val]) => val);

    // Parse filter to get WHERE clause and filter parameters
    const filterParams: any[] = [];
    const whereClause = this.parseFilter(filter, filterParams);

    if (!whereClause) {
      throw new Error('Invalid filter parameter');
    }

    // Combine parameters (set values first, then filter values)
    const params = [...setValues, ...filterParams];

    // Re-number WHERE clause parameters to come after SET parameters
    const whereClauseWithOffset = whereClause.replace(/\$(\d+)/g, (_, p1) => {
      return `$${Number(p1) + setValues.length}`;
    });

    const query = `UPDATE "${tableName}" SET ${setColumns.join(', ')}${whereClauseWithOffset} RETURNING *`;

    console.debug('Update query:', query);
    console.debug('Parameters:', params);

    return await pool.query(query, params);
  }







  public async deleteData(dbName: string, tableName: string, filter: string): Promise<QueryResult> {
    const pool = this.getDbPool(dbName);

    if (!filter) {
      throw new Error('Filter parameter is required for deletes');
    }

    // Parse filter
    const params: any[] = [];
    const whereClause = this.parseFilter(filter, params);

    if (!whereClause) {
      throw new Error('Invalid filter parameter');
    }

    const query = `DELETE FROM "${tableName}"${whereClause} RETURNING *`;
    return await pool.query(query, params);
  }

  public async getMetadata(dbName: string): Promise<any> {
    const pool = this.getDbPool(dbName);

    // Get all tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    // Get columns for each table
    const entityTypes: Record<string, any> = {};
    const entitySets: Record<string, any> = {};

    for (const table of tables.rows) {
      const tableName = table.table_name;
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
      `, [tableName]);

      entityTypes[tableName] = {
        name: tableName,
        properties: columns.rows.map(col => ({
          name: col.column_name,
          type: this.mapType(col.data_type),
          nullable: col.is_nullable === 'YES'
        }))
      };

      entitySets[tableName] = {
        entityType: `${dbName}.${tableName}`
      };
    }

    return {
      $Version: '4.0',
      [`${dbName}.${dbName}`]: {
        $Kind: 'EntityContainer',
        ...entitySets
      },
      ...entityTypes
    };
  }

  // Helper methods
  private parseFilter(filter: string, params: any[]): string {
    const conditions = filter.split(' and ');
    const whereParts: string[] = [];

    for (const condition of conditions) {
      const match = condition.match(/(\w+)\s+(eq|ne|gt|ge|lt|le)\s+(['"].*?['"]|\d+)/i);
      if (!match) continue;

      const [_, column, operator, value] = match;
      const sqlOperator = this.mapOperator(operator);
      const paramValue = value.replace(/^['"]|['"]$/g, '');

      whereParts.push(`"${column}" ${sqlOperator} $${params.length + 1}`);
      params.push(this.parseValue(paramValue));
    }

    return whereParts.length > 0 ? ` WHERE ${whereParts.join(' AND ')}` : '';
  }

  private parseOrderBy(orderBy: string): string {
    const parts = orderBy.split(',').map(part => {
      const [column, direction] = part.trim().split(/\s+/);
      const dir = direction?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
      return `"${column}" ${dir}`;
    });

    return parts.length > 0 ? ` ORDER BY ${parts.join(', ')}` : '';
  }

  private mapOperator(odataOp: string): string {
    const map: Record<string, string> = {
      eq: '=',
      ne: '!=',
      gt: '>',
      ge: '>=',
      lt: '<',
      le: '<='
    };
    return map[odataOp.toLowerCase()] || '=';
  }

  private parseValue(value: string): any {
    if (/^\d+$/.test(value)) return parseInt(value);
    if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    return value;
  }

  private mapType(pgType: string): string {
    const typeMap: Record<string, string> = {
      'integer': 'Edm.Int32',
      'bigint': 'Edm.Int64',
      'smallint': 'Edm.Int16',
      'character varying': 'Edm.String',
      'text': 'Edm.String',
      'boolean': 'Edm.Boolean',
      'numeric': 'Edm.Decimal',
      'real': 'Edm.Single',
      'double precision': 'Edm.Double',
      'timestamp without time zone': 'Edm.DateTimeOffset',
      'timestamp with time zone': 'Edm.DateTimeOffset',
      'date': 'Edm.Date',
      'time without time zone': 'Edm.TimeOfDay',
      'time with time zone': 'Edm.TimeOfDay',
      'uuid': 'Edm.Guid'
    };
    return typeMap[pgType] || 'Edm.String';
  }
}