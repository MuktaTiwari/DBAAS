export interface IUser {
  id?:string;
  userId?: string;
  orgId: string;
  unitId?: string;
  firstName: string;
  lastName: string;
  status: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
  password?:string;
  userType?:string;
  secondaryERPId: string;
  registryId: string;
  isPyramidDocument: boolean;
}
