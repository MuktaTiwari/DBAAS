import { IWallet } from "./wallet.interface";

export interface IUnitPayload {
  secondaryERPId: string ;
  registryId: string ;
  orgId: string;
  unitId: string;
  consumerUnitName: string;
  appId: string;
  billingUnitId: string;
  isPyramidDocument:boolean;
  linkedUsers: [];
  walletDetails: {};
}
