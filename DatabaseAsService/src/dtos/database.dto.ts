// dtos/database.dto.ts

import { Request } from 'express';

export interface CreateDatabaseRequest {
  databaseName: string;
}

export interface CreateTableRequest {
  tableName: string;
  columns: TableColumn[];
}

export interface UpdateTableRequest {
  addColumns?: TableColumn[];
  removeColumns?: string[];
}

export interface TableColumn {
  name: string;
  type: string;
  primaryKey?: boolean;
  isNotNull?: boolean;
  isUnique?: boolean;
  default?: string;
  foreignKey?: {
    table: string;
    column: string;
  };
}

export interface RequestWithUser extends Request {
  user: {
    userId: string;
  };
}
