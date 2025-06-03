import { RequestWithUser } from "@/interfaces/auth.interface";
import appConfigurationService from "@/services/appConfiguration.service";
import { NextFunction, Request, Response } from "express";

export default class AppConfigurationController {
    private appConfigurationService = new appConfigurationService();
    public addOrganizationPyramid = async (req: Request, res: Response, next: NextFunction) => {
        const orgData = req.body;
        try {
            const result = await this.appConfigurationService.addOrganizationPyramid(orgData);
        if (result && 'error' in result) {
            return res.status(400).json(result);
        }

        res.json(result);
        } catch (error) {
        console.error('Error adding organization:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: 'Failed to add organization',
        });
        }
    };

    public consumerUnitLinkToApp = async (req: Request, res: Response, next: NextFunction) => {
        const consumerUnitData = req.body;
        try {
            const result = await this.appConfigurationService.consumerUnitLinkToApp(consumerUnitData);
        if (result && 'error' in result) {
            return res.status(400).json(result);
        }

        res.json(result);
        } catch (error) {
        console.error('Error linking consumer unit:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: 'Failed to link consumer unit',
        });
        }
    };

        public authenticate = async (req: RequestWithUser, res: Response, next: NextFunction) => {
        try {
            const findUser = req.user;
            const domain = req.hostname;
          
            if (req.query.unitId) {
                const unitId = findUser.unitDetails.id;
                let cuName = String(findUser.unitDetails.unitName);
                // cuName = cuName.trim().replace(' ', '_');
                //replacing all spaces as spaces are not allowed in cookie 
                cuName = cuName.trim().replace(/ /g, '_');
                res.cookie(cuName, unitId, { httpOnly: true,domain:`.${domain}`, maxAge: 9000000 });
            }

        return res.json({findUser});
        } catch (error) {
        console.error('Error linking consumer unit:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: 'Failed to link consumer unit',
        });
        }
    };
}