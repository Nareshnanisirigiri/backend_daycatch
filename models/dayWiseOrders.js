import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, date, mixed } = types;

export default createCollectionModel("DayWiseOrders", "day wise orders", {
    "Cart ID": string,
    "Cart price": number,
    User: string,
    "Delivery Date": date,
    Status: string,
    "Delivery Boy": string,
    "cart product": mixed,
    payment: mixed,
    status: string,
    store: string
});
