import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from '@/services/database.service';
import { RequestWithUser } from '@/interfaces/auth.interface';
import multer from 'multer';

declare module 'express' {
  interface Request {
    file?: Express.Multer.File;
  }
}

export class DatabaseController {
  private databaseService = new DatabaseService();

  public createDatabase = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const { databaseName } = req.body;
    const {  orgId } = req.user;
    const userId = req.user.userId ? req.user.userId : req.user.id;

    try {
      if (!databaseName) {
        return res.status(400).json({
          success: false,
          message: 'Database name is required'
        });
      }

      const result = await this.databaseService.createDatabase(databaseName, userId, orgId);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createDatabase:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create database'
      });
    }
  };

  public getDatabases = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.userId ? req.user.userId : req.user.id;
      const orgId = req.user.orgId;
      const result = await this.databaseService.getDatabases(userId, orgId);
      
      res.status(200).json({
        success: true,
        data: result.data,
        count: result.count
      });
    } catch (error) {
      console.error('Error in getDatabases:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  public getTableCount = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const dbName = req.query.dbName.toString();
      const tableCount = await this.databaseService.getTableCount(dbName);
      
      res.status(200).json({
        success: true,
        data: { dbName, tableCount }
      });
    } catch (error) {
      console.error('Error in getTableCount:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch table count'
      });
    }
  };

  public createTable = async (req: Request, res: Response, next: NextFunction) => {
    const { dbName } = req.params;
    const { tableName, columns } = req.body;
    const csvFile = req.file;

    try {
      const result = await this.databaseService.createTable(dbName, tableName, columns, csvFile);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createTable:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  public getDatabasesByDbId = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const dbName = req.query.dbName.toString();
      const dbId = req.query.dbId.toString();
      const result = await this.databaseService.getDatabasesByDbId(dbId, dbName);
      
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error in getDatabasesByDbId:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  public deleteDatabase = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const { dbName } = req.params;
    const { userId, orgId } = req.user;

    try {
      if (!dbName) {
        return res.status(400).json({
          success: false,
          message: 'Database name is required'
        });
      }

      const result = await this.databaseService.deleteDatabase(dbName, userId, orgId);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in deleteDatabase:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete database'
      });
    }
  };
}