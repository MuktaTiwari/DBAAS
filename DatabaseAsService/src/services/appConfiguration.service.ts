import { DB, sequelize } from '@/databases';
import { IUnitPayload } from '@/interfaces/appLinkPayload.interface';
import { UnitDetails } from '@/interfaces/consumerUnit.interface';
import { IOrganization } from '@/interfaces/organization.interface';
import { IUser } from '@/interfaces/users.interface';

export default class appConfigurationService {
  public orgModel = DB.OrganizationModel;
  public walletModel = DB.Walletmodel;
  public unitModel = DB.ConsumerUnitDataModel;
  public userModel = DB.UserModel;

  public async addOrganizationPyramid(orgData: IOrganization): Promise<IOrganization> {
    let org: IOrganization;
    try {
      org = await this.orgModel.findOne({
        where: {
          orgId: orgData.orgId,
          orgName: orgData.orgName,
          isPyramidDocument: true,
        },
        raw: true,
      });
      if (org) {
        return org;
      } else {
        org = await this.orgModel.create(orgData);
      }
      return org;
    } catch (error) {
      throw error;
    }
  }

  public async consumerUnitLinkToApp(unitData: IUnitPayload): Promise<IOrganization> {
    const session = await sequelize.transaction();
    try {
      const unitPayload = {
        secondaryERPId: unitData.secondaryERPId,
        registryId: unitData.registryId,
        orgId: unitData.orgId,
        unitId: unitData.consumerUnitId,
        consumerUnitName: unitData.consumerUnitName,
        appId: unitData.appId,
        billingUnitId: unitData.billingUnitId,
        isPyramidDocument: true,
      };

      // Creating Consumer unit
      await this.unitModel.create(unitPayload, { transaction: session });

      const userPayload: IUser = unitData.linkedUsers.map(item => {
        let user = {
          userId: item.userId,
          firstName: item.firstName,
          lastName: item.lastName,
          email: item.username,
          userType: item.userRole,
          unitId: unitPayload.unitId,
          secondaryERPId: unitData.secondaryERPId,
          registryId: unitData.registryId,
          orgId: unitData.orgId,
          status: "Active",
          isPyramidDocument: true,
        };
        return user;
      });

      // Creating User linked with consumer unit
      await this.userModel.bulkCreate(userPayload, { transaction: session });

      const walletData = {
        ...unitData.walletDetails,
        consumerUnitId: unitPayload.unitId,
        secondaryERPId: unitData.secondaryERPId,
        registryId: unitData.registryId,
        orgId: unitData.orgId,
        isPyramidDocument: true,
      };

      // creating consumer unit wallet 
      await this.walletModel.create(walletData, { transaction: session });

      await session.commit();
      return;
    } catch (error) {
      await session.rollback();
      throw error;
    }
  }
}
