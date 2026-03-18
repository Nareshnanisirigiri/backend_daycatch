import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, date } = types;

export default createCollectionModel("WalletRechargeHistory", "Wallet_Rechage_History", {
    "User Name": string,
    "User Phone": string,
    "Recharge Amount": number,
    "Recharge Date": date,
    Status: string,
    Medium: string,
    "Current Amount": number,
    Recharge: string
});
