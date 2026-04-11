import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, date } = types;

export default createCollectionModel("WalletRechargeHistory", "wallet_recharge_history", {
    user_name: string,
    user_phone: string,
    recharge_amount: number,
    recharge_date: date,
    status: string,
    medium: string,
    current_amount: number,
    recharge: string
}, { timestamps: false });
