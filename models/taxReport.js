import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number } = types;

export default createCollectionModel("TaxReport", "tax_report", {
    "Product Name": string,
    Quantity: number
});
