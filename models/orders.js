import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, date, mixed } = types;

export default createCollectionModel("Orders", "orders", {
    "Cart ID": string,
    "Cart price": number,
    User: string,
    "Delivery Date": date,
    Status: string,
    Details: mixed,
    "cart product": mixed,
    Assign: string
});
