import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number } = types;

export default createCollectionModel("AdminProducts", "Adminproducts", {
    "Product Id": string,
    "Product Name": string,
    Category: string,
    Type: string,
    "Product Image": string,
    Quantity: number,
    "EAN code": string,
    Tags: string,
    Unit: string,
    MRP: number,
    price: number,
    description: string
});
