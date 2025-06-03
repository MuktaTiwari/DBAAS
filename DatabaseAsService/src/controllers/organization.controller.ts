import OrganizationService from "@/services/organization.service";
import { NextFunction, Request, Response } from "express";

export default class OrganizationController {
    private orgService = new OrganizationService();

    public createOrganization = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const orgData = req.body;
            const organization = await this.orgService.addOrganization(orgData);
            res.status(201).json({ data: organization, message: 'Organization created successfully' });
        } catch (error) {
            next(error);
        }
    };

    public deleteOrganization = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const orgData = req.body;
            const organization = await this.orgService.deleteOrganization(orgData);
            if (organization) {
                res.status(200).json({ data: organization, message: 'Organization deleted successfully' });
            } else {
                res.status(404).json({ message: 'Organization not found' });
            }
        } catch (error) {
            next(error);
        }
    };

    public getOrganizations = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const organizations = await this.orgService.findAllOrganizations();
            res.status(200).json({ data: organizations, message: 'Organizations retrieved successfully' });
        } catch (error) {
            next(error);
        }
    };

    public getOrganizationByName = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const orgName = req.params.orgName;
            const organization = await this.orgService.findOrganizationByName(orgName);
            if (organization) {
                res.status(200).json({ data: organization, message: 'Organization retrieved successfully' });
            } else {
                res.status(404).json({ message: 'Organization not found' });
            }
        } catch (error) {
            next(error);
        }
    };
}