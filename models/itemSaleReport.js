import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number } = types;

export default createCollectionModel("ItemSaleReport", "item_sale_report", {
    product_name: string,
    variant_size: string,
    quantity: number,
    total_weight: string
}, { timestamps: false });
