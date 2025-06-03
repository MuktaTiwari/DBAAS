import { IOrganization } from '@/interfaces/organization.interface';
import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export class OrganizationModel extends Model<IOrganization> implements IOrganization {
    public orgId: string;
    public orgName: string;
    public domain: string;
    public registryId: string;
    public secondaryERPId: string;
    public appId: string;
    public mobileNo: string;
    public billingUnitId: string;
    public isPyramidDocument: boolean;
    public createdAt: Date;
    public updatedAt: Date;
}

export default function (sequelize: Sequelize): typeof OrganizationModel {
    OrganizationModel.init(
        {
            orgId: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
                field: "orgId",
            },
            domain: {
                type: DataTypes.STRING,
                defaultValue: DataTypes.UUIDV4,
                field: "domain",
            },
            orgName: {
                type: DataTypes.STRING,
                field: "orgName",
            },
            registryId: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                field: "registryId",
            },
            secondaryERPId: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                field: "secondaryERPId",
            },
            appId: {
                type: DataTypes.STRING,
                allowNull: true,
                field: "appId",
            },
            mobileNo: {
                type: DataTypes.STRING,
                allowNull: true,
                field: "mobileNo",
            },
            billingUnitId: {
                type: DataTypes.STRING,
                allowNull: true,
                field: "billingUnitId",
            },
            isPyramidDocument: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: false,
                field: "isPyramidDocument",
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
            tableName: 'organizations',
            sequelize,
            timestamps: true,
            freezeTableName: true,
        },
    );

    return OrganizationModel;
}