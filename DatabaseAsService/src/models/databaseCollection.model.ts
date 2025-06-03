import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import sequelize from '../config/db'; // Adjust path as needed

// Interface for attributes
export interface DatabaseAttributes {
  dbId: string;
  dbName: string;
  orgId: string;
  unitId: string;
  apiKey: string;
  isPyramidDocument: Boolean;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Optional attributes for creation
interface DatabaseCreationAttributes extends Optional<DatabaseAttributes, 'dbId' | 'createdAt' | 'updatedAt'> {}

// Model class
export class databaseCollectionModel extends Model<DatabaseAttributes, DatabaseCreationAttributes> implements DatabaseAttributes {
  public dbId!: string;
  public dbName!: string;
  public orgId!: string;
  public unitId: string;
  public apiKey: string;
  public isPyramidDocument!: Boolean;
  public userId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Init model
export default function (sequelize: Sequelize): typeof databaseCollectionModel {
  databaseCollectionModel.init(
    {
      dbId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'dbId',
      },
      dbName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'dbName',
      },
      orgId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'orgId',
      },
      unitId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'unitId',
      },
      apiKey: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'apiKey',
        defaultValue: DataTypes.UUIDV4,
      },
      isPyramidDocument: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        field: 'isPyramidDocument',
        defaultValue: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'userId',
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'createdAt',
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'updatedAt',
      },
    },
    {
      sequelize,
      modelName: 'databaseCollectionModel',
      tableName: 'databases_collection',
      timestamps: true,
    },
  );

  return databaseCollectionModel;
}
