import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, date, mixed } = types;

export default createCollectionModel("PendingOrders", "pending orders", {
    "Cart ID": string,
    "Cart price": number,
    User: string,
    "Delivery Date": date,
    Status: string,
    Details: mixed
});
