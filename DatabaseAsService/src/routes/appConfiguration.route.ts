import { Router } from 'express';
import UsersController from '@controllers/users.controller';
import { CreateUserDto } from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import OrganizationController from '@/controllers/organization.controller';
import AppConfigurationController from '@/controllers/appConfiguration.controller';
import authMiddleware from '@/middlewares/auth.middleware';

class AppConfiguration implements Routes {
    public path = '/app-sync';
    public router = Router();
    public usersController = new UsersController();
    public appConfigurationController = new AppConfigurationController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(`${this.path}/app-linked-to-organization`, this.appConfigurationController.addOrganizationPyramid);
        this.router.post(`${this.path}/consumer-unit-created`, this.appConfigurationController.consumerUnitLinkToApp);
        this.router.get(`${this.path}/authenticate`,authMiddleware, this.appConfigurationController.authenticate);

    }
}

export default AppConfiguration;