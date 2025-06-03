// controllers/table.controller.ts
import { IColumn, ITableResponse } from '../interfaces/table.interface';
import { Request, Response, NextFunction } from 'express';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { TableService } from '@/services/table.service';
import { mainPool } from '@/utils/pool.utils';

export class TableController {
  private tableService = new TableService();

  public getAllTables = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const { dbId} = req.params;
    const { orgId } = req.user;
    
    try {
      const tableData = await this.tableService.getTables(dbId, orgId);
      return res.status(200).json(tableData);
    } catch (error) {
      console.error('Error getting tables:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: 'Failed to get tables',
      });
    }
  }                                                                                                                   



  public createTable = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const { tableName, columns, dbId } = req.body;
    const { dbName } = req.params;
    const { orgId, userId } = req.user;

    if (!dbName || !tableName || !columns) {
      return res.status(400).json({
        error: 'Validation error',
        details: 'Database name, table name, and schema are required',
      });
    }
 try {
    const result = await this.tableService.createTable(
      orgId, 
      dbId, 
      dbName, 
      tableName, 
      userId, 
      columns,
      req.file
    );
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating table:', error);
    if (error.message.includes('Table limit reached')) {
      res.status(403).json({
        error: 'Upgrade required',
        details: error.message
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        details: error.message || 'Failed to create table',
      });
    }
  }
};
 public updateTable = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const { dbName, tableName } = req.params;
    const dbId = req.query.dbId.toString();
    const { columns } = req.body;
    const { orgId, userId } = req.user;

    if (!dbName || !tableName || !columns || !dbId) {
      return res.status(400).json({
        error: 'Validation error',
        details: 'Database name, table name, database ID, and schema are required',
      });
    }

    try {
      const result = await this.tableService.updateTable(
        orgId, 
        dbId, 
        dbName, 
        tableName, 
        userId, 
        columns
      );
      
      // Check if there was an error
      if (result && 'error' in result) {
        const statusCode = result.error === 'Not found' ? 404 : 400;
        return res.status(statusCode).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Error updating table:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error.message || 'Failed to update table',
      });
    }
  };

  // In table.controller.ts
  // public getTableColumns = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  // const { dbName, tableName } = req.params;
  // const { orgId } = req.user;
  // const { schema } = req.body;

  //   try {
  //     const result = await this.tableService.updateTableSchema(dbName, tableName, schema);
      
  //     if (result && 'error' in result) {
  //       return res.status(400).json(result);
  //     }

  //     res.json(result);
  //   } catch (error) {
  //     console.error('Error updating table schema:', error);
  //     res.status(500).json({
  //       error: 'Internal server error',
  //       details: 'Failed to update table schema',
  //     });
  //   }
  // };
  public getTableColumns = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  const { dbName, tableName } = req.params;
  const { orgId } = req.user;

  try {
    const columns = await this.tableService.getTableColumns(orgId, dbName, tableName);
    res.status(200).json(columns);
  } catch (error) {
    console.error('Error getting table columns:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message || 'Failed to get table columns',
    });
  }
};

  public deleteTable = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const { dbId, tableName } = req.params;
    const dbName = req.query.dbName.toString();
    const { orgId } = req.user;

    try {
      const result = await this.tableService.deleteTable(dbId, tableName, orgId, dbName);
      
      if (result && 'error' in result) {
        return res.status(404).json(result);
      }

      res.status(200).json({
        message: `Table '${tableName}' deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting table:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'Failed to delete table',
      });
    }
  };


  public viewTableData = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const dbName = req.query.dbName.toString();
    const userId = req.user.userId;
    const tableName = req.query.tableName.toString();


    try {
      const result = await this.tableService.viewTableData( dbName, tableName, userId, mainPool );
      
      if (result && 'error' in result) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error retrieving table data:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'Failed to view table data',
      });
    }
  }

  public viewTableColumns = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const dbName = req.query.dbName.toString();
    const userId = req.user.userId;
    // const mainPool = (req as any).mainPool;
    const tableName = req.query.tableName.toString();

    try {
      const result = await this.tableService.viewTableColumns( dbName, tableName, userId, mainPool );
      
      if (result && 'error' in result) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error retrieving table columns:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'Failed to view table columns',
      });
    }
  }

    public getTableSchema = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const { dbName, tableName } = req.params;

    try {
      const result = await this.tableService.getTableSchema(dbName, tableName);
      
      if (result && 'error' in result) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error fetching table schema:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'Failed to fetch table schema',
      });
    }
  };

   public updateTableSchema = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const { dbName, tableName } = req.params;
    const { schema } = req.body;

    try {
      const result = await this.tableService.updateTableSchema(dbName, tableName, schema);
      
      if (result && 'error' in result) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error updating table schema:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'Failed to update table schema',
      });
    }
  };






  public createTableFromCSV = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  const { dbName } = req.params;
  const { tableName } = req.body;
  const { orgId, userId } = req.user;
  const csvFile = req.file;

  if (!dbName || !tableName || !csvFile) {
    return res.status(400).json({
      error: 'Validation error',
      details: 'Database name, table name, and CSV file are required',
    });
  }

  try {
    const result = await this.tableService.createTableFromCSV(
      orgId,
      req.body.dbId,
      dbName,
      tableName,
      userId,
      csvFile
    );
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating table from CSV:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message || 'Failed to create table from CSV',
    });
  }
};
}