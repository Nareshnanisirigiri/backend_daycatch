import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, mixed } = types;

export default createCollectionModel("PayoutRequests", "payout requests", {
    Store: string,
    Address: string,
    "Total Revenue": number,
    "Bank Account Details": mixed,
    "Already Paid": number,
    "Pending Balance": number,
    Amount: number
});
