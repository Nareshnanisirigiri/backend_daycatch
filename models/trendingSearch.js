import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, date } = types;

export default createCollectionModel("TrendingSearch", "trending_search", {
    Keyword: string,
    "Store Product Id": string,
    "Product Id": string,
    "Product Name": string,
    Category: string,
    Type: string,
    "Product Image": string,
    Store: string,
    Tags: string,
    Unit: string,
    MRP: number,
    price: number,
    status: string,
    Position: number,
    "Search Count": number,
    "Last Updated": date
});
