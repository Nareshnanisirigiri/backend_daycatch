import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number } = types;

export default createCollectionModel("StorePayments", "storepayments", {
    Store: string,
    Address: string,
    "Total Revenue": number,
    "Already Paid": number,
    "Pending Balance": number
});
