import { DB } from "@/databases";
import { IOrganization, IOrganizationPayload } from "@/interfaces/organization.interface";
import UserService from "./users.service";
import bcrypt from 'bcrypt';

export default class OrganizationService {
    public orgModel = DB.OrganizationModel;
    private userService = new UserService();

    public async addOrganization(orgData: IOrganizationPayload): Promise<IOrganization> {
        let org: IOrganization;

        console.log(orgData);

        const orgDetails = {
            orgName: orgData.orgName,
            domain: orgData.domain,
        };

        if (!orgData.password) {
            throw new Error("Password is required");
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(orgData.password, saltRounds);

        org = await this.orgModel.findOne({
            where: {
                orgName: orgData.orgName,
                domain: orgData.domain
            },
            raw: true,
        });

        if (org) {
            return org;
        } else {
            org = await this.orgModel.create(orgData);
        }

        const orgUserDetails = {
            orgId: org.orgId,
            firstName: orgData.firstName,
            lastName: orgData.lastName,
            email: orgData.email,
            userType: 'user',
            status: 'active',
            password: hashedPassword,
        };

        await this.userService.addUsers(orgUserDetails);
        return org;
    }

    public async deleteOrganization(orgData: IOrganization): Promise<IOrganization | null> {
        const org = await this.orgModel.findOne({
            where: {
                orgName: orgData.orgName,
            },
            raw: false,
        });

        if (org) {
            await org.destroy();
            return org.toJSON() as IOrganization;
        } else {
            return null;
        }
    }

    public async findAllOrganizations(): Promise<IOrganization[]> {
        return this.orgModel.findAll({
            raw: true,
        });
    }

    public async findOrganizationByName(orgName: string): Promise<IOrganization | null> {
        const organization = await this.orgModel.findOne({
            where: {
                orgName: orgName,
            },
            raw: true,
        });
        return organization;
    }
}