import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number } = types;

export default createCollectionModel("TaxReport", "tax_report", {
    product_name: string,
    quantity: number
}, { timestamps: false });
