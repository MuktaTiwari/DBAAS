import { IWallet } from "@/interfaces/wallet.interface";
import { DataTypes, Model, Sequelize } from "sequelize";

export class Walletmodel extends Model<IWallet> implements IWallet {
    walletId: string;
    walletName: string;
    units: number;
    currency: string;
    unitId: string;
    secondaryERPId: string;
    registryId: string;
    orgId: string;
    isPyramidDocument: boolean;

}

export default function (sequelize: Sequelize): typeof Walletmodel {
  Walletmodel.init(
    {
      walletId:{
        type:DataTypes.UUID,
        field:"walletId",
        primaryKey:true,
      },
      walletName: {
        type: DataTypes.STRING,
        field:"walletName",
        allowNull:true,
      },
      units: {
        type: DataTypes.FLOAT,
        field:"units",
        allowNull:true,
      },
      currency: {
        type: DataTypes.STRING,
        field:"currency",
        allowNull:true
      },
      unitId: {
        type: DataTypes.STRING,
        field:"consumerUnitId",
        allowNull: true,
      },
      secondaryERPId: {
        type: DataTypes.STRING,
        field:"secondaryERPId",
        allowNull:true,
      },
      registryId: {
        type: DataTypes.STRING,
        field:"registryId",
        allowNull:true
      },
      orgId: {
        type: DataTypes.STRING,
        field:"orgId",
        allowNull:true
      },
      isPyramidDocument: {
        type: DataTypes.BOOLEAN,
        field:"isPyramidDocument",
        allowNull:true,
        defaultValue:true
    },
},

    {
      sequelize,
      modelName: 'walletmodel',
      tableName: 'wallet',
      timestamps: true,
      freezeTableName: true,
    },

  );

  return Walletmodel;

}
