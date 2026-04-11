import { createCollectionModel, types } from "./createCollectionModel.js";

const { string } = types;

export default createCollectionModel("ItemRequirement", "item_requirement", {
    store_name: string,
    city: string,
    mobile: string,
    email: string,
    item_sale_report: string
}, { timestamps: false });
