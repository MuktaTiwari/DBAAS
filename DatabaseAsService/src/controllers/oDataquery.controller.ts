// controllers/oData.controller.ts
import { NextFunction, Request, Response } from 'express';

import { ODataService } from '@/services/oDataquery.service';

export class ODataController {
  private odataService = new ODataService();

 public getData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { dbName, tableName } = req.params;
    const { $filter, $select, $orderby, $top, $skip, $count, $join } = req.query;

    console.log('OData Controller - Query.join:', $join);
    console.log('OData Controller - All query params:', req.query);

    const result = await this.odataService.getData(dbName, tableName, {
      filter: $filter as string,
      select: $select as string,
      orderby: $orderby as string,
      top: $top as string,
      skip: $skip as string,
      count: $count as string,
      join: $join as string
    });

    res.status(200).json({
      '@odata.context': `$metadata#${tableName}`,
      value: result.value,
      ...(result.count !== undefined && { '@odata.count': result.count })
    });
  } catch (error) {
    next(error);
  }
};

  public insertData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { dbName, tableName } = req.params;
      const data = req.query;

      const result = await this.odataService.insertData(dbName, tableName, data);

      res.status(201).json({
        message: 'Row inserted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

 public updateData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { dbName, tableName } = req.params;
        const { $filter, ...updateFields } = req.query;
        
        if (!$filter) {
            res.status(400).json({ error: '$filter parameter is required for updates' });
            return;
        }

        // Remove any OData system query options from the update fields
        const systemOptions = ['$select', '$orderby', '$top', '$skip', '$count'];
        const data = Object.keys(updateFields)
            .filter(key => !systemOptions.includes(key))
            .reduce((obj, key) => {
                obj[key] = updateFields[key];
                return obj;
            }, {});

        if (Object.keys(data).length === 0) {
            res.status(400).json({ error: 'No valid fields provided for update' });
            return;
        }

        const result = await this.odataService.updateData(dbName, tableName, $filter as string, data);

        res.status(200).json({
            message: 'Row(s) updated successfully',
            count: result.rowCount,
            data: result.rows,
        });
    } catch (error) {
        next(error);
    }
};

  public deleteData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { dbName, tableName } = req.params;
      const { $filter } = req.query;

      const result = await this.odataService.deleteData(dbName, tableName, $filter as string);

      res.status(200).json({
        message: 'Row(s) deleted successfully',
        count: result.rowCount,
        data: result.rows,
      });
    } catch (error) {
      next(error);
    }
  };

  public getMetadata = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { dbName } = req.params;

      const metadata = await this.odataService.getMetadata(dbName);

      res.status(200).json({
        '@odata.context': `${req.path}/$metadata`,
        value: metadata
      });
    } catch (error) {
      next(error);
    }
  };
}