import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, date, mixed } = types;

export default createCollectionModel("MissedOrders", "missed orders", {
    "Cart ID": string,
    Store: string,
    "Total Price": number,
    User: string,
    "Delivery Date": date,
    Status: string,
    "Cart Products": mixed,
    Assign: string,
    "Order Status": string
});
