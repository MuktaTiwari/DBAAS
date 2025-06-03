// types/index.ts
import { Request } from 'express';

export interface ExpressMulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

// Extend Express Request to include file with custom type
export interface MulterRequest extends Request {
  file?: ExpressMulterFile;
  files?: ExpressMulterFile[] | { [fieldname: string]: ExpressMulterFile[] };
}

// You can also export other types here
export interface DatabaseResponse {
  success: boolean;
  message?: string;
  data?: any;
  count?: number;
}

export interface CreateTableBody {
  tableName: string;
  columns?: Array<{
    name: string;
    type: string;
    constraints?: string[];
  }>;
}

export interface CreateDatabaseBody {
  databaseName: string;
}
