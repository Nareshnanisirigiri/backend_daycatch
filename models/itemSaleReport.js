import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number } = types;

export default createCollectionModel("ItemSaleReport", "item_sale_report", {
    "Product Name": string,
    Stock: number
});
