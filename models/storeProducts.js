import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, date, mixed } = types;

export default createCollectionModel("StoreProducts", "storeProducts", {
    storeId: string,
    adminProductId: string,
    "Product Id": string,
    Image: string,
    "Product Name": string,
    Category: string,
    Type: string,
    Price: number,
    MRP: number,
    stock: number,
    "Order Quantity": number,
    Store: string,
    status: string,
    deal: mixed,
    spotlight: mixed,
    reviewNotes: string,
    submittedAt: date,
    updatedAt: date,
    approvedAt: date,
    reviewedAt: date
});
