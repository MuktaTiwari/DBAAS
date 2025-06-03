// routes/odata.route.ts
import { Router } from 'express';
import { Routes } from '@/interfaces/routes.interface';
import authMiddleware from '@middlewares/auth.middleware';
import {ODataController} from '@controllers/oDataquery.controller'
import validateApiKey from '@/middlewares/validateApikey';
class ODataRoute implements Routes {
  public path = '/api/access';
  public router = Router();
  public oDataController = new ODataController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Standard OData endpoints
    this.router.get(`${this.path}/:dbName/:tableName`,validateApiKey,  this.oDataController.getData);
    this.router.post(`${this.path}/:dbName/:tableName/insert`,validateApiKey, this.oDataController.insertData); // New route for /insert
    this.router.patch(`${this.path}/:dbName/:tableName`,validateApiKey, this.oDataController.updateData);
    this.router.delete(`${this.path}/:dbName/:tableName`,validateApiKey, this.oDataController.deleteData);
    
    // Metadata endpoint
    this.router.get(`${this.path}/:dbName/$metadata`, validateApiKey,this.oDataController.getMetadata);
  }
}

export default ODataRoute;