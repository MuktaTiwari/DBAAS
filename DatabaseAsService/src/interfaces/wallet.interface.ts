export interface IWallet {
    walletId: string;
    walletName: string;
    units: number;
    currency: string;
    unitId: string;
    secondaryERPId: string;
    registryId: string;
    orgId: string;
    isPyramidDocument: boolean;
}