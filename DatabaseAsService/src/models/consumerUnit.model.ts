import { UnitDetails } from "@/interfaces/consumerUnit.interface";
import { DataTypes, Model, Sequelize } from "sequelize";


export class ConsumerUnitDataModel extends Model<UnitDetails> implements UnitDetails {
    public unitId: string ;
    public secondaryERPId: string;
    public registryId: string ;
    public orgId: string ;
    public consumerUnitName: string;
    public appId: string ;
    public isPyramidDocument: boolean ;
    public billingUnitId: string ;
}

export default function (sequelize: Sequelize): typeof ConsumerUnitDataModel {
    ConsumerUnitDataModel.init(
        {
            unitId: {
                type: DataTypes.STRING,
                field: 'unitId',
                allowNull: true,
            },
            secondaryERPId: {
                type: DataTypes.STRING,
                field: 'secondaryERPId',
                allowNull: true,
            },
            registryId: {
                type: DataTypes.STRING,
                field: 'registryId',
                allowNull: true,
            },
            orgId: {
                type: DataTypes.STRING,
                field: 'orgId',
                allowNull: true,
            },
            consumerUnitName: {
                type: DataTypes.STRING,
                field: 'consumerUnitName',
                allowNull: true,
            },
            appId: {
                type: DataTypes.STRING,
                field: 'appId',
                allowNull: true,
            },
         
            billingUnitId: {
                type: DataTypes.STRING,
                field: 'billingUnitId',
                allowNull: true,
            }, 
            isPyramidDocument: {
                type: DataTypes.BOOLEAN,
                field: 'isPyramidDocument',
                allowNull: true,
                defaultValue:true
            },
            
        },
        {
            sequelize,
            modelName: 'consumerUnitDataModel',
            tableName: 'consumerunit',
            timestamps: true,
        },
    )
    return ConsumerUnitDataModel;
}