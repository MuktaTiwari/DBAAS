export interface IOrganization {
  orgId: string;
  orgName: string;
  domain: string;
  registryId: string;
  secondaryERPId: string;
  appId: string;
  mobileNo: string;
  billingUnitId: string;
  isPyramidDocument: boolean;
  createdAt: Date;
  updatedAt:Date;
}

export interface IOrganizationPayload {
  orgId: string;
  orgName: string;
  domain: string;
  registryId: string;
  secondaryERPId: string;
  createdAt: Date;
  updatedAt:Date;
  firstName: string;
  lastName: string;
  email: string;
  password: string
}