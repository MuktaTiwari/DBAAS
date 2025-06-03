
import { ITable } from '@/interfaces/table.interface';
import { DataTypes, Model, Sequelize } from 'sequelize';

export class TableModel extends Model<ITable> implements ITable {
  public tableId: string;
  public tableName: string;
  public schema: [];
  public userId: string;
  public orgId: string;
  public unitId?: string;
  public dbId: string;
  public isPyramidDocument: boolean;
  public createdAt: Date;
  public updatedAt: Date;
}

export default function (sequelize: Sequelize): typeof TableModel {
  TableModel.init(
    {
      tableId: {
        type: DataTypes.UUID,
        field: "tableId",
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
      },
      tableName: {
        type: DataTypes.STRING,
        field: "tableName",
        allowNull: false
      },
      orgId: {
        type: DataTypes.UUID,
        field: "orgId",
        references: {
          model: "organizations",
          key: "orgId"
        }
      },
      schema: {
        type: DataTypes.JSONB,
        field: "schema",
        allowNull: false,
      },
      unitId: {
        type: DataTypes.UUID,
        field: "unitId",
        allowNull: true,
      },
      userId: {
        type: DataTypes.STRING,
        field: "userId",
        allowNull: false
      },
      dbId: {
        type: DataTypes.STRING,
        field: "dbId",
        allowNull: false
      },
      isPyramidDocument: {
        type: DataTypes.BOOLEAN,
        field: "isPyramidDocument",
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: "createdAt",
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: "updatedAt",
      },
    },
    {
      tableName: 'table_collection',
      sequelize,
      timestamps: true,
      freezeTableName: true,
    },
  );

  return TableModel;
}