import { Request } from 'express';
import { IUser } from '@interfaces/users.interface';
import { databaseCollectionModel } from '@/models/databaseCollection.model';

export interface DataStoredInToken {
  _id: string;
}

export interface TokenData {
  token: string;
  expiresIn: number;
}

export interface RequestWithUser extends Request {
  user: IUser;
}


export interface RequestWithDatabase extends Express.Request {
  headers: any;
  user?: databaseCollectionModel;
}