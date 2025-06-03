import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { APP_ID, APP_SECRET_KEY, HTTP_PROTOCOL, REGISTRY_BACKEND_PORT, SECRET_KEY } from '@config';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, RequestWithUser } from '@interfaces/auth.interface';
import { UserModel } from '@models/users.model';
import { DB } from '@/databases';
import axios from 'axios';
import { IUser } from '@/interfaces/users.interface';
const validateUserInSSOServer = async (authorization: string, unitId: string, REGISTRY_BACKEND_URL: string): Promise<{ user: IUser } | null> => {
  try {
    // Get app id from env
    const ssoServerResponse = await axios.get(`${REGISTRY_BACKEND_URL}/authenticated/token`, {
      headers: { Authorization: authorization, 'api-key': APP_SECRET_KEY, 'app-id': APP_ID },

      params: { unitId: unitId },
      withCredentials: true,
    });
    if (ssoServerResponse.status === 200) {
      const user: IUser = ssoServerResponse.data.user;
      return { user };
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};
const authMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const Authorization = req.cookies['token'] ? req.cookies['token'] : req.headers.authorization;

    const url = req.hostname.split('.');
    const domain_name = `${url[2]}.${url[3]}`;
    console.log(domain_name);
    const REGISTRY_BACKEND_URL = `${HTTP_PROTOCOL}://api.${domain_name}:${REGISTRY_BACKEND_PORT}`;
    const unitId = req.query.unitId === undefined || req.query.unitId === null ? req.cookies[String(req.headers.cuname)] : String(req.query.unitId);

    if (Authorization && unitId) {
      const verificationResponse = await validateUserInSSOServer(Authorization, unitId, REGISTRY_BACKEND_URL);
      if (verificationResponse && verificationResponse.user) {
        req.user = { ...verificationResponse.user };
        const user = verificationResponse.user;
        if (user) {
          next();
        } else {
          next(new HttpException(404, 'Authentication token missing'));
        }
      } 
    } else {
        if (Authorization) {
          const secretKey: string = SECRET_KEY;
          const verificationResponse = (await verify(Authorization, secretKey)) as DataStoredInToken;
          const userId = verificationResponse._id;
          const findUser = await UserModel.findByPk(userId);

          if (findUser) {
            req.user = findUser;
            next();
          } else {
            next(new HttpException(401, 'Wrong authentication token'));
          }
        } else {
          next(new HttpException(404, 'Authentication token missing'));
        }
      }
  } catch (error) {
    next(new HttpException(401, 'Wrong authentication token'));
  }
};

export default authMiddleware;
