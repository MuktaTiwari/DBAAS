
// import { Multer } from 'multer';

// export interface ITable {
//   tableId: string;
//   tableName: string;
//   orgId: string;
//   userId: string;
//   unitId?: string;
//   dbId: string;
//   schema: SchemaField[];
//   createdAt: Date;
//   updatedAt: Date;
//   isPyramidDocument: boolean;
// }


// export interface ITableCreateRequest {
//   tableName: string;
//   columns?: IColumn[] | string;
//   csvFile?: Express.Multer.File;
// }

// export interface ITableUpdateRequest {
//   columns: IColumn[];
// }

// export interface IColumn {
//   name: string;
//   type: string;
//   isNullable?: boolean;
//   isUnique: boolean;
//   PrimaryKey: boolean;
//   defaultValue?: string;
//   columnDefault?: string | null;
// }

// export interface ITableResponse {
//   message: string;
//   schema?: Record<string, string>;
// }

// export interface ITableError {
//   error: string;
//   details?: string;
// }


// export interface ITableUpdateRequest {
//   columns: IColumn[];
// }

// export interface ITableResponse {
//   message: string;
//   schema?: Record<string, string>;
// }

// export interface ITableError {
//   error: string;
//   details?: string;
// }

// interfaces/table.interface.ts
import { Multer } from 'multer';

export interface ITable {
  tableId: string;
  tableName: string;
  orgId: string;
  userId: string;
  unitId?: string;
  dbId: string;
  schema: SchemaField[];
  createdAt: Date;
  updatedAt: Date;
  isPyramidDocument: boolean;
}

type SchemaField = {
  name: string;
  type: string;
  isNullable: boolean;
  isUnique: boolean;
  isPrimary: boolean;
};

export interface ITableCreateRequest {
  tableName: string;
  columns?: IColumn[] | string; // Can be array or JSON string
  csvFile?: Express.Multer.File;
}

export interface ITableUpdateRequest {
  columns: IColumn[];
}

// export interface ITableResponse {
//   message: string;
//   dbId?: string;
//   schema?: Record<string, string>;
//   tableId?: string;
// }

// export interface ITableError {
//   error: string;
//   details?: string;
// }

// interfaces/table.interface.ts
export interface IColumn {
  name: string;
  type: string;
  isNullable?: boolean;
  isUnique: boolean;
  PrimaryKey: boolean;
  defaultValue?: string;
  columnDefault?: string | null;
  isForeignKey: boolean,
  foreignKeyTable: "",
  foreignKeyColumn: "",
}

export interface ITableResponse {
  message: string;
  schema?: Record<string, string>;
}

export interface ITableError {
  error: string;
  details?: string;
}

export interface ITableUpdateRequest {
  columns: IColumn[];
}

export interface ITableResponse {
  message: string;
  schema?: Record<string, string>;
};

export interface ITableError {
  error: string;
  details?: string;
}

