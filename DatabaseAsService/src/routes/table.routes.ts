import express, { Router } from 'express';
import multer from 'multer';
import { TableController } from '../controllers/table.controller';
import authMiddleware from '@/middlewares/auth.middleware';
import path from 'path';
import fs from 'fs';
import { Routes } from '@/interfaces/routes.interface';

const uploadsDir = path.join(__dirname, '../../Uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/csv',
      'text/x-csv',
      'application/x-csv',
      'text/comma-separated-values',
      'text/x-comma-separated-values'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

class TableRoute implements Routes {
  public path = "/table";
  public router = Router();
  public tableController = new TableController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}/:dbName/tables`,
      authMiddleware,
      upload.single('csvFile'),
      this.tableController.createTable
    );

  this.router.get(`${this.path}/:dbId/tables`,authMiddleware,this.tableController.getAllTables);
  this.router.get(`${this.path}/:dbId/view-table-data`,authMiddleware,this.tableController.viewTableData);
  this.router.get(`${this.path}/:dbId/view-table-column`,authMiddleware,this.tableController.viewTableColumns);

  this.router.get(`${this.path}/:dbName/:tableName/schema`,authMiddleware, this.tableController.getTableSchema);

  this.router.put(`${this.path}/:dbName/:tableName/schema`,authMiddleware, this.tableController.updateTableSchema);

  this.router.delete(`${this.path}/:dbId/tables/:tableName`, authMiddleware, this.tableController.deleteTable);



  this.router.put(
      `${this.path}/:dbName/tables/:tableName`,
      authMiddleware,
      this.tableController.updateTable
    );

    // In table.routes.ts
this.router.get(
  `${this.path}/:dbName/tables/:tableName/columns`,
  authMiddleware,
  this.tableController.getTableColumns
);
  }
  
}

export default TableRoute;