import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, date } = types;

export default createCollectionModel("StoreProducts", "storeProducts", {
    Image: string,
    "Product Name": string,
    Price: number,
    MRP: number,
    Store: string,
    status: string,
    reviewedAt: date
});
