import { Router } from 'express';
import UsersController from '@controllers/users.controller';
import { CreateUserDto } from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import OrganizationController from '@/controllers/organization.controller';

class OrgsRoute implements Routes {
    public path = '/orgs';
    public router = Router();
    public usersController = new UsersController();
    public orgController = new OrganizationController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(`${this.path}/add-org`, this.orgController.createOrganization);
        this.router.delete(`${this.path}/delete-org`, this.orgController.deleteOrganization);
        this.router.get(`${this.path}`, this.orgController.getOrganizations);
        this.router.get(`${this.path}/:orgName`, this.orgController.getOrganizationByName);
    }
}

export default OrgsRoute;