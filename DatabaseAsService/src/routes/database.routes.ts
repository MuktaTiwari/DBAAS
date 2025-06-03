import { Router } from 'express';
import { DatabaseController } from '../controllers/database.controller';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import authMiddleware from '@/middlewares/auth.middleware';

const uploadsDir = path.join(__dirname, '../../Uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

export class DatabaseRoutes {
  public path = "/database";
  public router = Router();
  public controller = new DatabaseController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Database operations
    this.router.post(`${this.path}/`, authMiddleware, this.controller.createDatabase);
    this.router.get(`${this.path}/get-by-dbid`, authMiddleware, this.controller.getDatabasesByDbId);
    this.router.get(`${this.path}/`, authMiddleware, this.controller.getDatabases);
    this.router.get(`${this.path}/table-count`, authMiddleware, this.controller.getTableCount);
    this.router.delete(`${this.path}/:dbName`, authMiddleware, this.controller.deleteDatabase);

    // Table operations
    // this.router.post(
    //   `${this.path}/:dbName/tables`, 
    //   upload.single('csvFile'), 
    //   this.controller.createTable.bind(this.controller)
    // );
    // this.router.get('/:dbName/tables', this.controller.getTables.bind(this.controller));
    // this.router.delete('/:dbName/tables/:tableName', this.controller.deleteTable.bind(this.controller));
  }
}