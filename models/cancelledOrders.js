import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, date } = types;

export default createCollectionModel("CancelledOrders", "cancelled orders", {
    "Cart ID": string,
    "Cart price": number,
    User: string,
    Store: string,
    "Delivery Boy": string,
    "Delivery Date": date,
    Status: string,
    reason: string
});
