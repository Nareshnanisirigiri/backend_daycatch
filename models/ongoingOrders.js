import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, date } = types;

export default createCollectionModel("OngoingOrders", "ongoingorders", {
    "Cart ID": string,
    "Cart price": number,
    User: string,
    Store: string,
    "Delivery Date": date,
    Status: string
});
