// utils/sql.utils.ts
import { IColumn } from '../interfaces/table.interface';

export function buildColumnDefinitions(columns: IColumn[]): string[] {
  return columns.map(col => {
    let columnDef = `${col.column_name} ${col.data_type}`;
    if (col.is_nullable === 'NO') columnDef += ' NOT NULL';
    if (col.column_default) columnDef += ` DEFAULT ${col.column_default}`;
    return columnDef;
  });
}