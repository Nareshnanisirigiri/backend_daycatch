import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, mixed, date } = types;

export default createCollectionModel(
    "Rejectedbystore",
    "rejectedbystore",
    {
        "Cart ID": string,
        "Cart price": number,
        User: string,
        Store: string,
        "Delivery Boy": string,
        "Delivery Date": date,
        Status: string,
        reason: string,
        Address: string,
        "Time Slot": string,
        Products: mixed
    },
    { timestamps: false }
);
