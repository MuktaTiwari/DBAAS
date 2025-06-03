import { IUser } from '@/interfaces/users.interface';
import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export class UserModel extends Model<IUser> implements IUser {
  public userId: string;
  public orgId: string;
  public unitId?: string;
  public firstName: string;
  public lastName: string;
  public status: string;
  public email: string;
  public password: string;
  public userType: string;
  public secondaryERPId: string;
  public registryId: string;
  public isPyramidDocument: boolean;
  public createdAt: Date;
  public updatedAt: Date;
}

export default function (sequelize: Sequelize): typeof UserModel {
  UserModel.init(
    {
      userId:{
        type:DataTypes.UUID,
        field:"userId",
        primaryKey:true,
        defaultValue:DataTypes.UUIDV4
      },

      orgId: {
        type: DataTypes.UUID,
        field:"orgId",
        references:{
          model:"organizations", key:"orgId"
        }
      },
      unitId: {
        type: DataTypes.UUID,
        field:"unitId",
        allowNull:true,
      },
      firstName: {
        type: DataTypes.STRING,
        field:"firstName",
        allowNull:true

      },
      lastName: {
        type: DataTypes.STRING,
        field:"lastName",
        allowNull: true

      },
      status: {
        type: DataTypes.STRING,
        field:"status",
        allowNull:true
      },
      password: {
        type: DataTypes.STRING,
        field:"password",
        allowNull:true
      },
      userType: {
        type: DataTypes.STRING,
        field:"userType",
        allowNull:true
      },
      email: {
        type: DataTypes.STRING,
        field:"email",
        allowNull:true
      },
      secondaryERPId: {
        type: DataTypes.STRING,
        field:"secondaryERPId",
        allowNull:true
      },
      registryId: {
        type: DataTypes.STRING,
        field:"registryId",
        allowNull:true
      },
      isPyramidDocument: {
        type: DataTypes.BOOLEAN,
        field:"isPyramidDocument",
        allowNull:true,
        defaultValue: true
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field:"createdAt",
      },
        updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field:"updatedAt",
      },

    },
    {
      tableName: 'users',
      sequelize,
      timestamps: true,
      freezeTableName: true,
    },
  );

  return UserModel;
}
